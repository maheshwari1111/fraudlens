import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import { AlertTriangle, Briefcase, TrendingUp, ShieldAlert, Clock, ArrowUpRight, ShieldCheck, Activity, Loader2, Play } from 'lucide-react';
import { getDashboardStats, startInvestigation as startInvestigationApi } from '../services/api';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import AgentActivityFeed from '../components/AgentActivityFeed';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedCounter from '../components/AnimatedCounter';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import PageTransition from '../components/PageTransition';
import { formatCurrency, formatDateTime } from '../utils/format';

const RISK_COLORS = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' };
const RISK_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const tooltipStyle = { background: '#090d16', border: '1px solid #334155', borderRadius: 12, color: '#fff', fontSize: 11 };

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(null);
  const [actionError, setActionError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  // Quick investigation from the dashboard: runs the real pipeline, then routes
  // to the case so the investigator lands on the evidence.
  const startInvestigation = async (investigationCase) => {
    setStarting(investigationCase.caseId);
    setActionError(null);
    try {
      await startInvestigationApi({
        transactionId: investigationCase.transactionId,
        customerId: investigationCase.customerId,
        alertId: investigationCase.alertId,
      });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setStarting(null);
    }
    navigate(`/cases/${investigationCase.caseId}`);
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="card max-w-lg mx-auto">
          <ErrorState error={error} onRetry={load} title="Monitoring feed unavailable" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner text="Connecting to the monitoring feed…" />
      </div>
    );
  }

  // Always show all four bands so the spectrum does not silently reflow.
  const riskData = RISK_ORDER.map((level) => ({
    level,
    count: stats.riskDistribution?.[level] || 0,
  }));
  const statusData = Object.entries(stats.investigationStatus || {}).map(([status, count]) => ({
    status: status.replace(/_/g, ' '),
    count,
  }));

  const pendingCase = stats.recentCases?.find((c) => c.status === 'AWAITING_HUMAN_REVIEW');
  const unrunCase = stats.recentCases?.find((c) => (c.agentResults?.length || 0) === 0);
  const totalCases = statusData.reduce((s, d) => s + d.count, 0);

  return (
    <PageTransition>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="relative rounded-2xl p-6 bg-surface-900/60 border border-surface-800/80 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full bg-accent-500/10 text-accent-400 border border-accent-500/30 text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" />
                  EVIDENCE-BACKED INVESTIGATION
                </span>
                <span className="text-[11px] text-surface-500 font-mono">Monitoring overview</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                Financial Security Command Center
              </h1>
              <p className="text-sm text-surface-400 mt-1.5 max-w-2xl leading-relaxed">
                Multi-agent investigation system correlating transaction behaviour, device signals,
                location intelligence and historical alerts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link to="/alerts" className="btn-primary py-2.5 px-4 text-sm">
                <ShieldAlert className="w-4 h-4" />
                View Active Alerts
              </Link>
              <Link to="/cases" className="btn-secondary py-2.5 px-4 text-sm">
                <Briefcase className="w-4 h-4" />
                Case Inventory
              </Link>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <AnimatedCard delay={0}>
            <StatCard title="Total Volume" value={<AnimatedCounter value={stats.totalTransactions} />} icon={TrendingUp} />
          </AnimatedCard>
          <AnimatedCard delay={0.05}>
            <StatCard
              title="Suspicious Flags"
              value={<AnimatedCounter value={stats.suspiciousTransactions} />}
              icon={ShieldAlert}
              accent="text-red-400"
            />
          </AnimatedCard>
          <AnimatedCard delay={0.1}>
            <StatCard
              title="Active Investigations"
              value={<AnimatedCounter value={stats.activeInvestigations} />}
              icon={Briefcase}
              accent="text-sky-400"
            />
          </AnimatedCard>
          <AnimatedCard delay={0.15}>
            <StatCard
              title="High Risk Cases"
              value={<AnimatedCounter value={stats.highRiskCases} />}
              icon={AlertTriangle}
              accent="text-orange-400"
            />
          </AnimatedCard>
          <AnimatedCard delay={0.2}>
            <StatCard
              title="Pending Human Review"
              value={<AnimatedCounter value={stats.pendingHumanReviews} />}
              icon={Clock}
              accent="text-amber-400"
            />
          </AnimatedCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <AnimatedCard delay={0.25} className="card">
            <h3 className="card-header">
              <span>Risk Level Spectrum</span>
              <span className="text-[10px] font-mono text-surface-500">{totalCases} case(s)</span>
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    dataKey="count"
                    nameKey="level"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={4}
                  >
                    {riskData.map((entry) => (
                      <Cell key={entry.level} fill={RISK_COLORS[entry.level]} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-2 pt-3 border-t border-surface-800/60">
              {riskData.map((r) => (
                <div key={r.level} className="flex items-center gap-1.5 text-[11px]">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: RISK_COLORS[r.level] }} />
                  <span className="text-surface-300">{r.level}</span>
                  <span className="font-mono text-surface-400 font-bold ml-auto">{r.count}</span>
                </div>
              ))}
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.3} className="card">
            <h3 className="card-header">
              <span>Threat Velocity Stream</span>
              <span className="text-[10px] font-mono text-surface-500">Alerts / day</span>
            </h3>
            <div className="h-48">
              {stats.alertsOverTime?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.alertsOverTime}>
                    <defs>
                      <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} tickFormatter={(v) => String(v).slice(5)} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 9 }} width={24} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorAlerts)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState compact title="No alert history" description="Alerts will chart here once recorded." />
              )}
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.35} className="card">
            <h3 className="card-header">
              <span>Pipeline Status</span>
              <span className="text-[10px] font-mono text-surface-500">Workflow states</span>
            </h3>
            <div className="h-56">
              {statusData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 9 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="status" tick={{ fill: '#94a3b8', fontSize: 9 }} width={100} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#0284c7" radius={[0, 5, 5, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState compact title="No cases yet" description="Investigations will appear here." />
              )}
            </div>
          </AnimatedCard>
        </div>

        {/* Agent activity + attention queue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatedCard delay={0.4}>
            <AgentActivityFeed />
          </AnimatedCard>

          <AnimatedCard delay={0.45} className="card flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                Investigator Attention Queue
              </h3>
              <Link to="/cases" className="text-[11px] font-semibold text-accent-400 hover:text-accent-300 flex items-center gap-1">
                All cases
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {pendingCase ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-4"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1.5">
                  Awaiting human decision
                </p>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <Link to={`/cases/${pendingCase.caseId}`} className="font-mono text-sm font-bold text-white hover:text-accent-300">
                    {pendingCase.caseId}
                  </Link>
                  <RiskBadge level={pendingCase.riskLevel} />
                </div>
                <p className="text-xs text-surface-300 mb-3">
                  {pendingCase.customerId} • {pendingCase.transactionId} •{' '}
                  {formatCurrency(pendingCase.amount)} • {pendingCase.riskScore}/100
                </p>
                <Link to={`/cases/${pendingCase.caseId}`} className="btn-warning py-2 px-3 text-xs w-full">
                  <Play className="w-3.5 h-3.5" />
                  Open investigation
                </Link>
              </motion.div>
            ) : (
              /* Nothing is blocked on a human: point at the unrun cases instead
                 of showing an empty panel. */
              <div className="p-3.5 rounded-xl bg-surface-800/40 border border-surface-800 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-1.5">
                  No case awaiting a decision
                </p>
                <p className="text-xs text-surface-400 mb-3 leading-relaxed">
                  HIGH and CRITICAL cases always surface here. Run an investigation on an open case to
                  generate its evidence and risk assessment.
                </p>
                {unrunCase && (
                  <button
                    onClick={() => startInvestigation(unrunCase)}
                    disabled={starting === unrunCase.caseId}
                    className="btn-primary py-2 px-3 text-xs w-full"
                  >
                    {starting === unrunCase.caseId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    Run investigation on {unrunCase.caseId}
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 min-h-0">
              {actionError && (
                <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-2.5 py-1.5 mb-2">
                  {actionError}
                </p>
              )}
              <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-2">
                Recent cases ({stats.recentCases?.length || 0})
              </p>
              {stats.recentCases?.length ? (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 -mx-1 px-1">
                  {stats.recentCases.map((c) => (
                    <div
                      key={c.caseId}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-surface-800/30 border border-surface-800/70 hover:border-surface-700 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/cases/${c.caseId}`}
                            className="font-mono text-xs font-bold text-accent-400 hover:text-accent-300"
                          >
                            {c.caseId}
                          </Link>
                          <span className="font-mono text-[10px] text-surface-500">{c.customerId}</span>
                        </div>
                        <p className="text-[11px] text-surface-400 mt-0.5 truncate">
                          {formatCurrency(c.amount)} • {c.riskScore}/100 • {formatDateTime(c.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.agentResults?.length === 0 ? (
                          <button
                            onClick={() => startInvestigation(c)}
                            disabled={starting === c.caseId}
                            className="btn-primary py-1 px-2.5 text-[10px]"
                          >
                            {starting === c.caseId ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                            Run
                          </button>
                        ) : (
                          <>
                            <RiskBadge level={c.riskLevel} />
                            <StatusBadge status={c.status} />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState compact icon={Briefcase} title="No cases yet" description="Start an investigation from an alert." />
              )}
            </div>
          </AnimatedCard>
        </div>

        {/* Monitoring vs investigation distinction */}
        <AnimatedCard delay={0.5} className="card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-1.5">This page</p>
              <p className="text-sm font-bold text-white">Monitoring</p>
              <p className="text-xs text-surface-400 mt-1 leading-relaxed">
                Volume, alerts, risk distribution and live agent status. Signals only — no conclusions.
              </p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-surface-800 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-1.5">Case page</p>
              <p className="text-sm font-bold text-white">Investigation</p>
              <p className="text-xs text-surface-400 mt-1 leading-relaxed">
                Evidence, agent execution, deterministic risk, relationship graph and the human decision.{' '}
                <Link to="/cases" className="text-accent-400 hover:text-accent-300">Open a case</Link>
              </p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-surface-800 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-1.5">Reports</p>
              <p className="text-sm font-bold text-white">Output</p>
              <p className="text-xs text-surface-400 mt-1 leading-relaxed">
                Evidence-backed investigation report with findings, risk assessment and audit trail.
              </p>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </PageTransition>
  );
}
