import './globals.css';
import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = { title: 'Slot Strategy Web', description: '身内用スロット分析Webアプリ' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ja"><body><Nav /><main className="mx-auto max-w-7xl px-4 pb-24 pt-5">{children}</main></body></html>;
}
