import { formatDate as runtimeFormatDate, toLocaleDigits } from '@eshobe/site-runtime'

import { localeHref } from './locale'
import type { Locale, Section } from './types'

export const DEFAULT_LOCALE: Locale = 'fa'

export const SECTIONS: Section[] = ['about', 'projects', 'services', 'education', 'contact']

export const otherLocale = (locale: Locale): Locale => (locale === 'fa' ? 'en' : 'fa')

const fa = {
  about: 'درباره',
  projects: 'پروژه‌ها',
  services: 'خدمات',
  education: 'آموزش',
  contact: 'ارتباط با ما',
  brand: 'وب‌سایت',
  primaryNav: 'فهرست اصلی',
  footerNav: 'پیوندهای پابرگ',
  home: 'صفحه نخست',
  menu: 'فهرست',
  openMenu: 'باز کردن فهرست',
  closeMenu: 'بستن فهرست',
  close: 'بستن',
  revealMenu: 'نمایش فهرست',
  hideMenu: 'پنهان کردن فهرست',
  scroll: 'پیمایش',
  skip: 'رد کردن مقدمه',
  skipToContent: 'رفتن به محتوا',
  languageName: 'فارسی',
  switchTo: 'English',
  switchToShort: 'EN',
  switchLabel: 'نمایش نسخه انگلیسی',
  switchUnavailable: 'نسخه انگلیسی این صفحه منتشر نشده است؛ صفحه اصلی بخش باز می‌شود.',
  translationMissing: 'این صفحه هنوز به فارسی منتشر نشده است.',
  translationMissingLink: 'مشاهده نسخه انگلیسی',
  empty: 'محتوایی برای این بخش هنوز منتشر نشده است.',
  emptyProjects: 'هنوز پروژه‌ای منتشر نشده است.',
  emptyEducation: 'هنوز مطلب آموزشی منتشر نشده است.',
  emptyFilter: 'در این دسته پروژه‌ای یافت نشد.',
  all: 'همه',
  filterLabel: 'دسته‌بندی پروژه‌ها',
  backTo: 'بازگشت به',
  relatedProjects: 'پروژه‌های مرتبط',
  nextProjects: 'پروژه‌های دیگر',
  relatedEducation: 'مطالب مرتبط',
  nextEducation: 'مطالب دیگر',
  published: 'تاریخ انتشار',
  category: 'دسته',
  author: 'نویسنده',
  readMore: 'ادامه',
  view: 'مشاهده',
  projectIndex: 'شماره',
  openImage: 'نمایش بزرگ‌تر تصویر',
  imageOf: 'تصویر {n} از {total}',
  previous: 'قبلی',
  next: 'بعدی',
  play: 'پخش ویدئو',
  video: 'ویدئو',
  videoUnsupported: 'مرورگر شما پخش این ویدئو را پشتیبانی نمی‌کند.',
  downloadVideo: 'دریافت ویدئو',
  map: 'نقشه موقعیت دفتر',
  openMap: 'باز کردن در نقشه',
  address: 'نشانی',
  phone: 'تلفن',
  email: 'رایانامه',
  hours: 'ساعات کاری',
  office: 'دفتر',
  send: 'ارسال پیام',
  sending: 'در حال ارسال…',
  success: 'پیام شما دریافت شد. سپاس از تماس شما.',
  failure: 'ارسال پیام ممکن نشد. لطفاً دوباره تلاش کنید.',
  required: 'تکمیل این بخش الزامی است.',
  invalidEmail: 'نشانی رایانامه معتبر نیست.',
  invalidNumber: 'لطفاً یک عدد وارد کنید.',
  optional: 'اختیاری',
  formUnavailable: 'فرم تماس در حال حاضر در دسترس نیست.',
  notFoundTitle: 'صفحه پیدا نشد',
  notFoundBody: 'نشانی واردشده وجود ندارد یا این محتوا دیگر منتشر نمی‌شود.',
  errorTitle: 'مشکلی پیش آمد',
  errorBody: 'بارگذاری این صفحه ممکن نشد.',
  retry: 'تلاش دوباره',
  holdingTitle: 'این وب‌سایت موقتاً در دسترس نیست.',
  holdingBody: 'لطفاً بعداً دوباره سر بزنید.',
  backToTop: 'بازگشت به بالا',
  rights: '',
  mapAttribution: 'داده نقشه',
} as const

