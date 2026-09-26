/**
 * Shapes returned by the Eshobe CMS REST API (Payload 3). Only the fields this
 * theme renders are typed; everything is optional because `fallbackLocale=false`
 * leaves untranslated localized fields empty.
 */

export type Locale = 'fa' | 'en'

export type Section = 'about' | 'projects' | 'services' | 'education' | 'contact'

export type EntryKind = 'projects' | 'education'

export type Ref<T> = T | string | null | undefined

export type LexicalNode = {
  type: string
  version?: number
  children?: LexicalNode[]
  text?: string
  format?: number | string
  style?: string
  mode?: string
  tag?: string
  listType?: 'bullet' | 'number' | 'check'
  checked?: boolean
  start?: number
  value?: unknown
  relationTo?: string
  fields?: Record<string, unknown> | null
  direction?: 'ltr' | 'rtl' | null
  url?: string
  indent?: number
}

export type RichTextData = { root: LexicalNode }

export type MediaSize = {
  url?: string | null
  width?: number | null
  height?: number | null
  mimeType?: string | null
}

export type Media = {
  id: string
  url?: string | null
  alt?: string | null
  caption?: RichTextData | null
  width?: number | null
  height?: number | null
  mimeType?: string | null
  filename?: string | null
  focalX?: number | null
  focalY?: number | null
  thumbnailURL?: string | null
  sizes?: Partial<
    Record<'thumbnail' | 'square' | 'small' | 'medium' | 'large' | 'xlarge' | 'og', MediaSize>
  > | null
}

export type Category = {
  id: string
  title?: string | null
  slug?: string | null
  parent?: Ref<Category>
}

export type Meta = {
  title?: string | null
  description?: string | null
  image?: Ref<Media>
}

export type Post = {
  id: string
  title?: string | null
  slug?: string | null
  heroImage?: Ref<Media>
  content?: RichTextData | null
  categories?: Ref<Category>[] | null
  relatedPosts?: Ref<Post>[] | null
  meta?: Meta | null
  publishedAt?: string | null
  updatedAt?: string | null
  populatedAuthors?: { id?: string | null; name?: string | null }[] | null
}

export type LinkField = {
  type?: 'reference' | 'custom' | null
  newTab?: boolean | null
  reference?: { relationTo: 'pages' | 'posts'; value: Ref<Page | Post> } | null
  url?: string | null
  label?: string | null
  appearance?: string | null
}

export type Hero = {
  type?: 'none' | 'highImpact' | 'mediumImpact' | 'lowImpact' | null
  richText?: RichTextData | null
  links?: { id?: string; link?: LinkField | null }[] | null
  media?: Ref<Media>
}

export type Block = {
  id?: string | null
  blockType: string
  blockName?: string | null
  [key: string]: unknown
}

export type Page = {
  id: string
  title?: string | null
  slug?: string | null
  hero?: Hero | null
  layout?: Block[] | null
  meta?: Meta | null
  publishedAt?: string | null
  updatedAt?: string | null
}

export type FormField = {
  id?: string | null
  blockType: string
  name?: string
  label?: string | null
  required?: boolean | null
  width?: number | null
  defaultValue?: string | number | boolean | null
  options?: { id?: string; label?: string | null; value: string }[] | null
  message?: RichTextData | null
}

export type Form = {
  id: string
  title?: string | null
  fields?: FormField[] | null
  submitButtonLabel?: string | null
  confirmationType?: 'message' | 'redirect' | null
  confirmationMessage?: RichTextData | null
  redirect?: { url?: string | null } | null
}

export type NavCollection = {
  id?: string
  navItems?: { id?: string; link?: LinkField | null }[] | null
}

export type SiteBranding = {
  displayName?: string | null
  displayNameFa?: string | null
  shortName?: string | null
  tagline?: string | null
  logo?: Ref<Media>
  logoCompact?: Ref<Media>
  favicon?: Ref<Media>
  defaultOgImage?: Ref<Media>
  ogImage?: Ref<Media>
}

export type SiteBindings = {
  homePage?: Ref<Page>
  aboutPage?: Ref<Page>
  servicesPage?: Ref<Page>
  contactPage?: Ref<Page>
  projectsCategory?: Ref<Category>
  educationCategory?: Ref<Category>
}

export type SiteDescriptor = {
  availableLocales: string[]
  blocks: string[]
  contractVersion: number
  defaultLocale: string
  domain: string
  media?: { basePath?: string; origin?: string } | null
  name?: string
  slug?: string
  status: 'active' | 'suspended' | 'archived'
  branding?: SiteBranding | null
  bindings?: SiteBindings | null
  runtimeSettings?: Record<string, unknown> | null
  theme?: {
    primary?: string | null
    accent?: string | null
    background?: string | null
    foreground?: string | null
    radius?: string | null
    lineHeight?: number | null
  } | null
  type?: 'business' | 'portfolio' | 'store'
  id?: string
  domainVerified?: boolean
}

export type Paginated<T> = {
  docs: T[]
  totalDocs?: number
  hasNextPage?: boolean
}

/** A language-switch target: `available` is false when no translation exists. */
export type LocaleLink = { href: string; available: boolean }

export type Alternates = Partial<Record<Locale, string>>
