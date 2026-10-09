import React, { useState } from 'react';
import { X, Copy, Check, ShieldCheck, Database, Terminal } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../data/supabaseSchema';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <span>Supabase PostgreSQL Schema & Security Rules (RLS)</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Ready to Deploy
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Production-ready tables, auto-profile trigger on signup, and strict Row Level Security policies per user.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info callout */}
        <div className="px-6 py-3 bg-emerald-950/30 border-b border-emerald-900/40 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              All tables enforce <strong className="text-white">owner_id = auth.uid()</strong> so hosts can never see or modify each other’s quizzes or live game data.
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md transition-all text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied SQL!' : 'Copy Entire SQL'}</span>
          </button>
        </div>

        {/* Code viewer */}
        <div className="flex-1 overflow-auto p-6 bg-slate-950">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 flex items-center space-x-1">
              <Terminal className="w-3.5 h-3.5" />
              <span>supabase_migration.sql</span>
            </span>
          </div>
          <pre className="font-mono text-xs text-emerald-400/90 bg-slate-900/90 p-4 rounded-xl border border-slate-800 overflow-x-auto leading-relaxed whitespace-pre selection:bg-emerald-500/30 selection:text-white">
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>How to use: Open Supabase Project &gt; SQL Editor &gt; Paste and click &quot;Run&quot;.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
