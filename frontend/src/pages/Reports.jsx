import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCases, getReport } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import PageTransition from '../components/PageTransition';
import AnimatedCard from '../components/AnimatedCard';
import { formatDateTime } from '../utils/format';
import { FileText, Download } from 'lucide-react';

export default function Reports() {
  const [cases, setCases] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCases().then((res) => setCases(res.data));
  }, []);

  const loadReport = async (caseId) => {
    setLoading(true);
    try {
      const res = await getReport(caseId);
      setSelectedReport(res.data);
    } catch {
      setSelectedReport(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!selectedReport) return;
    const blob = new Blob([JSON.stringify(selectedReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.caseId}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageTransition>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Investigation Reports</h1>
        <p className="text-surface-400 mb-6">Generated investigation reports with evidence-backed findings</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Case list */}
          <div className="lg:col-span-1">
            <AnimatedCard className="card">
              <h3 className="card-header">Cases</h3>
              <div className="space-y-2">
                {cases.map((c) => (
                  <button
                    key={c.caseId}
                    onClick={() => loadReport(c.caseId)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedReport?.caseId === c.caseId
                        ? 'bg-accent-600/10 border-accent-600/30'
                        : 'bg-surface-800/50 border-surface-800 hover:bg-surface-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-accent-400">{c.caseId}</span>
                      <RiskBadge level={c.riskLevel} />
                    </div>
                    <p className="text-xs text-surface-500 mt-1">{c.customerId} • {c.transactionId}</p>
                  </button>
                ))}
              </div>
            </AnimatedCard>
          </div>

          {/* Report view */}
          <div className="lg:col-span-2">
            {loading && <div className="card text-surface-400">Loading report…</div>}
            {!loading && !selectedReport && (
              <div className="card text-surface-500">Select a case to view its report.</div>
            )}
            {!loading && selectedReport && (
              <AnimatedCard className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="card-header mb-0">Report: {selectedReport.caseId}</h3>
                  <button onClick={downloadReport} className="btn-secondary text-xs">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Executive Summary</p>
                    <p className="text-sm text-surface-300 leading-relaxed">{selectedReport.executiveSummary}</p>
                  </div>

                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Risk Assessment</p>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-white">{selectedReport.riskAssessment?.score}/100</span>
                      <RiskBadge level={selectedReport.riskAssessment?.level} />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Findings</p>
                    <div className="space-y-2">
                      {selectedReport.findings?.map((f, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-2 rounded-lg bg-surface-800/50 border border-surface-800"
                        >
                          <p className="text-sm text-surface-200">{f.finding}</p>
                          {f.evidenceIds?.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {f.evidenceIds.map((eid) => (
                                <span key={eid} className="text-xs font-mono text-accent-400">{eid}</span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Recommendation</p>
                    <p className="text-sm text-surface-300">{selectedReport.recommendation}</p>
                  </div>

                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Generated</p>
                    <p className="text-sm text-surface-400">{formatDateTime(selectedReport.generatedAt)}</p>
                  </div>
                </div>
              </AnimatedCard>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
