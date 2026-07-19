import { adapters } from './providers.js';
import type { AiRequest, AiResponse, ProviderId, ProviderSettings, RouteDecision } from '../types/ai.js';

function publicEnv(name: string, fallback: string): string {
  return (typeof window !== 'undefined' && window.__ENV__?.[name]) || fallback;
}

export const defaultSettings: ProviderSettings[] = [
  { id: 'openai', label: 'OpenAI Mission Commander', enabled: false, endpoint: publicEnv('VITE_OPENAI_PROXY_URL', '/api/providers/openai'), model: 'gpt-5.6' },
  { id: 'gemini', label: 'Google Gemini', enabled: false, endpoint: publicEnv('VITE_GEMINI_PROXY_URL', '/api/providers/gemini'), model: 'gemini-2.5-flash' },
  { id: 'local', label: 'Ollama / OpenCode Lokal', enabled: false, endpoint: publicEnv('VITE_LOCAL_OPENAI_ENDPOINT', 'http://localhost:11434/v1'), model: 'llama3.1' },
  { id: 'demo', label: 'Demo ATAN', enabled: true, endpoint: 'demo://atan', model: 'simulasi-atan' },
];

export function selectProvider(request: AiRequest): RouteDecision {
  if (request.demoMode || !navigator.onLine) {
    return { provider: request.settings.find(p => p.id === 'demo') ?? defaultSettings[3], reason: request.demoMode ? 'Mod demo diaktifkan; jawapan simulasi selamat digunakan.' : 'Peranti luar talian; ATAN menggunakan demo/offline fallback.', simulated: true };
  }
  const enabled = request.settings.filter(p => p.enabled && p.id !== 'demo');
  const prompt = request.prompt.toLowerCase();
  const preferred: ProviderId = prompt.includes('lokal') || prompt.includes('privasi') ? 'local' : prompt.includes('gemini') || prompt.includes('google') ? 'gemini' : 'openai';
  const selected = enabled.find(p => p.id === preferred) ?? enabled[0];
  if (!selected) return { provider: request.settings.find(p => p.id === 'demo') ?? defaultSettings[3], reason: 'Tiada penyedia langsung diaktifkan; menggunakan respons simulasi demo.', simulated: true };
  const reasons: Record<ProviderId, string> = {
    openai: 'OpenAI dipilih untuk arahan umum dan perbualan misi yang memerlukan penaakulan seimbang.',
    gemini: 'Gemini dipilih kerana permintaan menyebut Google/Gemini atau sesuai untuk ringkasan pantas.',
    local: 'Endpoint lokal dipilih untuk permintaan yang menekankan privasi, lokal, Ollama atau OpenCode.',
    demo: 'Demo dipilih untuk simulasi tanpa kunci API.',
  };
  return { provider: selected, reason: reasons[selected.id], simulated: false };
}

export async function routeAiRequest(request: AiRequest): Promise<{ decision: RouteDecision; response: AiResponse }> {
  const decision = selectProvider(request);
  const adapter = adapters[decision.provider.id];
  const response = await adapter.send(request, decision.provider);
  return { decision, response };
}
