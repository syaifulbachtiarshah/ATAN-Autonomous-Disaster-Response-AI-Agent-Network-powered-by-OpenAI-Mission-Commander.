export type ProviderId = 'demo' | 'openai' | 'gemini' | 'local';
export type RequestStatus = 'idle' | 'loading' | 'success' | 'offline' | 'provider_unavailable' | 'auth_failure' | 'error';

export interface ProviderSettings {
  id: ProviderId;
  label: string;
  enabled: boolean;
  endpoint: string;
  model: string;
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  simulated?: boolean;
}

export interface AiRequest {
  prompt: string;
  messages: AiMessage[];
  settings: ProviderSettings[];
  demoMode: boolean;
}

export interface AiResponse {
  text: string;
  provider: ProviderId;
  simulated: boolean;
  responseTimeMs: number;
}

export interface RouteDecision {
  provider: ProviderSettings;
  reason: string;
  simulated: boolean;
}

export interface RoutingActivity {
  provider: ProviderId;
  providerLabel: string;
  reason: string;
  status: RequestStatus;
  responseTimeMs?: number;
  simulated: boolean;
  error?: string;
}

export interface AiProviderAdapter {
  id: ProviderId;
  label: string;
  test(settings: ProviderSettings): Promise<boolean>;
  send(request: AiRequest, provider: ProviderSettings): Promise<AiResponse>;
}
