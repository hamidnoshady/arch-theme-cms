import {renderRoute} from '@/lib/pages';export default async function Page({params}:{params:Promise<{slug:string[]}>}){return <div dir="ltr" lang="en">{renderRoute('en',(await params).slug)}</div>}
