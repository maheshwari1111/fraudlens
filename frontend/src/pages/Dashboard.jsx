import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { AlertTriangle, Briefcase, TrendingUp, ShieldAlert, Clock } from 'lucide-react';
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
    return <div className="p-8 text-red-400">Failed to load dashboard: {error}</div>;
  }
  if (!stats) {
    return <div className="p-8 text-surface-400">Loading dashboard…</div>;
  }

  const riskData = Object.entries(stats.riskDistribution).map(([level, count]) => ({ level, count }));
  const statusData = Object.entries(stats.investigationStatus).map(([status, count]) => ({ status: status.replace(/_/g, ' '), count }));

  return (
    <PageTransition>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Financial Security Operations Center</h1>
          <p className="text-surface-400 mt-1">AI-powered fraud investigation platform</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <AnimatedCard delay={0}>
            <StatCard title="Total Transactions" value={<AnimatedCounter value={stats.totalTransactions} />} icon={TrendingUp} />
          </AnimatedCard>
          <AnimatedCard delay={0.05}>
            <StatCard title="Suspicious" value={<AnimatedCounter value={stats.suspiciousTransactions} />} icon={ShieldAlert} accent="text-red-400" />
          </AnimatedCard>
          <AnimatedCard delay={0.1}>
            <StatCard title="Active Investigations" value={<AnimatedCounter value={stats.activeInvestigations} />} icon={Briefcase} accent="text-sky-400" />
          </AnimatedCard>
          <AnimatedCard delay={0.15}>
            <StatCard title="High Risk Cases" value={<AnimatedCounter value={stats.highRiskCases} />} icon={AlertTriangle} accent="text-orange-400" />
          </AnimatedCard>
          <AnimatedCard delay={0.2}>
            <StatCard title="Pending Human Reviews" value={<AnimatedCounter value={stats.pendingHumanReviews} />} icon={Clock} accent="text-amber-400" />
          </AnimatedCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <AnimatedCard delay={0.25} className="card">
            <h3 className="card-header">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={riskData} dataKey="count" nameKey="level" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {riskData.map((entry) => (
                    <Cell key={entry.level} fill={RISK_COLORS[entry.level] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {riskData.map((r) => (
                <div key={r.level} className="flex items-center gap-1.5 text-xs text-surface-400">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: RISK_COLORS[r.level] }} />
                  {r.level} ({r.count})
                </div>
              ))}
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.3} className="card">
            <h3 className="card-header">Alerts Over Time</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.alertsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2} dot={{ fill: '#38bdf8' }} />
              </LineChart>
            </ResponsiveContainer>
          </AnimatedCard>

          <AnimatedCard delay={0.35} className="card">
            <h3 className="card-header">Investigation Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis type="category" dataKey="status" tick={{ fill: '#94a3b8', fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedCard>
        </div>

        {/* Recent cases */}
        <AnimatedCard delay={0.4} className="card">
          <h3 className="card-header">Recent Cases</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="table-header text-left px-4 py-3">Case ID</th>
                  <th className="table-header text-left px-4 py-3">Customer</th>
                  <th className="table-header text-left px-4 py-3">Amount</th>
                  <th className="table-header text-left px-4 py-3">Risk</th>
                  <th className="table-header text-left px-4 py-3">Status</th>
                  <th className="table-header text-left px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentCases.map((c) => (
                  <tr key={c.caseId} className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors">
                    <td className="table-cell">
                      <Link to={`/cases/${c.caseId}`} className="text-accent-400 hover:text-accent-500 font-mono text-xs">
                        {c.caseId}
                      </Link>
                    </td>
                    <td className="table-cell">{c.customerId}</td>
                    <td className="table-cell">{c.amount ? formatCurrency(c.amount) : '—'}</td>
                    <td className="table-cell"><RiskBadge level={c.riskLevel} /></td>
                    <td className="table-cell"><StatusBadge status={c.status} /></td>
                    <td className="table-cell text-xs">{formatDateTime(c.createdAt)}</td>
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
