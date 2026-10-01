import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, CornerDownLeft, ShieldCheck } from 'lucide-react';
import { askCopilot } from '../services/api';

const SUGGESTED_QUESTIONS = [
  'Why is this case flagged high risk?',
  'Show me the key evidence breakdown.',
  'What device & IP anomalies were detected?',
  'Which connected entities share this fingerprint?',
];

export default function Copilot({ caseId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const send = async (question) => {
    const q = question || input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await askCopilot(caseId, q);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error: ' + (err.response?.data?.error || err.message) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card relative overflow-hidden flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-800/80 mb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent-600 to-indigo-500 p-0.5 shadow-lg shadow-accent-500/20">
            <div className="w-full h-full bg-surface-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent-400" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Neural Investigation Copilot
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[11px] text-surface-400">Contextual Case Intelligence Agent</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3 h-3" />
          Evidence Verified
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
        {SUGGESTED_QUESTIONS.map((q) => (
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            key={q}
            onClick={() => send(q)}
            disabled={loading}
            className="text-[11px] text-surface-300 hover:text-white bg-surface-800/70 hover:bg-surface-700/80 border border-surface-700/60 hover:border-accent-500/40 rounded-lg px-2.5 py-1 transition-all disabled:opacity-50 text-left"
          >
            {q}
          </motion.button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto space-y-3.5 p-3.5 rounded-xl bg-surface-950/60 border border-surface-800/80 backdrop-blur-md">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-3 text-accent-400 shadow-xl">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-surface-200">How can I assist your investigation?</p>
            <p className="text-xs text-surface-400 mt-1 max-w-sm">
              Ask any question regarding suspect transactions, device matching, or evidence summaries for this case.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center shrink-0 mt-0.5 text-accent-400">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-lg ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-accent-600 to-indigo-600 text-white rounded-br-none border border-accent-400/30'
                    : 'bg-surface-800/90 backdrop-blur-md text-surface-200 rounded-bl-none border border-surface-700/60'
                }`}
              >
                {m.content}
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-surface-700/80 border border-surface-600 flex items-center justify-center shrink-0 mt-0.5 text-surface-300">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2.5 text-xs text-accent-400 font-medium py-2 px-3 bg-accent-500/10 rounded-xl border border-accent-500/20 w-fit"
          >
            <Bot className="w-4 h-4 animate-spin" />
            <span>Analyzing neural evidence index...</span>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input controls */}
      <div className="mt-3 flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type investigation question..."
            className="w-full bg-surface-900/80 border border-surface-700/80 rounded-xl pl-4 pr-10 py-2.5 text-xs text-surface-100 placeholder-surface-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all shadow-inner"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none">
            <CornerDownLeft className="w-3.5 h-3.5" />
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="btn-primary py-2.5 px-4 rounded-xl shrink-0"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
