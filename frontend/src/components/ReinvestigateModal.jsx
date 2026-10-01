import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, Database, Loader2, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { getInvestigationAreas } from '../services/api';

/**
 * Request Additional Investigation
 *
 * The investigator picks which areas to deep-dive. On submit the parent calls
 * POST /api/investigations/:id/reinvestigate with the selected areas, which
 * re-runs the pipeline server-side (new evidence IDs, new agent logs, new
 * audit entry). This is a real database re-query, not a UI simulation.
 */
export default function ReinvestigateModal({ open, onClose, onSubmit, submitting, error, lastResult }) {
  const [areas, setAreas] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setLoadError(null);
    setLoadingAreas(true);
    getInvestigationAreas()
      .then((res) => setAreas(res.data.areas || []))
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoadingAreas(false));
  }, [open]);

  // Pre-select the areas that the previous cycle already covered, so the
  // investigator can add to them rather than re-typing.
  useEffect(() => {
    if (!open || !lastResult?.areas?.length) return;
    setSelected(lastResult.areas.map((a) => a.area));
  }, [open, lastResult]);

  const toggle = (value) =>
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  const submit = () => {
    if (selected.length === 0) return;
    onSubmit(selected);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request Additional Investigation"
      subtitle="Select the areas to deep-dive. Selected agents re-query the database and register new evidence."
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-surface-500">
            {selected.length > 0 ? `${selected.length} area(s) selected` : 'Select at least one area'}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-secondary py-2 px-3 text-xs" disabled={submitting}>
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={selected.length === 0 || submitting}
              className="btn-primary py-2 px-3.5 text-xs"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {submitting ? 'Re-running agents…' : 'Run Additional Investigation'}
            </button>
          </div>
        </div>
      }
    >
      {loadingAreas && (
        <p className="text-sm text-surface-400 flex items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading investigation areas…
        </p>
      )}

      {loadError && (
        <p className="text-sm text-red-400 flex items-center gap-2 py-2">
          <AlertTriangle className="w-4 h-4" /> {loadError}
        </p>
      )}

      {!loadingAreas && !loadError && (
        <div className="space-y-2">
          {areas.map((a, i) => {
            const checked = selected.includes(a.value);
            return (
              <motion.label
                key={a.value}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  checked
                    ? 'bg-accent-600/10 border-accent-500/40'
                    : 'bg-surface-900/60 border-surface-800 hover:border-surface-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(a.value)}
                  className="mt-0.5 w-4 h-4 accent-sky-500 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{a.label}</p>
                  <p className="text-[11px] text-surface-500 font-mono">{a.value}</p>
                </div>
                {checked && <Search className="w-3.5 h-3.5 text-accent-400 ml-auto shrink-0" />}
              </motion.label>
            );
          })}
        </div>
      )}

      {/* Result of the previous focused run, straight from the investigation record */}
      {lastResult && (
        <div className="mt-4 pt-4 border-t border-surface-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 flex items-center gap-1.5 mb-2">
            <Database className="w-3 h-3" />
            Last deep-dive (cycle {lastResult.cycle})
          </p>
          {lastResult.areas?.length ? (
            <div className="space-y-1.5">
              {lastResult.areas.map((r) => (
                <div key={r.area} className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-surface-300">{r.label}</span>
                  <span className="text-surface-500 font-mono truncate text-right">{r.note}</span>
                </div>
              ))}
              <p className="text-[11px] text-surface-500 pt-1 font-mono">
                {lastResult.totalRecords} record(s) examined
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-surface-500">No deep-dive has been run on this case yet.</p>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </Modal>
  );
}
