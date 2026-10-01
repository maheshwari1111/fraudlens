import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, CornerDownLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { askCopilot } from '../services/api';

const SUGGESTED_QUESTIONS = [
  'Why is this case high risk?',
  'What is the strongest evidence?',
  'Why is this device suspicious?',
  'Which customers are connected?',
  'Were there previous alerts?',
  'What should I investigate next?',
];

/**
 * Case-scoped copilot.
 *
 * Every answer is grounded in this case's evidence on the server. When the
 * evidence does not cover the question the backend replies exactly
 * "Insufficient evidence to answer this question." — shown verbatim here.
 */
export default function Copilot({ caseId, disabled }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (question) => {
    const q = (question || input).trim();
    if (!q || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await askCopilot(caseId, q);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}`, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card flex flex-col h-[30rem]">
      <div className="flex items-center justify-between pb-3 border-b border-surface-800/80 mb-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent-600 to-indigo-500 p-0.5 shrink-0">
            <div className="w-full h-full bg-surface-950 rounded-[10px] flex items-center justify-center">
              <Bot className="w-4 h-4 text-accent-400" />
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white tracking-wide">Case Copilot</h3>
            <p className="text-[11px] text-surface-400 truncate">Answers from this case's evidence only</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full shrink-0">
          <ShieldCheck className="w-3 h-3" />
          Grounded
        </span>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={loading || disabled}
            className="text-[11px] text-surface-300 hover:text-white bg-surface-800/70 hover:bg-surface-700/80 border border-surface-700/60 hover:border-accent-500/40 rounded-lg px-2.5 py-1 transition-all disabled:opacity-40 text-left"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-xl bg-surface-950/60 border border-surface-800/80">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-11 h-11 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-3 text-accent-400">
              <Bot className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-surface-200">Ask about this case</p>
            <p className="text-xs text-surface-400 mt-1 max-w-xs leading-relaxed">
              The copilot can only use evidence recorded on this case. It will tell you when evidence is
              insufficient rather than guessing.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-6 h-6 rounded-lg bg-accent-500/20 border border-accent-500/30 flex items-center justify-center shrink-0 mt-0.5 text-accent-400">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed border ${
                  m.role === 'user'
                    ? 'bg-accent-600/25 text-white border-accent-500/30 rounded-br-sm'
                    : m.isError
                      ? 'bg-red-500/10 text-red-300 border-red-500/25 rounded-bl-sm'
                      : 'bg-surface-800/80 text-surface-200 border-surface-700/60 rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
              {m.role === 'user' && (
                <div className="w-6 h-6 rounded-lg bg-surface-700/80 border border-surface-600 flex items-center justify-center shrink-0 mt-0.5 text-surface-300">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-accent-400 py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Reading case evidence…</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            disabled={disabled}
            placeholder={disabled ? 'Run the investigation first…' : 'Ask a question about this case…'}
            className="w-full bg-surface-900/80 border border-surface-700/80 rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-surface-100 placeholder-surface-600 focus:outline-none focus:border-accent-500 disabled:opacity-50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-600 pointer-events-none">
            <CornerDownLeft className="w-3.5 h-3.5" />
          </div>
        </div>
        <button
          onClick={() => send()}
          disabled={loading || disabled || !input.trim()}
          className="btn-primary py-2.5 px-3.5 rounded-xl shrink-0 disabled:opacity-50"
          aria-label="Send question"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
