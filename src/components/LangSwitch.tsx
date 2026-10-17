import { LOCALE_OPTIONS, useLocale } from '../i18n'
import { sfx } from '../lib/sound'

export function LangSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale()
  return (
    <div className={`lang-switch ${compact ? 'lang-switch--compact' : ''}`} role="group" aria-label="Interface language">
      {LOCALE_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={locale === option.id ? 'is-active' : ''}
          onClick={() => {
            if (locale === option.id) return
            sfx.tap()
            setLocale(option.id)
          }}
          aria-pressed={locale === option.id}
          title={option.label}
        >
          {option.short}
        </button>
      ))}
    </div>
  )
}
