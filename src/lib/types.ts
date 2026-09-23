export type Locale='fa'|'en';
export type Media={url:string;alt?:string;width?:number;height?:number;mimeType?:string;poster?:string};
export type Entry={id:string;slug:string;title:string;excerpt?:string;publishedAt?:string;featuredImage?:Media;category?:string;content?:Block[];metadata?:Record<string,string>};
export type Block={id?:string;blockType:string;heading?:string;text?:string;media?:Media;images?:Media[];url?:string;label?:string};
export type PageData={slug:string;title:string;intro?:string;layout?:Block[];seo?:{title?:string;description?:string};location?:{address:string;lat:number;lng:number;mapUrl?:string};contact?:{email?:string;phone?:string;address?:string};formId?:string};
