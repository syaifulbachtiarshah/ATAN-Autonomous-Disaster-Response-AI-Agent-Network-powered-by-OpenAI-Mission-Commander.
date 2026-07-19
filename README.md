# AI ATAN Hub

AI ATAN Hub is a mobile-first Progressive Web Application for a practical Malaysian disaster-response assistant. The original repository contained only a short project statement; this MVP turns ATAN into an installable web app that accepts typed commands and Bahasa Malaysia voice commands, replies with text and Bahasa Malaysia text-to-speech, and routes requests across configured AI providers.

## Problem Statement

During floods, storms, earthquakes, heat events, or community emergencies, responders and residents need fast, local-language guidance. AI ATAN Hub demonstrates how a lightweight assistant can provide Bahasa Malaysia interaction, transparent AI-provider routing, offline-aware UI states, and a no-key demo mode suitable for OpenAI Build Week demonstrations.

## Main Features

- Mobile-first Bahasa Malaysia chat interface.
- Text input and browser speech recognition configured for `ms-MY`.
- Text responses and browser text-to-speech configured for `ms-MY`.
- Intelligent AI Router with transparent activity panel.
- Modular provider adapters for OpenAI, Google Gemini, and OpenAI-compatible local endpoints such as Ollama or OpenCode.
- Demo mode that works without paid API keys and clearly labels simulated responses.
- Settings page/section for enabling providers, editing endpoints, selecting models, and testing connection availability.
- Clear states for loading, success, offline, provider unavailable, authentication failure, and general errors.
- PWA manifest, service worker, offline fallback page, and ATAN icons.
- QR install section generated from `VITE_PUBLIC_APP_URL` or the current app URL.
- Accessibility basics: semantic labels, keyboard focus styles, contrast-conscious palette, microphone-permission messaging, and speech fallback messaging.

## System Architecture

```text
Browser PWA
├─ Dependency-free TypeScript mobile UI
│  ├─ Chat + voice controls
│  ├─ Settings provider controls
│  ├─ AI routing activity panel
│  └─ QR install panel
├─ Browser capabilities
│  ├─ SpeechRecognition / webkitSpeechRecognition for Bahasa Malaysia voice input
│  ├─ SpeechSynthesisUtterance for Bahasa Malaysia TTS
│  └─ Service worker cache for install/offline fallback
└─ AI services layer
   ├─ AI Router
   ├─ Demo adapter
   ├─ OpenAI adapter
   ├─ Google Gemini adapter
   └─ Local OpenAI-compatible adapter for Ollama/OpenCode-style endpoints
```

## AI Routing Flow

1. User enters a typed or voice command in Bahasa Malaysia.
2. UI sends the request, current conversation, provider settings, and demo-mode state to the router.
3. Router chooses:
   - Demo adapter when demo mode is on, no live providers are enabled, or the browser is offline.
   - Local adapter when the request emphasizes local/private/Ollama/OpenCode use.
   - Gemini adapter when the request mentions Google/Gemini.
   - OpenAI adapter as the default live provider for general mission reasoning.
4. Adapter returns a response and timing metadata.
5. UI displays the response, speaks it with `ms-MY` TTS, and records routing reason, status, response time, and simulated/live status.

## Technology Stack

- Dependency-free TypeScript compiled with `tsc`
- Native browser DOM APIs
- Browser Web Speech APIs
- Service Worker + Web App Manifest
- Node.js static build and local preview scripts
- Dynamic QR generation from the configured public app URL

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the local URL shown in your terminal. Demo mode is enabled by default, so the app works without paid API credentials.

## Environment Variables

Create `.env.local` from `.env.example`. Never commit real credentials.

| Variable | Purpose |
| --- | --- |
| `VITE_PUBLIC_APP_URL` | Public deployed URL used for the QR installation code. |
| `VITE_OPENAI_API_KEY` | Optional development OpenAI key for live OpenAI calls. |
| `VITE_GEMINI_API_KEY` | Optional development Gemini key for live Gemini calls. |
| `VITE_OPENAI_ENDPOINT` | Optional OpenAI-compatible endpoint default. |
| `VITE_GEMINI_ENDPOINT` | Optional Gemini endpoint default. |
| `VITE_LOCAL_OPENAI_ENDPOINT` | Optional local endpoint such as Ollama `http://localhost:11434/v1`. |

Security note: browser bundles can expose public configuration values such as `VITE_*`. For production, route paid provider calls through a backend proxy if you need to protect long-lived API keys. This MVP keeps secrets out of source control and provides demo mode for public demos.

## Testing Instructions

```bash
npm run test
npm run lint
npm run build
```

Tests cover important routing decisions including demo fallback, local-provider selection, and offline fallback.

## Deployment Instructions

1. Set `VITE_PUBLIC_APP_URL` to your final HTTPS deployment URL.
2. Build the static app:
   ```bash
   npm run build
   ```
3. Deploy the `dist/` folder to a static host such as Netlify, Vercel, Cloudflare Pages, GitHub Pages, or an HTTPS-enabled object storage bucket.
4. Verify `https://your-domain/manifest.webmanifest`, `https://your-domain/sw.js`, and `https://your-domain/offline.html` are reachable.

## PWA Installation Instructions

- Android Chrome/Edge: open the site, tap browser menu, then **Install app** or **Add to Home screen**.
- iOS Safari: open the site, tap Share, then **Add to Home Screen**.
- Desktop Chrome/Edge: use the install icon in the address bar when available.

## QR Installation Instructions

The app renders a QR code in the “QR Pasang Aplikasi” panel. In production, set `VITE_PUBLIC_APP_URL` before building so the QR points to the deployed app. Without that variable, the QR is generated from the current browser URL.

## WhatsApp and OpenCode Preservation

No existing WhatsApp or OpenCode implementation was present in the initial repository. The MVP therefore preserves the concept safely by documenting and implementing an OpenAI-compatible local adapter that can point at Ollama/OpenCode-style endpoints, plus a no-secret demo adapter. A future WhatsApp adapter can reuse the same provider-adapter interface and should store tokens/session credentials only in server-side environment variables.

## Security and Privacy Notes

- No real secrets are committed.
- `.env.example` contains placeholders only.
- Demo mode is clearly labeled as simulated.
- Browser speech features run locally in the browser capability layer, subject to browser/vendor implementation.
- Production paid-provider access should be proxied by a backend to avoid exposing long-lived credentials in public JavaScript.
- Local endpoints are user-configurable in Settings and can support privacy-first deployments.

## Current Limitations and Future Improvements

- Live provider calls from a frontend-only app are suitable for demos, not for protecting production API keys.
- Speech recognition availability depends on browser support and microphone permission.
- The service worker provides static offline fallback, not full offline AI inference.
- WhatsApp integration is represented as a documented future adapter because no existing integration was found.
- Future work: backend key vault/proxy, emergency data feeds, geolocation consent flow, WhatsApp Business integration, richer model health checks, push notifications, and multilingual support.

## How Codex and GPT-5.6 Were Used

Codex and GPT-5.6 were used as OpenAI Build Week development partners to analyze the sparse repository, plan a practical MVP, select a lightweight PWA stack, implement the TypeScript mobile interface, create modular AI-provider adapters, build and test the AI Router, add PWA install/offline assets, debug build and lint issues, verify that no real credentials were committed, and expand the README into complete setup, deployment, testing, privacy, and product documentation. GPT-5.6 assisted with architecture reasoning, Bahasa Malaysia UX wording, error-state coverage, demo-mode safety, and future-improvement planning so the project could move from concept to demonstrable application quickly.

## Exact Commands to Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

## License

See [LICENSE](LICENSE).
