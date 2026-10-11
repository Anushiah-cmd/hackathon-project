import React, { useState, useEffect } from 'react';
import {
  Send,
  Upload,
  FileText,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  DollarSign,
  Languages,
  FileCheck,
  Hash,
  ArrowRight,
  ChevronRight,
  Shield,
  HelpCircle,
  Cpu,
  Layers,
  Lock,
  Compass,
  Mic,
  MicOff,
  LoaderCircle
} from 'lucide-react';
import { createComplaint, submitOfficialFIR, transcribeAudio } from '../services/api';
import { Complaint, AIAnalysisResult, LanguageCode, OfficialFIRReceipt } from '../types';
import { VoiceComplaintAssistant } from './VoiceComplaintAssistant';
import { CitizenGuideModal } from './CitizenGuideModal';

interface CitizenPortalProps {
  onCaseCreated: (caseId: string) => void;
  onOpenAuth?: () => void;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({ onCaseCreated, onOpenAuth }) => {
  // Form State
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [reportedCategory, setReportedCategory] = useState('Cyber Crime / Online Fraud');
  const [description, setDescription] = useState('');
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [audioError, setAudioError] = useState('');
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const audioStreamRef = React.useRef<MediaStream | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const recordingLanguageRef = React.useRef<LanguageCode>(selectedLanguage);
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentTime, setIncidentTime] = useState(new Date().toTimeString().slice(0, 5));
  const [incidentLocation, setIncidentLocation] = useState('');
  const [city, setCity] = useState('Central District');
  const [lossAmount, setLossAmount] = useState('');
  const [suspectDetails, setSuspectDetails] = useState('');
  const [witnessDetails, setWitnessDetails] = useState('');
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Evidence
  const [evidenceList, setEvidenceList] = useState<{
    originalName: string;
    fileType: string;
    sizeBytes: number;
    sha256: string;
    extractedText?: string;
  }[]>([]);

