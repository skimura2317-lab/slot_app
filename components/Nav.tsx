import Link from 'next/link';
import { BarChart3, Database, Map, Upload, Target, Home } from 'lucide-react';
const items = [
  ['/', 'TOP', Home], ['/upload','取込',Upload], ['/data','データ',Database], ['/map','マップ',Map], ['/analysis','分析',BarChart3], ['/tomorrow','狙い目',Target]
] as const;
export function Nav(){return <>
  <div className="sticky top-0 z-40 border-b border-neutral-800 bg-black/90 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3">
      <div className="mr-3 whitespace-nowrap text-lg font-black text-orange-400">SLOT STRATEGY</div>
      {items.map(([href,label,Icon])=><Link key={href} href={href} className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800"><Icon size={16}/>{label}</Link>)}
    </div>
  </div>
  <div className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-6 border-t border-neutral-800 bg-black md:hidden">
    {items.map(([href,label,Icon])=><Link key={href} href={href} className="flex flex-col items-center gap-1 py-2 text-[11px] text-neutral-200"><Icon size={18}/>{label}</Link>)}
  </div>
</>}