type Copy = { [K in keyof typeof fa]: string }

const en: Copy = {
  about: 'About',
  projects: 'Projects',
  services: 'Services',
  education: 'Education',
  contact: 'Contact Us',
  brand: 'Website',
  primaryNav: 'Primary navigation',
  footerNav: 'Footer links',
  home: 'Home',
  menu: 'Menu',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  close: 'Close',
  revealMenu: 'Show menu',
  hideMenu: 'Hide menu',
  scroll: 'Scroll',
  skip: 'Skip intro',
  skipToContent: 'Skip to content',
  languageName: 'English',
  switchTo: 'فارسی',
  switchToShort: 'فا',
  switchLabel: 'View the Persian version',
  switchUnavailable: 'This page is not published in Persian; the section index opens instead.',
  translationMissing: 'This page has not been published in English yet.',
  translationMissingLink: 'View the Persian version',
  empty: 'Nothing has been published in this section yet.',
  emptyProjects: 'No projects have been published yet.',
  emptyEducation: 'No education content has been published yet.',
  emptyFilter: 'No projects in this category.',
  all: 'All',
  filterLabel: 'Project categories',
  backTo: 'Back to',
  relatedProjects: 'Related projects',
  nextProjects: 'More projects',
  relatedEducation: 'Related articles',
  nextEducation: 'More articles',
  published: 'Published',
  category: 'Category',
  author: 'Author',
  readMore: 'Read',
  view: 'View',
  projectIndex: 'No.',
  openImage: 'Open larger image',
  imageOf: 'Image {n} of {total}',
  previous: 'Previous',
  next: 'Next',
  play: 'Play video',
  video: 'Video',
  videoUnsupported: 'Your browser cannot play this video.',
  downloadVideo: 'Download video',
  map: 'Office location map',
  openMap: 'Open in maps',
  address: 'Address',
  phone: 'Phone',
  email: 'Email',
  hours: 'Hours',
  office: 'Office',
  send: 'Send message',
  sending: 'Sending…',
  success: 'Thank you — your message has been received.',
  failure: 'The message could not be sent. Please try again.',
  required: 'This field is required.',
  invalidEmail: 'Please enter a valid email address.',
  invalidNumber: 'Please enter a number.',
  optional: 'Optional',
  formUnavailable: 'The contact form is currently unavailable.',
  notFoundTitle: 'Page not found',
  notFoundBody: 'This address does not exist, or the content is no longer published.',
  errorTitle: 'Something went wrong',
  errorBody: 'This page could not be loaded.',
  retry: 'Try again',
  holdingTitle: 'This website is temporarily unavailable.',
  holdingBody: 'Please check back later.',
  backToTop: 'Back to top',
  rights: '',
  mapAttribution: 'Map data',
}

export const copy: Record<Locale, Copy> = { fa, en }

export const t = (locale: Locale) => copy[locale]

/** Locale-prefixed site path. Persian (default) is unprefixed; `/en` for English. */
export function href(locale: Locale, path = ''): string {
  const clean = `/${path.replace(/^\/+|\/+$/g, '')}`
  return localeHref(clean === '/' ? '/' : clean, locale, DEFAULT_LOCALE)
}

export function sectionNumber(section: Section, locale: Locale): string {
  return toLocaleDigits(String(SECTIONS.indexOf(section) + 1).padStart(2, '0'), locale)
}

export function indexNumber(index: number, locale: Locale): string {
  return toLocaleDigits(String(index + 1).padStart(2, '0'), locale)
}

export function formatDate(value: string | null | undefined, locale: Locale): string {
  if (!value || Number.isNaN(Date.parse(value))) return ''
  return runtimeFormatDate(value, locale)
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}
