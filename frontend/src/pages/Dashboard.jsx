import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import { AlertTriangle, Briefcase, TrendingUp, ShieldAlert, Clock, ArrowUpRight, Zap, Radio, ShieldCheck, Activity } from 'lucide-react';
import { getDashboardStats } from '../services/api';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedCounter from '../components/AnimatedCounter';
import PageTransition from '../components/PageTransition';
import { formatCurrency, formatDateTime } from '../utils/format';

const RISK_COLORS = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="card max-w-md text-center border-red-500/30 bg-red-500/10 p-6">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">SOC Telemetry Connection Failed</h3>
          <p className="text-xs text-surface-400 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Retry Telemetry Link</button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-surface-400">
        <div className="w-12 h-12 rounded-2xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center mb-4 text-accent-400 animate-bounce">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-white">Connecting to SOC Command Grid...</p>
        <p className="text-xs text-surface-500 mt-1 font-mono">Initializing multi-agent fraud metrics</p>
      </div>
    );
  }

  const riskData = Object.entries(stats.riskDistribution).map(([level, count]) => ({ level, count }));
  const statusData = Object.entries(stats.investigationStatus).map(([status, count]) => ({ status: status.replace(/_/g, ' '), count }));

  return (
    <PageTransition>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* SOC Command Header Banner */}
        <div className="relative rounded-3xl p-8 bg-gradient-to-r from-surface-900/90 via-surface-900/60 to-surface-950/90 border border-surface-800/80 shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-accent-500/10 text-accent-400 border border-accent-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  REAL-TIME INTELLIGENCE
                </span>
                <span className="text-xs text-surface-400 font-mono">• 24hr Window</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Financial Security Command Center
              </h1>
              <p className="text-sm text-surface-400 mt-1 max-w-2xl">
                Autonomous fraud detection neural network monitoring transaction streams, entity clusters, and device fingerprints.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/alerts" className="btn-primary">
                <ShieldAlert className="w-4 h-4" />
                View Active Alerts
              </Link>
              <Link to="/cases" className="btn-secondary">
                <Briefcase className="w-4 h-4" />
                Case Inventory
              </Link>
            </div>
          </div>
        </div>

        {/* 3D Tilt Animated Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <AnimatedCard delay={0}>
            <StatCard title="Total Volume" value={<AnimatedCounter value={stats.totalTransactions} />} icon={TrendingUp} />
          </AnimatedCard>
          <AnimatedCard delay={0.06}>
            <StatCard title="Suspicious Flags" value={<AnimatedCounter value={stats.suspiciousTransactions} />} icon={ShieldAlert} accent="text-red-400" />
          </AnimatedCard>
          <AnimatedCard delay={0.12}>
            <StatCard title="Active Investigations" value={<AnimatedCounter value={stats.activeInvestigations} />} icon={Briefcase} accent="text-sky-400" />
          </AnimatedCard>
          <AnimatedCard delay={0.18}>
            <StatCard title="High Risk Cases" value={<AnimatedCounter value={stats.highRiskCases} />} icon={AlertTriangle} accent="text-orange-400" />
          </AnimatedCard>
          <AnimatedCard delay={0.24}>
            <StatCard title="Pending Human Review" value={<AnimatedCounter value={stats.pendingHumanReviews} />} icon={Clock} accent="text-amber-400" />
          </AnimatedCard>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Distribution Donut */}
          <AnimatedCard delay={0.3} className="card">
            <h3 className="card-header">
              <span>Risk Level Spectrum</span>
              <span className="text-[10px] font-mono text-surface-400">Composite Index</span>
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskData} dataKey="count" nameKey="level" innerRadius={60} outerRadius={85} paddingAngle={5}>
                    {riskData.map((entry) => (
                      <Cell key={entry.level} fill={RISK_COLORS[entry.level] || '#64748b'} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#090d16', border: '1px solid #334155', borderRadius: 12, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-surface-800/60">
              {riskData.map((r) => (
                <div key={r.level} className="flex items-center gap-2 text-xs text-surface-300">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: RISK_COLORS[r.level] }} />
                  <span className="font-medium">{r.level}:</span>
                  <span className="font-mono text-surface-400 font-bold ml-auto">{r.count}</span>
                </div>
              ))}
            </div>
          </AnimatedCard>

          {/* Area Chart: Alerts Over Time */}
          <AnimatedCard delay={0.36} className="card">
            <h3 className="card-header">
              <span>Threat Velocity Stream</span>
              <span className="text-[10px] font-mono text-accent-400">7-Day Telemetry</span>
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.alertsOverTime}>
                  <defs>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#090d16', border: '1px solid #334155', borderRadius: 12, color: '#fff' }} />
                  <Area type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAlerts)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>

          {/* Bar Chart: Investigation Pipeline */}
          <AnimatedCard delay={0.42} className="card">
            <h3 className="card-header">
              <span>Pipeline Status</span>
              <span className="text-[10px] font-mono text-surface-400">Workflow States</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis type="category" dataKey="status" tick={{ fill: '#94a3b8', fontSize: 10 }} width={110} />
                  <Tooltip contentStyle={{ background: '#090d16', border: '1px solid #334155', borderRadius: 12, color: '#fff' }} />
                  <Bar dataKey="count" fill="#0284c7" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>
        </div>

        {/* Recent Cases Live Table */}
        <AnimatedCard delay={0.48} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-accent-400 animate-pulse" />
              Active Priority Investigations
            </h3>
            <Link to="/cases" className="text-xs font-semibold text-accent-400 hover:text-accent-300 flex items-center gap-1">
              View All Cases
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-800 text-surface-400 text-xs uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Time</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/50 text-sm">
                {stats.recentCases.map((c) => (
                  <tr key={c.caseId} className="hover:bg-surface-800/40 transition-colors group">
                    <td className="py-3.5 px-4">
                      <Link to={`/cases/${c.caseId}`} className="text-accent-400 group-hover:text-accent-300 font-mono text-xs font-bold">
                        {c.caseId}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-surface-300 text-xs">{c.customerId}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      {c.amount ? formatCurrency(c.amount) : '—'}
                    </td>
                    <td className="py-3.5 px-4"><RiskBadge level={c.riskLevel} /></td>
                    <td className="py-3.5 px-4"><StatusBadge status={c.status} /></td>
                    <td className="py-3.5 px-4 text-xs text-surface-400 font-mono">{formatDateTime(c.createdAt)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/cases/${c.caseId}`} className="btn-secondary py-1 px-3 text-xs">
                        Investigate
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedCard>
      </div>
    </PageTransition>
  );
}
