import Link from 'next/link';
import { BarChart3, Database, Map, Upload, Target, Home } from 'lucide-react';

const navItems = [
  { href: '/', label: 'TOP', icon: Home },
  { href: '/upload', label: '取込', icon: Upload },
  { href: '/data', label: 'データ', icon: Database },
  { href: '/map', label: 'マップ', icon: Map },
  { href: '/analysis', label: '分析', icon: BarChart3 },
  { href: '/tomorrow', label: '狙い目', icon: Target },
] as const;

export function Nav() {
  return (
    <>
      {/* デスクトップナビ */}
      <div className="sticky top-0 z-40 border-b border-neutral-800 bg-black/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3">
          <div className="mr-3 whitespace-nowrap text-lg font-black text-orange-400">
            SLOT STRATEGY
          </div>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-neutral-200 transition hover:bg-neutral-800 hover:text-orange-400"
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* モバイルナビ（下部固定） */}
      <div className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-6 border-t border-neutral-800 bg-black/95 backdrop-blur md:hidden">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 py-2.5 text-[10px] text-neutral-300 transition active:bg-neutral-900"
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
