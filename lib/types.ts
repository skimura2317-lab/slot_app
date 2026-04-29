export type ResultRow = { id?:number; play_date:string; hall_name:string; machine_name:string; unit_no:number; games:number; diff:number; bb?:number; rb?:number; source?:string };
export type MapCell = { id?:number; hall_name:string; map_name:string; row_no:number; col_no:number; unit_no:number|null; area?:string|null };
