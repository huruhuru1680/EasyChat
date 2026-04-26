'use client';

import { ProviderSettings } from '@/components/ProviderSettings';
import Link from 'next/link';

export default function ProvidersPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>EasyChat</h1>
        <Link
          href="/"
          style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', textDecoration: 'none', color: 'inherit' }}
        >
          Back to Chat
        </Link>
      </div>
      <ProviderSettings />
    </div>
  );
}