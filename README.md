# ATAN — Autonomous Disaster Response AI Agent Network

ATAN is a mobile-first Progressive Web App for a Bahasa Malaysia disaster-response assistant. It accepts text and voice commands, speaks responses, exposes routing decisions, supports multiple AI providers, and remains demonstrable without credentials through a labelled offline-safe demo mode.

> **Safety:** ATAN is decision support, not an emergency authority. For immediate danger in Malaysia, call **999** and follow official agency instructions.

## OpenAI Build Week implementation evidence

- `src/main.ts`: Bahasa Malaysia chat, speech recognition and TTS (`ms-MY`), Settings, online/offline state, QR install URL, routing activity, and provider-error UI.
- `src/services/router.ts`: deterministic multi-provider selection and demo/offline fallback.
- `src/services/providers.ts`: OpenAI Mission Commander and Gemini proxies, local OpenAI-compatible adapter, health checks, and no-key demo adapter.
- `public/manifest.webmanifest`, `public/sw.js`, and icons: installable PWA and offline shell.
- `tests/router.test.js`: routing regression tests.
- `scripts/build.mjs`: static build with a strict public-config allowlist.

## Architecture and security boundary

```text
Browser PWA
  ├─ UI, Bahasa Malaysia voice/TTS, routing, PWA and demo mode
  ├─ public dist/env.js: install URL and endpoint URLs only
  ├─ /api/providers/openai → trusted server proxy → OpenAI Mission Commander
  ├─ /api/providers/gemini → trusted server proxy → Gemini
  └─ localhost endpoint → user-operated OpenAI-compatible service
```

Cloud credentials are deliberately **not supported in the browser**. Generated `dist/env.js` is ignored by Git and contains only allowlisted public URLs. A deployment proxy holds credentials server-side and exposes:

- `GET <proxy>/status` → a successful response when configured and healthy.
- `POST <proxy>/chat` with `{ model, prompt, messages }` → `{ "text": "..." }`.

The OpenAI proxy is the Mission Commander boundary: it owns authentication, system instructions, tool orchestration, rate limits, audit logging, and the upstream OpenAI request. Never forward a provider credential to the PWA. The local adapter uses `GET /models` and `POST /chat/completions` directly because it targets a user-controlled service.

## Setup and configuration

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Demo mode is enabled by default and requires no credentials. On Windows systems that block `npm.ps1`, use `npm.cmd install` and `npm.cmd run dev`.

The build reads variables from the process; `.env.example` is a reference and is not automatically loaded.

| Public variable | Default | Purpose |
| --- | --- | --- |
| `VITE_PUBLIC_APP_URL` | current browser URL | HTTPS installation URL encoded into the QR image |
| `VITE_OPENAI_PROXY_URL` | `/api/providers/openai` | server-side OpenAI Mission Commander proxy |
| `VITE_GEMINI_PROXY_URL` | `/api/providers/gemini` | server-side Gemini proxy |
| `VITE_LOCAL_OPENAI_ENDPOINT` | `http://localhost:11434/v1` | local OpenAI-compatible endpoint |

These values are public. Do not give secrets a `VITE_*` name. Provider keys belong only in the separate proxy/server environment and must never be passed to `npm run build`.

```powershell
$env:VITE_PUBLIC_APP_URL = "https://atan.example.org"
npm.cmd run build
```

Deploy `dist/` to an HTTPS static host alongside the proxy routes. The QR uses the configured HTTP(S) URL and otherwise safely falls back to the current page URL. QR rendering uses `api.qrserver.com`, so that service receives the installation URL; privacy-sensitive deployments should replace it with a bundled generator.

## Testing and readiness checks

```bash
npm install
npm run test
npm run lint
npm run build
```

Tests cover demo selection, privacy/local routing, and offline fallback. `lint` performs strict TypeScript validation. Scan source and output after building:

```bash
rg -n -i "(api[_-]?key|secret|token|password|credential)" dist src public scripts tests .env.example
```

Expected matches must be documentation/comments only—never credential values or fields in `dist/env.js`. For production, also run an organisation-approved, history-aware scanner such as Gitleaks against the real Git checkout. This source snapshot has no `.git` metadata.

## Sample disaster-response scenario

1. Open ATAN with **Mod demo** selected.
2. Enter or speak: **“ATAN, air banjir semakin naik di Kampung Baru. Apakah tindakan selamat sekarang?”**
3. Confirm the response recommends monitoring water, avoiding low routes, preparing an emergency bag, and calling 999 if safety is threatened.
4. Confirm **Aktiviti AI Router** reports `Demo ATAN`, `success`, and `Simulasi`.
5. Turn the network off and repeat; confirm `offline` status and safe demo fallback.
6. For an authorised live test, turn demo off, enable **OpenAI Mission Commander**, and select **Test status**. Ready is shown only when the proxy `/status` succeeds.

Do not treat generated advice as an official alert. Validate operational deployments with emergency-service stakeholders and authoritative live data.

## Key technical and product decisions

- Server-side cloud-provider boundary keeps long-lived credentials out of source, requests, browser storage, and generated assets.
- Visible provider, reason, latency, live/simulated type, and failures make routing auditable.
- Demo-first availability gives a complete no-credential demonstration while clearly labelling simulation.
- Privacy/local prompts prefer local AI, explicit Gemini prompts prefer Gemini, and general live missions prefer OpenAI Mission Commander.
- Text remains available when speech support or microphone permission is unavailable.
- Settings persist only enablement, endpoint URLs, and model names; no credential input exists.
- Native browser APIs keep runtime dependencies small while providing install, offline, speech, and UI capabilities.

## How Codex and GPT-5.6 were used

Codex performed the repository-wide implementation audit: traced environment data into generated assets, removed browser credential handling, designed the proxy contract, repaired health checks and voice transcript persistence, hardened saved settings and HTML rendering, made npm scripts cross-platform and reproducible, updated documentation, and ran the readiness commands and secret scan.

GPT-5.6 is the configured Mission Commander model identifier sent to the trusted OpenAI proxy. The proxy—not this browser repository—controls the authenticated OpenAI call and orchestration. The no-credential audit uses demo mode and does **not** claim a live GPT-5.6 request was made. This keeps simulated and live implementation evidence distinct.

## PWA installation

- Android Chrome/Edge: menu → **Install app** or **Add to Home screen**.
- iOS Safari: Share → **Add to Home Screen**.
- Desktop Chrome/Edge: use the address-bar install control.
- Another device: scan **QR Pasang Aplikasi** after setting the final HTTPS `VITE_PUBLIC_APP_URL`.

## Known limitations

- Speech recognition depends on browser support and permission.
- Offline mode provides cached UI and deterministic demo guidance, not offline model inference.
- This repository specifies but does not deploy the credential-bearing proxy backend.
- QR rendering currently uses a third-party endpoint.
- Live emergency feeds, geolocation consent, WhatsApp, push alerts, and agency validation remain future work.

## License

See [LICENSE](LICENSE).
