import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play, RefreshCw, CheckCircle, XCircle, AlertTriangle, ShieldAlert,
  MapPin, Smartphone, Clock, Users, FileText, Download,
} from 'lucide-react';
import {
  getCase, startInvestigation, getGraph, getReport, getAuditTrail,
  submitReview, reinvestigate,
} from '../services/api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import AgentTimeline from '../components/AgentTimeline';
import EvidencePanel from '../components/EvidencePanel';
import RelationshipGraph from '../components/RelationshipGraph';
import Copilot from '../components/Copilot';
import AuditTrail from '../components/AuditTrail';
import { formatCurrency, formatDateTime, formatTime, severityColor } from '../utils/format';

export default function CaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [report, setReport] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [investigating, setInvestigating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  const load = useCallback(async () => {
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
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStartInvestigation = async () => {
    setInvestigating(true);
    try {
      await startInvestigation({
        transactionId: caseData.transaction.transactionId,
        customerId: caseData.customer.customerId,
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setInvestigating(false);
    }
  };

  const handleReinvestigate = async () => {
    setInvestigating(true);
    try {
      await reinvestigate(id, {});
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setInvestigating(false);
    }
  };

  const handleReview = async (action) => {
    try {
      await submitReview(id, { action, note: reviewNote, decidedBy: 'investigator' });
      setReviewNote('');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${id}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-surface-400">Loading case…</div>;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;
  if (!caseData) return <div className="p-8 text-surface-400">Case not found.</div>;

  const { investigation, transaction, customer, alerts } = caseData;
  const requiresHumanReview = investigation.status === 'AWAITING_HUMAN_REVIEW';
  const hasInvestigation = investigation.agentResults?.length > 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white font-mono">{investigation.caseId}</h1>
            <StatusBadge status={investigation.status} />
            <RiskBadge level={investigation.riskLevel} size="lg" />
          </div>
          <p className="text-surface-400">
            Customer <span className="text-surface-200 font-medium">{customer.name}</span> ({customer.customerId})
            {' • '}
            <span className="font-mono text-sm">{transaction.transactionId}</span>
            {' • '}
            <span className="text-lg font-semibold text-white">{formatCurrency(transaction.amount)}</span>
            {' • '}
            {transaction.location}
            {' • '}
            {formatDateTime(transaction.timestamp)}
          </p>
        </div>
        <div className="flex gap-2">
          {!hasInvestigation && (
            <button onClick={handleStartInvestigation} disabled={investigating} className="btn-primary">
              <Play className="w-4 h-4" />
              {investigating ? 'Investigating…' : 'Start Investigation'}
            </button>
          )}
          {hasInvestigation && (
            <>
              <button onClick={handleReinvestigate} disabled={investigating} className="btn-secondary">
                <RefreshCw className="w-4 h-4" />
                Re-investigate
              </button>
              {report && (
                <button onClick={handleDownloadReport} className="btn-secondary">
                  <Download className="w-4 h-4" />
                  Report
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Human review banner */}
      {requiresHumanReview && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">HUMAN INVESTIGATION REQUIRED</p>
            <p className="text-xs text-red-400/70">This case has been flagged for human review. A human investigator must make the final decision.</p>
          </div>
        </div>
      )}

      {/* Agent timeline + Evidence panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <AgentTimeline agents={investigation.agentResults} loading={investigating} />
        <EvidencePanel evidence={investigation.evidence} />
      </div>

      {/* Analysis sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Behaviour Analysis */}
        <div className="card">
          <h3 className="card-header">Behaviour Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Historical Average</span>
              <span className="text-surface-200 font-medium">{formatCurrency(customer.averageTransactionAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Current Amount</span>
              <span className="text-white font-semibold">{formatCurrency(transaction.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Ratio</span>
              <span className="text-red-400 font-semibold">
                {customer.averageTransactionAmount > 0
                  ? `${(transaction.amount / customer.averageTransactionAmount).toFixed(1)}x`
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Usual Locations</span>
              <span className="text-surface-200">{(customer.usualLocations || []).join(', ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Current Location</span>
              <span className={customer.usualLocations?.includes(transaction.location) ? 'text-emerald-400' : 'text-red-400'}>
                {transaction.location}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Usual Hours</span>
              <span className="text-surface-200">{(customer.usualTransactionHours || []).map((h) => `${String(h).padStart(2, '0')}:00`).join(', ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Transaction Time</span>
              <span className="text-red-400">{formatTime(transaction.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Device Intelligence */}
        <div className="card">
          <h3 className="card-header">Device Intelligence</h3>
          {transaction.deviceId ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-sm text-surface-200">{transaction.deviceId}</span>
              </div>
              {investigation.agentResults?.find((a) => a.agentName === 'DeviceAgent')?.data?.device && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-400">Associated Customers</span>
                    <span className="text-surface-200">
                      {investigation.agentResults.find((a) => a.agentName === 'DeviceAgent').data.device.customers?.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-400">Transaction Count</span>
                    <span className="text-surface-200">
                      {investigation.agentResults.find((a) => a.agentName === 'DeviceAgent').data.device.transactionCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-400">Previous Alerts</span>
                    <span className="text-red-400">
                      {investigation.agentResults.find((a) => a.agentName === 'DeviceAgent').data.device.previousAlerts?.join(', ') || 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-400">First Seen</span>
                    <span className="text-surface-200">
                      {formatDateTime(investigation.agentResults.find((a) => a.agentName === 'DeviceAgent').data.device.firstSeen)}
                    </span>
                  </div>
                </>
              )}
              {investigation.agentResults?.find((a) => a.agentName === 'DeviceAgent')?.data?.previousCases?.length > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400">
                    Previous cases: {investigation.agentResults.find((a) => a.agentName === 'DeviceAgent').data.previousCases.join(', ')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-surface-500">No device associated with this transaction.</p>
          )}
        </div>
      </div>

      {/* Location + Previous Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h3 className="card-header">Location Intelligence</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-surface-400">Usual:</span>
              <span className="text-surface-200">{(customer.usualLocations || []).join(', ')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-red-400" />
              <span className="text-surface-400">Current:</span>
              <span className="text-red-400 font-medium">{transaction.location}</span>
            </div>
            {investigation.agentResults?.find((a) => a.agentName === 'LocationAgent')?.data?.recentLocations && (
              <div className="mt-2">
                <p className="text-xs text-surface-500 mb-1">Recent Locations</p>
                <div className="flex flex-wrap gap-1">
                  {investigation.agentResults.find((a) => a.agentName === 'LocationAgent').data.recentLocations.map((loc) => (
                    <span key={loc} className="text-xs bg-surface-700 text-surface-300 rounded px-2 py-0.5">{loc}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="card-header">Previous Alerts</h3>
          {alerts.length === 0 ? (
            <p className="text-sm text-surface-500">No previous alerts for this customer.</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a.alertId} className="flex items-center justify-between p-2 rounded-lg bg-surface-800/50 border border-surface-800">
                  <div>
                    <span className="font-mono text-xs text-accent-400">{a.alertId}</span>
                    <span className="text-xs text-surface-500 ml-2">{a.transactionId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${severityColor(a.severity)}`}>{a.severity}</span>
                    <span className="text-xs text-surface-500">{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Relationship Graph */}
      <div className="mb-6">
        <RelationshipGraph nodes={graph.nodes} edges={graph.edges} onNodeClick={setSelectedNode} />
        {selectedNode && (
          <div className="mt-3 p-3 rounded-lg bg-surface-800/50 border border-surface-700">
            <p className="text-sm font-medium text-surface-200">{selectedNode.data.label}</p>
            <pre className="text-xs text-surface-400 mt-1 overflow-x-auto">
              {JSON.stringify(selectedNode.data.details, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Risk Factors */}
      <div className="card mb-6">
        <h3 className="card-header">Risk Factors (Deterministic Calculation)</h3>
        <div className="mb-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-white">{investigation.riskScore}<span className="text-lg text-surface-500">/100</span></div>
            <RiskBadge level={investigation.riskLevel} size="lg" />
          </div>
          <div className="w-full bg-surface-800 rounded-full h-2 mt-3">
            <div
              className={`h-2 rounded-full ${
                investigation.riskLevel === 'CRITICAL' ? 'bg-red-500' :
                investigation.riskLevel === 'HIGH' ? 'bg-orange-500' :
                investigation.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${investigation.riskScore}%` }}
            />
          </div>
        </div>
        <div className="space-y-2">
          {investigation.riskFactors?.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface-800/50 border border-surface-800">
              <div>
                <span className="text-sm text-surface-200">{f.type}</span>
                <p className="text-xs text-surface-500">{f.description}</p>
              </div>
              <span className="text-sm font-mono text-amber-400">+{f.weight}</span>
            </div>
          ))}
          {(!investigation.riskFactors || investigation.riskFactors.length === 0) && (
            <p className="text-sm text-surface-500">No risk factors identified.</p>
          )}
        </div>
        <p className="text-xs text-surface-600 mt-3">
          Risk weights are demonstration rules, not universal financial risk standards. Configurable via RISK_WEIGHTS env.
        </p>
      </div>

      {/* AI Investigation Summary */}
      {investigation.investigationSummary && (
        <div className="card mb-6">
          <h3 className="card-header">AI Investigation Summary</h3>
          <p className="text-sm text-surface-300 leading-relaxed mb-4">{investigation.investigationSummary.summary}</p>
          <div className="space-y-2">
            {investigation.investigationSummary.findings?.map((f, i) => (
              <div key={i} className="p-3 rounded-lg bg-surface-800/50 border border-surface-800">
                <p className="text-sm text-surface-200">{f.finding}</p>
                {f.evidenceIds?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {f.evidenceIds.map((eid) => (
                      <span key={eid} className="text-xs font-mono text-accent-400 bg-accent-600/10 rounded px-1.5 py-0.5">{eid}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {investigation.investigationSummary.limitations?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-surface-500 mb-1">Limitations:</p>
              {investigation.investigationSummary.limitations.map((l, i) => (
                <p key={i} className="text-xs text-surface-500">• {l}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Human Review */}
      {requiresHumanReview && (
        <div className="card mb-6">
          <h3 className="card-header">Human Review Decision</h3>
          <p className="text-sm text-surface-400 mb-4">
            This case requires a human investigator to make the final decision. All actions are recorded in the audit trail.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => handleReview('CLOSE_APPROVE')} className="btn-success">
              <CheckCircle className="w-4 h-4" /> Close / Approve
            </button>
            <button onClick={() => handleReview('ESCALATE')} className="btn-danger">
              <AlertTriangle className="w-4 h-4" /> Escalate
            </button>
            <button onClick={() => handleReview('REQUEST_INVESTIGATION')} className="btn-warning">
              <RefreshCw className="w-4 h-4" /> Request Additional Investigation
            </button>
            <button onClick={() => handleReview('FALSE_POSITIVE')} className="btn-secondary">
              <XCircle className="w-4 h-4" /> Mark False Positive
            </button>
          </div>
          <input
            type="text"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Add a note (optional)…"
            className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:border-accent-600"
          />
        </div>
      )}

      {/* Copilot + Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Copilot caseId={id} />
        <AuditTrail logs={auditLogs} />
      </div>
    </div>
  );
}
