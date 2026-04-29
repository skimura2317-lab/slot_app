import { ResultRow, MapCell } from './types';
export function grade(diff:number,games:number){
 let s=0; if(games>=7000)s+=25; else if(games>=5000)s+=15; else if(games>=3000)s+=8;
 if(diff>=5000)s+=40; else if(diff>=3000)s+=30; else if(diff>=1000)s+=15; else if(diff>0)s+=5; else if(diff<=-3000)s-=10;
 if(s>=60)return 'S'; if(s>=45)return 'A'; if(s>=30)return 'B'; if(s>=15)return 'C'; return 'D';
}
export function cellClass(diff?:number){
 if(diff===undefined) return 'bg-neutral-950';
 if(diff>=5000) return 'bg-yellow-500 text-black border-yellow-200';
 if(diff>=3000) return 'bg-emerald-600 text-white border-emerald-300';
 if(diff>=1000) return 'bg-lime-700 text-white border-lime-300';
 if(diff>0) return 'bg-blue-800 text-white border-blue-400';
 if(diff<=-3000) return 'bg-red-950 text-white border-red-500';
 return 'bg-neutral-800 text-neutral-200';
}
export function detectLines(cells:MapCell[], results:ResultRow[]){
 const byUnit = new Map(results.map(r=>[r.unit_no,r]));
 const hit = new Set<string>();
 const grouped = new Map<number, Map<number, MapCell>>();
 for(const c of cells){ if(!grouped.has(c.row_no)) grouped.set(c.row_no,new Map()); grouped.get(c.row_no)!.set(c.col_no,c); }
 for(const [row, cols] of grouped){
   const sorted = [...cols.values()].sort((a,b)=>a.col_no-b.col_no);
   for(let i=0;i<sorted.length-2;i++){
     const trio=sorted.slice(i,i+3); if(trio.some(c=>!c.unit_no)) continue;
     const strong=trio.every(c=>{const r=byUnit.get(c.unit_no!); return r && r.diff>=1000 && r.games>=2500;});
     if(strong) trio.forEach(c=>hit.add(`${c.row_no}-${c.col_no}`));
   }
 }
 return hit;
}
