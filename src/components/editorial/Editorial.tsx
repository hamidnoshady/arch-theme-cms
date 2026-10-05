import Link from 'next/link'

/** Title block shared by every interior page; the title is always the first major element. */
export function PageTitle({
  number,
  eyebrow,
  eyebrowHref,
  title,
  lead,
  children,
}: {
  number?: string
  eyebrow?: string
  eyebrowHref?: string
  title: string
  lead?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <header className="page-title" data-reveal="">
      <span className="rule rule--marked" aria-hidden="true" />
      <div className="page-title__grid">
        {number || eyebrow ? (
          <p className="page-title__eyebrow">
            {number ? <span className="num">{number}</span> : null}
            {eyebrow ? (
              eyebrowHref ? (
                <Link className="text-link" href={eyebrowHref}>
                  {eyebrow}
                </Link>
              ) : (
                <span>{eyebrow}</span>
              )
            ) : null}
          </p>
        ) : null}
        <h1 className="page-title__heading text-title">{title}</h1>
        {lead ? <div className="page-title__lead">{lead}</div> : null}
        {children ? <div className="page-title__extra">{children}</div> : null}
      </div>
    </header>
  )
}

/** Numbered editorial section heading used by blocks, related content and services. */
export function SectionHeading({
  number,
  title,
  intro,
  as: Tag = 'h2',
}: {
  number?: string
  title?: string | null
  intro?: string | null
  as?: 'h2' | 'h3'
}) {
  if (!title && !intro) return null
  return (
    <div className="section-heading" data-reveal="">
      <span className="rule" aria-hidden="true" />
      <div className="section-heading__grid">
        {number ? <span className="num section-heading__number">{number}</span> : <span />}
        <div>
          {title ? <Tag className="section-heading__title">{title}</Tag> : null}
          {intro ? <p className="section-heading__intro">{intro}</p> : null}
        </div>
      </div>
    </div>
  )
}

export type MetaItem = { label: string; value: React.ReactNode }

export function MetaList({ items, className = '' }: { items: MetaItem[]; className?: string }) {
  if (!items.length) return null
  return (
    <dl className={`meta-list ${className}`} data-reveal="">
      {items.map((item) => (
        <div className="meta-list__item" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export type StateAction = { href: string; label: string; hrefLang?: string }

/** A state a visitor can act on: every empty state offers somewhere useful to go next. */
function Actions({ actions }: { actions?: StateAction[] }) {
  if (!actions?.length) return null
  return (
    <ul className="state-actions" role="list">
      {actions.map((action) => (
        <li key={action.href}>
          <Link className="text-link" href={action.href} hrefLang={action.hrefLang} lang={action.hrefLang}>
            {action.label} <span className="arrow" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function EmptyState({ children, actions }: { children: React.ReactNode; actions?: StateAction[] }) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-state__mark" aria-hidden="true" />
      <p>{children}</p>
      <Actions actions={actions} />
    </div>
  )
}

/** Section anchors for a long entry; links move focus with the scoped smooth scroll. */
export function Toc({ title, anchors }: { title: string; anchors: { id: string; text: string }[] }) {
  if (!anchors.length) return null
  return (
    <nav className="toc" aria-label={title} data-reveal="">
      <p className="toc__title">{title}</p>
      <ol className="toc__list">
        {anchors.map((anchor) => (
          <li key={anchor.id}>
            <a className="toc__link" href={`#${anchor.id}`}>
              {anchor.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** The continuation into a conversation: only rendered when the site has a contact page in this locale. */
export function Inquiry({ title, body, action }: { title: string; body: string; action: StateAction }) {
  return (
    <section className="inquiry" aria-label={title} data-reveal="">
      <span className="rule rule--marked" aria-hidden="true" />
      <div className="inquiry__grid">
        <h2 className="inquiry__title">{title}</h2>
        <p className="inquiry__body">{body}</p>
        <Link className="button" href={action.href}>
          <span>{action.label}</span>
          <span className="arrow" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

export function Notice({ children, actions }: { children: React.ReactNode; actions?: StateAction[] }) {
  return (
    <div className="notice" role="status">
      <p>{children}</p>
      <Actions actions={actions} />
    </div>
  )
}
