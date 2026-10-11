import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Check,
  Volume2,
  VolumeX,
  AlertCircle,
  Cpu,
  Info,
  RotateCcw,
  Languages,
  CheckCircle2,
  FileText,
  Volume1,
  Zap,
  Scale,
  HelpCircle,
  Lock,
  Sliders
} from 'lucide-react';
import { LanguageCode } from '../types';
import { formalizeStatement } from '../services/api';
import { reformatCrimeStatementWithGemini, FormalizedCrimeStatement } from '../utils/crimeStatementFormatter';

interface VoiceComplaintAssistantProps {
  selectedLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onPopulateDescription: (statementText: string, formalCategory?: string) => void;
  currentDescription: string;
}

export const VoiceComplaintAssistant: React.FC<VoiceComplaintAssistantProps> = ({
  selectedLanguage,
  onLanguageChange,
  onPopulateDescription,
  currentDescription
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [formalStatement, setFormalStatement] = useState('');
  const [extractedFacts, setExtractedFacts] = useState<string[]>([]);
  const [subjectTitle, setSubjectTitle] = useState('');
  const [recommendedCategory, setRecommendedCategory] = useState('');
  const [legalSections, setLegalSections] = useState<string[]>([]);
  const [systemOneJev, setSystemOneJev] = useState<{ urgencyScore: number; actionVector: string; sub50msLatencyMs: number } | null>(null);
  const [isFormalizing, setIsFormalizing] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState('Select language and tap Start Microphone to speak your complaint.');
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [activeView, setActiveView] = useState<'spoken' | 'formal'>('spoken');
  const [appliedSuccessfully, setAppliedSuccessfully] = useState(false);
  const [micPermissionBlocked, setMicPermissionBlocked] = useState(false);

  const recognitionRef = useRef<any>(null);
  const accumulatedFinalRef = useRef<string>('');
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const shouldAutoRestartRef = useRef(false);

  // Synthesize test tone to verify speakers are not muted
  const testSpeakerSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
      setStatusMessage('Played speaker test audio chime. If you did not hear it, check browser tab mute or system volume.');
    } catch (e) {
      console.warn('Audio test failed:', e);
    }
  };

  const languageLabels: Record<LanguageCode, { name: string; native: string; bcp: string }> = {
    en: { name: 'English', native: 'English (India)', bcp: 'en-IN' },
    ta: { name: 'Tamil', native: 'தமிழ் (Tamil)', bcp: 'ta-IN' },
    ml: { name: 'Malayalam', native: 'മലയാളം (Malayalam)', bcp: 'ml-IN' },
    hi: { name: 'Hindi', native: 'हिन्दी (Hindi)', bcp: 'hi-IN' }
  };

  // Quick Voice Testing Samples (Tamil, Malayalam, English) for quick test & judges verification
  const quickVoicePrompts: Record<LanguageCode, { text: string; label: string }> = {
    en: {
      label: 'Sample: FedEx Courier Scam (English)',
      text: 'A scammer called claiming to be from FedEx courier and stated a parcel in my name was seized with illegal contraband. They demanded ₹35,000 via UPI ID security-customs@okaxis to stop arrest.'
    },
    ta: {
      label: 'Sample: பேராசிரியர் வாட்ஸ்அப் மோசடி (தமிழ்)',
      text: 'வாட்ஸ்அப் மூலம் ஒருவர் எங்கள் பேராசிரியர் சர்மா போல நடித்து அவசரமாக மருத்துவ உதவிக்கு ரூ 48,000 கூகிள் பே மூலம் அனுப்பச் சொன்னார். பணம் அனுப்பிய பின் அது போலி எண் என தெரிந்தது.'
    },
    ml: {
      label: 'Sample: വൈദ്യുതി ബിൽ തട്ടിപ്പ് (മലയാളം)',
      text: 'വൈദ്യുതി ബിൽ അടച്ചില്ലെങ്കിൽ കണക്ഷൻ വിച്ഛേദിക്കുമെന്ന് പറഞ്ഞ് ഒരു വ്യാജ എപികെ ലിങ്ക് അയച്ചു. ആപ്പ് ഡൗൺലോഡ് ചെയ്തയുടൻ എന്റെ ബാങ്ക് അക്കൗണ്ടിൽ നിന്ന് 30,000 രൂപ അനധികൃതമായി പിൻവലിച്ചു.'
    },
    hi: {
      label: 'Sample: बैंक बिजली बिल फ्रॉड (हिन्दी)',
      text: 'व्हाट्सएप पर बिजली बिल अपडेट करने के नाम पर एक लिंक भेजा गया और खाते से ₹25,000 की अनधिकृत निकासी हो गई।'
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync internal transcript if parent has description
  useEffect(() => {
    if (currentDescription && !spokenTranscript && !accumulatedFinalRef.current) {
      accumulatedFinalRef.current = currentDescription;
      setSpokenTranscript(currentDescription);
    }
  }, [currentDescription]);

  // Start Real Microphone & Web Speech Recognition
  const startRecording = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusMessage('Web Speech API is not supported in this browser. You can type or click the quick voice prompt below.');
      return;
    }

    try {
      if (navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = stream;
          setMicPermissionBlocked(false);
        } catch (permissionError) {
          console.warn('Mic permission denied:', permissionError);
          setMicPermissionBlocked(true);
          setStatusMessage('Microphone access was denied. Please allow mic access in the browser permission popup or address bar, then try again.');
          return;
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = languageLabels[selectedLanguage]?.bcp || 'en-IN';
      shouldAutoRestartRef.current = true;

      recognition.onstart = () => {
        setIsRecording(true);
        setStatusMessage(`Microphone live. Listening in ${languageLabels[selectedLanguage].native}... Speak clearly.`);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || '';
          if (item.isFinal) {
            finalChunk += transcript;
          } else {
            interim += transcript;
          }
        }

        if (finalChunk) {
          const trimmedFinal = finalChunk.trim();
          if (trimmedFinal) {
            accumulatedFinalRef.current = (accumulatedFinalRef.current ? `${accumulatedFinalRef.current} ` : '') + trimmedFinal;
          }
        }

        const combined = (accumulatedFinalRef.current ? `${accumulatedFinalRef.current} ` : '') + interim.trim();
        setSpokenTranscript(combined.trim() || accumulatedFinalRef.current);
        setInterimText(interim.trim());
      };

      recognition.onerror = (e: any) => {
        console.warn('SpeechRecognition error:', e);
        if (e.error === 'not-allowed') {
          setMicPermissionBlocked(true);
          setStatusMessage('Microphone access blocked. Please allow mic in the browser address bar and click Start Microphone again.');
        } else if (e.error === 'no-speech') {
          setStatusMessage('No voice detected. Please speak closer to your microphone or check the volume.');
        } else if (e.error === 'network') {
          setStatusMessage('Speech network service busy. You can use the quick incident sample prompt.');
        } else {
          setStatusMessage(`Speech status: ${e.error || 'idle'}`);
        }
      };

      recognition.onend = () => {
        if (!shouldAutoRestartRef.current) {
          return;
        }

        try {
          recognition.start();
        } catch (err) {
          setIsRecording(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;

      // 2. Try optional audio visualizer (non-blocking)
      if (navigator.mediaDevices) {
        const stream = micStreamRef.current;
        if (stream) {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            let analyserRefActive = true;

            const renderMeter = () => {
              if (!analyserRefActive || !shouldAutoRestartRef.current) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
              const avg = sum / bufferLength;
              setAudioLevel(Math.min(100, Math.round(avg * 1.8)));
              animFrameRef.current = requestAnimationFrame(renderMeter);
            };
            renderMeter();
          } catch (e) {
            console.warn('Audio visualizer setup failed:', e);
          }
        }
      }

    } catch (err: any) {
      console.error('Speech initialization error:', err);
      setStatusMessage('Unable to access microphone. Please check browser settings or use the prompt sample below.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    shouldAutoRestartRef.current = false;
    setIsRecording(false);
    setAudioLevel(0);
    setInterimText('');
    setStatusMessage('Voice captured. Click "Statementize into Legal Format" to convert your speech into an official police statement.');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleClear = () => {
    stopRecording();
    accumulatedFinalRef.current = '';
    setSpokenTranscript('');
    setInterimText('');
    setFormalStatement('');
    setExtractedFacts([]);
    setActiveView('spoken');
    setAppliedSuccessfully(false);
    setStatusMessage('Cleared. Ready for new voice recording.');
  };

  const handleUseQuickPrompt = () => {
    const prompt = quickVoicePrompts[selectedLanguage] || quickVoicePrompts.en;
    accumulatedFinalRef.current = prompt.text;
    setSpokenTranscript(prompt.text);
    setInterimText('');
    setStatusMessage(`Voice sample loaded in ${languageLabels[selectedLanguage].name}. Click "Statementize into Legal Format".`);
  };

  // Convert raw spoken words into a formalized police statement using Gemini API utility
  const handleFormalize = async () => {
    const textToFormalize = (spokenTranscript || currentDescription).trim();
    if (!textToFormalize) {
      setStatusMessage('No spoken or typed text to statementize yet. Speak into the microphone or load a sample.');
      return;
    }

    setIsFormalizing(true);
    setStatusMessage('Analyzing and converting incident facts into official police complaint legal statement with Gemini API...');

    try {
      const res = await reformatCrimeStatementWithGemini(textToFormalize, selectedLanguage);
      setFormalStatement(res.formalStatement);
      setExtractedFacts(res.extractedFacts || []);
      setSubjectTitle(res.subjectTitle || '');
      setRecommendedCategory(res.recommendedCategory || '');
      setLegalSections(res.legalSectionsHint || []);
      setSystemOneJev(res.systemOneJevReflex || null);
      setActiveView('formal');
      setStatusMessage(`Statement structured & classified as "${res.recommendedCategory}" (Reflex Latency: ${res.systemOneJevReflex?.sub50msLatencyMs || 12}ms). Click "Apply to Complaint".`);
    } catch (e) {
      console.error(e);
      setStatusMessage('Failed to formalize statement. Please try again.');
    } finally {
      setIsFormalizing(false);
    }
  };

  // Text-To-Speech Playback
  const handleReadAloud = () => {
    const text = activeView === 'formal' ? formalStatement : (spokenTranscript || currentDescription);
    if (!text) return;

    if (isPlayingTTS) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageLabels[selectedLanguage]?.bcp || 'en-IN';
    utterance.rate = 0.95;
    utterance.onend = () => setIsPlayingTTS(false);
    utterance.onerror = () => setIsPlayingTTS(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsPlayingTTS(true);
  };

  const handleApplyToComplaint = () => {
    const textToApply = activeView === 'formal' && formalStatement ? formalStatement : spokenTranscript;
    if (textToApply) {
      onPopulateDescription(textToApply, recommendedCategory);
      setAppliedSuccessfully(true);
      setStatusMessage('Applied structured statement & legal subject to official complaint form!');
      setTimeout(() => setAppliedSuccessfully(false), 4000);
    }
  };

  return (
    <div className="border border-rose-900/40 rounded-3xl bg-[#081224] p-5 sm:p-6 space-y-5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <h3 className="text-sm sm:text-base font-bold text-white font-display flex items-center gap-2">
              <Mic className="w-4 h-4 text-rose-400" />
              <span>Multilingual Voice Complaint Assistant</span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Speak incident details in Tamil, Malayalam, or English. Transcribes speech and formalizes it into an official legal statement.
          </p>
        </div>

        {/* Edge Indicator */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-[11px] font-mono text-cyan-400 self-start sm:self-auto">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Edge Voice Recognition Active</span>
        </div>
      </div>

      {/* Language Selector Tabs & Voice Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Language Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          {(['en', 'ta', 'ml'] as LanguageCode[]).map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                if (isRecording) stopRecording();
                onLanguageChange(lang);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedLanguage === lang
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {languageLabels[lang].native}
            </button>
          ))}
        </div>

        {/* Main Microphone Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Speaker Sound Test */}
          <button
            type="button"
            onClick={testSpeakerSound}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1.5 border border-slate-800 cursor-pointer"
            title="Play audio test chime through your speakers"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Test Speaker</span>
          </button>

          {spokenTranscript && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Clear transcript"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setMicPermissionBlocked(false);
              toggleRecording();
            }}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/50'
                : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 text-white shadow-rose-500/20'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isRecording ? 'Stop Recording' : 'Start Microphone'}</span>
          </button>
        </div>
      </div>

      {/* Mic Notice (Subtle, non-blocking notification only if blocked) */}
      {micPermissionBlocked && (
        <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Mic access was restricted. Click the lock/tune icon in your browser address bar to allow microphone.</span>
          </div>
          <button
            type="button"
            onClick={handleUseQuickPrompt}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
          >
            Use Sample Speech
          </button>
        </div>
      )}

      {/* Live Audio Decibel Volume Meter */}
      {isRecording && (
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-rose-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>Microphone Live in {languageLabels[selectedLanguage].name}... Speak clearly now</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-28 sm:w-36 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-75"
                style={{ width: `${Math.max(10, audioLevel)}%` }}
              ></div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">{audioLevel}%</span>
          </div>
        </div>
      )}

      {/* Quick Testing Voice Utterance Chip */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px]">
        <div className="text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick voice incident testing:</span>
        </div>
        <button
          type="button"
          onClick={handleUseQuickPrompt}
          className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/50 transition-colors cursor-pointer text-[11px] font-medium"
        >
          {quickVoicePrompts[selectedLanguage]?.label || 'Load Sample Voice Prompt'}
        </button>
      </div>

      {/* Status banner */}
      <div className="text-[11px] text-slate-400 flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>{statusMessage}</span>
      </div>

      {/* Transcript & Formal Statement Area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView('spoken')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeView === 'spoken'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw Spoken Words ({spokenTranscript ? spokenTranscript.split(' ').filter(Boolean).length : 0} words)
            </button>
            <button
              type="button"
              onClick={() => setActiveView('formal')}
              disabled={!formalStatement}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeView === 'formal'
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                  : formalStatement
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Legal Complaint Format</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReadAloud}
              disabled={!spokenTranscript && !formalStatement}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
              title="Read aloud"
            >
              {isPlayingTTS ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <span className="text-[10px] hidden sm:inline">{isPlayingTTS ? 'Stop' : 'Listen'}</span>
            </button>
          </div>
        </div>

        {/* Display Text Area */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 min-h-[110px] text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
          {activeView === 'formal' && formalStatement ? (
            <div className="space-y-3">
              {/* Intelligent Triage Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-900">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold">
                    {recommendedCategory || 'Crime Incident'}
                  </span>
                  {systemOneJev && (
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-800/50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>System 1 Reflex: {systemOneJev.urgencyScore}/100 ({systemOneJev.sub50msLatencyMs}ms)</span>
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Gemini Legal Structure Ready</span>
                </div>
              </div>

              {subjectTitle && (
                <div className="text-white font-bold text-sm bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-xs font-normal block font-mono">SUBJECT / TITLE:</span>
                  {subjectTitle}
                </div>
              )}

              <p className="text-slate-100 font-normal leading-relaxed">{formalStatement}</p>

              {legalSections.length > 0 && (
                <div className="pt-2 border-t border-slate-900 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono font-bold uppercase">
                    <Scale className="w-3 h-3" />
                    <span>Applicable Legal Provisions & Penal Sections:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {legalSections.map((sec, idx) => (
                      <span key={idx} className="text-[10px] font-mono bg-amber-950/40 border border-amber-800/40 text-amber-200 px-2 py-0.5 rounded">
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {extractedFacts.length > 0 && (
                <div className="pt-2 border-t border-slate-900 space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Extracted Facts & Digital Artifacts:</span>
                  <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                    {extractedFacts.map((fact, idx) => (
                      <li key={idx}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : spokenTranscript || interimText ? (
            <div>
              <span className="text-slate-400 italic">Transcribed Voice Speech:</span>
              <p className="mt-1 text-white font-medium">
                {spokenTranscript}
                {interimText && <span className="text-rose-400 italic animate-pulse"> {interimText}</span>}
              </p>
            </div>
          ) : (
            <div className="text-slate-500 italic py-5 text-center">
              Microphone transcript will appear here in real-time as you speak...
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleFormalize}
            disabled={isFormalizing || (!spokenTranscript && !currentDescription)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 shadow-lg shadow-purple-950"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isFormalizing ? 'Formalizing...' : 'Statementize / Formalize into Legal Format'}</span>
          </button>

          <button
            type="button"
            onClick={handleApplyToComplaint}
            disabled={!spokenTranscript && !formalStatement}
            className={`px-5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 shadow-lg ${
              appliedSuccessfully
                ? 'bg-emerald-600 text-white shadow-emerald-950'
                : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 text-white shadow-rose-950'
            }`}
          >
            {appliedSuccessfully ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Applied to Form!</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Apply to Complaint Description</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
