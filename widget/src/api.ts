export interface ChatRequest {
  message: string;
  session_id: string;
  current_route: string;
  history: Array<{ sender: string; text: string }>;
  role: string;
  workspace_context?: Record<string, any>;
  site_knowledge?: Array<{ name: string; path: string; description: string }>;
}

export interface ChatResponse {
  message: string;
  route?: string;
  route_name?: string;
  navigations?: Array<{ url: string; title: string }>;
  session_id: string;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost: number;
  };
}

export async function sendMessage(
  apiKey: string,
  baseUrl: string,
  payload: ChatRequest,
  retries = 1
): Promise<ChatResponse> {
  const url = `${baseUrl.replace(/\/+$/, '')}/api/v1/chat/message/`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }

    return await resp.json();
  } catch (err) {
    if (retries > 0) {
      return sendMessage(apiKey, baseUrl, payload, retries - 1);
    }
    throw err;
  }
}
