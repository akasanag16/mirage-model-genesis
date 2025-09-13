import { toast } from 'sonner';

export interface ApiKeys {
  meshyAi?: string;
  csmAi?: string;
  rodinAi?: string;
  huggingFace?: string;
}

export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private keys: ApiKeys = {};

  private constructor() {
    this.loadKeys();
  }

  static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  private loadKeys(): void {
    try {
      const stored = localStorage.getItem('api-keys');
      if (stored) {
        this.keys = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
      this.keys = {};
    }
  }

  private saveKeys(): void {
    try {
      localStorage.setItem('api-keys', JSON.stringify(this.keys));
    } catch (error) {
      console.error('Failed to save API keys:', error);
      toast.error('Failed to save API keys');
    }
  }

  setKey(service: keyof ApiKeys, key: string): void {
    this.keys[service] = key;
    this.saveKeys();
    toast.success(`${service} API key saved successfully`);
  }

  getKey(service: keyof ApiKeys): string | undefined {
    return this.keys[service];
  }

  hasKey(service: keyof ApiKeys): boolean {
    return !!this.keys[service]?.trim();
  }

  clearKey(service: keyof ApiKeys): void {
    delete this.keys[service];
    this.saveKeys();
    toast.info(`${service} API key removed`);
  }

  clearAllKeys(): void {
    this.keys = {};
    this.saveKeys();
    toast.info('All API keys cleared');
  }

  getAvailableServices(): (keyof ApiKeys)[] {
    return Object.keys(this.keys).filter(key => this.hasKey(key as keyof ApiKeys)) as (keyof ApiKeys)[];
  }
}

export const apiKeyManager = ApiKeyManager.getInstance();