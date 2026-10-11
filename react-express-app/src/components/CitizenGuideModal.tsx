import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  MessageSquare,
  Send,
  ShieldCheck,
  Mic,
  FileText,
  PhoneCall,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface CitizenGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (action: string) => void;
}

export const CitizenGuideModal: React.FC<CitizenGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  const [userQuery, setUserQuery] = useState('');
  const [messages, setMessages] = useState<{ sender: 'ai' | 'user'; text: string }[]>([
    {
      sender: 'ai',
      text: 'Namaste! I am the CRIMVEXA Citizen AI Assistant. If you are not sure how to report an incident or use this application, I am here to help you step-by-step. What happened, or what would you like guidance on?'
    }
  ]);

  if (!isOpen) return null;

  const quickGuideTopics = [
    {
      title: 'How do I report a UPI or WhatsApp Scam?',
      answer: '1. Select the "Report a Crime" tab.\n2. Choose "UPI / Financial Scam" in the category dropdown.\n3. Speak in your language (English, Tamil, or Malayalam) or type what happened.\n4. Include the scammer\'s UPI ID (e.g. name@bank) or phone number and the loss amount.\n5. Attach transaction screenshots or SMS receipts with SHA-256 integrity check.'
    },
    {
      title: 'How does Voice Reporting in Tamil or Malayalam work?',
      answer: '1. Click the "Voice Assistant" panel.\n2. Tap "தமிழ் (Tamil)" or "മലയാളം (Malayalam)".\n3. Click "Start Microphone" and describe your incident in your native tongue.\n4. Click "Statementize into Legal Format" — our AI transcribes your words and structures them into an official police report statement in English and regional text!'
    },
    {
      title: 'What happens after I submit my complaint?',
      answer: '1. You receive a unique permanent Case Reference (e.g. CVX-2026-XXXX).\n2. The complaint is categorized and assigned an urgency priority level.\n3. For cyber frauds, a fast-track lien alert is dispatched under the National 1930 Cyber Cell protocol.\n4. You can track real-time milestones in the "Track Status" tab.'
    },
    {
      title: 'What is the Golden Hour Financial Freeze?',
      answer: 'If you lost money via UPI, net banking, or fraudulent cards within the last 2 hours, reporting immediately allows cyber officers to freeze the stolen funds at the beneficiary bank account before fraudsters withdraw it.'
    }
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const newMsgs = [...messages, { sender: 'user' as const, text: text.trim() }];
    setMessages(newMsgs);
    setUserQuery('');

    // AI intelligent answer
    const lower = text.toLowerCase();
    let reply = 'To file a report, start on the "Report Incident" tab. Fill in what happened, the occurrence time, landmark location, and attach any receipts. Our AI will automatically categorize your complaint and calculate its priority.';

    if (lower.includes('upi') || lower.includes('money') || lower.includes('scam') || lower.includes('bank') || lower.includes('பணம்') || lower.includes('പണം')) {
      reply = 'For financial scams: Report immediately on the citizen portal. Mention the exact amount, destination UPI ID, bank reference UTR number, and upload your payment app screenshot. Cyber officers receive an instant freeze notification.';
    } else if (lower.includes('voice') || lower.includes('speak') || lower.includes('tamil') || lower.includes('malayalam') || lower.includes('மொழி')) {
      reply = 'You can speak in English, Tamil (தமிழ்), or Malayalam (മലയാളം)! Select your language, tap "Start Microphone", and speak. Then click "Statementize" to transform your spoken words into a formal legal complaint statement.';
    } else if (lower.includes('track') || lower.includes('status') || lower.includes('fir')) {
      reply = 'Use the "Track Status" tab in the top navigation bar. Enter your Case ID (e.g. CVX-2026-XXXX) to view live investigation progress, evidence verification hashes, and officer investigation remarks.';
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="max-w-2xl w-full bg-[#0a1222] border border-cyan-800/50 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#08101e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">
                CRIMVEXA AI Citizen Guidance Assistant
              </h3>
              <p className="text-[11px] text-slate-400">
                Interactive guidance on filing, voice reporting, and cyber fraud freeze
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Topic Chips */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto flex gap-2 no-scrollbar">
          {quickGuideTopics.map((topic, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setMessages(prev => [
                  ...prev,
                  { sender: 'user', text: topic.title },
                  { sender: 'ai', text: topic.answer }
                ]);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-700/50 text-[11px] font-semibold text-slate-300 whitespace-nowrap transition-colors shrink-0 cursor-pointer"
            >
              {topic.title}
            </button>
          ))}
        </div>

        {/* Conversation Message Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-600/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
              <div
                className={`p-3.5 rounded-2xl max-w-md leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-rose-600 text-white font-medium'
                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Query Input */}
        <div className="p-4 bg-[#08101e] border-t border-slate-800 flex gap-2">
          <input
            type="text"
            placeholder="Ask anything (e.g. 'How do I record in Tamil?', 'What is 1930?')..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(userQuery)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={() => handleSend(userQuery)}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
};
