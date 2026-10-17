import './globals.css';
import type { Metadata } from 'next';
import { StoreProvider } from '@/lib/store';
import { LayoutShell } from '@/components/LayoutShell';

export const metadata: Metadata = {
  title: 'Chai Tea Manager Kenya',
  description: 'Tea leaves business management web application for wholesale and retail in Kenya',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <LayoutShell>{children}</LayoutShell>
        </StoreProvider>
      </body>
    </html>
  );
}
