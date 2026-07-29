/**
 * Triple Fusion OS: Official TypeScript / Node Client SDK
 * Version: 3.5.0
 */

export class BullLogicClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'http://localhost:8001', apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
    return response.json();
  }

  public async getHealth(): Promise<any> {
    return this.request('/api/health');
  }

  public async getPrediction(ticker: string = 'AAPL', interval: string = '1d'): Promise<any> {
    return this.request(`/api/predict?ticker=${ticker}&interval=${interval}`);
  }

  public async getMultiAgentProvenance(ticker: string = 'AAPL'): Promise<any> {
    return this.request(`/api/ai/subagents/provenance?ticker=${ticker}`);
  }

  public async getTcaAnalytics(ticker: string = 'AAPL'): Promise<any> {
    return this.request(`/api/execution/tca?ticker=${ticker}`);
  }
}
