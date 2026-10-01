import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { AlertTriangle, Briefcase, TrendingUp, ShieldAlert, Clock, ArrowUpRight } from 'lucide-react';
import { getDashboardStats } from '../services/api';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedCounter from '../components/AnimatedCounter';
import PageTransition from '../components/PageTransition';
import CyberHeroHeader from '../components/CyberHeroHeader';
import ThreatGlobe3D from '../components/ThreatGlobe3D';
import RadarScannerGSAP from '../components/RadarScannerGSAP';
import AgentOrchestratorGSAP from '../components/AgentOrchestratorGSAP';
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
      <div className="p-8 text-red-400">
        <p className="font-bold">Failed to load dashboard telemetry:</p>
        <p className="font-mono text-xs mt-1">{error}</p>
      </div>
    );
  }
  if (!stats) {
    return (
      <div className="p-12 text-center text-surface-400 font-mono flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-accent-400 border-t-transparent rounded-full animate-spin mb-4" />
        Initializing 3D Telemetry & AI Agent Pipeline…
      </div>
    );
  }

  const riskData = Object.entries(stats.riskDistribution).map(([level, count]) => ({ level, count }));
  const statusData = Object.entries(stats.investigationStatus).map(([status, count]) => ({ status: status.replace(/_/g, ' '), count }));

  return (
    <PageTransition>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Cyber Hero Banner */}
        <CyberHeroHeader />

        {/* 3D Global Telemetry Mesh & Live Threat Radar Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatedCard delay={0.1}>
            <div className="h-full flex flex-col">
              <ThreatGlobe3D />
            </div>
          </AnimatedCard>
          <AnimatedCard delay={0.15}>
            <RadarScannerGSAP />
          </AnimatedCard>
        </div>

        {/* Stat Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <AnimatedCard delay={0.2}>
            <StatCard title="Total Transactions" value={<AnimatedCounter value={stats.totalTransactions} />} icon={TrendingUp} />
          </AnimatedCard>
          <AnimatedCard delay={0.25}>
            <StatCard title="Suspicious" value={<AnimatedCounter value={stats.suspiciousTransactions} />} icon={ShieldAlert} accent="text-red-400" />
          </AnimatedCard>
          <AnimatedCard delay={0.3}>
            <StatCard title="Active Investigations" value={<AnimatedCounter value={stats.activeInvestigations} />} icon={Briefcase} accent="text-accent-400" />
          </AnimatedCard>
          <AnimatedCard delay={0.35}>
            <StatCard title="High Risk Cases" value={<AnimatedCounter value={stats.highRiskCases} />} icon={AlertTriangle} accent="text-orange-400" />
          </AnimatedCard>
          <AnimatedCard delay={0.4}>
            <StatCard title="Pending Human Reviews" value={<AnimatedCounter value={stats.pendingHumanReviews} />} icon={Clock} accent="text-amber-400" />
          </AnimatedCard>
        </div>

        {/* Multi-Agent Orchestrator Pipeline */}
        <AnimatedCard delay={0.45}>
          <AgentOrchestratorGSAP agents={[]} />
        </AnimatedCard>

        {/* Recharts Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnimatedCard delay={0.5} className="card">
            <h3 className="card-header">Risk Distribution Breakdown</h3>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={riskData} dataKey="count" nameKey="level" innerRadius={55} outerRadius={85} paddingAngle={4}>
                  {riskData.map((entry) => (
                    <Cell key={entry.level} fill={RISK_COLORS[entry.level] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #334155', borderRadius: 12, backdropFilter: 'blur(12px)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {riskData.map((r) => (
                <div key={r.level} className="flex items-center gap-1.5 text-xs text-surface-400 font-mono">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: RISK_COLORS[r.level] }} />
                  {r.level} ({r.count})
                </div>
              ))}
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.55} className="card">
            <h3 className="card-header">Alert Velocity Trend</h3>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={stats.alertsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #334155', borderRadius: 12, backdropFilter: 'blur(12px)' }} />
                <Line type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2.5} dot={{ fill: '#00f3ff', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </AnimatedCard>

          <AnimatedCard delay={0.6} className="card">
            <h3 className="card-header">Investigation Status</h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis type="category" dataKey="status" tick={{ fill: '#94a3b8', fontSize: 10 }} width={110} />
                <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #334155', borderRadius: 12, backdropFilter: 'blur(12px)' }} />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedCard>
        </div>

        {/* Recent Cases Table */}
        <AnimatedCard delay={0.65} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-header mb-0">High-Priority Cases Pending Action</h3>
            <Link to="/cases" className="text-xs font-mono text-accent-400 hover:text-accent-300 flex items-center gap-1">
              View All Cases <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="table-header text-left px-4 py-3">Case ID</th>
                  <th className="table-header text-left px-4 py-3">Customer</th>
                  <th className="table-header text-left px-4 py-3">Amount</th>
                  <th className="table-header text-left px-4 py-3">Risk Level</th>
                  <th className="table-header text-left px-4 py-3">Status</th>
                  <th className="table-header text-left px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentCases.map((c) => (
                  <tr key={c.caseId} className="border-b border-surface-800/40 hover:bg-surface-800/40 transition-colors">
                    <td className="table-cell">
                      <Link to={`/cases/${c.caseId}`} className="text-accent-400 hover:text-accent-300 font-mono text-xs font-bold">
                        {c.caseId}
                      </Link>
                    </td>
                    <td className="table-cell font-mono text-xs">{c.customerId}</td>
                    <td className="table-cell font-mono font-semibold">{c.amount ? formatCurrency(c.amount) : '—'}</td>
                    <td className="table-cell"><RiskBadge level={c.riskLevel} /></td>
                    <td className="table-cell"><StatusBadge status={c.status} /></td>
                    <td className="table-cell text-xs font-mono text-surface-400">{formatDateTime(c.createdAt)}</td>
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
