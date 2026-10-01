import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, RefreshCw, ArrowUpRight, Cpu, Radio } from 'lucide-react';
import { getAgentActivity } from '../services/api';
import { agentLabel, agentShort, statusStyle } from '../utils/agents';
import { formatDateTime, formatTime } from '../utils/format';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingSpinner from './LoadingSpinner';
import RiskBadge from './RiskBadge';

/**
 * LIVE AGENT ACTIVITY
 *
 * Reads the real AgentLog records written by the Supervisor — no fabricated
 * statuses. Each row shows the agent, its status, when it ran, the finding it
 * reported and how many evidence items it registered.
 */
export default function AgentActivityFeed() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const res = await getAgentActivity();
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 15000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <LoadingSpinner text="Reading agent logs…" />;
  if (error) return <ErrorState error={error} onRetry={() => load()} title="Agent activity unavailable" compact />;

  const agents = data?.agents || [];

  return (
    <div className="card flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <Radio className="w-4 h-4 text-accent-400" />
            LIVE AGENT ACTIVITY
          </h3>
          <p className="text-[11px] text-surface-400 mt-0.5 truncate">
            {data.caseId ? (
              <>
                Pipeline for{' '}
                <Link to={`/cases/${data.caseId}`} className="text-accent-400 hover:text-accent-300 font-mono">
                  {data.caseId}
                </Link>
                {data.investigationCycles > 1 && ` • cycle ${data.investigationCycles}`}
              </>
            ) : (
              'No investigation has run yet'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {data.riskLevel && <RiskBadge level={data.riskLevel} />}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
            title="Refresh agent activity"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {agents.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="No agent executions recorded"
          description="Start an investigation from a case or an alert and the agent log will populate here."
        />
      ) : (
        <div className="space-y-1.5 max-h-[24rem] overflow-y-auto pr-1 -mx-1 px-1">
          {agents.map((a, i) => {
            const st = statusStyle(a.status);
            return (
              <motion.div
                key={`${a.agentName}-${a.cycle}-${a.timestamp}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.03 }}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-800/30 border border-surface-800/70 hover:border-surface-700 transition-colors"
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${st.dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">{agentLabel(a.agentName)}</span>
                    <span className={`text-[9px] font-mono font-bold tracking-wider ${st.color}`}>{st.text}</span>
                    {a.evidenceCount > 0 && (
                      <span className="text-[9px] font-mono text-accent-400 bg-accent-600/10 border border-accent-500/20 rounded px-1 py-0.5">
                        {a.evidenceCount} EV
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-surface-500 ml-auto shrink-0" title={formatDateTime(a.timestamp)}>
                      {formatTime(a.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-surface-300 mt-0.5 leading-relaxed line-clamp-2">{a.finding}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {data.updatedAt && (
        <div className="mt-4 pt-3 border-t border-surface-800/60 flex items-center justify-between gap-3">
          <p className="text-[10px] text-surface-600 font-mono flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            {agents.length} agent log entries • updated {formatTime(data.updatedAt)}
          </p>
          {data.caseId && (
            <Link
              to={`/cases/${data.caseId}`}
              className="text-[11px] font-semibold text-accent-400 hover:text-accent-300 flex items-center gap-1 shrink-0"
            >
              Open case
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
