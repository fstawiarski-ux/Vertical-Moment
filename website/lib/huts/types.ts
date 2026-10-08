export type ResearchRow=Record<string,unknown>;
export type HutIndex={id:string;number:number;name:string;region:string;mountain_group:string;association:string;elevation_m:number|null;service:string;story:string;story_status:string;opening_year:number|null;anniversary_hooks:string;has_notice:boolean;notice_summary:string;has_prices:boolean;has_diet:boolean;checked:string;latitude:number|null;longitude:number|null};
export type HutDetail={release:string;record:ResearchRow&{id:string;number:number;name:string;base?:{region?:string;mountain_group?:string;elevation_m?:number;directory_link?:string}};visitor:ResearchRow|null;surroundings:ResearchRow|null;tariffs:ResearchRow[];events:ResearchRow[];dates:ResearchRow[];routes:ResearchRow[];contexts:ResearchRow[];sources:ResearchRow[];film_formats:ResearchRow[]};
export type ShootField={key:string;label:string;type:string;default:string;options?:string[]};
export type TripDestination={hut_id:string;approach_id:string};
export type Trip={id:string;name:string;date:string;destinations:TripDestination[];notes:string;checklist:Record<string,boolean>;shoot_status:string;day_notes:string};
export type Workspace={bookmarks:string[];plans:Record<string,Record<string,string>>;trips:Trip[];legacy:Record<string,unknown>};
export const emptyWorkspace=():Workspace=>({bookmarks:[],plans:{},trips:[],legacy:{}});
export const text=(v:unknown):string=>v===null||v===undefined||v===''?'Not established in checked sources':typeof v==='object'?JSON.stringify(v):String(v);
export function safeUrl(value:unknown){if(typeof value!=='string')return null;try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}}
export function validDate(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value&&value>='1900-01-01'&&value<='2100-12-31';}
