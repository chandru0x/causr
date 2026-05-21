import './UnderDevelopmentPanel.css'

export type UnderDevelopmentPanelProps = {
  title: string
  description: string
  badge?: string
}

export function UnderDevelopmentPanel({
  title,
  description,
  badge = 'Coming soon',
}: UnderDevelopmentPanelProps) {
  return (
    <div className="under-dev" role="status" aria-label={title}>
      <div className="under-dev__card">
        <span className="under-dev__badge">{badge}</span>
        <span className="material-symbols-outlined under-dev__icon" aria-hidden>
          engineering
        </span>
        <h2 className="under-dev__title">{title}</h2>
        <p className="under-dev__description">{description}</p>
      </div>
    </div>
  )
}
