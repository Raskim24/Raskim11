import React, { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  Zap,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Smartphone,
  QrCode,
  Volume2,
  Lock,
  Download,
} from 'lucide-react';

interface HostRecommendationsProps {
  onAddTestBots?: () => void;
  onOpenQR?: () => void;
  onOpenPlayerTester?: () => void;
  isLive?: boolean;
}

export const HostRecommendations: React.FC<HostRecommendationsProps> = ({
  onAddTestBots,
  onOpenQR,
  onOpenPlayerTester,
  isLive = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const recommendations = [
    {
      icon: <QrCode className="w-4 h-4 text-purple-400" />,
      title: 'Display QR Code on Screen',
      desc: 'Point phone camera at the QR code to join in 2 seconds without typing any URL or PIN manually.',
      actionLabel: onOpenQR ? 'View Big QR Code' : undefined,
      action: onOpenQR,
    },
    {
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      title: 'Add 3 Test Bots for Instant Preview',
      desc: 'Want to preview how live scoring and podiums look right away? Spawn 3 automated test players.',
      actionLabel: onAddTestBots ? 'Add 3 Test Bots' : undefined,
      action: onAddTestBots,
    },
    {
      icon: <Smartphone className="w-4 h-4 text-emerald-400" />,
      title: 'Open Built-in Player Phone Buzzer',
      desc: 'Test your own buzzer in a side window alongside the big screen to experience both perspectives.',
      actionLabel: onOpenPlayerTester ? 'Open Player Buzzer' : undefined,
      action: onOpenPlayerTester,
    },
    {
      icon: <Lock className="w-4 h-4 text-rose-400" />,
      title: 'Lock Lobby Once Everyone Joins',
      desc: 'Click "Lock" before clicking "Start Game" to prevent late random joiners from disrupting the session.',
    },
    {
      icon: <Award className="w-4 h-4 text-pink-400" />,
      title: 'Explain Streak Bonus Scoring',
      desc: 'Remind players: 3 correct in a row gives +100 bonus, 4 gives +200, 5+ gives +300 points!',
    },
    {
      icon: <Download className="w-4 h-4 text-sky-400" />,
      title: 'Download Full Project Source Code',
      desc: 'Export the complete codebase (frontend, Socket.IO server, and schema) in a clean ZIP archive.',
      actionLabel: 'Download .ZIP',
      action: () => {
        window.location.href = '/api/download-zip';
      },
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
      {/* Header bar toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/60 transition-colors text-left"
      >
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Host Recommendations & Pro Tips
            </span>
            <span className="text-[11px] text-purple-300">
              {isLive ? 'Tips for running an engaging live session' : 'Recommended setups, QR scan & testing tips'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-slate-400">
          <span className="text-xs font-semibold hidden sm:inline">
            {isOpen ? 'Hide Tips' : 'Show Recommendations'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded recommendations */}
      {isOpen && (
        <div className="p-4 pt-2 border-t border-slate-800 space-y-3 bg-slate-950/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    {rec.icon}
                    <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{rec.desc}</p>
                </div>

                {rec.action && rec.actionLabel && (
                  <button
                    type="button"
                    onClick={rec.action}
                    className="self-start text-[11px] font-bold text-purple-400 hover:text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-700/50 px-2.5 py-1 rounded-lg transition-colors mt-1"
                  >
                    {rec.actionLabel} →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
