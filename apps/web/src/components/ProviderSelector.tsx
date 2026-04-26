'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ProviderConfig, PROVIDER_LABELS } from '@/lib/types';
import { getProviders, getSelectedProviderId, setSelectedProviderId } from '@/lib/api';
import { sortProviders } from '@/lib/utils';

interface ProviderSelectorProps {
  onProviderChange?: (provider: ProviderConfig) => void;
}

export function ProviderSelector({ onProviderChange }: ProviderSelectorProps) {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadProviders = useCallback(async () => {
    try {
      const data = await getProviders();
      const enabled = data.filter((p) => p.enabled);
      setProviders(sortProviders(enabled));
      const saved = getSelectedProviderId();
      if (saved && enabled.find((p) => p.id === saved)) {
        setSelectedId(saved);
      } else {
        setSelectedId(enabled[0]?.id || null);
      }
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedProvider = providers.find((p) => p.id === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSelectedProviderId(id);
    const provider = providers.find((p) => p.id === id);
    if (provider && onProviderChange) {
      onProviderChange(provider);
    }
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280' }}>
        Loading...
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div style={{ padding: '8px 12px', fontSize: '14px', color: '#9ca3af' }}>
        No providers
      </div>
    );
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          fontSize: '14px',
          backgroundColor: '#fff',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          minWidth: '180px',
        }}
      >
        <span style={{ fontWeight: 500 }}>
          {selectedProvider ? PROVIDER_LABELS[selectedProvider.provider] : 'Select provider'}
        </span>
        {selectedProvider && (
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{selectedProvider.name}</span>
        )}
        <svg
          style={{ width: '16px', height: '16px', marginLeft: 'auto', transition: 'transform 0.2s' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 50,
            maxHeight: '240px',
            overflowY: 'auto',
          }}
        >
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleSelect(provider.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                backgroundColor: provider.id === selectedId ? '#eff6ff' : 'transparent',
                border: 'none',
                borderBottom: '1px solid #f3f4f6',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontWeight: 500 }}>{PROVIDER_LABELS[provider.provider]}</span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {provider.name} {provider.model && `• ${provider.model}`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}