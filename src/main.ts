import { adapters } from './services/providers.js';
import { defaultSettings, routeAiRequest } from './services/router.js';
import type { AiMessage, ProviderSettings, RequestStatus, RoutingActivity } from './types/ai.js';

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    __ENV__?: Record<string, string>;
  }
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  start(): void;
}

const storageKey = 'ai-atan-settings';
const app = document.querySelector<HTMLDivElement>('#app');

let settings = loadSettings();
let messages: AiMessage[] = [
  {
    role: 'assistant',
    content: 'Selamat datang ke AI ATAN Hub. Saya sedia membantu dalam Bahasa Malaysia.',
    simulated: true,
  },
];
let status: RequestStatus = navigator.onLine ? 'idle' : 'offline';
let activity: RoutingActivity | null = null;
let demoMode = true;
let voiceNote = '';

function loadSettings(): ProviderSettings[] {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return defaultSettings.map((provider) => ({ ...provider }));
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error('Invalid settings');
    return defaultSettings.map((fallback) => {
      const candidate = parsed.find((value) => value && typeof value === 'object' && value.id === fallback.id);
      return candidate && typeof candidate.endpoint === 'string' && typeof candidate.model === 'string' && typeof candidate.enabled === 'boolean'
        ? { ...fallback, endpoint: candidate.endpoint, model: candidate.model, enabled: candidate.enabled }
        : { ...fallback };
    });
  } catch {
    return defaultSettings.map((provider) => ({ ...provider }));
  }
}

function getPublicAppUrl(): string {
  const configured = window.__ENV__?.VITE_PUBLIC_APP_URL?.trim();
  if (!configured) return window.location.href;
  try {
    const url = new URL(configured);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : window.location.href;
  } catch {
    return window.location.href;
  }
}

function createQrImageUrl(text: string): string {
  // The QR is generated dynamically from configured app URL. A backend or bundled QR library can replace this
  // public image endpoint when npm registry access is available.
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encoded}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    };
    return entities[character];
  });
}

function render(): void {
  if (!app) return;

  localStorage.setItem(storageKey, JSON.stringify(settings));
  const appUrl = getPublicAppUrl();

  app.innerHTML = `
    <header>
      <div>
        <p class="eyebrow">Misi Malaysia • PWA</p>
        <h1>AI ATAN Hub</h1>
        <p>Pembantu AI bencana mudah alih dengan arahan teks, suara Bahasa Malaysia dan routing pintar.</p>
      </div>
      <span class="pill ${status}" aria-live="polite">${status}</span>
    </header>

    <section class="hero" aria-labelledby="chat-title">
      <h2 id="chat-title">Arahan Misi</h2>
      <div class="chat" aria-live="polite">
        ${messages.map(renderMessage).join('')}
      </div>
      <label for="prompt">Arahan kepada ATAN</label>
      <textarea id="prompt" placeholder="Contoh: ATAN, apa langkah keselamatan banjir di kampung saya?"></textarea>
      <div class="actions">
        <button id="send" ${status === 'loading' ? 'disabled' : ''}>${status === 'loading' ? 'Memproses...' : 'Hantar'}</button>
        <button class="secondary" id="listen" aria-label="Guna mikrofon untuk arahan suara Bahasa Malaysia">🎙️ Suara BM</button>
        <label class="inline"><input id="demo" type="checkbox" ${demoMode ? 'checked' : ''}/> Mod demo</label>
      </div>
      ${voiceNote ? `<p class="note">${escapeHtml(voiceNote)}</p>` : ''}
    </section>

    <section class="grid" aria-label="Panel sokongan ATAN">
      <aside>
        <h2>Aktiviti AI Router</h2>
        ${renderActivity()}
      </aside>
      <aside>
        <h2>QR Pasang Aplikasi</h2>
        <img class="qr" src="${createQrImageUrl(appUrl)}" alt="Kod QR untuk ${escapeHtml(appUrl)}"/>
        <p class="url-copy">${escapeHtml(appUrl)}</p>
      </aside>
    </section>

    <section aria-labelledby="settings-title">
      <h2 id="settings-title">Settings Penyedia AI</h2>
      ${settings.map(renderProviderSetting).join('')}
    </section>

    <footer>
      <p>WhatsApp/OpenCode: repositori asal belum mempunyai kod integrasi langsung; MVP ini menyediakan adapter local OpenAI-compatible selamat untuk Ollama/OpenCode dan mock demo tanpa rahsia.</p>
    </footer>
  `;

  bindEvents();
}

function renderMessage(message: AiMessage): string {
  const label = message.role === 'user' ? 'Anda' : 'ATAN';
  return `
    <article class="${message.role}">
      <strong>${label}</strong>
      <p>${escapeHtml(message.content)}</p>
      ${message.simulated ? '<small>Respons simulasi demo</small>' : ''}
    </article>
  `;
}

