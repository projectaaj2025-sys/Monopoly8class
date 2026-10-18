import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, Check, Clock3, HelpCircle, Languages, Lightbulb, Loader2, Sparkles, X } from 'lucide-react';
import type { ActiveQuestion, Team } from '../types';
import { sfx } from '../lib/sound';
import { Modal, Pill } from './ui';
import { DOMAIN_META } from '../data/themes';
import { cellKindLabel, formatNumber } from '../game/engine';
import { QuestionChart } from './QuestionChart';
import { t, useLocale } from '../i18n'
import { translateList, type TranslateTarget } from '../lib/questionTranslate'
interface QuestionModalProps {
  open: boolean;
  active: ActiveQuestion | null;
  team: Team | null;
  ownerName?: string | null;
  onResolve: (correct: boolean, meta: {
    timedOut?: boolean;
    override?: boolean;
  }) => void;
  onSkip: () => void;
}
const KIND_TITLES: Record<string, string> = {
  topic: 'Вопрос по теме',
  formula: 'Знание формулы',
  problem: 'Расчётная задача',
  lab: 'Лаборатория',
  practice: 'Практика: реальная ситуация',
  question: 'Задание учителя',
  custom: 'Задание учителя'
};
export function QuestionModal({
  open,
  active,
  team,
  ownerName,
  onResolve,
  onSkip
}: QuestionModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const timerRef = useRef<number | null>(null);
  const { locale } = useLocale();
  const target: TranslateTarget | null = locale === 'en' ? 'en' : locale === 'kk' ? 'kk' : null;
  const [translated, setTranslated] = useState<{
    text: string;
    options: string[];
    explanation: string;
    answer: string;
  } | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState(false);
  const question = active?.question ?? null;
  const isOpen = !question?.options || question.options.length < 2;
  const correct = question && typeof question.correct === 'number' ? question.correct : null;
  const isCorrect = revealed && !isOpen ? selected !== null && selected === correct : false;
  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setRevealed(false);
    setTimedOut(false);
    setSeconds(60);
    setTranslated(null);
    setTranslateError(false);
    sfx.pop();
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          window.clearInterval(timerRef.current as number);
          return 0;
        }
        if (prev <= 5) sfx.warn();
        else if (prev <= 11) sfx.tick();
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [open, active?.question.id]);
  useEffect(() => {
    if (seconds === 0 && !revealed) {
      setRevealed(true);
      setTimedOut(true);
      sfx.wrong();
    }
  }, [seconds, revealed]);
  const domain = useMemo(() => {
    if (!active) return DOMAIN_META.methods;
    return DOMAIN_META[active.cell.domain] ?? DOMAIN_META.methods;
  }, [active]);
  const stopTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
  };
  const choose = (index: number) => {
    if (revealed || !question) return;
    setSelected(index);
    setRevealed(true);
    stopTimer();
    if (index === correct) sfx.correct();else sfx.wrong();
  };
  const reveal = () => {
    if (revealed) return;
    setRevealed(true);
    stopTimer();
    sfx.open();
  };
  const handleResolve = (value: boolean, override = false) => {
    if (value) sfx.correct();
    onResolve(value, {
      timedOut,
      override
    });
  };
  if (!active || !question || !team) return null;
  const runTranslation = async () => {
    if (!question || !target || translating) return;
    if (translated) {
      setTranslated(null);
      return;
    }
    setTranslating(true);
    setTranslateError(false);
    try {
      const [text, ...rest] = await translateList(
        [
          question.text,
          ...(question.options ?? []),
          question.explanation ?? '',
          question.answer ?? '',
        ],
        target,
      );
      const optionCount = question.options?.length ?? 0;
      setTranslated({
        text,
        options: rest.slice(0, optionCount),
        explanation: question.explanation ? rest[optionCount] : '',
        answer: question.answer ? rest[optionCount + (question.explanation ? 1 : 0)] : '',
      });
    } catch {
      setTranslateError(true);
    } finally {
      setTranslating(false);
    }
  };

  const points = active.points;
  const timeRatio = Math.max(0, Math.min(1, seconds / 60));
  const kindLabel = t(KIND_TITLES[active.source] ?? 'Вопрос');
  const rawCellTitle = active.cell.title;
  const cellTitle = /^[А-ЯЁA-Z0-9 .,:–-]+$/.test(rawCellTitle) ? rawCellTitle : t(rawCellTitle);
  return <Modal open={open} onClose={onSkip} size="lg" className="question-modal">
      <div className="question-head">
        <div className="question-head-main">
          <div className="question-tags">
            <Pill tone="neutral" className="question-category">
              <span className="dot" style={{
              background: domain.color
            }} />
              {t(active.cell.title)}
            </Pill>
            <Pill tone="info">{kindLabel}</Pill>
            {(active.cell.kind === 'lab' || active.cell.kind === 'practice') && <Pill tone="accent">{t("Повышенные баллы")}</Pill>}
          </div>
          <h2 className="question-team">{t("Отвечает")}{" "}<span className={team.color === 'red' ? 'question-team-name is-red' : 'question-team-name'}>{team.name}</span>
          </h2>
        </div>
        <div className="question-reward">
          <span className="reward-label">{t("за верный ответ")}</span>
          <strong>+{formatNumber(points)}</strong>
          <span className="reward-unit">{t("очков")}</span>
        </div>
      </div>

      <div className="question-timer">
        <div className="timer-meta">
          <Clock3 size={15} />
          <span>{revealed ? t("Ответ открыт") : seconds > 0 ? `${t("Осталось")} ${seconds} ${t("с")}` : t("Время вышло")}</span>
          {ownerName && <span className="owner-hint">
              <Sparkles size={14} />{" "}{t("Клетка команды «")}{ownerName}{t("» — перехват даст +50")}</span>}
        </div>
        <div className="timer-track">
          <div className={`timer-fill ${seconds <= 10 && !revealed ? 'is-low' : ''}`} style={{
          width: `${timeRatio * 100}%`
        }} />
        </div>
      </div>

      <div className="question-body">
        <div className="question-text">
          <span className="question-mark">?</span>
          <p>{translated?.text ?? question.text}</p>
        </div>
        {target && (
          <div className="question-translate">
            <button
              type="button"
              className={`btn btn--ghost btn--sm ${translated ? 'is-active' : ''}`}
              onClick={runTranslation}
              disabled={translating}
            >
              {translating ? <Loader2 size={14} className="spin" /> : <Languages size={14} />}
              {translating
                ? t("Переводим задание…")
                : translated
                  ? t("Показать оригинал")
                  : t("Перевести задание")}
            </button>
            {translated && <span className="question-translate-note">{t("машинный перевод")}</span>}
            {translateError && <span className="question-translate-note is-error">{t("Перевод недоступен — проверьте интернет")}</span>}
          </div>
        )}

        {question.chart && <QuestionChart spec={question.chart} />}

        {isOpen ? <div className="open-answer-area">
            {!revealed ? <div className="open-placeholder">
                <HelpCircle size={22} />
                <span>{t("Устный ответ. Нажмите «Показать ответ», когда команда ответит.")}</span>
              </div> : <div className={`answer-panel ${timedOut ? 'is-timeout' : ''}`}>
                <div className="answer-label">{t("Правильный ответ")}</div>
                <div className="answer-text">{translated?.answer ?? question.answer}</div>
                {question.explanation && <div className="answer-explanation">
                    <Lightbulb size={16} />
                    <span>{translated?.explanation || question.explanation}</span>
                  </div>}
              </div>}
            {revealed && <div className="teacher-mark">
                <span>{t("Учитель оценивает ответ:")}</span>
                <div className="teacher-mark-buttons">
                  <button type="button" className="btn btn--success" onClick={() => handleResolve(true)}>
                    <Check size={16} />{" "}{t("Верно")}</button>
                  <button type="button" className="btn btn--ghost" onClick={() => handleResolve(false)}>
                    <X size={16} />{" "}{t("Неверно")}</button>
                </div>
              </div>}
          </div> : <div className={`options-grid ${(question.options?.length ?? 0) > 4 ? 'options-grid--wide' : ''}`}>
            {question.options?.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const isRight = revealed && index === correct;
          const isWrong = revealed && index === selected && index !== correct;
          return <button key={`${option}-${index}`} type="button" className={`option option--animate ${isRight ? 'is-right' : ''} ${isWrong ? 'is-wrong' : ''} ${selected === index ? 'is-selected' : ''}`} style={{ '--option-i': index } as CSSProperties} onClick={() => choose(index)} disabled={revealed}>
                  <span className="option-letter">{isRight ? <Check size={15} /> : isWrong ? <X size={15} /> : letter}</span>
                  <span className="option-text">{translated?.options[index] ?? option}</span>
                </button>;
        })}
          </div>}

        {revealed && !isOpen && <div className={`result-banner ${isCorrect ? 'is-good' : 'is-bad'}`}>
            <span className="result-icon">{isCorrect ? <Check size={18} /> : <X size={18} />}</span>
            <div>
              <strong>
                {isCorrect ? `Верно! +${formatNumber(points)} очков` : timedOut ? t("Время вышло") : t("Неверный ответ")}
              </strong>
              {!isCorrect && correct !== null && <p>{t("Правильный ответ:")}{" "}<b>{translated?.options[correct] ?? question.options?.[correct]}</b>
                </p>}
              {question.explanation && <p>{translated?.explanation || question.explanation}</p>}
            </div>
          </div>}
      </div>

      <div className="question-footer">
        <button type="button" className="btn btn--ghost btn--quiet" onClick={onSkip}>{t("Пропустить вопрос")}</button>
        <div className="question-footer-actions">
          {!revealed && isOpen && <button type="button" className="btn btn--primary" onClick={reveal}>{t("Показать ответ")}{" "}<ArrowRight size={16} />
            </button>}
          {revealed && !isOpen && <>
              {!isCorrect && <button type="button" className="btn btn--ghost" onClick={() => handleResolve(true, true)}>{t("Засчитать как верный")}</button>}
              <button type="button" className="btn btn--primary" onClick={() => handleResolve(isCorrect)}>{t("Продолжить")}{" "}<ArrowRight size={16} />
              </button>
            </>}
        </div>
      </div>
    </Modal>;
}