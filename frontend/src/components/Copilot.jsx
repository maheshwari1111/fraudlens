import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { askCopilot } from '../services/api';

const SUGGESTED_QUESTIONS = [
  'Why is this case high risk?',
  'Show me the strongest evidence.',
  'Why is this device suspicious?',
  'Which customers are connected to this device?',
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
    <div className="card">
      <h3 className="card-header">AI Copilot</h3>
      <div className="space-y-2 mb-3">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={loading}
            className="text-xs text-accent-400 hover:text-accent-500 bg-accent-600/10 hover:bg-accent-600/20 border border-accent-600/20 rounded-full px-3 py-1 transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
      <div className="h-64 overflow-y-auto space-y-3 mb-3 p-3 rounded-lg bg-surface-800/50 border border-surface-800">
        {messages.length === 0 && (
          <p className="text-sm text-surface-500 text-center mt-8">
            Ask questions about this case. The copilot only uses evidence from this investigation.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-accent-600/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-accent-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-accent-600 text-white'
                  : 'bg-surface-700 text-surface-200'
              }`}
            >
              {m.content}
            </div>
            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-surface-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-surface-400" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center text-sm text-surface-400">
            <Bot className="w-4 h-4 animate-pulse" />
            <span>Analyzing evidence…</span>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask about this case…"
          className="flex-1 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:border-accent-600"
        />
        <button onClick={() => send()} disabled={loading} className="btn-primary">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
