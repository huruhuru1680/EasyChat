'use client';

import { useState } from 'react';
import { ProviderSelector } from '@/components/ProviderSelector';
import { ProviderSettings } from '@/components/ProviderSettings';

export default function HomePage() {
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    const userMessage = input;
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setStreaming(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
    await new Promise((r) => setTimeout(r, 1500));
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant') {
        return [...prev.slice(0, -1), { ...last, content: 'Demo response - connect backend streaming to enable real responses.' }];
      }
      return prev;
    });
    setStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (showSettings) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '20px' }}>EasyChat</h1>
          <button
            onClick={() => setShowSettings(false)}
            style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
          >
            Back to Chat
          </button>
        </div>
        <ProviderSettings onClose={() => setShowSettings(false)} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>EasyChat</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ProviderSelector />
          <button
            onClick={() => setShowSettings(true)}
            style={{ padding: '8px 12px', fontSize: '14px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
          >
            Settings
          </button>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#f9fafb' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '12px', color: '#374151' }}>Welcome to EasyChat</h2>
            <p style={{ fontSize: '16px' }}>Select a provider and start chatting</p>
          </div>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: msg.role === 'user' ? '#3b82f6' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#374151',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer style={{ padding: '16px 20px', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '12px' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            style={{ flex: 1, padding: '12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', resize: 'none', fontFamily: 'inherit' }}
          />
          <button
            onClick={handleSend}
            disabled={streaming || !input.trim()}
            style={{ padding: '12px 24px', fontSize: '14px', backgroundColor: streaming ? '#9ca3af' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: streaming ? 'not-allowed' : 'pointer' }}
          >
            {streaming ? 'Sending...' : 'Send'}
          </button>
        </div>
      </footer>
    </div>
  );
}