const env = require('../config/env');

/**
 * LLM service — backend-only abstraction over an OpenAI-compatible API.
 * API keys are NEVER exposed to the frontend. In DEMO_MODE (or when no key
 * is configured) the service is bypassed entirely and deterministic outputs
 * are used instead.
 */
async function chat(userPrompt, systemPrompt = '') {
  if (env.DEMO_MODE || !env.LLM_API_KEY) {
    throw new Error('LLM unavailable: DEMO_MODE is active or LLM_API_KEY is not configured');
  }

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userPrompt });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${env.LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.LLM_API_KEY}`,
      },
      body: JSON.stringify({ model: env.LLM_MODEL, messages, temperature: 0.2 }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`LLM API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    try {
      return JSON.parse(content);
    } catch {
      return { summary: content, findings: [], strongestEvidence: [], additionalInvestigation: [], limitations: [] };
    }
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { chat };
