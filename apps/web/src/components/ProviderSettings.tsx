'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProviderConfig, CreateProviderInput } from '@/lib/types';
import { getProviders, createProvider, updateProvider, getSelectedProviderId, setSelectedProviderId } from '@/lib/api';
import { sortProviders } from '@/lib/utils';
import { ProviderCard } from './ProviderCard';
import { ProviderForm } from './ProviderForm';

interface ProviderSettingsProps {
  onClose?: () => void;
}

export function ProviderSettings({ onClose }: ProviderSettingsProps) {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProviders();
      setProviders(sortProviders(data));
      const saved = getSelectedProviderId();
      if (saved && !data.find((p) => p.id === saved)) {
        setSelectedId(data[0]?.id || null);
      } else {
        setSelectedId(saved || data[0]?.id || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSelectedProviderId(id);
  };

  const handleEdit = (provider: ProviderConfig) => {
    setEditingProvider(provider);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: CreateProviderInput) => {
    if (editingProvider) {
      await updateProvider(editingProvider.id, data);
    } else {
      await createProvider(data);
    }
    setShowForm(false);
    setEditingProvider(null);
    await loadProviders();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProvider(null);
  };

  const handleTestConnection = async (id: string) => {
    setTestingConnection(id);
    await new Promise((r) => setTimeout(r, 1500));
    alert(`Connection test for provider ${id} would be called here. Backend /providers/:id/test endpoint not yet implemented.`);
    setTestingConnection(null);
  };

  const handleDelete = () => {
    loadProviders();
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading providers...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</p>
        <button onClick={loadProviders} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px' }}>Provider Settings</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            + Add Provider
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ marginBottom: '24px' }}>
          <ProviderForm
            provider={editingProvider}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      {providers.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
          <p style={{ fontSize: '16px', marginBottom: '16px' }}>No providers configured yet.</p>
          <button
            onClick={() => setShowForm(true)}
            style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Add Your First Provider
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isSelected={provider.id === selectedId}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDeleted={handleDelete}
              onTestConnection={handleTestConnection}
              testingConnection={testingConnection === provider.id}
            />
          ))}
        </div>
      )}

      {onClose && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}