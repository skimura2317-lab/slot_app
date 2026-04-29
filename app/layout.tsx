import './globals.css';
import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Slot Strategy - スロット分析Webアプリ',
  description: 'パチスロ実戦データを蓄積・分析し、ホールごとの傾向・並び・狙い台を可視化',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Nav />
        <main className="mx-auto max-w-7xl px-4 pb-24 pt-5 md:pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}
