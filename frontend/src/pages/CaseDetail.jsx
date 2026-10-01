import { useEffect, useState, useCallback, useRef, Suspense, lazy } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RefreshCw, Loader2, ArrowLeft, Printer, Sparkles, Network, ListChecks } from 'lucide-react';
import { getCase, startInvestigation, getGraph, getReport, getAuditTrail, submitReview, reinvestigate } from '../services/api';
import CaseHeader from '../components/CaseHeader';
import AgentTimeline from '../components/AgentTimeline';
import EvidencePanel from '../components/EvidencePanel';
import RiskBreakdown from '../components/RiskBreakdown';
import HumanReviewPanel from '../components/HumanReviewPanel';
import ReinvestigateModal from '../components/ReinvestigateModal';
import Copilot from '../components/Copilot';
import AuditTrail from '../components/AuditTrail';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import PageTransition from '../components/PageTransition';
import { formatCurrency } from '../utils/format';

// The 3D relationship graph pulls in Three.js (~1 MB). It is only needed once
// an investigator opens a case that has a graph, so it loads on demand.
const Graph3D = lazy(() => import('../components/Graph3D'));

/**
 * Case investigation page — the judge-facing surface.
 *
 * Monitoring lives on the Dashboard; this page is the investigation: evidence,
 * agent execution, deterministic risk, relationship graph, and the human
 * decision. Every value is read from the case record produced by the backend.
 */
