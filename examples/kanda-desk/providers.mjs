// Provider adapters. Keys come from the environment only and are never written to traces.
// Each call returns { ok, body, usage, latencyMs, attempts, error } and never invents an answer.

const JEV_URL = 'https://api.typesafe.ai/v1/systemone';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504, 529]);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function postJson(url, headers, payload, { timeoutMs, maxAttempts }) {
  let attempts = 0, lastError = null;
  const started = Date.now();
  while (attempts < maxAttempts) {
    attempts++;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(payload), signal: ctrl.signal });
      const text = await res.text();
      clearTimeout(timer);
      if (res.ok) {
        try { return { ok: true, body: JSON.parse(text), latencyMs: Date.now() - started, attempts }; }
        catch { return { ok: false, error: `unparseable response: ${text.slice(0, 200)}`, latencyMs: Date.now() - started, attempts }; }
      }
      lastError = `HTTP ${res.status}: ${text.slice(0, 300)}`;
      if (!RETRYABLE.has(res.status)) break;
      const retryAfter = Number(res.headers.get('retry-after'));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempts);
    } catch (e) {
      clearTimeout(timer);
      lastError = e.name === 'AbortError' ? `timeout after ${timeoutMs} ms` : String(e.message || e);
      await sleep(1000 * 2 ** attempts);
    }
  }
  return { ok: false, error: lastError, latencyMs: Date.now() - started, attempts };
}

// ---------- Jev (TypeSafe System One) ----------

// circuit.json gate → API question. Noul criteria use the API's `true` / `false` keys;
// Choice criteria are a map of option id → description; Score criteria are an ordered array.
export function toQuestion(gate) {
  if (gate.type === 'noul') return { type: 'noul', instructions: gate.instructions, criteria: { true: gate.criteria.yes, false: gate.criteria.no } };
  if (gate.type === 'score') return { type: 'score', instructions: gate.instructions, criteria: gate.criteria };
  return { type: 'choice', instructions: gate.instructions, criteria: Object.fromEntries(gate.criteria.map(c => [c.id, c.text])) };
}

export async function callJev({ model, state, questions }) {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) throw new Error('TYPESAFE_API_KEY is not set');
  return postJson(JEV_URL, { authorization: `Bearer ${key}` }, { model, state, questions }, { timeoutMs: 60000, maxAttempts: 4 });
}

const finite01 = x => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 1;
const sumsToOne = probs => Math.abs(Object.values(probs).reduce((a, b) => a + b, 0) - 1) < 0.02;

// Returns an error string, or null when the answer matches the question's contract.
export function validateAnswer(gate, answer) {
  if (!answer) return 'missing answer';
  if (answer.type !== gate.type) return `type ${answer.type} != ${gate.type}`;
  if (gate.type === 'noul') return finite01(answer.noul) ? null : 'noul out of range';
  const probs = answer.probabilities;
  if (!probs || !Object.values(probs).every(finite01) || !sumsToOne(probs)) return 'bad probabilities';
  if (!finite01(answer.confidence)) return 'confidence out of range';
  if (gate.type === 'choice') {
    const ids = gate.criteria.map(c => c.id);
    if (!ids.includes(answer.choice)) return `illegal choice ${answer.choice}`;
    if (Object.keys(probs).sort().join() !== [...ids].sort().join()) return 'choice options mismatch';
    return null;
  }
  if (Object.keys(probs).length !== gate.criteria.length) return 'score levels mismatch';
  return typeof answer.score === 'number' && Number.isFinite(answer.score) ? null : 'score not finite';
}

// ---------- LLM baseline (OpenRouter) ----------

export async function callOpenRouter({ model, messages }) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY is not set');
  return postJson(OPENROUTER_URL, { authorization: `Bearer ${key}`, 'x-title': 'Kanda Desk baseline' },
    { model, messages, response_format: { type: 'json_object' }, usage: { include: true } },
    { timeoutMs: 180000, maxAttempts: 3 });
}
