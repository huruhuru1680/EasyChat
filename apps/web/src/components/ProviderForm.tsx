'use client';

import { useState, useEffect } from 'react';
import { ProviderConfig, CreateProviderInput, PROVIDER_LABELS, PROVIDER_MODELS } from '@/lib/types';
import { z } from 'zod';

const providerFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(128),
  provider: z.enum(['openai', 'anthropic', 'google']),
  api_key: z.string().optional(),
  base_url: z.string().url('Invalid URL').or(z.literal('')).optional(),
  model: z.string().optional(),
  priority: z.number().int().min(0).max(1000).default(0),
  enabled: z.boolean().default(true),
});

type ProviderFormData = z.infer<typeof providerFormSchema>;

interface ProviderFormProps {
  provider?: ProviderConfig | null;
  onSubmit: (data: CreateProviderInput) => Promise<void>;
  onCancel: () => void;
}

export function ProviderForm({ provider, onSubmit, onCancel }: ProviderFormProps) {
  const [formData, setFormData] = useState<ProviderFormData>({
    name: provider?.name || '',
    provider: provider?.provider || 'openai',
    api_key: provider?.api_key || '',
    base_url: provider?.base_url || '',
    model: provider?.model || '',
    priority: provider?.priority || 0,
    enabled: provider?.enabled ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name,
        provider: provider.provider,
        api_key: provider.api_key || '',
        base_url: provider.base_url || '',
        model: provider.model || '',
        priority: provider.priority,
        enabled: provider.enabled,
      });
    }
  }, [provider]);

  const handleChange = (field: keyof ProviderFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = providerFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: formData.name,
        provider: formData.provider,
        api_key: formData.api_key || undefined,
        base_url: formData.base_url || undefined,
        model: formData.model || undefined,
        priority: formData.priority,
        enabled: formData.enabled,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>{provider ? 'Edit Provider' : 'Add Provider'}</h3>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
          Provider *
        </label>
        <select
          value={formData.provider}
          onChange={(e) => handleChange('provider', e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '14px', border: `1px solid ${errors.provider ? '#dc2626' : '#d1d5db'}`, borderRadius: '4px' }}
        >
          {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errors.provider && <p style={{ color: '#dc2626', fontSize: '12px', margin: '4px 0 0' }}>{errors.provider}</p>}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
          Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="My OpenAI Config"
          style={{ width: '100%', padding: '8px', fontSize: '14px', border: `1px solid ${errors.name ? '#dc2626' : '#d1d5db'}`, borderRadius: '4px', boxSizing: 'border-box' }}
        />
        {errors.name && <p style={{ color: '#dc2626', fontSize: '12px', margin: '4px 0 0' }}>{errors.name}</p>}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
          API Key
        </label>
        <input
          type="password"
          value={formData.api_key}
          onChange={(e) => handleChange('api_key', e.target.value)}
          placeholder={provider ? '(unchanged)' : 'sk-...'}
          style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
          Base URL
        </label>
        <input
          type="text"
          value={formData.base_url}
          onChange={(e) => handleChange('base_url', e.target.value)}
          placeholder="https://api.openai.com/v1 (optional)"
          style={{ width: '100%', padding: '8px', fontSize: '14px', border: `1px solid ${errors.base_url ? '#dc2626' : '#d1d5db'}`, borderRadius: '4px', boxSizing: 'border-box' }}
        />
        {errors.base_url && <p style={{ color: '#dc2626', fontSize: '12px', margin: '4px 0 0' }}>{errors.base_url}</p>}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
          Model
        </label>
        <select
          value={formData.model}
          onChange={(e) => handleChange('model', e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '4px' }}
        >
          <option value="">Select a model</option>
          {PROVIDER_MODELS[formData.provider].map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
            Priority
          </label>
          <input
            type="number"
            value={formData.priority}
            onChange={(e) => handleChange('priority', parseInt(e.target.value) || 0)}
            min={0}
            max={1000}
            style={{ width: '100px', padding: '8px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
            />
            Enabled
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: submitting ? 'not-allowed' : 'pointer' }}
        >
          {submitting ? 'Saving...' : provider ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}