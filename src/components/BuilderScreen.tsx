import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleHelp, Download, FileSpreadsheet, FileUp, Layers, ListChecks, Pencil, Play, Plus, Save, Search, Sparkles, Trash2, Upload, Wand2, X } from 'lucide-react';
import type { CustomBoard, CustomQuestion, ThemeId } from '../types';
import { THEMES, THEME_ICON } from '../data/themes';
import { buildCustomBoard, pluralize, RING_SIZE, uid } from '../game/engine';
import { downloadFile, parseQuestionsCsv, questionsToCsv, sampleQuestions } from '../data/storage';
import { gridPosition, tileBackground } from './Board';
import { Modal } from './ui';
import { QuestionEditor } from './QuestionEditor';
import { Icon } from './Icon';
import { sfx } from '../lib/sound';
import { t } from '../i18n'
const EMOJI_CHOICES = ['⚛️', '🧠', '⚡', '🚀', '🔬', '🧪', '🌍', '🔭', '💡', '🧲', '🎲', '🏆', '📚', '🪐', '🌈', '🎯'];
const THEME_ORDER: ThemeId[] = ['g7', 'g8', 'g9', 'g10', 'g11', 'review'];
interface BuilderScreenProps {
  board: CustomBoard;
  isNew: boolean;
  onBack: () => void;
  onSave: (board: CustomBoard, play: boolean) => void;
  onShowRules: () => void;
}
const cloneBoard = (board: CustomBoard): CustomBoard => ({
  ...board,
  questions: board.questions.map(question => ({
    ...question,
    options: question.options ? [...question.options] : undefined
  }))
});
export function BuilderScreen({
  board,
  isNew,
  onBack,
  onSave,
  onShowRules
}: BuilderScreenProps) {
  const [draft, setDraft] = useState<CustomBoard>(() => cloneBoard(board));
  const [editorQuestion, setEditorQuestion] = useState<CustomQuestion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomQuestion | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [nameError, setNameError] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const categories = useMemo(() => [...new Set(draft.questions.map(question => question.category).filter(Boolean))], [draft.questions]);
  const parsed = useMemo(() => parseQuestionsCsv(csvText), [csvText]);
  const ring = useMemo(() => buildCustomBoard(draft), [draft]);
  const theme = THEMES[draft.theme] ?? THEMES.g7;
  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return draft.questions.filter(question => {
      const matchesCategory = !categoryFilter || question.category === categoryFilter;
      const matchesQuery = !query || question.text.toLowerCase().includes(query) || question.category.toLowerCase().includes(query) || question.answer.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [draft.questions, search, categoryFilter]);
  const allAnswered = draft.questions.every(question => question.options && question.options.length >= 2 ? typeof question.correct === 'number' && Boolean(question.options[question.correct]) : Boolean(question.answer.trim()));
  const canPlay = draft.questions.length > 0 && Boolean(draft.name.trim());
  const updateDraft = (patch: Partial<CustomBoard>) => {
    setDraft(prev => ({
      ...prev,
      ...patch,
      updatedAt: Date.now()
    }));
  };
  const showFlash = (text: string) => {
    setFlash(text);
    window.setTimeout(() => setFlash(null), 2600);
  };
  const saveBoard = (play: boolean) => {
    if (!draft.name.trim()) {
      setNameError(true);
      nameRef.current?.focus();
      sfx.wrong();
      return;
    }
    if (play && draft.questions.length === 0) {
      showFlash(t("Добавьте хотя бы одно задание, чтобы играть"));
      return;
    }
    const saved: CustomBoard = {
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      updatedAt: Date.now(),
      isSample: false
    };
    sfx.open();
    onSave(saved, play);
  };
  const openNewQuestion = () => {
    sfx.tap();
    setEditorQuestion({
      id: uid('cq'),
      kind: 'custom',
      source: 'custom',
      category: categoryFilter ?? categories[0] ?? t("Мои задания"),
      text: '',
      options: ['', '', '', ''],
      correct: 0,
      answer: '',
      explanation: '',
      points: 100
    });
  };
  const saveQuestion = (question: CustomQuestion) => {
    setDraft(prev => {
      const exists = prev.questions.some(item => item.id === question.id);
      return {
        ...prev,
        updatedAt: Date.now(),
        questions: exists ? prev.questions.map(item => item.id === question.id ? question : item) : [...prev.questions, question]
      };
    });
    setEditorQuestion(null);
    showFlash(t("Задание сохранено"));
  };
  const removeQuestion = () => {
    if (!deleteTarget) return;
    setDraft(prev => ({
      ...prev,
      updatedAt: Date.now(),
      questions: prev.questions.filter(item => item.id !== deleteTarget.id)
    }));
    setDeleteTarget(null);
    showFlash(t("Задание удалено"));
  };
  const importQuestions = () => {
    if (parsed.questions.length === 0) return;
    setDraft(prev => ({
      ...prev,
      updatedAt: Date.now(),
      questions: [...prev.questions, ...parsed.questions]
    }));
    setImportOpen(false);
    setCsvText('');
    showFlash(`${t("Добавлено заданий:")} ${parsed.questions.length}`);
  };
  const readFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ''));
    reader.readAsText(file);
  };
  const downloadTemplate = () => {
    downloadFile('shablon-zadaniy-fizika-poli.csv', questionsToCsv(sampleQuestions.slice(0, 3)));
  };
  const checklist = [{
    ok: Boolean(draft.name.trim()),
    label: t("Название монополии заполнено")
  }, {
    ok: draft.questions.length > 0,
    label: t("Добавлено хотя бы одно задание")
  }, {
    ok: categories.length >= 2,
    label: t("Не меньше двух категорий на поле")
  }, {
    ok: allAnswered,
    label: t("У всех заданий указан верный ответ")
  }];
  return <div className="builder-page">
      <div className="builder-head">
        <div className="builder-head-left">
          <button type="button" className="back-link" onClick={onBack}>
            <ArrowLeft size={15} />{" "}{t("Мои монополии")}</button>
          <div className="builder-title-row">
            <span className="builder-emoji">
              <Icon name={THEME_ICON[draft.theme] ?? 'Atom'} size={24} />
            </span>
            <div>
              <div className="page-eyebrow">
                <Wand2 size={14} /> {isNew ? t("Новая монополия") : t("Редактирование монополии")}
              </div>
              <h1>{draft.name.trim() || t("Без названия")}</h1>
            </div>
          </div>
        </div>
        <div className="builder-head-actions">
          <button type="button" className="btn btn--ghost" onClick={onShowRules}>
            <CircleHelp size={16} />{" "}{t("Подсказки")}</button>
          <button type="button" className="btn btn--ghost" onClick={() => saveBoard(false)}>
            <Save size={16} />{" "}{t("Сохранить")}</button>
          <button type="button" className="btn btn--primary" onClick={() => saveBoard(true)} disabled={!canPlay}>
            <Play size={16} />{" "}{t("Играть")}</button>
        </div>
      </div>

      {flash && <div className="builder-flash">
          <Check size={15} /> {flash}
        </div>}

      <div className="builder-grid">
        <div className="builder-main">
          <section className="panel builder-section">
            <div className="builder-section-head">
              <span className="step-num">1</span>
              <div>
                <h2>{t("Оформление")}</h2>
                <p>{t("Название, эмодзи и дизайн будущего поля.")}</p>
              </div>
            </div>

            <div className="builder-fields">
              <label className="field">
                <span className="field-label">{t("Название монополии")}</span>
                <input ref={nameRef} value={draft.name} onChange={event => {
                updateDraft({
                  name: event.target.value
                });
                setNameError(false);
              }} placeholder={t("Например, Физика вокруг нас")} maxLength={48} className={nameError ? 'has-error' : ''} />
                {nameError && <span className="field-error">{t("Придумайте название — оно нужно для сохранения")}</span>}
              </label>

              <label className="field">
                <span className="field-label">{t("Короткое описание")}{" "}<small>{t("необязательно")}</small>
                </span>
                <input value={draft.description} onChange={event => updateDraft({
                description: event.target.value
              })} placeholder={t("Например: итоговая игра для 8 класса по электричеству")} maxLength={140} />
              </label>
            </div>

            <div className="field">
              <span className="field-label">{t("Значок монополии")}{" "}<small>{t("для своего оформления")}</small>
              </span>
              <div className="emoji-picker">
                {EMOJI_CHOICES.map(emoji => <button key={emoji} type="button" className={draft.emoji === emoji ? 'is-active' : ''} onClick={() => {
                sfx.tap();
                updateDraft({
                  emoji
                });
              }} aria-label={`Эмодзи ${emoji}`}>
                    {emoji}
                  </button>)}
              </div>
            </div>

            <div className="field">
              <span className="field-label">{t("Дизайн поля")}</span>
              <div className="theme-picker">
                {THEME_ORDER.map(themeId => {
                const item = THEMES[themeId];
                return <button key={themeId} type="button" className={`theme-swatch ${draft.theme === themeId ? 'is-active' : ''}`} onClick={() => {
                  sfx.tap();
                  updateDraft({
                    theme: themeId
                  });
                }} style={{
                  '--swatch-a': item.frameA,
                  '--swatch-b': item.frameB,
                  '--swatch-accent': item.accent
                } as CSSProperties}>
                      <span className="theme-swatch-dot" />
                      <span className="theme-swatch-name">{t(item.name)}</span>
                      <span className="theme-swatch-grade">{t(item.gradeLabel)}</span>
                      {draft.theme === themeId && <span className="theme-swatch-check">
                          <Check size={12} />
                        </span>}
                    </button>;
              })}
              </div>
            </div>
          </section>

          <section className="panel builder-section">
            <div className="builder-section-head">
              <span className="step-num">2</span>
              <div>
                <h2>{t("Задания и категории")}</h2>
                <p>{t("Категории станут клетками поля. Внутри категорий — ваши вопросы.")}</p>
              </div>
              <div className="builder-section-actions">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setImportOpen(true)}>
                  <FileUp size={15} />{" "}{t("Импорт CSV")}</button>
                <button type="button" className="btn btn--primary btn--sm" onClick={openNewQuestion}>
                  <Plus size={16} />{" "}{t("Добавить задание")}</button>
              </div>
            </div>

            <div className="builder-toolbar">
              <div className="search-field search-field--sm">
                <Search size={15} />
                <input value={search} onChange={event => setSearch(event.target.value)} placeholder={t("Поиск по заданиям")} aria-label={t("Поиск по заданиям")} />
                {search && <button type="button" onClick={() => setSearch('')} aria-label={t("Очистить")}>
                    <X size={14} />
                  </button>}
              </div>
              <div className="category-filters">
                <button type="button" className={!categoryFilter ? 'is-active' : ''} onClick={() => setCategoryFilter(null)}>{t("Все")}{" "}<span>{draft.questions.length}</span>
                </button>
                {categories.map(category => {
                const count = draft.questions.filter(question => question.category === category).length;
                return <button key={category} type="button" className={categoryFilter === category ? 'is-active' : ''} onClick={() => setCategoryFilter(category)}>
                      {category} <span>{count}</span>
                    </button>;
              })}
              </div>
            </div>

            {draft.questions.length === 0 ? <div className="builder-empty">
                <div className="builder-empty-icon">
                  <ListChecks size={28} />
                </div>
                <h3>{t("Добавьте первое задание")}</h3>
                <p>{t("Придумайте категорию — например «Механика» — и добавьте в неё вопросы. Можно вставить готовый список из CSV.")}</p>
                <div className="builder-empty-actions">
                  <button type="button" className="btn btn--primary" onClick={openNewQuestion}>
                    <Plus size={16} />{" "}{t("Добавить задание")}</button>
                  <button type="button" className="btn btn--ghost" onClick={() => setImportOpen(true)}>
                    <FileSpreadsheet size={16} />{" "}{t("Импорт из CSV")}</button>
                </div>
              </div> : <div className="question-list">
                {filteredQuestions.map((question, index) => <div key={question.id} className="question-row">
                    <span className="question-number">{index + 1}</span>
                    <div className="question-row-main">
                      <span className="question-row-cat">{question.category}</span>
                      <p>{question.text}</p>
                      <span className="question-row-answer">
                        <Check size={12} /> {question.answer || t("ответ не указан")}
                      </span>
                    </div>
                    <div className="question-row-side">
                      <span className="question-type">
                        {question.options && question.options.length >= 2 ? t("тест") : t("открытый")}
                      </span>
                      <span className="question-points">{question.points}{" "}{t("б.")}</span>
                    </div>
                    <div className="question-row-actions">
                      <button type="button" className="icon-btn icon-btn--ghost" onClick={() => setEditorQuestion(question)} aria-label={t("Изменить вопрос")}>
                        <Pencil size={15} />
                      </button>
                      <button type="button" className="icon-btn icon-btn--ghost icon-btn--danger" onClick={() => setDeleteTarget(question)} aria-label={t("Удалить вопрос")}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>)}
                {filteredQuestions.length === 0 && <div className="topics-empty">
                    <Search size={20} />
                    <p>{t("Задания не найдены. Измените запрос или категорию.")}</p>
                  </div>}
              </div>}
          </section>

          <section className="panel builder-section builder-section--check">
            <div className="builder-section-head">
              <span className="step-num">3</span>
              <div>
                <h2>{t("Проверка перед запуском")}</h2>
                <p>{t("Чем больше категорий, тем интереснее поле.")}</p>
              </div>
              <button type="button" className="btn btn--ghost btn--sm" onClick={downloadTemplate}>
                <Download size={15} />{" "}{t("Шаблон CSV")}</button>
            </div>
            <div className="checklist">
              {checklist.map(item => <div key={item.label} className={`check-row ${item.ok ? 'is-ok' : ''}`}>
                  <span className="check-mark">{item.ok ? <Check size={13} /> : <X size={13} />}</span>
                  {item.label}
                </div>)}
            </div>
          </section>
        </div>

        <aside className="builder-aside">
          <div className="panel builder-preview">
            <div className="ticket-eyebrow">
              <Sparkles size={13} />{" "}{t("Живой предпросмотр")}</div>
            <h2>{draft.name.trim() || t("Ваша монополия")}</h2>
            <p className="builder-preview-sub">
              {draft.description.trim() || t("Описание появится на карточке игры")}
            </p>

            <div className="builder-mini-wrap" style={{
            '--accent': theme.accent,
            '--accent-2': theme.accent2,
            '--frame-a': theme.frameA,
            '--frame-b': theme.frameB,
            '--board-bg': theme.boardBg,
            '--page-glow': theme.pageGlow
          } as CSSProperties}>
              <div className="builder-mini">
                {ring.map(cell => {
                const pos = gridPosition(cell.index);
                return <span key={cell.index} style={{
                  gridRow: pos.gridRow,
                  gridColumn: pos.gridColumn,
                  background: tileBackground(cell, theme)
                }} />;
              })}
                <div className="builder-mini-center">
                  <span>
                    <Icon name={THEME_ICON[draft.theme] ?? 'Atom'} size={24} />
                  </span>
                  <b>{draft.name.trim() || t("ФИЗИКА-ПОЛИ")}</b>
                  <small>
                    {RING_SIZE}{" "}{t("клеток ·")}{" "}{draft.questions.length}{" "}{t("заданий")}</small>
                </div>
              </div>
            </div>

            <div className="builder-preview-stats">
              <div>
                <Layers size={16} />
                <span>
                  <b>{categories.length}</b>{' '}
                  {pluralize(categories.length, 'категория', 'категории', 'категорий')}
                </span>
              </div>
              <div>
                <ListChecks size={16} />
                <span>
                  <b>{draft.questions.length}</b>{' '}
                  {pluralize(draft.questions.length, 'задание', 'задания', 'заданий')}
                </span>
              </div>
              <div>
                <Icon name="FlaskConical" size={16} />
                <span>
                  <b>{categories[0] ?? t("свои")}</b>
                  {categories.length > 1 ? ` и ещё ${categories.length - 1}` : t(" · своя тема")}
                </span>
              </div>
            </div>

            <div className="builder-cat-list">
              {categories.length === 0 ? <span className="builder-cat-empty">{t("Категории появятся вместе с заданиями")}</span> : categories.map(category => {
              const count = draft.questions.filter(question => question.category === category).length;
              return <span key={category} className="builder-cat">
                      {category} <b>{count}</b>
                    </span>;
            })}
            </div>

            <div className="builder-preview-actions">
              <button type="button" className="btn btn--ghost" onClick={() => saveBoard(false)}>
                <Save size={16} />{" "}{t("Сохранить")}</button>
              <button type="button" className="start-btn start-btn--sm" onClick={() => saveBoard(true)} disabled={!canPlay}>
                <span>{t("Играть")}<small>
                    {draft.questions.length} {pluralize(draft.questions.length, 'задание', 'задания', 'заданий')}
                  </small>
                </span>
                <ArrowRight size={18} />
              </button>
            </div>
            {!canPlay && <p className="builder-preview-note">
                {!draft.name.trim() ? t("Придумайте название, чтобы сохранить игру.") : t("Добавьте хотя бы одно задание.")}
              </p>}
          </div>
        </aside>
      </div>

      <QuestionEditor open={Boolean(editorQuestion)} question={editorQuestion} categories={categories} onSave={saveQuestion} onClose={() => setEditorQuestion(null)} />

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} size="sm" className="confirm-modal">
        <div className="confirm-icon confirm-icon--danger">
          <Trash2 size={24} />
        </div>
        <h2>{t("Удалить задание?")}</h2>
        <p>{deleteTarget?.text}</p>
        <div className="confirm-actions">
          <button type="button" className="btn btn--ghost" onClick={() => setDeleteTarget(null)}>{t("Отмена")}</button>
          <button type="button" className="btn btn--danger" onClick={removeQuestion}>
            <Trash2 size={16} />{" "}{t("Удалить")}</button>
        </div>
      </Modal>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} size="lg" className="import-modal">
        <div className="editor-head">
          <div>
            <div className="eyebrow">
              <FileSpreadsheet size={13} />{" "}{t("Массовый импорт")}</div>
            <h2>{t("Задания из CSV")}</h2>
            <p>{t("Каждая строка — одно задание. Скачайте шаблон, заполните и загрузите файл или вставьте текст.")}</p>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={downloadTemplate}>
            <Download size={15} />{" "}{t("Шаблон")}</button>
        </div>

        <div className="import-upload">
          <label className="import-file">
            <Upload size={18} />
            <span>{t("Выбрать CSV-файл")}</span>
            <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" onChange={event => readFile(event.target.files?.[0])} />
          </label>
          <span className="import-or">{t("или вставьте текст")}</span>
        </div>

        <textarea className="import-textarea" value={csvText} onChange={event => setCsvText(event.target.value)} rows={7} placeholder={t("Категория;Вопрос;Вариант 1;Вариант 2;Вариант 3;Вариант 4;Номер верного;Пояснение;Баллы\nМеханика;Скорость 20 м/с — это сколько км/ч?;72;20;36;7,2;1;20 м/с · 3,6 = 72 км/ч;100")} />

        <div className="import-preview">
          <span className={`import-count ${parsed.questions.length > 0 ? 'is-good' : ''}`}>
            <ListChecks size={15} />{" "}{t("Распознано:")}{" "}{parsed.questions.length}
          </span>
          {parsed.errors > 0 && <span className="import-errors">{t("Пропущено строк:")}{" "}{parsed.errors}</span>}
          <span className="import-hint">{t("CSV с разделителем «;» или «,»")}</span>
        </div>

        <div className="editor-footer">
          <span className="editor-hint">{t("Верный вариант указывается номером, начиная с 1.")}</span>
          <div className="editor-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setImportOpen(false)}>{t("Отмена")}</button>
            <button type="button" className="btn btn--primary" onClick={importQuestions} disabled={parsed.questions.length === 0}>
              <Plus size={16} />{" "}{t("Добавить")}{" "}{parsed.questions.length || ''}
            </button>
          </div>
        </div>
      </Modal>
    </div>;
}