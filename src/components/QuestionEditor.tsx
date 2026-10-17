import { useEffect, useState } from 'react';
import { Check, CircleHelp, Plus, Trash2 } from 'lucide-react';
import type { CustomQuestion } from '../types';
import { Modal } from './ui';
import { sfx } from '../lib/sound';
import { t } from '../i18n'
interface QuestionEditorProps {
  open: boolean;
  question: CustomQuestion | null;
  categories: string[];
  onSave: (question: CustomQuestion) => void;
  onClose: () => void;
}
type AnswerType = 'choice' | 'open';
const POINT_OPTIONS = [50, 100, 150, 200, 250, 300];
export function QuestionEditor({
  open,
  question,
  categories,
  onSave,
  onClose
}: QuestionEditorProps) {
  const [type, setType] = useState<AnswerType>('choice');
  const [category, setCategory] = useState('');
  const [text, setText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correct, setCorrect] = useState(0);
  const [answer, setAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [points, setPoints] = useState(100);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!open || !question) return;
    const hasOptions = Array.isArray(question.options) && question.options.length >= 2;
    setType(hasOptions ? 'choice' : 'open');
    setCategory(question.category ?? '');
    setText(question.text);
    setOptions(hasOptions ? [...(question.options as string[]), '', '', '', ''].slice(0, 4) : ['', '', '', '']);
    setCorrect(typeof question.correct === 'number' ? question.correct : 0);
    setAnswer(question.answer ?? '');
    setExplanation(question.explanation ?? '');
    setPoints(question.points || 100);
    setErrors({});
  }, [open, question]);
  const setOption = (index: number, value: string) => {
    setOptions(prev => prev.map((item, i) => i === index ? value : item));
    setErrors(prev => ({
      ...prev,
      options: '',
      correct: ''
    }));
  };
  const submit = () => {
    if (!question) return;
    const nextErrors: Record<string, string> = {};
    if (!text.trim()) nextErrors.text = t("Напишите текст задания");
    if (!category.trim()) nextErrors.category = t("Укажите категорию");
    let finalOptions: string[] | undefined;
    let finalCorrect: number | undefined;
    let finalAnswer = answer.trim();
    if (type === 'choice') {
      const filled = options.map((value, index) => ({
        value: value.trim(),
        index
      })).filter(item => item.value.length > 0);
      if (filled.length < 2) nextErrors.options = t("Заполните минимум два варианта ответа");
      const correctFilledIndex = filled.findIndex(item => item.index === correct);
      if (filled.length >= 2 && correctFilledIndex === -1) {
        nextErrors.correct = t("Отметьте верный вариант — он не должен быть пустым");
      }
      if (Object.keys(nextErrors).length === 0) {
        finalOptions = filled.map(item => item.value);
        finalCorrect = correctFilledIndex;
        finalAnswer = finalOptions[correctFilledIndex];
      }
    } else if (!finalAnswer) {
      nextErrors.answer = t("Напишите правильный ответ");
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      sfx.wrong();
      return;
    }
    const next: CustomQuestion = {
      ...question,
      category: category.trim(),
      text: text.trim(),
      options: finalOptions,
      correct: finalCorrect,
      answer: finalAnswer,
      explanation: explanation.trim(),
      points
    };
    sfx.correct();
    onSave(next);
  };
  if (!question) return null;
  return <Modal open={open} onClose={onClose} size="lg" className="question-editor">
      <div className="editor-head">
        <div>
          <div className="eyebrow">
            <CircleHelp size={13} /> {question.text ? t("Редактирование задания") : t("Новое задание")}
          </div>
          <h2>{t("Составьте вопрос")}</h2>
          <p>{t("Можно выбрать тест с вариантами или открытый ответ для устной работы.")}</p>
        </div>
        <div className="editor-points">
          <span>{t("Баллы")}</span>
          <div className="points-picker">
            {POINT_OPTIONS.map(value => <button key={value} type="button" className={points === value ? 'is-active' : ''} onClick={() => {
            sfx.tap();
            setPoints(value);
          }}>
                {value}
              </button>)}
          </div>
        </div>
      </div>

      <div className="editor-grid">
        <label className="field">
          <span className="field-label">{t("Категория")}</span>
          <input list="builder-categories" value={category} onChange={event => {
          setCategory(event.target.value);
          setErrors(prev => ({
            ...prev,
            category: ''
          }));
        }} placeholder={t("Например, Механика")} autoFocus />
          <datalist id="builder-categories">
            {categories.map(item => <option key={item} value={item} />)}
          </datalist>
          {errors.category && <span className="field-error">{errors.category}</span>}
        </label>

        <div className="field">
          <span className="field-label">{t("Тип задания")}</span>
          <div className="type-switch">
            <button type="button" className={type === 'choice' ? 'is-active' : ''} onClick={() => {
            sfx.tap();
            setType('choice');
          }}>{t("Тест с вариантами")}</button>
            <button type="button" className={type === 'open' ? 'is-active' : ''} onClick={() => {
            sfx.tap();
            setType('open');
          }}>{t("Открытый ответ")}</button>
          </div>
        </div>
      </div>

      <label className="field">
        <span className="field-label">{t("Текст задания")}</span>
        <textarea value={text} onChange={event => {
        setText(event.target.value);
        setErrors(prev => ({
          ...prev,
          text: ''
        }));
      }} rows={3} placeholder={t("Например: Чему равна сила тяжести, действующая на тело массой 2 кг?")} />
        {errors.text && <span className="field-error">{errors.text}</span>}
      </label>

      {type === 'choice' ? <div className="field">
          <span className="field-label">{t("Варианты ответа")}{" "}<small>{t("отметьте верный кружком")}</small>
          </span>
          <div className="option-editor">
            {options.map((option, index) => <div key={index} className={`option-editor-row ${correct === index ? 'is-correct' : ''}`}>
                <button type="button" className={`option-radio ${correct === index ? 'is-on' : ''}`} onClick={() => {
            setCorrect(index);
            setErrors(prev => ({
              ...prev,
              correct: ''
            }));
          }} aria-label={`${t("Сделать вариант")} ${index + 1} ${t("верным")}`}>
                  {correct === index ? <Check size={13} /> : String.fromCharCode(65 + index)}
                </button>
                <input value={option} onChange={event => setOption(index, event.target.value)} placeholder={`${t("Вариант")} ${String.fromCharCode(65 + index)}`} />
                {options.length > 2 && <button type="button" className="option-remove" onClick={() => {
            setOptions(prev => {
              const next = prev.filter((_, i) => i !== index);
              if (correct >= next.length) setCorrect(0);
              return next;
            });
          }} aria-label={t("Удалить вариант")}>
                    <Trash2 size={14} />
                  </button>}
              </div>)}
            {options.length < 6 && <button type="button" className="option-add" onClick={() => setOptions(prev => [...prev, ''])}>
                <Plus size={14} />{" "}{t("Добавить вариант")}</button>}
          </div>
          {errors.options && <span className="field-error">{errors.options}</span>}
          {errors.correct && <span className="field-error">{errors.correct}</span>}
        </div> : <label className="field">
          <span className="field-label">{t("Правильный ответ")}</span>
          <input value={answer} onChange={event => {
        setAnswer(event.target.value);
        setErrors(prev => ({
          ...prev,
          answer: ''
        }));
      }} placeholder={t("Ответ, который увидит учитель после таймера")} />
          {errors.answer && <span className="field-error">{errors.answer}</span>}
        </label>}

      <label className="field">
        <span className="field-label">{t("Пояснение")}{" "}<small>{t("необязательно — покажем после ответа")}</small>
        </span>
        <textarea value={explanation} onChange={event => setExplanation(event.target.value)} rows={2} placeholder={t("Короткое объяснение или формула, на которую опирается ответ")} />
      </label>

      <div className="editor-footer">
        <span className="editor-hint">{t("Задание можно изменить в любой момент.")}</span>
        <div className="editor-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>{t("Отмена")}</button>
          <button type="button" className="btn btn--primary" onClick={submit}>
            <Check size={16} />{" "}{t("Сохранить задание")}</button>
        </div>
      </div>
    </Modal>;
}