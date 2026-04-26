'use client';

import { ProviderConfig } from './types';

const SELECTED_PROVIDER_KEY = 'easychat_selected_provider';

export function getSelectedProviderId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SELECTED_PROVIDER_KEY);
}

export function setSelectedProviderId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(SELECTED_PROVIDER_KEY, id);
  } else {
    localStorage.removeItem(SELECTED_PROVIDER_KEY);
  }
}

export function maskApiKey(apiKey: string | null): string {
  if (!apiKey) return '••••••••';
  if (apiKey.length <= 8) return '••••••••';
  return apiKey.slice(0, 4) + '••••••••' + apiKey.slice(-4);
}

export function sortProviders(providers: ProviderConfig[]): ProviderConfig[] {
  return [...providers].sort((a, b) => {
    if (a.enabled !== b.enabled) return b.enabled ? 1 : -1;
    return b.priority - a.priority;
  });
}