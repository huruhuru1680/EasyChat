'use client';

import { useState } from 'react';
import { ProviderConfig, PROVIDER_LABELS } from '@/lib/types';
import { maskApiKey } from '@/lib/utils';
import { deleteProvider } from '@/lib/api';

interface ProviderCardProps {
  provider: ProviderConfig;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (provider: ProviderConfig) => void;
  onDeleted: () => void;
  onTestConnection: (id: string) => void;
  testingConnection: boolean;
}

export function ProviderCard({
  provider,
  isSelected,
  onSelect,
  onEdit,
  onDeleted,
  onTestConnection,
  testingConnection,
}: ProviderCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${provider.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteProvider(provider.id);
      onDeleted();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(provider.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(provider.id)}
      style={{
        padding: '16px',
        border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
        borderRadius: '8px',
        backgroundColor: isSelected ? '#eff6ff' : '#fff',
        cursor: 'pointer',
        opacity: provider.enabled ? 1 : 0.6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{provider.name}</h3>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
            {PROVIDER_LABELS[provider.provider]} {provider.model && `• ${provider.model}`}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9ca3af' }}>
            API: {maskApiKey(provider.api_key)}
          </p>
          {provider.base_url && (
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
              Base: {provider.base_url}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onTestConnection(provider.id); }}
            disabled={testingConnection}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: testingConnection ? 'not-allowed' : 'pointer',
            }}
          >
            {testingConnection ? 'Testing...' : 'Test'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(provider); }}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            disabled={deleting}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '4px',
              color: '#dc2626',
              cursor: deleting ? 'not-allowed' : 'pointer',
            }}
          >
            {deleting ? '...' : 'Delete'}
          </button>
        </div>
      </div>
      {!provider.enabled && (
        <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', display: 'block' }}>
          Disabled
        </span>
      )}
    </div>
  );
}