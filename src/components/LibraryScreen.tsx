import { useMemo, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Clock3, Copy, Download, FileQuestion, FlaskConical, Layers, ListChecks, Pencil, Play, Plus, Sparkles, Trash2, Upload, Wand2 } from 'lucide-react';
import type { CustomBoard, ThemeId } from '../types';
import { THEMES, THEME_ICON } from '../data/themes';
import { buildCustomBoard, pluralize, RING_SIZE } from '../game/engine';
import { gridPosition, tileBackground } from './Board';
import { Modal, EmptyState, Pill } from './ui';
import { Icon } from './Icon';
import { sfx } from '../lib/sound';
import { getLocale, t } from '../i18n'
interface LibraryScreenProps {
  boards: CustomBoard[];
  onCreate: () => void;
  onEdit: (board: CustomBoard) => void;
  onPlay: (board: CustomBoard) => void;
  onDuplicate: (board: CustomBoard) => void;
  onDelete: (board: CustomBoard) => void;
  onBack: () => void;
  onShowRules: () => void;
  onExportAll: () => void;
  onImport: (file: File | undefined) => void;
}
const THEME_ORDER: ThemeId[] = ['g7', 'g8', 'g9', 'g10', 'g11', 'review'];
const dateFormatters: Record<string, Intl.DateTimeFormat> = {};
const formatBoardDate = (value: number): string => {
  const locale = getLocale();
  const tag = locale === 'ru' ? 'ru-RU' : locale === 'kk' ? 'kk-KZ' : 'en-GB';
  dateFormatters[tag] ??= new Intl.DateTimeFormat(tag, {
    day: 'numeric',
    month: 'short'
  });
  return dateFormatters[tag].format(value);
};
export function LibraryScreen({
  boards,
  onCreate,
  onEdit,
  onPlay,
  onDuplicate,
  onDelete,
  onBack,
  onShowRules,
  onExportAll,
  onImport
}: LibraryScreenProps) {
  const [deleteTarget, setDeleteTarget] = useState<CustomBoard | null>(null);
  const totalQuestions = boards.reduce((sum, board) => sum + board.questions.length, 0);
  const cards = useMemo(() => boards.map(board => {
    const categories = [...new Set(board.questions.map(q => q.category))];
    return {
      board,
      categories,
      ring: buildCustomBoard(board),
      theme: THEMES[board.theme] ?? THEMES.g7,
      themeKey: THEME_ORDER.includes(board.theme) ? board.theme : 'g7'
    };
  }), [boards]);
  return <div className="library-page">
      <div className="library-head">
        <div>
          <button type="button" className="back-link" onClick={onBack}>
            <ArrowLeft size={15} />{" "}{t("Новая игра")}</button>
          <div className="page-eyebrow">
            <Wand2 size={14} />{" "}{t("Конструктор учителя")}</div>
          <h1>{t("Мои монополии")}</h1>
          <p>{t("Создавайте собственные поля, добавляйте вопросы и категории. Всё хранится в этом браузере — игру можно запустить в один клик.")}</p>
        </div>
        <div className="library-head-actions">
          <button type="button" className="btn btn--ghost" onClick={onShowRules}>{t("Как играть")}</button>
          <button type="button" className="icon-btn" onClick={onExportAll} title={t("Скачать резервную копию всех монополий")} aria-label={t("Скачать резервную копию всех монополий")} disabled={boards.length === 0}>
            <Download size={17} />
          </button>
          <label className="icon-btn icon-btn--upload" title={t("Загрузить монополии из файла")}>
            <Upload size={17} />
            <input type="file" accept="application/json,.json" onChange={event => {
            onImport(event.target.files?.[0]);
            event.target.value = '';
          }} />
          </label>
          <button type="button" className="btn btn--primary btn--lg" onClick={onCreate}>
            <Plus size={18} />{" "}{t("Создать монополию")}</button>
        </div>
      </div>

      <div className="library-stats">
        <div>
          <span className="library-stat-icon">
            <Layers size={18} />
          </span>
          <div>
            <b>{boards.length}</b>
            <small>{pluralize(boards.length, 'монополия', 'монополии', 'монополий')}</small>
          </div>
        </div>
        <div>
          <span className="library-stat-icon library-stat-icon--pink">
            <FileQuestion size={18} />
          </span>
          <div>
            <b>{totalQuestions}</b>
            <small>{t("авторских заданий")}</small>
          </div>
        </div>
        <div>
          <span className="library-stat-icon library-stat-icon--green">
            <Sparkles size={18} />
          </span>
          <div>
            <b>6</b>
            <small>{t("дизайнов поля")}</small>
          </div>
        </div>
        <div className="library-stat-note">
          <FlaskConical size={16} />
          <span>{t("Задания можно импортировать из CSV или добавлять вручную.")}</span>
        </div>
      </div>

      {boards.length === 0 ? <div className="panel library-empty">
          <EmptyState icon={<Wand2 size={34} />} title={t("Пока нет своих монополий")} text={t("Создайте первую игру: придумайте категории, добавьте вопросы и выберите один из шести дизайнов поля.")} action={<button type="button" className="btn btn--primary btn--lg" onClick={onCreate}>
                <Plus size={18} />{" "}{t("Создать монополию")}</button>} />
        </div> : <div className="library-grid">
          {cards.map(({
        board,
        categories,
        ring,
        theme,
        themeKey
      }) => <article key={board.id} className="board-card">
              <div className="board-card-art" style={{
          '--accent': theme.accent,
          '--accent-2': theme.accent2,
          '--frame-a': theme.frameA,
          '--frame-b': theme.frameB,
          '--board-bg': theme.boardBg,
          '--page-glow': theme.pageGlow
        } as CSSProperties}>
                <div className="board-card-mini">
                  {ring.map(cell => {
              const pos = gridPosition(cell.index);
              return <span key={cell.index} style={{
                gridRow: pos.gridRow,
                gridColumn: pos.gridColumn,
                background: tileBackground(cell)
              }} />;
            })}
                  <div className="board-card-mini-center">
                  <Icon name={THEME_ICON[themeKey as ThemeId]} size={26} />
                </div>
                </div>
                <div className="board-card-topline">
                  <Pill tone="accent">{t(theme.name)}</Pill>
                  {board.isSample && <Pill tone="info">{t("Пример")}</Pill>}
                </div>
                <span className="board-card-cells">
            <ListChecks size={13} /> {RING_SIZE}{" "}{t("клеток ·")}{" "}{board.questions.length}{' '}
            {pluralize(board.questions.length, 'задание', 'задания', 'заданий')}
          </span>
              </div>

              <div className="board-card-body">
                <div className="board-card-title-row">
                  <h2>{board.isSample ? t(board.name) : board.name || t("Без названия")}</h2>
                </div>
                <p className="board-card-desc">
                  {board.isSample ? t(board.description) : board.description || t("Своя монополия по физике с авторскими заданиями.")}
                </p>
                <div className="board-card-categories">
                  {categories.slice(0, 3).map(category => <span key={category}>{board.isSample ? t(category) : category}</span>)}
                  {categories.length > 3 && <span>+{categories.length - 3}</span>}
                  {categories.length === 0 && <span className="is-muted">{t("нет категорий")}</span>}
                </div>
                <div className="board-card-meta">
                  <span>
                    <Clock3 size={13} /> {formatBoardDate(board.updatedAt)}
                  </span>
                  <span>
                    <FileQuestion size={13} /> {board.questions.length}{' '}
                    {pluralize(board.questions.length, 'вопрос', 'вопроса', 'вопросов')}
                  </span>
                </div>
                <div className="board-card-actions">
                  <button type="button" className="btn btn--primary btn--sm" onClick={() => {
              sfx.open();
              onPlay(board);
            }} disabled={board.questions.length === 0} title={board.questions.length === 0 ? t("Добавьте хотя бы один вопрос") : t("Играть")}>
                    <Play size={15} />{" "}{t("Играть")}</button>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => onEdit(board)}>
                    <Pencil size={15} />{" "}{t("Изменить")}</button>
                  <button type="button" className="icon-btn icon-btn--ghost" onClick={() => onDuplicate(board)} title={t("Дублировать")} aria-label={t("Дублировать")}>
                    <Copy size={16} />
                  </button>
                  <button type="button" className="icon-btn icon-btn--ghost icon-btn--danger" onClick={() => setDeleteTarget(board)} title={t("Удалить")} aria-label={t("Удалить")}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>)}

          <button type="button" className="board-card board-card--new" onClick={onCreate}>
            <span className="board-card-new-icon">
              <Plus size={26} />
            </span>
            <b>{t("Новая монополия")}</b>
            <span>{t("Свои категории, вопросы и дизайн")}</span>
            <span className="board-card-new-arrow">
              <ArrowRight size={17} />
            </span>
          </button>
        </div>}

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} size="sm" className="confirm-modal">
        <div className="confirm-icon confirm-icon--danger">
          <Trash2 size={24} />
        </div>
        <h2>{t("Удалить монополию?")}</h2>
        <p>
          «{deleteTarget?.name || t("Без названия")}{t("» и все её задания будут удалены. Это действие нельзя отменить.")}</p>
        <div className="confirm-actions">
          <button type="button" className="btn btn--ghost" onClick={() => setDeleteTarget(null)}>{t("Отмена")}</button>
          <button type="button" className="btn btn--danger" onClick={() => {
          if (deleteTarget) onDelete(deleteTarget);
          setDeleteTarget(null);
        }}>
            <Trash2 size={16} />{" "}{t("Удалить")}</button>
        </div>
      </Modal>
    </div>;
}