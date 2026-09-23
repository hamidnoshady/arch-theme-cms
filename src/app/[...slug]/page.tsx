import {renderRoute} from '@/lib/pages';export default async function Page({params}:{params:Promise<{slug:string[]}>}){return renderRoute('fa',(await params).slug)}