export default function CaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [report, setReport] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [highlightEvidence, setHighlightEvidence] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingNote, setPendingNote] = useState('');
  const [toast, setToast] = useState(null);
  const evidenceRef = useRef(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [caseRes, graphRes, reportRes, auditRes] = await Promise.all([
          getCase(id),
          getGraph(id).catch(() => ({ data: { nodes: [], edges: [] } })),
          getReport(id).catch(() => ({ data: null })),
          getAuditTrail(id).catch(() => ({ data: [] })),
        ]);
        setCaseData(caseRes.data);
        setGraph(graphRes.data);
        setReport(reportRes.data);
        setAuditLogs(auditRes.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (message, tone = 'info') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStartInvestigation = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await startInvestigation({
        transactionId: caseData.transaction.transactionId,
        customerId: caseData.customer.customerId,
        alertId: caseData.alerts?.[0]?.alertId,
      });
      await load(true);
      showToast('Investigation complete — evidence and risk score generated', 'success');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReview = async (action, note) => {
    setBusy(true);
    setActionError(null);
    try {
      await submitReview(id, { action, note, decidedBy: 'secops.analyst' });
      await load(true);
      showToast(`Decision recorded: ${action.replace(/_/g, ' ')}`, 'success');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReinvestigate = async (areas) => {
    setBusy(true);
    setActionError(null);
    try {
      // 1. Record the human decision (with the requested areas) in the audit trail.
      await submitReview(id, {
        action: 'REQUEST_INVESTIGATION',
        note: pendingNote,
        decidedBy: 'secops.analyst',
        areas,
      });
      // 2. Re-run the pipeline server-side for the selected areas.
      const res = await reinvestigate(id, areas);
      const newEvidence = res.data?.evidence?.length || 0;
      await load(true);
      setModalOpen(false);
      setPendingNote('');
      showToast(`Deep-dive complete — ${newEvidence} evidence item(s) on file`, 'success');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const focusEvidence = (evidenceId) => {
    setHighlightEvidence(evidenceId);
    setTimeout(() => evidenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner text="Loading case record…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="card max-w-lg mx-auto">
          <ErrorState error={error} onRetry={() => load()} title="Case could not be loaded" />
          <div className="text-center pb-6">
            <Link to="/cases" className="btn-secondary py-2 px-3 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to cases
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-8">
        <EmptyState
          title="Case not found"
          description={`No investigation record exists for "${id}".`}
          action={
            <Link to="/cases" className="btn-secondary py-2 px-3 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to cases
            </Link>
          }
        />
      </div>
    );
  }

  const { investigation, transaction, customer, alerts } = caseData;
  const hasInvestigation = (investigation.agentResults?.length || 0) > 0;
  const requiresHumanReview = investigation.status === 'AWAITING_HUMAN_REVIEW';
  const summary = investigation.investigationSummary;
  const focusResult = investigation.lastFocusResult;

  return (
    <PageTransition>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
        {/* Breadcrumb + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/cases" className="text-xs text-surface-400 hover:text-accent-400 flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> All cases
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {!hasInvestigation && (
              <button onClick={handleStartInvestigation} disabled={busy} className="btn-primary py-2 px-3.5 text-xs">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                {busy ? 'Running agents…' : 'Start Investigation'}
              </button>
            )}
            {report && (
              <Link to={`/reports?case=${id}`} className="btn-secondary py-2 px-3 text-xs">
                <Printer className="w-3.5 h-3.5" />
                Investigation Report
              </Link>
            )}
          </div>
        </div>

        <CaseHeader investigation={investigation} transaction={transaction} customer={customer} alert={alerts?.[0]} />

        {/* Human review banner */}
        <AnimatePresence>
          {requiresHumanReview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-400">HUMAN INVESTIGATION REQUIRED</p>
                  <p className="text-xs text-red-400/75 mt-0.5 leading-relaxed">
                    Risk indicators on this case require an investigator decision. The system will not close
                    this case on its own, and no conclusion about the customer has been drawn.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pre-investigation prompt */}
        {!hasInvestigation && (
          <div className="card border-dashed border-surface-700">
            <EmptyState
              icon={Play}
              title="Investigation not started"
              description="Running the investigation executes the agent pipeline: transaction, anomaly, behaviour, device, location, pattern and investigation agents, followed by the deterministic risk engine."
              action={
                <button onClick={handleStartInvestigation} disabled={busy} className="btn-primary py-2.5 px-4 text-sm">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {busy ? 'Running agents…' : 'Start Investigation'}
                </button>
              }
            />
            {actionError && <p className="text-center text-xs text-red-400 pb-5">{actionError}</p>}
          </div>
        )}

        {/* Row 1 — timeline + evidence */}
        {hasInvestigation && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <AgentTimeline
              agents={investigation.agentResults}
              investigation={investigation}
              running={busy}
              onSelectEvidence={focusEvidence}
            />
            <div ref={evidenceRef}>
              <EvidencePanel
                evidence={investigation.evidence}
                highlightId={highlightEvidence}
                onHighlightHandled={() => setHighlightEvidence(null)}
              />
            </div>
          </div>
        )}

        {/* Row 2 — risk breakdown + human review */}
        {hasInvestigation && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <RiskBreakdown
              investigation={investigation}
              onFocusEvidence={focusEvidence}
              activeEvidenceId={highlightEvidence}
            />
            <HumanReviewPanel
              investigation={investigation}
              onReview={handleReview}
              onOpenReinvestigate={(note) => {
                setPendingNote(note || '');
                setModalOpen(true);
              }}
              submitting={busy}
              error={actionError}
            />
          </div>
        )}

        {/* Row 3 — investigation summary (AI reasoning) */}
        {summary && (
          <div className="card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-400" />
                Investigation Analysis
              </h3>
              <span className="text-[10px] font-mono text-surface-500 bg-surface-900 border border-surface-800 px-2 py-1 rounded">
                explained from evidence · does not compute risk
              </span>
            </div>

            <p className="text-sm text-surface-300 leading-relaxed mb-4">{summary.summary}</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {summary.findings?.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.04 }}
                  className="p-3 rounded-xl bg-surface-800/40 border border-surface-800"
                >
                  <p className="text-sm text-surface-200 leading-relaxed">{f.finding}</p>
                  {f.evidenceIds?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {f.evidenceIds.map((eid) => (
                        <button
                          key={eid}
                          onClick={() => focusEvidence(eid)}
                          className="text-[10px] font-mono text-accent-400 bg-accent-600/10 border border-accent-500/25 rounded px-1.5 py-0.5 hover:bg-accent-500/20 transition-colors"
                        >
                          {eid}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {summary.strongestEvidence?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-surface-800/70">
                <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-2">Strongest evidence</p>
                <div className="flex flex-wrap gap-1.5">
                  {summary.strongestEvidence.map((id) => (
                    <button
                      key={id}
                      onClick={() => focusEvidence(id)}
                      className="text-[11px] font-mono text-accent-300 bg-accent-500/10 border border-accent-500/30 rounded px-2 py-1 hover:bg-accent-500/20 transition-colors"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {summary.limitations?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-surface-800/70">
                <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-1.5">Limitations</p>
                {summary.limitations.map((l, i) => (
                  <p key={i} className="text-[11px] text-surface-500 leading-relaxed">
                    • {l}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Row 4 — relationship graph */}
        {hasInvestigation && (graph.nodes?.length > 0) && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <Network className="w-4 h-4 text-accent-400" />
                Relationship Graph
              </h3>
              <p className="text-[10px] font-mono text-surface-500">
                {graph.nodes.length} entities • {graph.edges.length} relationships • discovered from the database
              </p>
            </div>
            <Suspense
              fallback={
                <div className="card flex items-center justify-center h-[28rem]">
                  <LoadingSpinner text="Loading relationship graph…" />
                </div>
              }
            >
              <Graph3D nodes={graph.nodes} edges={graph.edges} onNodeClick={() => {}} />
            </Suspense>
          </div>
        )}

        {/* Row 5 — copilot + audit trail */}
        {hasInvestigation && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Copilot caseId={id} />
            <AuditTrail logs={auditLogs} />
          </div>
        )}

        {/* Investigation facts strip */}
        {hasInvestigation && (
          <div className="card py-3.5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px]">
              <span className="flex items-center gap-1.5 text-surface-400">
                <ListChecks className="w-3.5 h-3.5 text-accent-400" />
                <span className="text-surface-500">Evidence</span>
                <span className="font-mono font-bold text-white">{investigation.evidence?.length || 0}</span>
              </span>
              <span className="flex items-center gap-1.5 text-surface-400">
                <span className="text-surface-500">Agents executed</span>
                <span className="font-mono font-bold text-white">{investigation.agentResults?.length || 0}</span>
              </span>
              <span className="flex items-center gap-1.5 text-surface-400">
                <span className="text-surface-500">Cycles</span>
                <span className="font-mono font-bold text-white">{investigation.investigationCycles}</span>
              </span>
              <span className="flex items-center gap-1.5 text-surface-400">
                <span className="text-surface-500">Transaction</span>
                <span className="font-mono font-bold text-white">{formatCurrency(transaction.amount)}</span>
              </span>
              {focusResult && (
                <span className="flex items-center gap-1.5 text-surface-400">
                  <span className="text-surface-500">Deep-dived areas</span>
                  <span className="font-mono font-bold text-white">
                    {focusResult.areas?.map((a) => a.area).join(', ') || '—'}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl backdrop-blur-xl ${
              toast.tone === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-surface-900 border-surface-700 text-surface-200'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <ReinvestigateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleReinvestigate}
        submitting={busy}
        error={actionError}
        lastResult={focusResult}
      />
    </PageTransition>
  );
}
