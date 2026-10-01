import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, LayoutDashboard, AlertTriangle, Briefcase, FileText, Sparkles, Terminal, Bell, User } from 'lucide-react';
import Copilot from './Copilot';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alerts', label: 'Live Alerts', icon: AlertTriangle, badge: '12' },
  { to: '/cases', label: 'Cases', icon: Briefcase },
  { to: '/reports', label: 'Reports', icon: FileText },
];

export default function Layout() {
  const location = useLocation();
  const [showCopilot, setShowCopilot] = useState(false);

  return (
    <div className="min-h-screen flex bg-surface-950 text-surface-100 font-sans">
      {/* Glassmorphic Sidebar */}
      <aside className="w-64 bg-surface-900/80 backdrop-blur-2xl border-r border-surface-800/80 flex flex-col shrink-0 z-20 shadow-cyber-glass">
        {/* Brand Header */}
        <div className="p-6 border-b border-surface-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-600 via-accent-500 to-cyber-neon flex items-center justify-center shadow-neon-accent">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-wide flex items-center gap-1.5">
                FraudLens <span className="text-[10px] font-mono text-accent-400 px-1.5 py-0.5 rounded bg-accent-500/10 border border-accent-500/20">AI</span>
              </h1>
              <p className="text-xs text-surface-400 font-mono">SOC Investigation Hub</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map(({ to, label, icon: Icon, badge }) => {
            const isActive = location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={`relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-accent-400 bg-accent-500/10 border border-accent-500/20 shadow-neon-accent/10'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-accent-400' : 'text-surface-400'}`} />
                <span>{label}</span>

                {badge && (
                  <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    {badge}
                  </span>
                )}

                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute right-0 top-2 bottom-2 w-1 rounded-l-full bg-accent-400 shadow-neon-accent"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </NavLink>
            );
          })}

          <div className="pt-6">
            <p className="px-3.5 text-[11px] font-mono text-surface-500 uppercase tracking-widest mb-2">AI Copilot</p>
            <button
              onClick={() => setShowCopilot(true)}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-900/40 via-surface-900 to-accent-950/40 border border-purple-500/30 text-purple-300 hover:border-purple-400 transition-all shadow-lg shadow-purple-500/10 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>Launch AI Assistant</span>
            </button>
          </div>
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-surface-800/60">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-950/60 border border-surface-800 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <p className="font-semibold text-surface-200">System Nominal</p>
              <p className="text-[10px] text-surface-500 font-mono">Live WebSocket Active</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-surface-800/80 bg-surface-900/40 backdrop-blur-xl px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-surface-400">STATUS:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              PROTECTED
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCopilot(!showCopilot)}
              className="btn-secondary text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent-400" />
              AI Copilot
            </button>
            <div className="w-px h-6 bg-surface-800" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-accent-400 text-xs font-bold font-mono">
                SOC
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-white">Lead Analyst</p>
                <p className="text-[10px] text-surface-400 font-mono">Tier-3 Investigator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content with Transition */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Slide-over AI Copilot Modal / Drawer */}
      <AnimatePresence>
        {showCopilot && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-w-lg bg-surface-900/95 border-l border-surface-700/80 shadow-2xl h-full flex flex-col"
            >
              <div className="p-4 border-b border-surface-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  FraudLens AI Assistant
                </div>
                <button
                  onClick={() => setShowCopilot(false)}
                  className="text-surface-400 hover:text-white text-xs px-2 py-1 rounded bg-surface-800"
                >
                  Close ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <Copilot caseId="DEFAULT" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
