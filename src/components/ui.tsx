import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Minus, Plus, X } from 'lucide-react'
import { sfx } from '../lib/sound'

interface ModalProps {
  open: boolean
  onClose?: () => void
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  closeOnBackdrop?: boolean
}

export function Modal({
  open,
  onClose,
  children,
  size = 'md',
  className = '',
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget && onClose) onClose()
      }}
    >
      <div className={`modal modal--${size} ${className}`} role="dialog" aria-modal="true">
        {onClose && (
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}

interface StepperProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  label?: string
  suffix?: string
}

export function Stepper({ value, min, max, onChange, label, suffix }: StepperProps) {
  return (
    <div className="stepper">
      {label && <span className="stepper-label">{label}</span>}
      <div className="stepper-controls">
        <button
          type="button"
          className="stepper-btn"
          disabled={value <= min}
          onClick={() => {
            sfx.tap()
            onChange(Math.max(min, value - 1))
          }}
          aria-label="Уменьшить"
        >
          <Minus size={15} />
        </button>
        <span className="stepper-value">
          {value}
          {suffix ? <small>{suffix}</small> : null}
        </span>
        <button
          type="button"
          className="stepper-btn"
          disabled={value >= max}
          onClick={() => {
            sfx.tap()
            onChange(Math.min(max, value + 1))
          }}
          aria-label="Увеличить"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? 'is-on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        sfx.tap()
        onChange(!checked)
      }}
    >
      <span className="toggle-knob" />
    </button>
  )
}

export function Pill({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'success' | 'danger' | 'info'
  className?: string
}) {
  return <span className={`pill pill--${tone} ${className}`}>{children}</span>
}

export function SectionTitle({
  eyebrow,
  title,
  hint,
  action,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  hint?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="section-title">
      <div className="section-title-main">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {hint && <p>{hint}</p>}
      </div>
      {action && <div className="section-title-action">{action}</div>}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}
