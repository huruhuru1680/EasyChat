import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EasyChat',
  description: 'Provider-agnostic AI chat interface',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}