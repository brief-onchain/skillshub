import { getLlmConfig } from '@/lib/server/env';

function extractChatReply(parsed: any) {
  let reply = parsed?.choices?.[0]?.message?.content;
  if (Array.isArray(reply)) {
    reply = reply
      .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim();
  }
  if (!reply || typeof reply !== 'string') {
    throw new Error('LLM response missing message content');
  }
  return reply;
}

export async function callLlmChat(opts: {
  system: string;
  user: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
}) {
  const llm = getLlmConfig();
  if (!llm.apiKey) {
    throw new Error(
      'Missing LLM API key. Set OPENROUTER_API_KEY (or OPENAI_API_KEY/AI_API_KEY) in server env.'
    );
  }

  const endpoint = `${llm.apiBase.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${llm.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: llm.model,
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.maxTokens,
      messages: [
        { role: 'system', content: opts.system },
        ...(opts.history || []),
        { role: 'user', content: opts.user }
      ]
    })
  });

  const raw = await response.text();
  let parsed: any;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    parsed = {};
  }

  if (!response.ok) {
    const message =
      parsed?.error?.message ||
      parsed?.error ||
      `LLM API failed with status ${response.status}`;
    throw new Error(String(message));
  }

  return {
    model: llm.model,
    reply: extractChatReply(parsed)
  };
}
