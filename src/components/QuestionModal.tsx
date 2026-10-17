import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, Clock3, HelpCircle, Lightbulb, Sparkles, X } from 'lucide-react'
import type { ActiveQuestion, Team } from '../types'
import { sfx } from '../lib/sound'
import { Modal, Pill } from './ui'
import { DOMAIN_META } from '../data/themes'
import { cellKindLabel, formatNumber } from '../game/engine'

interface QuestionModalProps {
  open: boolean
  active: ActiveQuestion | null
  team: Team | null
  ownerName?: string | null
  onResolve: (correct: boolean, meta: { timedOut?: boolean; override?: boolean }) => void
  onSkip: () => void
}

const KIND_TITLES: Record<string, string> = {
  topic: 'Вопрос по теме',
  formula: 'Знание формулы',
  problem: 'Расчётная задача',
  lab: 'Лаборатория',
  practice: 'Практика: реальная ситуация',
  question: 'Задание учителя',
  custom: 'Задание учителя',
}

export function QuestionModal({ open, active, team, ownerName, onResolve, onSkip }: QuestionModalProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [seconds, setSeconds] = useState(60)
  const timerRef = useRef<number | null>(null)

  const question = active?.question ?? null
  const isOpen = !question?.options || question.options.length < 2
  const correct = question && typeof question.correct === 'number' ? question.correct : null
  const isCorrect = revealed && !isOpen ? selected !== null && selected === correct : false

  useEffect(() => {
    if (!open) return
    setSelected(null)
    setRevealed(false)
    setTimedOut(false)
    setSeconds(60)
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerRef.current as number)
          return 0
        }
        if (prev <= 11) sfx.tick()
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [open, active?.question.id])

  useEffect(() => {
    if (seconds === 0 && !revealed) {
      setRevealed(true)
      setTimedOut(true)
      sfx.wrong()
    }
  }, [seconds, revealed])

  const domain = useMemo(() => {
    if (!active) return DOMAIN_META.methods
    return DOMAIN_META[active.cell.domain] ?? DOMAIN_META.methods
  }, [active])

  const stopTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
  }

  const choose = (index: number) => {
    if (revealed || !question) return
    setSelected(index)
    setRevealed(true)
    stopTimer()
    if (index === correct) sfx.correct()
    else sfx.wrong()
  }

  const reveal = () => {
    if (revealed) return
    setRevealed(true)
    stopTimer()
    sfx.open()
  }

  const handleResolve = (value: boolean, override = false) => {
    if (value) sfx.correct()
    onResolve(value, { timedOut, override })
  }

  if (!active || !question || !team) return null

  const points = active.points
  const timeRatio = Math.max(0, Math.min(1, seconds / 60))
  const kindLabel = KIND_TITLES[active.source] ?? 'Вопрос'

  return (
    <Modal open={open} onClose={onSkip} size="lg" className="question-modal">
      <div className="question-head">
        <div className="question-head-main">
          <div className="question-tags">
            <Pill tone="neutral" className="question-category">
              <span className="dot" style={{ background: domain.color }} />
              {active.cell.title}
            </Pill>
            <Pill tone="info">{kindLabel}</Pill>
            {(active.cell.kind === 'lab' || active.cell.kind === 'practice') && (
              <Pill tone="accent">Повышенные баллы</Pill>
            )}
          </div>
          <h2 className="question-team">
            Отвечает <span style={{ color: team.color === 'red' ? '#ff9bab' : '#9fc4ff' }}>{team.name}</span>
          </h2>
        </div>
        <div className="question-reward">
          <span className="reward-label">за верный ответ</span>
          <strong>+{formatNumber(points)}</strong>
          <span className="reward-unit">очков</span>
        </div>
      </div>

      <div className="question-timer">
        <div className="timer-meta">
          <Clock3 size={15} />
          <span>{revealed ? 'Ответ открыт' : seconds > 0 ? `Осталось ${seconds} с` : 'Время вышло'}</span>
          {ownerName && (
            <span className="owner-hint">
              <Sparkles size={14} /> Клетка команды «{ownerName}» — перехват даст +50
            </span>
          )}
        </div>
        <div className="timer-track">
          <div
            className={`timer-fill ${seconds <= 10 && !revealed ? 'is-low' : ''}`}
            style={{ width: `${timeRatio * 100}%` }}
          />
        </div>
      </div>

      <div className="question-body">
        <div className="question-text">
          <span className="question-mark">?</span>
          <p>{question.text}</p>
        </div>

        {isOpen ? (
          <div className="open-answer-area">
            {!revealed ? (
              <div className="open-placeholder">
                <HelpCircle size={22} />
                <span>Устный ответ. Нажмите «Показать ответ», когда команда ответит.</span>
              </div>
            ) : (
              <div className={`answer-panel ${timedOut ? 'is-timeout' : ''}`}>
                <div className="answer-label">Правильный ответ</div>
                <div className="answer-text">{question.answer}</div>
                {question.explanation && (
                  <div className="answer-explanation">
                    <Lightbulb size={16} />
                    <span>{question.explanation}</span>
                  </div>
                )}
              </div>
            )}
            {revealed && (
              <div className="teacher-mark">
                <span>Учитель оценивает ответ:</span>
                <div className="teacher-mark-buttons">
                  <button type="button" className="btn btn--success" onClick={() => handleResolve(true)}>
                    <Check size={16} /> Верно
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => handleResolve(false)}>
                    <X size={16} /> Неверно
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`options-grid ${(question.options?.length ?? 0) > 4 ? 'options-grid--wide' : ''}`}>
            {question.options?.map((option, index) => {
              const letter = String.fromCharCode(65 + index)
              const isRight = revealed && index === correct
              const isWrong = revealed && index === selected && index !== correct
              return (
                <button
                  key={`${option}-${index}`}
                  type="button"
                  className={`option ${isRight ? 'is-right' : ''} ${isWrong ? 'is-wrong' : ''} ${
                    selected === index ? 'is-selected' : ''
                  }`}
                  onClick={() => choose(index)}
                  disabled={revealed}
                >
                  <span className="option-letter">{isRight ? <Check size={15} /> : isWrong ? <X size={15} /> : letter}</span>
                  <span className="option-text">{option}</span>
                </button>
              )
            })}
          </div>
        )}

        {revealed && !isOpen && (
          <div className={`result-banner ${isCorrect ? 'is-good' : 'is-bad'}`}>
            <span className="result-icon">{isCorrect ? <Check size={18} /> : <X size={18} />}</span>
            <div>
              <strong>
                {isCorrect
                  ? `Верно! +${formatNumber(points)} очков`
                  : timedOut
                    ? 'Время вышло'
                    : 'Неверный ответ'}
              </strong>
              {!isCorrect && correct !== null && (
                <p>
                  Правильный ответ: <b>{question.options?.[correct]}</b>
                </p>
              )}
              {question.explanation && <p>{question.explanation}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="question-footer">
        <button type="button" className="btn btn--ghost btn--quiet" onClick={onSkip}>
          Пропустить вопрос
        </button>
        <div className="question-footer-actions">
          {!revealed && isOpen && (
            <button type="button" className="btn btn--primary" onClick={reveal}>
              Показать ответ <ArrowRight size={16} />
            </button>
          )}
          {revealed && !isOpen && (
            <>
              {!isCorrect && (
                <button type="button" className="btn btn--ghost" onClick={() => handleResolve(true, true)}>
                  Засчитать как верный
                </button>
              )}
              <button type="button" className="btn btn--primary" onClick={() => handleResolve(isCorrect)}>
                Продолжить <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
