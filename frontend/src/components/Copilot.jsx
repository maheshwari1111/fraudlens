import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Terminal } from 'lucide-react';
import { askCopilot } from '../services/api';

const SUGGESTED_QUESTIONS = [
  'Why is this case high risk?',
  'Show me the strongest evidence.',
  'Why is this device suspicious?',
  'Which customers connect to this device?',
  'Which previous alerts are relevant?',
  'What additional information should I investigate?',
];

export default function Copilot({ caseId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (question) => {
    const q = question || input.trim();
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
        { role: 'assistant', content: 'Telemetry Error: ' + (err.response?.data?.error || err.message) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-glass-glow flex flex-col justify-between h-full min-h-[420px]">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-header mb-0 flex items-center gap-2 text-white font-mono">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            AI Investigation Copilot
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
            STRICT CONTEXT ENFORCED
          </span>
        </div>

        {/* Quick Question Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={loading}
              className="text-xs text-accent-300 hover:text-white bg-accent-500/10 hover:bg-accent-500/25 border border-accent-500/20 rounded-lg px-2.5 py-1 transition-all disabled:opacity-50 cursor-pointer font-mono"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="h-64 overflow-y-auto space-y-3 mb-4 p-4 rounded-xl bg-surface-950/90 border border-surface-800">
          {messages.length === 0 && (
            <div className="text-center text-surface-400 py-10">
              <Bot className="w-8 h-8 text-accent-400 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-mono">Ask AI Copilot regarding risk evidence, device MAC links, or anomaly reasoning.</p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-purple-300" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed font-sans shadow-md ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-accent-600 to-accent-500 text-white font-medium'
                      : 'bg-surface-800/90 text-surface-100 border border-surface-700/60'
                  }`}
                >
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-surface-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex gap-2 items-center text-xs text-purple-300 font-mono">
              <Bot className="w-4 h-4 animate-spin text-purple-400" />
              <span>Querying multi-agent knowledge graph…</span>
            </div>
          )}
        </div>
      </div>

      {/* Input Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask Copilot about evidence, devices, or transactions…"
          className="flex-1 bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-xs text-surface-200 placeholder-surface-500 focus:outline-none focus:border-accent-500 font-sans"
        />
        <button onClick={() => send()} disabled={loading} className="btn-primary">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
