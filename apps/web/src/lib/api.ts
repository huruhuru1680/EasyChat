import { ProviderConfig, CreateProviderInput, UpdateProviderInput } from './types';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(`${API_URL}${url}`, { ...options, headers });
}

export async function getProviders(): Promise<ProviderConfig[]> {
  const res = await fetchWithAuth('/providers');
  if (!res.ok) throw new Error('Failed to fetch providers');
  const data = await res.json();
  return data.provider_configs;
}

export async function getProvider(id: string): Promise<ProviderConfig> {
  const res = await fetchWithAuth(`/providers/${id}`);
  if (!res.ok) throw new Error('Failed to fetch provider');
  const data = await res.json();
  return data.provider_config;
}

export async function createProvider(input: CreateProviderInput): Promise<ProviderConfig> {
  const res = await fetchWithAuth('/providers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create provider');
  }
  const data = await res.json();
  return data.provider_config;
}

export async function updateProvider(id: string, input: UpdateProviderInput): Promise<ProviderConfig> {
  const res = await fetchWithAuth(`/providers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update provider');
  }
  const data = await res.json();
  return data.provider_config;
}

export async function deleteProvider(id: string): Promise<void> {
  const res = await fetchWithAuth(`/providers/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete provider');
}

export async function testConnection(providerId: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetchWithAuth(`/providers/${providerId}/test`, { method: 'POST' });
  const data = await res.json();
  return { success: res.ok, error: data.error };
}