function renderActivity(): string {
  if (!activity) return '<p>Belum ada permintaan.</p>';

  return `
    <dl>
      <dt>Penyedia</dt><dd>${escapeHtml(activity.providerLabel)}</dd>
      <dt>Sebab</dt><dd>${escapeHtml(activity.reason)}</dd>
      <dt>Status</dt><dd>${escapeHtml(activity.status)}</dd>
      <dt>Masa respons</dt><dd>${activity.responseTimeMs ?? '-'} ms</dd>
      <dt>Jenis</dt><dd>${activity.simulated ? 'Simulasi' : 'Langsung'}</dd>
      ${activity.error ? `<dt>Ralat</dt><dd>${escapeHtml(activity.error)}</dd>` : ''}
    </dl>
  `;
}

function renderProviderSetting(provider: ProviderSettings, index: number): string {
  return `
    <div class="provider">
      <label><input data-index="${index}" class="enabled" type="checkbox" ${provider.enabled ? 'checked' : ''}/>${escapeHtml(provider.label)}</label>
      <input aria-label="Endpoint ${escapeHtml(provider.label)}" class="endpoint" data-index="${index}" value="${escapeHtml(provider.endpoint)}"/>
      <input aria-label="Model ${escapeHtml(provider.label)}" class="model" data-index="${index}" value="${escapeHtml(provider.model)}"/>
      <button class="secondary test" data-index="${index}">Test status</button>
    </div>
  `;
}

function speak(text: string): void {
  if (!('speechSynthesis' in window)) {
    voiceNote = 'Text-to-speech tidak disokong oleh pelayar ini.';
    render();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ms-MY';
  utterance.rate = 0.95;
  speechSynthesis.speak(utterance);
}

function listen(): void {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    voiceNote = 'Input suara tidak tersedia. Sila taip arahan anda.';
    render();
    return;
  }

  const recognition = new Recognition();
  recognition.lang = 'ms-MY';
  recognition.interimResults = false;
  recognition.onstart = () => {
    voiceNote = 'Mendengar arahan suara Bahasa Malaysia...';
    render();
  };
  recognition.onerror = () => {
    voiceNote = 'Kebenaran mikrofon ditolak atau berlaku ralat. Anda masih boleh menaip.';
    render();
  };
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    voiceNote = 'Arahan suara diterima.';
    render();
    const prompt = document.querySelector<HTMLTextAreaElement>('#prompt');
    if (prompt) prompt.value = transcript;
  };
  recognition.start();
}

async function send(): Promise<void> {
  const promptElement = document.querySelector<HTMLTextAreaElement>('#prompt');
  const prompt = promptElement?.value.trim() ?? '';
  if (!prompt) return;

  const userMessage: AiMessage = { role: 'user', content: prompt };
  messages = [...messages, userMessage];
  status = navigator.onLine ? 'loading' : 'offline';
  render();

  try {
    const { decision, response } = await routeAiRequest({ prompt, messages, settings, demoMode });
    messages = [...messages, { role: 'assistant', content: response.text, simulated: response.simulated }];
    activity = {
      provider: response.provider,
      providerLabel: decision.provider.label,
      reason: decision.reason,
      status: 'success',
      responseTimeMs: response.responseTimeMs,
      simulated: response.simulated,
    };
    status = 'success';
    speak(response.text);
  } catch (error) {
    const authenticationFailed = error instanceof Error && error.message === 'AUTH_FAILURE';
    status = authenticationFailed ? 'auth_failure' : 'provider_unavailable';
    activity = {
      provider: 'demo',
      providerLabel: 'Ralat Penyedia',
      reason: 'Penyedia gagal menjawab. Semak endpoint, model dan kunci API di Settings.',
      status,
      simulated: false,
      error: String(error),
    };
  }

  render();
}

function bindEvents(): void {
  document.querySelector('#send')?.addEventListener('click', send);
  document.querySelector('#listen')?.addEventListener('click', listen);
  document.querySelector('#demo')?.addEventListener('change', (event) => {
    demoMode = (event.target as HTMLInputElement).checked;
  });

  document.querySelectorAll<HTMLInputElement>('.enabled').forEach((input) => {
    input.addEventListener('change', () => {
      settings[Number(input.dataset.index)].enabled = input.checked;
      render();
    });
  });

  document.querySelectorAll<HTMLInputElement>('.endpoint,.model').forEach((input) => {
    input.addEventListener('change', () => {
      const provider = settings[Number(input.dataset.index)];
      if (input.classList.contains('endpoint')) provider.endpoint = input.value;
      else provider.model = input.value;
      render();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.test').forEach((button) => {
    button.addEventListener('click', async () => {
      const provider = settings[Number(button.dataset.index)];
      const available = await adapters[provider.id].test(provider);
      alert(`${provider.label}: ${available ? 'Sedia' : 'Tidak tersedia / perlu konfigurasi'}`);
    });
  });
}

window.addEventListener('offline', () => {
  status = 'offline';
  render();
});

window.addEventListener('online', () => {
  status = 'idle';
  render();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

render();
