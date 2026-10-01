import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, CircleDashed, ChevronRight, Cpu, Clock3, ShieldCheck } from 'lucide-react';
import { AGENT_PIPELINE, statusStyle, agentLabel, agentPurpose } from '../utils/agents';
import { formatDateTime } from '../utils/format';

/**
 * Investigation timeline.
 *
 * Renders the full pipeline in execution order. Steps that have not run are
 * shown as PENDING rather than hidden, so the investigator can see what the
 * pipeline still owes. Human Review is the final step and is visually distinct.
 */
export default function AgentTimeline({ agents = [], investigation, running = false, onSelectEvidence }) {
  const containerRef = useRef(null);
  const [expanded, setExpanded] = useState(null);

  const results = new Map((agents || []).map((a) => [a.agentName, a]));
  const decision = investigation?.humanDecision?.action;
  const awaitingReview = investigation?.status === 'AWAITING_HUMAN_REVIEW';

  // Build the ordered steps, including the terminal Human Review step.
  const steps = AGENT_PIPELINE.map((meta) => {
    if (meta.name === 'HumanReview') {
      return {
        ...meta,
        status: awaitingReview ? 'PENDING_REVIEW' : decision ? 'DECIDED' : running ? 'RUNNING' : 'PENDING',
        summary: awaitingReview
          ? 'Awaiting investigator decision — case cannot close automatically'
          : decision
            ? `Decision recorded: ${decision.replace(/_/g, ' ')}${investigation.humanDecision?.decidedBy ? ` by ${investigation.humanDecision.decidedBy}` : ''}`
            : 'No decision recorded',
        evidenceIds: [],
        duration: 0,
        isHuman: true,
      };
    }
    const result = results.get(meta.name);
    if (result) {
      return { ...meta, ...result, isHuman: false };
    }
    return {
      ...meta,
      status: running ? 'PENDING' : 'PENDING',
      summary: running ? 'Queued in the current investigation cycle' : 'Not yet executed',
      evidenceIds: [],
      duration: 0,
      isHuman: false,
    };
  });

  const executed = steps.filter((s) => s.status === 'SUCCESS' || s.status === 'FAILED' || s.status === 'PARTIAL').length;
  const completion = Math.round((executed / steps.length) * 100);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const ctx = gsap.context(() => {
      const items = containerRef.current.querySelectorAll('.tl-step');
      if (items.length) {
        gsap.fromTo(
          items,
          { opacity: 0, x: -18 },
          { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
        );
      }
    }, containerRef);
    return () => ctx.revert();
  }, [agents, investigation?.status]);

  return (
    <div className="card flex flex-col" ref={containerRef}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-accent-500/15 border border-accent-500/30 flex items-center justify-center text-accent-400 shrink-0">
            <Cpu className={`w-4 h-4 ${running ? 'animate-spin' : 'animate-pulse'}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white tracking-wide">Investigation Timeline</h3>
            <p className="text-[11px] text-surface-400 truncate">
              {running ? 'Agents executing…' : `${executed} of ${steps.length} steps completed`}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold text-accent-400 bg-accent-500/10 border border-accent-500/20 px-2.5 py-1 rounded-lg shrink-0">
          {completion}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-1.5 bg-surface-800/80 rounded-full overflow-hidden border border-surface-800/60">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent-500 via-sky-400 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="space-y-1.5 max-h-[30rem] overflow-y-auto pr-1">
        {steps.map((step, idx) => {
          const st = statusStyle(step.status);
          const isOpen = expanded === step.name;
          const isLast = idx === steps.length - 1;
          return (
            <div key={step.name} className="tl-step relative pl-7">
              {/* Connector */}
              {!isLast && (
                <div className="absolute left-[9px] top-6 bottom-[-6px] w-px bg-surface-800" aria-hidden="true" />
              )}

              {/* Node */}
              <div
                className={`absolute left-0 top-2.5 w-[19px] h-[19px] rounded-full border-2 flex items-center justify-center z-10 ${st.bg} ${
                  step.status === 'PENDING' ? 'border-surface-700' : st.border
                }`}
              >
                {step.status === 'SUCCESS' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                {step.status === 'FAILED' && <XCircle className="w-2.5 h-2.5 text-red-400" />}
                {step.status === 'PARTIAL' && <Clock3 className="w-2.5 h-2.5 text-amber-400" />}
                {step.status === 'RUNNING' && <Loader2 className="w-2.5 h-2.5 text-accent-400 animate-spin" />}
                {step.status === 'PENDING' && <CircleDashed className="w-2.5 h-2.5 text-surface-600" />}
                {step.status === 'PENDING_REVIEW' && <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />}
                {step.status === 'DECIDED' && <CheckCircle2 className="w-2.5 h-2.5 text-sky-400" />}
              </div>

              {/* Body */}
              <button
                onClick={() => setExpanded(isOpen ? null : step.name)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                  step.isHuman && step.status === 'PENDING_REVIEW'
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : isOpen
                      ? 'bg-surface-800/80 border-surface-700'
                      : 'bg-surface-900/50 border-surface-800/70 hover:border-surface-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono font-bold text-surface-500 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                    <span className={`text-xs font-bold truncate ${step.isHuman ? 'text-amber-300' : 'text-white'}`}>
                      {step.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-mono font-bold tracking-wider ${st.color}`}>{st.text}</span>
                    {step.duration > 0 && (
                      <span className="text-[10px] font-mono text-surface-500 hidden sm:inline">{step.duration}ms</span>
                    )}
                    <ChevronRight className={`w-3.5 h-3.5 text-surface-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                <p className="text-[11px] text-surface-400 mt-1 leading-relaxed line-clamp-2">{step.summary}</p>

                {/* Evidence chips */}
                {!isOpen && (step.evidenceIds || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {step.evidenceIds.slice(0, 4).map((id) => (
                      <span key={id} className="text-[10px] font-mono text-accent-400 bg-accent-600/10 border border-accent-500/20 rounded px-1.5 py-0.5">
                        {id}
                      </span>
                    ))}
                    {step.evidenceIds.length > 4 && (
                      <span className="text-[10px] font-mono text-surface-500">+{step.evidenceIds.length - 4}</span>
                    )}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1.5 ml-3 p-3 rounded-lg bg-surface-950/70 border border-surface-800 space-y-2">
                      <p className="text-[11px] text-surface-300 leading-relaxed">
                        <span className="font-semibold text-accent-400">Purpose: </span>
                        {agentPurpose(step.name)}
                      </p>
                      <p className="text-[11px] text-surface-300 leading-relaxed">
                        <span className="font-semibold text-accent-400">Finding: </span>
                        {step.summary}
                      </p>
                      {(step.evidenceIds || []).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] uppercase tracking-widest text-surface-500 font-bold">Evidence</span>
                          {step.evidenceIds.map((id) => (
                            <button
                              key={id}
                              onClick={() => onSelectEvidence?.(id)}
                              className="text-[10px] font-mono text-accent-400 bg-accent-600/10 border border-accent-500/25 rounded px-1.5 py-0.5 hover:bg-accent-500/20 transition-colors"
                            >
                              {id}
                            </button>
                          ))}
                        </div>
                      )}
                      {step.status === 'FAILED' && step.error && (
                        <p className="text-[11px] text-red-400 font-mono">error: {step.error}</p>
                      )}
                      {step.data && Object.keys(step.data).length > 0 && (
                        <details className="text-[11px]">
                          <summary className="cursor-pointer text-surface-400 hover:text-surface-200 select-none">
                            Raw agent output
                          </summary>
                          <pre className="mt-1.5 p-2 rounded bg-surface-900 border border-surface-800 font-mono text-[10px] text-surface-400 overflow-x-auto max-h-40">
                            {JSON.stringify(step.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {investigation?.updatedAt && (
        <p className="text-[10px] text-surface-600 mt-3 pt-3 border-t border-surface-800/60 font-mono">
          Last run {formatDateTime(investigation.updatedAt)} • cycle {investigation.investigationCycles}
        </p>
      )}
    </div>
  );
}
