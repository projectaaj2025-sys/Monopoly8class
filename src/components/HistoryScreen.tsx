import { useMemo, useState, type CSSProperties } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, CircleHelp, History, Sparkles, Trash2, Trophy } from 'lucide-react';
import type { GameRecord } from '../types';
import { THEMES, THEME_ICON } from '../data/themes';
import { formatNumber, pluralize } from '../game/engine';
import { clearHistory, loadHistory, removeGameRecord } from '../data/storage';
import { Icon } from './Icon';
import { Modal } from './ui';
import { sfx } from '../lib/sound';
import { t } from '../i18n';

interface HistoryScreenProps {
  onBack: () => void;
  onShowRules: () => void;
}

const formatDate = (ts: number): string => {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(ts);
  } catch {
    return new Date(ts).toLocaleString();
  }
};

const FORMAT_LABEL: Record<GameRecord['format'], string> = {
  quarter: t('по четвертям'),
  year: t('весь год'),
  topics: t('свои темы'),
  custom: t('своя монополия'),
};

export function HistoryScreen({ onBack, onShowRules }: HistoryScreenProps) {
  const [records, setRecords] = useState<GameRecord[]>(() => loadHistory());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const total = records.length;
  const bestScore = useMemo(() => Math.max(0, ...records.flatMap((r) => r.teams.map((team) => team.score))), [records]);

  const dropRecord = (id: string) => {
    sfx.tap();
    setRecords((prev) => prev.filter((item) => item.id !== id));
    removeGameRecord(id);
  };

  return <div className="history-page">
      <header className="library-head">
        <div>
          <button type="button" className="back-link" onClick={onBack}>
            <ArrowLeft size={15} />{" "}{t("В меню")}</button>
          <div className="page-eyebrow">
            <Sparkles size={14} />{" "}{t("Кабинет учителя")}</div>
          <h1>{t("История прохождений")}</h1>
          <p>{t("Все завершённые игры сохраняются автоматически — можно разобрать ошибки класса после урока.")}</p>
        </div>
        <div className="library-head-actions">
          <button type="button" className="btn btn--ghost" onClick={onShowRules}>
            <CircleHelp size={16} />{" "}{t("Как играть")}</button>
          <button type="button" className="btn btn--danger" onClick={() => setConfirmClear(true)} disabled={total === 0}>
            <Trash2 size={16} />{" "}{t("Очистить историю")}</button>
        </div>
      </header>

      {records.length === 0 ? <div className="panel library-empty">
          <div className="empty-state">
            <div className="empty-icon">
              <History size={34} />
            </div>
            <h3>{t("Пока нет пройденных игр")}</h3>
            <p>{t("Завершите первую игру — она появится здесь с таблицей очков каждой команды.")}</p>
          </div>
        </div> : <div className="history-list">
          {records.map((record) => {
          const theme = THEMES[record.themeId] ?? THEMES.g7;
          const isOpen = expanded === record.id;
          const placeOf = (score: number): number => record.teams.filter((item) => item.score > score).length + 1;
          return <article key={record.id} className={`history-card panel ${isOpen ? 'is-open' : ''}`} style={{
            '--accent': theme.accent,
            '--accent-2': theme.accent2
          } as CSSProperties}>
                <button type="button" className="history-card-head" onClick={() => {
            sfx.tap();
            setExpanded(isOpen ? null : record.id);
          }}>
                  <span className="history-orb" style={{
            background: `linear-gradient(150deg, ${theme.frameA}, ${theme.frameB})`
          }}>
                    <Icon name={THEME_ICON[record.themeId] ?? 'Atom'} size={20} />
                  </span>
                  <span className="history-card-main">
                    <b>{record.title}</b>
                    <small>{formatDate(record.finishedAt)} · {t(FORMAT_LABEL[record.format])}</small>
                  </span>
                  <span className="history-winner">
                    <Trophy size={14} />{" "}{record.winner.join(', ') || t("Нет победителя")}
                  </span>
                  <span className="history-score">
                    {formatNumber(Math.max(...record.teams.map((team) => team.score)))}
                    <small>{t("очков")}</small>
                  </span>
                  {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                </button>

                {isOpen && <div className="history-card-body">
                    <div className="history-meta">
                      <span>
                        {t("Ходов")}: {record.turns}
                      </span>
                      <span>
                        {t("Открыто клеток")}: {record.captured}/{record.totalCells}
                      </span>
                      <span>
                        {t("Команд")}: {record.teams.length}
                      </span>
                    </div>
                    <div className="history-teams">
                      {record.teams.map((team) => {
                  const place = placeOf(team.score);
                  return <div key={team.name} className={`history-team ${place === 1 ? 'is-winner' : ''}`}>
                            <span className="history-place">{place}</span>
                            <span className="history-team-token">{team.emoji}</span>
                            <span className="history-team-name">{team.name}</span>
                            <span className="history-team-score">{formatNumber(team.score)}</span>
                            <span className="history-team-stats">
                              <i className="is-good">{team.correct} {t("верно")}</i>
                              <i className="is-bad">{team.wrong} {t("ошибок")}</i>
                              <i className="is-cap">{team.captures} {t("перехватов")}</i>
                            </span>
                          </div>;
                })}
                    </div>
                    <div className="history-card-actions">
                      <button type="button" className="link-btn" onClick={() => dropRecord(record.id)}>
                        <Trash2 size={13} />{" "}{t("удалить запись")}</button>
                    </div>
                  </div>}
              </article>;
        })}
        </div>}

      {bestScore > 0 && <p className="history-foot">
          <Trophy size={14} />{" "}{t("Лучший результат")}: <b>{formatNumber(bestScore)}</b>{" "}{t("очков")}
        </p>}

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} size="sm" className="confirm-modal">
        <div className="confirm-icon confirm-icon--danger">
          <Trash2 size={24} />
        </div>
        <h2>{t("Очистить историю?")}</h2>
        <p>{t("Все записи о пройденных играх будут удалены. Это действие нельзя отменить.")}</p>
        <div className="confirm-actions">
          <button type="button" className="btn btn--ghost" onClick={() => setConfirmClear(false)}>{t("Отмена")}</button>
          <button type="button" className="btn btn--danger" onClick={() => {
            clearHistory();
            setRecords([]);
            setConfirmClear(false);
          }}>
            <Trash2 size={16} />{" "}{t("Очистить")}</button>
        </div>
      </Modal>
    </div>;
}
