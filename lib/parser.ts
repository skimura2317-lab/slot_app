import { ResultRow } from './types';

function n(v:string){ const m=(v||'').replace(/[,枚G回]/g,'').match(/-?\d+/); return m?Number(m[0]):0; }

export function parsePastedTable(text:string, play_date:string, hall_name:string): ResultRow[]{
  const rows: ResultRow[] = [];
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  for(const line of lines){
    const cols = line.split(/\t|,|\s{2,}/).map(x=>x.trim()).filter(Boolean);
    if(cols.length < 4) continue;
    const unitIndex = cols.findIndex(c=>/^\d{2,5}$/.test(c));
    if(unitIndex < 0) continue;
    const unit_no = Number(cols[unitIndex]);
    const machine_name = cols.slice(0, unitIndex).join(' ') || cols[unitIndex+1] || '不明';
    const nums = cols.slice(unitIndex+1).map(n);
    rows.push({ play_date, hall_name, machine_name, unit_no, games: nums[0]||0, diff: nums[1]||0, bb: nums[2]||0, rb: nums[3]||0, source:'paste' });
  }
  return rows;
}

export function parseCsv(text:string, play_date:string, hall_name:string): ResultRow[]{
  const lines = text.split(/\r?\n/).filter(Boolean);
  const rows: ResultRow[] = [];
  const header = lines[0].split(',').map(h=>h.trim());
  const idx = (names:string[]) => header.findIndex(h=>names.some(n=>h.includes(n)));
  const iUnit=idx(['台番号','unit']), iMachine=idx(['機種','machine']), iGames=idx(['G数','ゲーム','games']), iDiff=idx(['差枚','diff']), iBB=idx(['BB','bb']), iRB=idx(['RB','rb']), iDate=idx(['日付','date']), iHall=idx(['ホール','hall']);
  for(const line of lines.slice(1)){
    const c=line.split(',').map(x=>x.trim());
    if(iUnit<0 || iMachine<0) continue;
    rows.push({ play_date:iDate>=0?c[iDate]:play_date, hall_name:iHall>=0?c[iHall]:hall_name, machine_name:c[iMachine]||'不明', unit_no:n(c[iUnit]), games:iGames>=0?n(c[iGames]):0, diff:iDiff>=0?n(c[iDiff]):0, bb:iBB>=0?n(c[iBB]):0, rb:iRB>=0?n(c[iRB]):0, source:'csv' });
  }
  return rows;
}

export function parseHtml(html:string, play_date:string, hall_name:string): ResultRow[]{
  const plain = html.replace(/<\/(tr|p|div)>/gi,'\n').replace(/<\/(td|th)>/gi,'\t').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');
  return parsePastedTable(plain, play_date, hall_name).map(r=>({...r, source:'html'}));
}
