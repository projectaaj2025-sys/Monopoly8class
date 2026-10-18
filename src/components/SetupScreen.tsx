import { useMemo, useState, type CSSProperties } from 'react';
import { ArrowRight, BookOpen, Check, CircleHelp, Dices, FlaskConical, GraduationCap, Layers, Library, ListChecks, Play, RotateCcw, Search, Sparkles, Trophy, Users, Wand2, X } from 'lucide-react';
import type { GameConfig, GradeId, TeamTemplate, Topic } from '../types';
import { GRADE_LIST, GRADES, QUARTER_LABELS, allTopicsOfGrades, topicsOfGrade, topicsOfQuarter } from '../data/curriculum';
import { DOMAIN_META, TEAM_COLORS, THEMES, THEME_ICON, dieStyle, dieName } from '../data/themes';
import { BASE_QUESTIONS } from '../data/questions';
import { DEFAULT_ROUNDS, TEAM_PALETTE, buildBoard, buildGameConfig, countQuestions, formatNumber, pluralize } from '../game/engine';
import { gameSaveSummary } from '../data/storage';
import type { GameSaveState } from '../types';
import { sfx } from '../lib/sound';
import { gridPosition, tileBackground } from './Board';
import { Stepper } from './ui';
import { Icon } from './Icon';
import { assetUrl } from '../utils/asset';
import { localizeComposed, pluralRu, t } from '../i18n'
type Mode = 'quarter' | 'year' | 'topics';
const DEFAULT_NAMES = ['Ньютоны', 'Эйнштейны', 'Теслы', 'Ломоносовы'];
const TEAM_EMOJI = ['🍎', '🧠', '⚡', '🔭'];
const MIN_TEAMS = 2;
const MAX_TEAMS = 4;
const DEFAULT_GRADE: GradeId = 8;
const quarterKey = (grade: GradeId, quarter: number): string => `${grade}-${quarter}`;
const formatQuarterList = (numbers: number[]): string => {
  const labels = [...numbers].sort((a, b) => a - b).map(n => QUARTER_LABELS[n - 1] ?? String(n));
  if (labels.length === 0) return '—';
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} и ${labels[labels.length - 1]}`;
};
const pluralTopics = (n: number): string => `${n} ${pluralRu(n, 'тема', 'темы', 'тем')}`;
const pluralTasks = (n: number): string => `${n} ${pluralize(n, 'задание', 'задания', 'заданий')}`;
const pluralClasses = (n: number): string => `${n} ${pluralize(n, 'класс', 'класса', 'классов')}`;
const pluralQuestions = (n: number): string => `${n} ${pluralize(n, 'вопрос', 'вопроса', 'вопросов')}`;
/** Раскладка точек кубика для предпросмотра (значение 5) */
const PIP_LAYOUT: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};
interface SetupScreenProps {
  boardsCount: number;
  soundOn: boolean;
  onToggleSound: () => void;
  onStart: (config: GameConfig) => void;
  onOpenLibrary: () => void;
  onShowRules: () => void;
  /** Сохранённая незавершённая игра — предложить продолжить */
  resumeSave: GameSaveState | null;
  onResume: (save: GameSaveState) => void;
  onDiscardSave: () => void;
}
export function SetupScreen({
  boardsCount,
  soundOn,
  onToggleSound,
  onStart,
  onOpenLibrary,
  onShowRules,
  resumeSave,
  onResume,
  onDiscardSave
}: SetupScreenProps) {
  const [grades, setGrades] = useState<GradeId[]>([DEFAULT_GRADE]);
  const [mode, setMode] = useState<Mode>('quarter');
  const [quarters, setQuarters] = useState<Set<string>>(() => new Set([quarterKey(DEFAULT_GRADE, 1)]));
  const [topicIds, setTopicIds] = useState<Set<string>>(() => new Set());
  const [teamCount, setTeamCount] = useState(3);
  const [teamNames, setTeamNames] = useState<string[]>(['', '', '', '']);
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [search, setSearch] = useState('');
  const isMulti = grades.length > 1;
  const primaryGrade = grades[0];
  const themeId = isMulti ? 'review' : GRADES[primaryGrade].theme;
  const theme = THEMES[themeId];
  const selectedGradeObjects = useMemo(() => GRADE_LIST.filter(grade => grades.includes(grade.id)), [grades]);
  const gradeTopics = useMemo(() => allTopicsOfGrades(grades), [grades]);
  const activeTopics = useMemo(() => {
    if (mode === 'year') return gradeTopics;
    if (mode === 'topics') {
      return gradeTopics.filter(topic => topicIds.has(topic.id));
    }
    return gradeTopics.filter(topic => quarters.has(quarterKey(topic.grade, topic.quarter)));
  }, [mode, gradeTopics, topicIds, quarters]);
  const questionCount = useMemo(() => countQuestions(activeTopics), [activeTopics]);
  const selectedQuarterNumbers = useMemo(() => grades.map(grade => ({
    grade,
    numbers: [...quarters].filter(key => key.startsWith(`${grade}-`)).map(key => Number(key.split('-')[1]))
  })), [grades, quarters]);
  const previewBoard = useMemo(() => buildBoard(activeTopics.length > 0 ? activeTopics : gradeTopics), [activeTopics, gradeTopics]);
  const allSelectedTopics = activeTopics.length === gradeTopics.length && activeTopics.length > 0;
  const canStart = activeTopics.length > 0;
  const toggleGrade = (grade: GradeId) => {
    sfx.tap();
    if (grades.includes(grade)) {
      if (grades.length === 1) return;
      const nextGrades = grades.filter(item => item !== grade);
      setGrades(nextGrades);
      if (nextGrades.length === 1) {
        const only = nextGrades[0];
        setQuarters(new Set([quarterKey(only, 1)]));
      }
      setTopicIds(prev => {
        const allowed = new Set(allTopicsOfGrades(nextGrades).map(topic => topic.id));
        return new Set([...prev].filter(id => allowed.has(id)));
      });
      return;
    }
    const nextGrades = [...grades, grade].sort((a, b) => a - b);
    setGrades(nextGrades);
    setQuarters(prev => new Set([...prev, quarterKey(grade, 1)]));
    setTopicIds(prev => {
      const next = new Set(prev);
      topicsOfQuarter(grade, 1).forEach(topic => next.add(topic.id));
      return next;
    });
  };
  const applyPreset = (preset: GradeId[]) => {
    sfx.open();
    setGrades(preset);
    setMode('year');
    setQuarters(new Set(preset.map(grade => quarterKey(grade, 1))));
    setTopicIds(new Set(allTopicsOfGrades(preset).map(topic => topic.id)));
    setSearch('');
  };
  const resetPreset = () => {
    sfx.tap();
    setGrades([DEFAULT_GRADE]);
    setMode('quarter');
    setQuarters(new Set([quarterKey(DEFAULT_GRADE, 1)]));
    setTopicIds(new Set());
    setSearch('');
  };
  const toggleQuarter = (grade: GradeId, quarter: number) => {
    sfx.tap();
    const key = quarterKey(grade, quarter);
    setQuarters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);else next.add(key);
      return next;
    });
    setTopicIds(prev => {
      const next = new Set(prev);
      const quarterTopics = topicsOfQuarter(grade, quarter);
      if (quarters.has(key)) quarterTopics.forEach(topic => next.delete(topic.id));else quarterTopics.forEach(topic => next.add(topic.id));
      return next;
    });
  };
  const selectAllQuarters = () => {
    sfx.tap();
    setQuarters(new Set(grades.flatMap(grade => [1, 2, 3, 4].map(q => quarterKey(grade, q)))));
  };
  const changeMode = (nextMode: Mode) => {
    sfx.tap();
    setMode(nextMode);
    if (nextMode === 'topics' && topicIds.size === 0) {
      const inherited = gradeTopics.filter(topic => quarters.has(quarterKey(topic.grade, topic.quarter)));
      setTopicIds(new Set((inherited.length > 0 ? inherited : gradeTopics).map(topic => topic.id)));
    }
  };
  const selectAllTopicsAction = () => {
    sfx.tap();
    setTopicIds(new Set(gradeTopics.map(topic => topic.id)));
  };
  const toggleTopic = (topic: Topic) => {
    sfx.tap();
    setTopicIds(prev => {
      const next = new Set(prev);
      if (next.has(topic.id)) next.delete(topic.id);else next.add(topic.id);
      return next;
    });
  };
  const toggleAllTopics = () => {
    sfx.tap();
    if (allSelectedTopics) setTopicIds(new Set());else setTopicIds(new Set(gradeTopics.map(topic => topic.id)));
  };
  const setTeamName = (index: number, value: string) => {
    setTeamNames(prev => prev.map((name, i) => i === index ? value : name));
  };
  const subtitle = useMemo(() => {
    if (mode === 'year') {
      return `${isMulti ? 'Вся программа' : 'Весь учебный год'} · ${pluralTopics(activeTopics.length)}`;
    }
    if (mode === 'topics') {
      return `Свой набор тем · ${pluralTopics(activeTopics.length)}`;
    }
    const numbers = [...new Set(selectedQuarterNumbers.flatMap(item => item.numbers))];
    return `${formatQuarterList(numbers)} ${numbers.length > 1 ? 'четверти' : 'четверть'} · ${pluralTopics(activeTopics.length)}`;
  }, [mode, isMulti, activeTopics.length, selectedQuarterNumbers]);
  const title = useMemo(() => {
    if (isMulti) {
      const first = grades[0];
      const last = grades[grades.length - 1];
      return `Итоговое повторение · ${first}–${last} классы`;
    }
    const grade = GRADES[primaryGrade];
    if (mode === 'year') return `${grade.label} · весь год`;
    if (mode === 'topics') return `${grade.label} · свои темы`;
    if (selectedQuarterNumbers[0]?.numbers.length === 1) {
      const quarterNumber = selectedQuarterNumbers[0].numbers[0];
      const quarter = grade.quarters.find(item => item.number === quarterNumber);
      return `${grade.label} · ${quarter?.title ?? 'четверть'}`;
    }
    return `${grade.label} · выбранные четверти`;
  }, [grades, isMulti, mode, primaryGrade, selectedQuarterNumbers]);
  const handleStart = () => {
    if (!canStart) return;
    sfx.open();
    const templates: TeamTemplate[] = Array.from({
      length: teamCount
    }).map((_, index) => ({
      name: teamNames[index]?.trim() || t(DEFAULT_NAMES[index]),
      color: TEAM_PALETTE[index],
      emoji: TEAM_EMOJI[index]
    }));
    const config = buildGameConfig({
      source: 'curriculum',
      topics: activeTopics,
      themeId,
      subtitle,
      rounds,
      teamTemplates: templates,
      format: mode
    });
    config.title = title;
    onStart(config);
  };
  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return gradeTopics;
    return gradeTopics.filter(topic => `${topic.title} ${t(topic.short)} ${topic.grade}`.toLowerCase().includes(query));
  }, [gradeTopics, search]);
  const preset79 = grades.length === 3 && grades.join(',') === '7,8,9' && mode === 'year';
  const preset711 = grades.length === 5 && mode === 'year';
  return <div className="setup-page">
      <section className="hero">
        <div className="hero-bg" aria-hidden>
          <img src={assetUrl('img/physics-center.jpg')} alt="" />
        </div>
        <div className="hero-veil" aria-hidden />
        <div className="hero-inner">
          <div className="hero-badge">
            <span className="hero-badge-dot" />{t("Образовательная монополия · физика · 7–11 классы")}</div>
          <h1 className="hero-title">{t("ФИЗИКА")}<span className="hero-title-dash">-</span>{t("ПОЛИ")}</h1>
          <div className="hero-ribbon">{t("Путешествие в мир физики")}</div>
          <p className="hero-tagline">{t("Знание · Скорость · Логика · Победа")}</p>
          <div className="hero-stats">
            <span>
              <Layers size={14} />{" "}{t("28 клеток")}</span>
            <span>
              <GraduationCap size={14} />{" "}{t("5 классов")}</span>
            <span>
              <FlaskConical size={14} /> {localizeComposed(pluralTasks(BASE_QUESTIONS.length))}
            </span>
            <span>
              <Wand2 size={14} />{" "}{t("свои правила")}</span>
          </div>
        </div>
        <div className="hero-actions">
          <button type="button" className="hero-cta" onClick={() => document.getElementById('setup')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })}>
            <span>
              <b>{t("Начать игру")}</b>
              <small>{t("выбрать класс и темы")}</small>
            </span>
            <ArrowRight size={17} />
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onShowRules}>
            <CircleHelp size={16} />{" "}{t("Как играть")}</button>
          <button type="button" className="icon-btn icon-btn--glass" onClick={onToggleSound} aria-label={soundOn ? t("Выключить звук") : t("Включить звук")}>
            {soundOn ? '🔊' : '🔇'}
          </button>
        </div>
      </section>

      {resumeSave && (() => {
        const summary = gameSaveSummary(resumeSave);
        const savedTheme = THEMES[summary.themeId] ?? THEMES.g7;
        const savedAt = new Intl.DateTimeFormat('ru-RU', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        }).format(summary.savedAt);
        return <section className="resume-banner panel" style={{
          '--accent': savedTheme.accent,
          '--accent-2': savedTheme.accent2
        } as CSSProperties}>
            <div className="resume-orb" aria-hidden>
              <Icon name={THEME_ICON[summary.themeId] ?? 'Atom'} size={24} />
            </div>
            <div className="resume-main">
              <div className="eyebrow">
                <Sparkles size={13} />{" "}{t("Незавершённая игра")}
              </div>
              <h2>{localizeComposed(summary.title)}</h2>
              <p className="resume-sub">
                {localizeComposed(summary.subtitle)} · {t("сохранена")} {savedAt} · {t("ход")} {summary.turn + 1} {t("из")} {summary.maxMoves}
              </p>
              <div className="resume-teams">
                {summary.teams.map(team => <span key={team.name} className="resume-team">
                    <i style={{ background: `linear-gradient(150deg, ${TEAM_COLORS.find(color => color.id === team.color)?.from ?? '#6ea8ff'}, ${TEAM_COLORS.find(color => color.id === team.color)?.to ?? '#2f63e0'})` }}>{team.emoji}</i>
                    <b>{team.name}</b>
                    <small>{formatNumber(team.score)} {t("очков")}</small>
                  </span>)}
              </div>
            </div>
            <div className="resume-actions">
              <button type="button" className="btn btn--primary btn--lg" onClick={() => onResume(resumeSave)}>
                <Play size={17} />{" "}{t("Продолжить игру")}</button>
              <button type="button" className="btn btn--ghost btn--lg" onClick={() => {
            sfx.tap();
            onDiscardSave();
          }}>
                {t("Отказаться")}</button>
            </div>
          </section>;
      })()}

      <div className="setup-stage" id="setup">
        <section className="panel setup-main">
          <div className="step-block">
            <div className="step-head">
              <span className="step-num">1</span>
              <div className="step-head-text">
                <h2>{t("Выберите класс")}</h2>
                <p>{t("Один класс или несколько — для итогового повторения всей программы.")}</p>
              </div>
              <span className="step-state">
                {localizeComposed(pluralClasses(grades.length))} · {localizeComposed(pluralTopics(gradeTopics.length))}
              </span>
            </div>

            <div className="grade-grid" id="grades">
              {GRADE_LIST.map(grade => {
              const gradeTheme = THEMES[grade.theme];
              const selected = grades.includes(grade.id);
              return <button key={grade.id} type="button" className={`grade-card ${selected ? 'is-selected' : ''}`} style={{
                '--grade-accent': gradeTheme.accent,
                '--grade-accent-2': gradeTheme.accent2,
                '--grade-glow': gradeTheme.pageGlow
              } as CSSProperties} onClick={() => toggleGrade(grade.id)} aria-pressed={selected}>
                    <span className="grade-check">{selected ? <Check size={13} /> : <span />}</span>
                    <span className="grade-emoji"><Icon name={THEME_ICON[grade.theme]} size={21} /></span>
                    <span className="grade-label">{t(grade.label)}</span>
                    <span className="grade-tagline">{t(gradeTheme.name)}</span>
                    <span className="grade-meta">{localizeComposed(pluralTopics(topicsOfGrade(grade.id).length))}</span>
                    <span className="grade-sheen" aria-hidden />
                  </button>;
            })}
              <div className="grade-note">
                <Sparkles size={15} />
                <span>{t("Отметьте несколько классов, чтобы собрать итоговое повторение. Дизайн поля меняется вместе с классом.")}</span>
                {isMulti && <button type="button" className="link-btn" onClick={resetPreset}>
                    <RotateCcw size={13} />{" "}{t("сбросить")}</button>}
              </div>
            </div>

            <div className="preset-row">
              <button type="button" className={`preset-card ${preset79 ? 'is-active' : ''}`} onClick={() => applyPreset([7, 8, 9])}>
                <span className="preset-icon">
                  <Trophy size={18} />
                </span>
                <span className="preset-text">
                  <b>{t("Итоги 7–9 классов")}</b>
                  <small>{t("вся программа основной школы")}</small>
                </span>
                <span className="preset-count">{localizeComposed(pluralTopics(allTopicsOfGrades([7, 8, 9]).length))}</span>
              </button>
              <button type="button" className={`preset-card preset-card--gold ${preset711 ? 'is-active' : ''}`} onClick={() => applyPreset([7, 8, 9, 10, 11])}>
                <span className="preset-icon">
                  <GraduationCap size={18} />
                </span>
                <span className="preset-text">
                  <b>{t("Итоги 7–11 классов")}</b>
                  <small>{t("полный курс физики школы")}</small>
                </span>
                <span className="preset-count">{localizeComposed(pluralTopics(allTopicsOfGrades([7, 8, 9, 10, 11]).length))}</span>
              </button>
            </div>
          </div>

          <div className="step-divider" />

          <div className="step-block" id="format">
            <div className="step-head">
              <span className="step-num">2</span>
              <div className="step-head-text">
                <h2>{t("Соберите содержание")}</h2>
                <p>{t("Четверть, весь учебный год или свой набор тем.")}</p>
              </div>
              <div className="mode-switch">
                <button type="button" className={mode === 'quarter' ? 'is-active' : ''} onClick={() => changeMode('quarter')}>{t("По четвертям")}</button>
                <button type="button" className={mode === 'year' ? 'is-active' : ''} onClick={() => changeMode('year')}>
                  {isMulti ? t("Вся программа") : t("Весь год")}
                </button>
                <button type="button" className={mode === 'topics' ? 'is-active' : ''} onClick={() => changeMode('topics')}>{t("Свои темы")}</button>
              </div>
            </div>

            {mode === 'quarter' && <div className="quarter-area">
                <div className="quarter-toolbar">
                  <span>
                    <ListChecks size={14} />{" "}{t("Можно выбрать одну или несколько четвертей")}</span>
                  <button type="button" className="link-btn" onClick={selectAllQuarters}>{t("выбрать все")}</button>
                </div>
                {selectedGradeObjects.map(grade => <div key={grade.id} className="quarter-group">
                    {isMulti && <div className="quarter-group-head">
                        <span className="mini-emoji"><Icon name={THEME_ICON[grade.theme]} size={12} /></span>
                        {t(grade.label)}
                        <span>{localizeComposed(pluralTopics(topicsOfGrade(grade.id).length))}</span>
                      </div>}
                    <div className="quarter-grid">
                      {grade.quarters.map(quarter => {
                  const selected = quarters.has(quarterKey(grade.id, quarter.number));
                  return <button key={quarter.number} type="button" className={`quarter-card ${selected ? 'is-selected' : ''}`} onClick={() => toggleQuarter(grade.id, quarter.number)} aria-pressed={selected}>
                            <div className="quarter-top">
                              <span className="quarter-roman">{QUARTER_LABELS[quarter.number - 1]}</span>
                              <span className="quarter-name">{t(quarter.title)}</span>
                              <span className={`quarter-check ${selected ? 'is-on' : ''}`}>
                                {selected ? <Check size={12} /> : null}
                              </span>
                            </div>
                            <div className="quarter-topics">
                              {quarter.topics.slice(0, 3).map(topic => <span key={topic.id}>{t(topic.short)}</span>)}
                              {quarter.topics.length > 3 && <span className="quarter-more">+{quarter.topics.length - 3}</span>}
                            </div>
                            <div className="quarter-foot">
                              {localizeComposed(pluralTopics(quarter.topics.length))}
                            </div>
                          </button>;
                })}
                    </div>
                  </div>)}
              </div>}

            {mode === 'year' && <div className="year-area">
                <div className="year-note">
                  <BookOpen size={17} />
                  <span>{t("В игру войдут все темы")}{" "}{isMulti ? t("выбранных классов") : t("учебного года")}{" "}{t("— от первой до последней четверти.")}</span>
                </div>
                <div className="year-grid">
                  {selectedGradeObjects.map(grade => <div key={grade.id} className="year-grade">
                      <div className="year-grade-head">
                        <span className="mini-emoji"><Icon name={THEME_ICON[grade.theme]} size={12} /></span>
                        <div>
                          <b>{t(grade.label)}</b>
                          <small>{t(grade.tagline)}</small>
                        </div>
                        <span className="year-count">{localizeComposed(pluralTopics(topicsOfGrade(grade.id).length))}</span>
                      </div>
                      <div className="year-quarters">
                        {grade.quarters.map(quarter => <div key={quarter.number} className="year-quarter">
                            <span className="year-quarter-num">{QUARTER_LABELS[quarter.number - 1]}</span>
                            <div>
                              <b>{t(quarter.title)}</b>
                              <small>{quarter.topics.map(topic => t(topic.short)).slice(0, 3).join(' · ')}</small>
                            </div>
                            <span className="year-quarter-topics">{quarter.topics.length}</span>
                          </div>)}
                      </div>
                    </div>)}
                </div>
              </div>}

            {mode === 'topics' && <div className="topics-area">
                <div className="topics-toolbar">
                  <div className="search-field">
                    <Search size={15} />
                    <input value={search} onChange={event => setSearch(event.target.value)} placeholder={t("Найти тему: давление, линзы, фотоэффект…")} aria-label={t("Поиск темы")} />
                    {search && <button type="button" onClick={() => setSearch('')} aria-label={t("Очистить поиск")}>
                        <X size={14} />
                      </button>}
                  </div>
                  <div className="topics-actions">
                    <span className="topics-count">
                      {activeTopics.length} / {gradeTopics.length}
                    </span>
                    <button type="button" className="link-btn" onClick={toggleAllTopics}>
                      {allSelectedTopics ? t("снять все") : t("выбрать все")}
                    </button>
                  </div>
                </div>
                <div className="topics-scroll">
                  {selectedGradeObjects.map(grade => {
                const filteredGrade = filteredTopics.filter(topic => topic.grade === grade.id);
                if (filteredGrade.length === 0) return null;
                return <div key={grade.id} className="topics-group">
                        <div className="topics-group-head">
                          <span className="mini-emoji"><Icon name={THEME_ICON[grade.theme]} size={12} /></span>
                          {t(grade.label)}
                          <span>
                            {filteredGrade.filter(topic => topicIds.has(topic.id)).length} /{' '}
                            {filteredGrade.length}
                          </span>
                        </div>
                        {grade.quarters.map(quarter => {
                    const quarterTopics = filteredGrade.filter(topic => topic.quarter === quarter.number);
                    if (quarterTopics.length === 0) return null;
                    return <div key={quarter.number} className="topic-quarter-row">
                              <span className="topic-quarter-label">
                                {QUARTER_LABELS[quarter.number - 1]}{" "}{t("четв.")}</span>
                              <div className="topic-chips">
                                {quarterTopics.map(topic => {
                          const selected = topicIds.has(topic.id);
                          const domain = DOMAIN_META[topic.domain];
                          return <button key={topic.id} type="button" className={`topic-chip ${selected ? 'is-selected' : ''}`} onClick={() => toggleTopic(topic)} title={t(topic.title)} aria-pressed={selected} style={{
                            '--dot': domain.color
                          } as CSSProperties}>
                                      <span className="topic-dot" />
                                      {t(topic.short)}
                                      {selected && <Check size={12} />}
                                    </button>;
                        })}
                              </div>
                            </div>;
                  })}
                      </div>;
              })}
                  {filteredTopics.length === 0 && <div className="topics-empty">
                      <Search size={20} />
                      <p>{t("Ничего не найдено. Попробуйте другое слово.")}</p>
                    </div>}
                  {activeTopics.length === 0 && <div className="topics-warning">
                      <CircleHelp size={17} />
                      <span>{t("Ни одна тема не выбрана — отметьте темы, иначе игру нельзя начать.")}</span>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={selectAllTopicsAction}>{t("Выбрать все темы")}</button>
                    </div>}
                </div>
              </div>}
          </div>
        </section>

        <aside className="setup-aside">
          <div className="game-ticket panel">
            <div className="ticket-preview" style={{
            '--accent': theme.accent,
            '--accent-2': theme.accent2,
            '--frame-a': theme.frameA,
            '--frame-b': theme.frameB,
            '--board-bg': theme.boardBg
          } as CSSProperties}>
              <div className="mini-board">
                {previewBoard.map(cell => {
                const pos = gridPosition(cell.index);
                return <span key={cell.index} className="mini-tile" style={{
                  gridRow: pos.gridRow,
                  gridColumn: pos.gridColumn,
                  background: tileBackground(cell, theme)
                }} />;
              })}
                <div className="mini-center">
                  <span className="mini-center-emoji"><Icon name={THEME_ICON[themeId]} size={22} /></span>
                  <b>{isMulti ? t("Итоги") : t(GRADES[primaryGrade].label)}</b>
                  <small>{t(theme.name)}</small>
                </div>
              </div>
              <div className="ticket-chip">
                <span className="live-dot" />{" "}{t("игра готова к запуску")}</div>
            </div>

            <div className="ticket-body">
              <div className="ticket-eyebrow">{t("Ваша игра")}</div>
              <h2 className="ticket-title">{localizeComposed(title)}</h2>
              <p className="ticket-sub">{localizeComposed(subtitle)}</p>

              <div className="ticket-classes">
                {grades.map(grade => <span key={grade} className="class-chip">
                    <Icon name={THEME_ICON[GRADES[grade].theme]} size={11} /> {grade}
                  </span>)}
                {grades.length > 1 && <span className="class-chip class-chip--review">{t("итоги")}</span>}
              </div>

              <div className="ticket-stats">
                <div className="ticket-stat">
                  <span>{t("Тем в игре")}</span>
                  <b>{activeTopics.length}</b>
                </div>
                <div className="ticket-stat">
                  <span>{t("Заданий в банке")}</span>
                  <b>{questionCount}</b>
                </div>
                <div className="ticket-stat">
                  <span>{t("Клеток поля")}</span>
                  <b>28</b>
                </div>
                <div className="ticket-stat">
                  <span>{t("Ходов")}</span>
                  <b>{formatNumber(rounds * teamCount)}</b>
                </div>
              </div>

              <div className="ticket-divider" />

              <div className="ticket-die" title={t("Дизайн кубика меняется вместе с классом и форматом")}>
                <span className={`die die--preview`} style={dieStyle(themeId, mode)} aria-hidden>
                  {Array.from({ length: 9 }).map((_, index) => <i key={index} className={`pip ${PIP_LAYOUT[5].includes(index) ? 'is-on' : ''}`} />)}
                </span>
                <div>
                  <b>{t("Кубик")}: {t(dieName(themeId))}</b>
                  <small>{t("дизайн поля и кубика — по классу и формату")}</small>
                </div>
              </div>

              <div className="ticket-mode">
                <span className={`mode-badge mode-badge--${mode}`}>
                  {mode === 'quarter' ? <>
                      <ListChecks size={12} />{" "}{t("по четвертям")}</> : mode === 'year' ? <>
                      <BookOpen size={12} /> {isMulti ? t("вся программа") : t("весь год")}
                    </> : <>
                      <Search size={12} />{" "}{t("свои темы")}</>}
                </span>
                <span className="ticket-mode-note">
                  {mode === 'topics' ? t("выбрано вручную") : mode === 'year' ? t("все четверти") : t("выбранные четверти")}
                </span>
              </div>

              <div className="ticket-section">
                <div className="ticket-section-head">
                  <span>
                    <Users size={15} />{" "}{t("Команды")}</span>
                  <span className="ticket-hint">{t("от 2 до 4")}</span>
                </div>
                <Stepper value={teamCount} min={MIN_TEAMS} max={MAX_TEAMS} onChange={value => {
                sfx.tap();
                setTeamCount(value);
              }} />
                <div className="team-inputs">
                  {Array.from({
                  length: teamCount
                }).map((_, index) => {
                  const palette = TEAM_COLORS[index];
                  return <label key={index} className="team-input" style={{
                    '--dot': palette.from
                  } as CSSProperties}>
                        <span className="team-dot">{TEAM_EMOJI[index]}</span>
                        <input value={teamNames[index] ?? ''} onChange={event => setTeamName(index, event.target.value)} placeholder={t(DEFAULT_NAMES[index])} maxLength={18} aria-label={`${t("Название команды")} ${index + 1}`} />
                      </label>;
                })}
                </div>
              </div>

              <div className="ticket-section ticket-section--row">
                <div>
                  <div className="ticket-section-head">
                    <span>
                      <Dices size={15} />{" "}{t("Кругов")}</span>
                  </div>
                  <p className="ticket-hint">{t("каждая команда сыграет")}{" "}{rounds}{" "}{t("ходов")}</p>
                </div>
                <Stepper value={rounds} min={4} max={12} onChange={value => {
                sfx.tap();
                setRounds(value);
              }} />
              </div>

              <button type="button" className="start-btn" onClick={handleStart} disabled={!canStart}>
                <span>{t("Начать игру")}<small>{canStart ? `${activeTopics.length} тем · ${rounds * teamCount} ходов` : t("Выберите темы")}</small>
                </span>
                <ArrowRight size={20} />
              </button>
              <p className="start-note">
                {canStart ? t("Играть можно сразу — вопросы уже готовы.") : t("Отметьте хотя бы одну тему или четверть.")}
              </p>
            </div>
          </div>

          <button type="button" className="custom-cta" onClick={onOpenLibrary}>
            <span className="custom-cta-icon">
              <Wand2 size={20} />
            </span>
            <span className="custom-cta-text">
              <b>{t("Своя монополия")}</b>
              <small>{t("Добавьте задания и создайте игру с нуля")}</small>
            </span>
            <span className="custom-cta-count">
              <Library size={14} /> {boardsCount}
            </span>
          </button>

          <button type="button" className="rules-link" onClick={onShowRules}>
            <CircleHelp size={15} />{" "}{t("Правила и советы для учителя")}</button>
        </aside>
      </div>

      <footer className="setup-footer">
        <div className="setup-footer-inner">
          <span>
            <Sparkles size={14} />{" "}{t("ФИЗИКА-ПОЛИ · образовательная монополия")}</span>
          <span>
            <BookOpen size={14} />{" "}{t("7–11 классы · итоговые повторения · авторские задания")}</span>
          <span>
            <Trophy size={14} /> {localizeComposed(pluralQuestions(BASE_QUESTIONS.length))}{" "}{t("в банке заданий")}</span>
        </div>
      </footer>
    </div>;
}