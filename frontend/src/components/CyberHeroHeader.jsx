import { motion } from 'framer-motion';
import { Shield, Sparkles, Zap, Activity, Cpu, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CyberHeroHeader({ title, subtitle, stats }) {
  return (
    <div className="relative rounded-3xl p-8 mb-8 overflow-hidden bg-gradient-to-r from-surface-900/90 via-surface-900/60 to-surface-950/90 border border-surface-800/80 backdrop-blur-2xl shadow-cyber-glass">
      {/* Background Neon Grid & Particle Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs font-semibold font-mono mb-3">
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-ping" />
            FRAUDLENS SOC v2.4 • REAL-TIME INVESTIGATION ENGINE
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            {title || 'Financial Security Operations Center'}
          </h1>
          <p className="text-surface-300 text-sm mt-2 max-w-2xl">
            {subtitle || 'Autonomous multi-agent AI neural pipeline detecting complex financial crime & transaction velocity anomalies.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/alerts" className="btn-primary">
            <Zap className="w-4 h-4" />
            Live Threat Stream
          </Link>
          <Link to="/cases" className="btn-secondary">
            <Shield className="w-4 h-4 text-accent-400" />
            Active Cases
          </Link>
        </div>
      </div>

      {/* Quick Cyber Metric Ticker */}
      <div className="mt-6 pt-6 border-t border-surface-800/60 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-surface-400">SYSTEM LATENCY</p>
            <p className="text-sm font-bold text-white font-mono">14.2 ms</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-surface-400">NEURAL CONSENSUS</p>
            <p className="text-sm font-bold text-white font-mono">99.2% ACCURACY</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-surface-400">AGENTS RUNNING</p>
            <p className="text-sm font-bold text-white font-mono">9 PARALLEL</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-surface-400">AUTOMATED SHIELD</p>
            <p className="text-sm font-bold text-emerald-400 font-mono">ENFORCED</p>
          </div>
        </div>
      </div>
    </div>
  );
}