  // Submission & Workflow State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredCase, setRegisteredCase] = useState<{
    id: string;
    complaint: Complaint;
    analysis: AIAnalysisResult;
  } | null>(null);

  // Official FIR Filing State
  const [isFilingFIR, setIsFilingFIR] = useState(false);
  const [firReceipt, setFirReceipt] = useState<OfficialFIRReceipt | null>(null);
  const [firConsent, setFirConsent] = useState(false);

  // AI Guidance Modal State
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    audioStreamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  const startAudioRecording = async () => {
    setAudioError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setAudioError('Microphone access is unavailable. Use HTTPS or localhost and a supported browser.');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      setAudioError('Audio recording is not supported by this browser. Try the latest Chrome, Edge, Firefox, or Safari.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      recordingLanguageRef.current = selectedLanguage;

      const supportedMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      const mimeType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setAudioError('The microphone recording failed. Check your microphone and try again.');
        setIsAudioRecording(false);
        stream.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
        recorderRef.current = null;
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
        recorderRef.current = null;
        setIsAudioRecording(false);

        const recording = new Blob(audioChunksRef.current, { type: recorder.mimeType || audioChunksRef.current[0]?.type });
        audioChunksRef.current = [];
        if (!recording.size) {
          setAudioError('No audio was recorded. Speak into the microphone before stopping.');
          return;
        }
        if (recording.size > 20 * 1024 * 1024) {
          setAudioError('This recording exceeds the 20 MB limit. Record a shorter statement and try again.');
          return;
        }

        setIsTranscribingAudio(true);
        try {
          const result = await transcribeAudio(recording, recordingLanguageRef.current);
          setDescription(current => current.trim() ? `${current.trim()}\n${result.text}` : result.text);
          setAudioError('');
        } catch (error) {
          setAudioError(error instanceof TypeError
            ? 'Could not reach the transcription service. Check your connection and try again.'
            : error instanceof Error ? error.message : 'Transcription failed. Please try again.');
        } finally {
          setIsTranscribingAudio(false);
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsAudioRecording(true);
    } catch (error) {
      audioStreamRef.current?.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
      setIsAudioRecording(false);
      setAudioError(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Microphone permission was denied. Allow microphone access in your browser settings, then try again.'
        : 'Could not start the microphone. Check its connection and browser permissions, then try again.');
    }
  };

  const stopAudioRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  // Categories
  const crimeCategories = [
    'Cyber Crime / Online Fraud',
    'UPI / Financial Scam',
    'Phishing & Malicious Link',
    'Social Media Harassment & Blackmail',
    'Physical Theft / Burglary',
    'Assault & Physical Threat',
    'Identity Theft & Impersonation',
    'Other Crime Incident'
  ];

  // Dynamic Statement Checklist matching repo complaint.html
  const checklist = {
    what: description.trim().length >= 10,
    when: !!incidentDate && !!incidentTime,
    where: incidentLocation.trim().length >= 3,
    who: /\b(man|men|boy|woman|girl|person|bike|car|scooter|auto|wearing|helmet|plate|phone|upi|call|scammer|suspect|prof|caller)\b/i.test(description) || suspectDetails.trim().length > 0,
    how: /\b(camera|cctv|witness|ran|fled|towards|link|direction|apk|bank|google\s*pay|paytm|screen)\b/i.test(description) || cameraAvailable || witnessDetails.trim().length > 0
  };

  // Edge-Based Local Draft Persistence
  useEffect(() => {
    const savedDraft = localStorage.getItem('crimvexa_incident_draft');
    if (savedDraft && !description) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.location) setIncidentLocation(parsed.location);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (description || incidentLocation) {
      localStorage.setItem('crimvexa_incident_draft', JSON.stringify({
        description,
        location: incidentLocation,
        updatedAt: new Date().toISOString()
      }));
    }
  }, [description, incidentLocation]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 25 * 1024 * 1024) {
        alert('File size exceeds 25 MB limit.');
        continue;
      }

      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      setEvidenceList(prev => [
        ...prev,
        {
          originalName: file.name,
          fileType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          sha256,
          extractedText: `Uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
        }
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !incidentLocation.trim()) {
      setErrorMessage('Please provide a detailed statement and incident location.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please confirm acknowledgment before submitting.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await createComplaint({
        title: `${reportedCategory} Report`,
        description,
        originalLanguage: selectedLanguage,
        incidentDate,
        incidentTime,
        incidentLocation,
        city,
        lossAmount: lossAmount || undefined,
        suspectDetails: suspectDetails || undefined,
        witnessDetails: witnessDetails || undefined,
        cameraAvailable,
        evidenceItems: evidenceList
      });

      // Clear local edge draft upon successful creation
      localStorage.removeItem('crimvexa_incident_draft');
      setRegisteredCase(response);
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOfficialFIRFiling = async () => {
    if (!registeredCase) return;
    setIsFilingFIR(true);
    try {
      const res = await submitOfficialFIR(registeredCase.id, true);
      setFirReceipt(res.receipt);
    } catch (err: any) {
      alert(err.message || 'FIR registration failed');
    } finally {
      setIsFilingFIR(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header with AI Guide Assistant Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest font-mono">
            <Shield className="w-4 h-4" />
            <span>CRIMVEXA AI // OFFICIAL CITIZEN PORTAL</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white font-display tracking-tight">
            Report a Crime or Cyber Fraud
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Record incidents by voice in English, தமிழ், or മലയാളം with automatic legal formalization, SHA-256 cryptographic evidence sealing, and instant cyber fraud freeze routing.
          </p>
        </div>

        {/* AI Guide Assistant Button */}
        <button
          type="button"
          onClick={() => setIsGuideOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer self-start md:self-auto shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Need Help? Ask AI Assistant</span>
        </button>
      </div>

      {/* Visual Citizen Complaint Workflow Explainer Card */}
      <div className="p-5 rounded-3xl bg-[#091325] border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 font-display">
          <span className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>How the Complaint & Investigation Process Works</span>
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            End-to-End Workflow
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <div className="font-mono text-[10px] text-rose-400 font-bold">STAGE 1</div>
            <div className="font-bold text-white text-[11px]">Voice/Text Intake</div>
            <p className="text-[10px] text-slate-400">Speak in EN, தமிழ், or മലയാളം. Auto-statementized into legal format.</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <div className="font-mono text-[10px] text-cyan-400 font-bold">STAGE 2</div>
            <div className="font-bold text-white text-[11px]">AI Triage & Classification</div>
            <p className="text-[10px] text-slate-400">System 1 assigns category & priority urgency (0-100 score).</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <div className="font-mono text-[10px] text-purple-400 font-bold">STAGE 3</div>
            <div className="font-bold text-white text-[11px]">SHA-256 Evidence Seal</div>
            <p className="text-[10px] text-slate-400">Cryptographic hash calculated on-device for chain of custody.</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <div className="font-mono text-[10px] text-amber-400 font-bold">STAGE 4</div>
            <div className="font-bold text-white text-[11px]">Electronic FIR Filing</div>
            <p className="text-[10px] text-slate-400">Generates official FIR number and notifies police precinct.</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs col-span-2 sm:col-span-1">
            <div className="font-mono text-[10px] text-emerald-400 font-bold">STAGE 5</div>
            <div className="font-bold text-white text-[11px]">1930 Cyber Freeze</div>
            <p className="text-[10px] text-slate-400">Golden Hour financial lien alert sent to beneficiary bank node.</p>
          </div>
        </div>
      </div>

      {registeredCase ? (
        /* Post Registration Confirmation & Electronic FIR Transmission */
        <div className="space-y-6">
          <div className="border border-emerald-500/40 rounded-3xl bg-emerald-950/20 p-6 md:p-8 backdrop-blur-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                    Complaint Registered in State Crime Records Bureau Ledger
                  </div>
                  <div className="text-2xl font-bold font-mono text-white flex items-center gap-2">
                    Case Reference: <span className="text-cyan-400">{registeredCase.id}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onCaseCreated(registeredCase.id)}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <span>Track in Investigation Ledger</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-emerald-900/40 text-xs">
              <div>
                <span className="text-slate-400">Status</span>
                <div className="font-semibold text-amber-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  {registeredCase.complaint.status}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Classified Category</span>
                <div className="font-semibold text-cyan-300 mt-0.5">
                  {registeredCase.analysis.category.label} ({Math.round(registeredCase.analysis.category.confidence * 100)}% conf.)
                </div>
              </div>
              <div>
                <span className="text-slate-400">Priority Urgency</span>
                <div className="font-semibold text-white mt-0.5">
                  {registeredCase.analysis.priority.level} (Score: {registeredCase.analysis.priority.score}/100)
                </div>
              </div>
            </div>
          </div>

          {/* Electronic FIR Registration */}
          <div className="border border-rose-900/40 rounded-3xl bg-[#091222] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span>State Police Electronic FIR Registration</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-800/50 text-rose-300">
                Official Law Enforcement Protocol
              </span>
            </div>

            {firReceipt ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Electronic FIR Generated & Dispatched</span>
                </div>
                <div className="font-mono text-white">
                  FIR Registration Number: <span className="text-emerald-300 font-bold">{firReceipt.filingReceiptId}</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Station Node: {firReceipt.jurisdictionStation}
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate">
                  SHA-256 Digest: {firReceipt.verificationHash}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={firConsent}
                    onChange={(e) => setFirConsent(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-rose-500"
                  />
                  <span>
                    I solemnly confirm that the facts submitted are true and authorize official electronic FIR generation.
                  </span>
                </label>

                <button
                  type="button"
                  disabled={!firConsent || isFilingFIR}
                  onClick={handleOfficialFIRFiling}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    firConsent && !isFilingFIR
                      ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 text-white shadow-lg shadow-rose-600/30 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isFilingFIR ? 'Generating Official FIR...' : 'Transmit Official Electronic FIR'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Main Layout: Form (2 cols) + Checklist & Help (1 col) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Component 1: Dedicated VoiceComplaintAssistant */}
            <VoiceComplaintAssistant
              selectedLanguage={selectedLanguage}
              onLanguageChange={(lang) => setSelectedLanguage(lang)}
              onPopulateDescription={(text, formalCat) => {
                setDescription(text);
                if (formalCat) {
                  setReportedCategory(formalCat);
                }
              }}
              currentDescription={description}
            />

            {/* Standard Complaint Form Fields */}
            <div className="p-6 rounded-3xl bg-[#091222] border border-slate-800 space-y-5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Complaint Details & Statement
                </label>
                {/* Edge Draft Badge */}
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Edge Draft Auto-Saved</span>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Incident Category
                </label>
                <select
                  value={reportedCategory}
                  onChange={(e) => setReportedCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-rose-500 text-xs text-white outline-none"
                >
                  {crimeCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label htmlFor="complaint-description" className="block text-xs font-semibold text-slate-300">
                    Full Statement Text (Populated from Voice Assistant or Typed) <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={isAudioRecording ? stopAudioRecording : startAudioRecording}
                    disabled={isTranscribingAudio || isSubmitting}
                    aria-pressed={isAudioRecording}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                      isAudioRecording
                        ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                    }`}
                  >
                    {isTranscribingAudio
                      ? <LoaderCircle className="w-4 h-4 animate-spin" />
                      : isAudioRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-rose-400" />}
                    <span>
                      {isTranscribingAudio
                        ? 'Transcribing...'
                        : isAudioRecording ? 'Stop & Transcribe' : 'Record & Transcribe'}
                    </span>
                  </button>
                </div>
                <textarea
                  id="complaint-description"
                  required
                  rows={5}
                  placeholder="Describe the incident in your own words, or record your statement above. Review and edit the transcript before submitting."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-rose-500 text-xs text-white placeholder:text-slate-600 outline-none leading-relaxed"
                />
                <p className="mt-1.5 text-[10px] text-slate-500">
                  Transcription uses your selected language ({selectedLanguage === 'ta' ? 'Tamil' : selectedLanguage === 'en' ? 'English' : selectedLanguage === 'ml' ? 'Malayalam' : 'Hindi'}). Audio is sent securely for transcription and is not stored by this app. Review or edit the text before submitting.
                </p>
                {audioError && (
                  <div role="alert" className="mt-2 flex items-start gap-2 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{audioError}</span>
                  </div>
                )}
                {isAudioRecording && (
                  <p role="status" aria-live="polite" className="mt-2 text-xs text-rose-300">
                    Recording in {recordingLanguageRef.current === 'ta' ? 'Tamil' : recordingLanguageRef.current === 'en' ? 'English' : recordingLanguageRef.current === 'ml' ? 'Malayalam' : 'Hindi'}. Select Stop &amp; Transcribe when finished.
                  </p>
                )}
              </div>
            </div>

            {/* Time, Location & Loss Parameters */}
            <div className="p-6 rounded-3xl bg-[#091222] border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                When, Where & Financial Valuation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Time</label>
                  <input
                    type="time"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Specific Physical Landmark or Digital Application / URL <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Block Quadrangle OR WhatsApp / http://scam-site.xyz"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monetary Loss (if any)</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹48,000"
                    value={lossAmount}
                    onChange={(e) => setLossAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Suspect Phone / UPI / Details</label>
                  <input
                    type="text"
                    placeholder="e.g. prof.k.sharma@okaxis or +91 91234 56789"
                    value={suspectDetails}
                    onChange={(e) => setSuspectDetails(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 pt-1">
                  <input
                    type="checkbox"
                    checked={cameraAvailable}
                    onChange={(e) => setCameraAvailable(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-rose-500"
                  />
                  <span>CCTV camera surveillance exists nearby</span>
                </label>
              </div>
            </div>

            {/* Evidence Upload Section */}
            <div className="p-6 rounded-3xl bg-[#091222] border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Digital Evidence Vault (SHA-256 Checksum)
              </h3>

              <div className="border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-2xl p-5 text-center bg-slate-950/40">
                <Upload className="w-6 h-6 text-rose-400 mx-auto mb-1.5" />
                <div className="text-xs text-white font-semibold">Attach Screenshots or Transaction Proofs</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Images, PDFs, or Media files up to 25 MB</div>
                <label className="mt-3 inline-block px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-rose-500 text-xs font-bold text-rose-300 cursor-pointer">
                  <span>Select Files</span>
                  <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {evidenceList.length > 0 && (
                <div className="space-y-1.5">
                  {evidenceList.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="font-semibold text-white truncate">{item.originalName}</span>
                        <div className="font-mono text-[10px] text-cyan-400 truncate">SHA-256: {item.sha256}</div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 shrink-0">VERIFIED</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Consent & Submit */}
            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-rose-500"
                />
                <span>
                  I confirm that the details provided are true and accurate to the best of my knowledge.
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Analyzing & Registering Complaint...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Incident Report</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Aside: Statement Checklist */}
          <aside className="p-6 rounded-3xl bg-[#091222] border border-slate-800 space-y-5 sticky top-24">
            <div>
              <h3 className="text-sm font-bold text-white font-display">Statement Checklist</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Checks turn green automatically as you speak or fill in details.
              </p>
            </div>

            <ul className="space-y-3 text-xs">
              <li className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                checklist.what ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${checklist.what ? 'text-emerald-400' : 'text-slate-600'}`} />
                <div>
                  <div className="font-semibold text-white">What Happened</div>
                  <div className="text-[11px] text-slate-400">At least a short incident description</div>
                </div>
              </li>

              <li className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                checklist.when ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${checklist.when ? 'text-emerald-400' : 'text-slate-600'}`} />
                <div>
                  <div className="font-semibold text-white">When</div>
                  <div className="text-[11px] text-slate-400">Date and occurrence time specified</div>
                </div>
              </li>

              <li className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                checklist.where ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${checklist.where ? 'text-emerald-400' : 'text-slate-600'}`} />
                <div>
                  <div className="font-semibold text-white">Where</div>
                  <div className="text-[11px] text-slate-400">Road, landmark, digital app or website</div>
                </div>
              </li>

              <li className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                checklist.who ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${checklist.who ? 'text-emerald-400' : 'text-slate-600'}`} />
                <div>
                  <div className="font-semibold text-white">Person or Identifier</div>
                  <div className="text-[11px] text-slate-400">Phone number, UPI ID, or description</div>
                </div>
              </li>

              <li className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                checklist.how ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${checklist.how ? 'text-emerald-400' : 'text-slate-600'}`} />
                <div>
                  <div className="font-semibold text-white">Evidence & Cameras</div>
                  <div className="text-[11px] text-slate-400">CCTV presence, bank app, or files</div>
                </div>
              </li>
            </ul>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-semibold border border-slate-800 hover:border-cyan-700/50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Need Step-by-Step Help?</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Citizen Guidance Assistant Modal */}
      <CitizenGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};
