export interface ChatbotConfig {
  apiKey: string;
  baseUrl: string;
  botName: string;
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
  role: string;
  welcomeMessage?: string;
  suggestionChips?: string[];
}

const DEFAULTS: Omit<ChatbotConfig, 'apiKey' | 'baseUrl'> = {
  botName: 'Assistant',
  primaryColor: '#1a56db',
  position: 'bottom-right',
  role: 'guest',
  suggestionChips: ['What can I do here?'],
};

export function loadConfig(): ChatbotConfig | null {
  const raw = (window as any).ChatbotConfig;
  if (!raw || !raw.apiKey) return null;

  return {
    ...DEFAULTS,
    ...raw,
    baseUrl: raw.baseUrl || '',
  };
}
