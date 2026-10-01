import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, LayoutDashboard, AlertTriangle, Briefcase, FileText, Activity, Bell, Search, Radio, Sparkles } from 'lucide-react';
import CyberBackground3D from './CyberBackground3D';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/cases', label: 'Cases', icon: Briefcase },
  { to: '/reports', label: 'Reports', icon: FileText },
];

export default function Layout() {
  const location = useLocation();
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#030712] text-surface-100 relative overflow-hidden font-sans">
      {/* 3D Three.js Particle Background */}
      <CyberBackground3D />

      {/* Sidebar */}
      <aside className="w-64 bg-surface-950/80 backdrop-blur-2xl border-r border-surface-800/80 flex flex-col shrink-0 z-20 relative shadow-2xl">
        {/* Brand Logo Header */}
        <div className="p-5 border-b border-surface-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-500 via-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-accent-500/25">
              <div className="w-full h-full bg-surface-950 rounded-[14px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent-400" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-wide text-white flex items-center gap-1.5">
                FraudLens
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-500/20 text-accent-400 border border-accent-500/30">
                  AI
                </span>
              </h1>
              <p className="text-[11px] text-surface-400 font-medium">Risk & Fraud Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3.5 space-y-1.5">
          <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest px-3 mb-2">Navigation</p>
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname.startsWith(to) || (to === '/dashboard' && location.pathname === '/');
            return (
              <NavLink
                key={to}
                to={to}
                className={`relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'text-accent-400 bg-accent-500/10 border border-accent-500/30 shadow-lg shadow-accent-500/10'
                    : 'text-surface-400 hover:text-white hover:bg-surface-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110 text-accent-400' : ''}`} />
                <span>{label}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="ml-auto w-2 h-2 rounded-full bg-accent-400 shadow-[0_0_10px_#38bdf8]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* System Status Footer */}
        <div className="p-4 border-t border-surface-800/80 bg-surface-900/40">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-emerald-400">Autonomous Neural Shield Active</span>
          </div>
          <div className="text-[11px] text-surface-400 font-mono space-y-0.5">
            <p>Model: Gemini Multi-Agent</p>
            <p className="text-surface-500">Latency: 42ms • Integrity 99.9%</p>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-surface-950/60 backdrop-blur-xl border-b border-surface-800/80 px-8 flex items-center justify-between shrink-0 z-20">
          {/* Left Security Status Pill */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold shadow-lg shadow-red-500/10">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>DEFCON-2 • ELEVATED RISK MONITORING</span>
            </div>
          </div>

          {/* Right System Info & Controls */}
          <div className="flex items-center gap-5 text-xs text-surface-400">
            <div className="hidden md:flex items-center gap-2 bg-surface-900/80 border border-surface-800 px-3 py-1.5 rounded-xl font-mono">
              <Activity className="w-3.5 h-3.5 text-accent-400" />
              <span>LIVE SYS TIME: {time}</span>
            </div>
            <button className="p-2 rounded-xl bg-surface-900/80 border border-surface-800 text-surface-300 hover:text-white hover:border-surface-700 transition-all">
              <Bell className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 pl-3 border-l border-surface-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-500 to-indigo-500 p-0.5">
                <div className="w-full h-full bg-surface-950 rounded-full flex items-center justify-center font-bold text-white text-xs">
                  AI
                </div>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-white leading-tight">SecOps Analyst</p>
                <p className="text-[10px] text-surface-400">SOC Investigator #409</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page View with Motion AnimatePresence */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
