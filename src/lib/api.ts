import type {Entry,Locale,PageData} from './types';
const base=process.env.ESHOBE_API_URL||process.env.NEXT_PUBLIC_ESHOBE_API_URL||'';
const headers=()=>{const h:Record<string,string>={'Accept':'application/json'};if(process.env.ESHOBE_SITE_API_KEY)h.Authorization=`Bearer ${process.env.ESHOBE_SITE_API_KEY}`;return h};
async function request<T>(path:string):Promise<T|null>{if(!base)return null;try{const r=await fetch(`${base.replace(/\/$/,'')}${path}`,{headers:headers(),next:{revalidate:60}});if(!r.ok)return null;return await r.json()}catch{return null}}
export async function getSite(){return request<Record<string,unknown>>('/api/site')}
export async function getPage(slug:string,locale:Locale){const q=new URLSearchParams({locale,'where[slug][equals]':slug,depth:'2','where[_status][equals]':'published',fallbackLocale:'false'});const d=await request<{docs:PageData[]}>(`/api/pages?${q}`);return d?.docs?.[0]||null}
export async function getEntries(kind:'projects'|'education',locale:Locale){const q=new URLSearchParams({locale,depth:'2','where[_status][equals]':'published','where[category.slug][equals]':kind,fallbackLocale:'false',limit:'100'});const d=await request<{docs:Entry[]}>(`/api/posts?${q}`);return d?.docs||[]}
export async function getEntry(slug:string,locale:Locale){const q=new URLSearchParams({locale,depth:'3','where[slug][equals]':slug,'where[_status][equals]':'published',fallbackLocale:'false'});const d=await request<{docs:Entry[]}>(`/api/posts?${q}`);return d?.docs?.[0]||null}
export function mediaUrl(path?:string){if(!path)return '';if(/^https?:\/\//.test(path))return path;const origin=process.env.NEXT_PUBLIC_MEDIA_ORIGIN||base;return `${origin.replace(/\/$/,'')}/${path.replace(/^\//,'')}`}
