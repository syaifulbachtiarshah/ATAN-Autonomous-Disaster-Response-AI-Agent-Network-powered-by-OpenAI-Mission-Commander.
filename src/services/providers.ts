import type { AiProviderAdapter, AiRequest, AiResponse, ProviderSettings } from '../types/ai.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

function endpoint(settings: ProviderSettings, suffix: string): string {
  return `${settings.endpoint.replace(/\/$/, '')}${suffix}`;
}

async function timed<T>(operation: () => Promise<T>): Promise<[T, number]> {
  const start = performance.now();
  const value = await operation();
  return [value, Math.round(performance.now() - start)];
}

async function checkEndpoint(settings: ProviderSettings, suffix = '/status'): Promise<boolean> {
  if (!settings.endpoint) return false;
  try {
    const response = await fetch(endpoint(settings, suffix), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function demoReply(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('banjir')) return 'Demo: Untuk banjir, semak paras air, elakkan laluan rendah, sediakan beg kecemasan, dan hubungi 999 jika keselamatan terancam.';
  if (lower.includes('gempa')) return 'Demo: Berlindung di bawah meja kukuh, jauhi tingkap, dan keluar selepas gegaran berhenti.';
  if (lower.includes('cuaca')) return 'Demo: Saya boleh membantu merumuskan amaran cuaca apabila sambungan penyedia AI dikonfigurasi.';
  return `Demo: Saya ATAN. Saya menerima arahan anda: “${prompt}”. Mod demo menggunakan jawapan simulasi tanpa kunci API berbayar.`;
}

export const demoAdapter: AiProviderAdapter = {
  id: 'demo', label: 'Demo ATAN', async test() { return true; },
  async send(request) {
    const [text, responseTimeMs] = await timed(async () => demoReply(request.prompt));
    return { text, provider: 'demo', simulated: true, responseTimeMs };
  },
};

/** Cloud endpoints are trusted server-side proxies. Credentials never enter the browser request or bundle. */
function proxyAdapter(id: 'openai' | 'gemini', label: string): AiProviderAdapter {
  return {
    id, label, test: checkEndpoint,
    async send(request, provider) {
      const [data, responseTimeMs] = await timed(async () => {
        const response = await fetch(endpoint(provider, '/chat'), {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({ model: provider.model, prompt: request.prompt, messages: request.messages }),
        });
        if (response.status === 401 || response.status === 403) throw new Error('AUTH_FAILURE');
        if (!response.ok) throw new Error(`${id.toUpperCase()}_PROXY_${response.status}`);
        return response.json();
      });
      return { text: data.text ?? 'Tiada respons diterima.', provider: id, simulated: false, responseTimeMs };
    },
  };
}

export const openAiAdapter = proxyAdapter('openai', 'OpenAI Mission Commander');
export const geminiAdapter = proxyAdapter('gemini', 'Google Gemini');

export const localAdapter: AiProviderAdapter = {
  id: 'local', label: 'Local OpenAI-Compatible', async test(settings) { return checkEndpoint(settings, '/models'); },
  async send(request, provider) {
    const [data, responseTimeMs] = await timed(async () => {
      const response = await fetch(endpoint(provider, '/chat/completions'), {
        method: 'POST', headers: jsonHeaders,
        body: JSON.stringify({ model: provider.model, messages: [{ role: 'system', content: 'Anda ialah ATAN. Jawab dalam Bahasa Malaysia.' }, { role: 'user', content: request.prompt }] }),
      });
      if (!response.ok) throw new Error(`LOCAL_${response.status}`);
      return response.json();
    });
    return { text: data.choices?.[0]?.message?.content ?? data.message?.content ?? 'Tiada respons diterima.', provider: 'local', simulated: false, responseTimeMs };
  },
};

export const adapters = { demo: demoAdapter, openai: openAiAdapter, gemini: geminiAdapter, local: localAdapter };
