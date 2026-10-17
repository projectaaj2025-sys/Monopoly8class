import { useEffect, useRef, useState } from 'react';
import { Atom, CircleHelp, Dices, FlaskConical, Library, ShieldCheck, Sparkles, Trophy, Users, Volume2, VolumeX, Wand2, Zap } from 'lucide-react';
import type { CustomBoard, GameConfig, TeamTemplate } from './types';
import { SetupScreen } from './components/SetupScreen';
import { GameScreen } from './components/GameScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { BuilderScreen } from './components/BuilderScreen';
import { Modal } from './components/ui';
import { blankBoard, downloadFile, ensureSeed, loadCustomBoards, saveCustomBoards } from './data/storage';
import { buildGameConfig, DEFAULT_TEAM_TEMPLATES, uid } from './game/engine';
import { isSoundEnabled, setSoundEnabled, sfx } from './lib/sound';
import { applyTheme, getInitialTheme, type ThemeMode } from './lib/theme';
import { ThemeToggle } from './components/ThemeToggle';
import { LangSwitch } from './components/LangSwitch';
import { t, useLocale } from './i18n';
type Screen = 'setup' | 'game' | 'library' | 'builder';
const HELP_STEPS = [{
  icon: <Dices size={20} />,
  title: 'Соберите поле',
  text: 'Выберите класс и четверть, весь год или отдельные темы. Для итогов — отметьте несколько классов.'
}, {
  icon: <Users size={20} />,
  title: 'Разделите класс',
  text: 'Две–четыре команды по очереди бросают кубик и двигаются по 28 клеткам поля.'
}, {
  icon: <Zap size={20} />,
  title: 'Отвечайте и побеждайте',
  text: 'Верный ответ приносит очки и открывает клетку. Перехватывайте клетки соперников и собирайте бонусы.'
}];
const POINT_ROWS = [['Вопрос по теме', '100'], ['Знание формулы', '150'], ['Расчётная задача', '200'], ['Лаборатория', '250'], ['Перехват клетки', '+50'], ['Круг по полю', '+100'], ['Ракета', '+250']];
export default function App() {
  useLocale();
  const [boards, setBoards] = useState<CustomBoard[]>(() => {
    ensureSeed();
    return loadCustomBoards();
  });
  const [screen, setScreen] = useState<Screen>('setup');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [setupReturnScreen, setSetupReturnScreen] = useState<Screen>('setup');
  const [gameKey, setGameKey] = useState(0);
  const [editingBoard, setEditingBoard] = useState<CustomBoard | null>(null);
  const [editingIsNew, setEditingIsNew] = useState(false);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<{
    id: number;
    text: string;
  } | null>(null);
  const toastTimer = useRef<number | null>(null);
  useEffect(() => {
    saveCustomBoards(boards);
  }, [boards]);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);
  const showToast = (text: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({
      id: Date.now(),
      text
    });
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  };
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) sfx.tap();
  };
  const startGame = (nextConfig: GameConfig) => {
    setConfig(nextConfig);
    setGameKey(prev => prev + 1);
    setScreen('game');
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const playCustom = (board: CustomBoard) => {
    setSetupReturnScreen('library');
    const templates: TeamTemplate[] = DEFAULT_TEAM_TEMPLATES.slice(0, 3).map(template => ({ ...template, name: t(template.name) }));
    const customConfig = buildGameConfig({
      source: 'custom',
      topics: [],
      themeId: board.theme,
      subtitle: `${board.questions.length} ${t("авторских заданий")} · ${t("своя монополия")}`,
      rounds: 8,
      teamTemplates: templates,
      customBoard: board
    });
    customConfig.title = board.isSample ? t(board.name) : board.name || t("Своя монополия");
    startGame(customConfig);
  };
  const openCreate = () => {
    setEditingBoard(blankBoard());
    setEditingIsNew(true);
    setScreen('builder');
    window.scrollTo({
      top: 0
    });
  };
  const openEdit = (board: CustomBoard) => {
    setEditingBoard({
      ...board,
      questions: board.questions.map(question => ({
        ...question,
        options: question.options ? [...question.options] : undefined
      }))
    });
    setEditingIsNew(false);
    setScreen('builder');
    window.scrollTo({
      top: 0
    });
  };
  const handleSaveBoard = (saved: CustomBoard, play: boolean) => {
    setBoards(prev => {
      const exists = prev.some(board => board.id === saved.id);
      return exists ? prev.map(board => board.id === saved.id ? saved : board) : [saved, ...prev];
    });
    setEditingBoard(null);
    if (play) {
      playCustom(saved);
      return;
    }
    setScreen('library');
    showToast(t("Монополия сохранена"));
    window.scrollTo({
      top: 0
    });
  };
  const duplicateBoard = (board: CustomBoard) => {
    const now = Date.now();
    const copy: CustomBoard = {
      ...board,
      id: uid('board'),
      name: `${board.name || t("Монополия")} (копия)`,
      createdAt: now,
      updatedAt: now,
      isSample: false,
      questions: board.questions.map(question => ({
        ...question,
        id: uid('cq'),
        options: question.options ? [...question.options] : undefined
      }))
    };
    setBoards(prev => [copy, ...prev]);
    showToast(t("Создана копия монополии"));
  };
  const deleteBoard = (board: CustomBoard) => {
    setBoards(prev => prev.filter(item => item.id !== board.id));
    showToast(t("Монополия удалена"));
  };
  const importBoards = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result ?? '')) as CustomBoard[];
        const valid = (Array.isArray(data) ? data : [data]).filter(item => item && typeof item.name === 'string' && Array.isArray(item.questions));
        if (valid.length === 0) throw new Error('empty');
        const now = Date.now();
        const restored: CustomBoard[] = valid.map(item => ({
          ...item,
          id: uid('board'),
          createdAt: item.createdAt ?? now,
          updatedAt: now,
          isSample: false,
          questions: item.questions.map(question => ({
            ...question,
            id: uid('cq')
          }))
        }));
        setBoards(prev => [...restored, ...prev]);
        showToast(`Загружено монополий: ${restored.length}`);
      } catch {
        showToast(t("Не удалось прочитать файл резервной копии"));
      }
    };
    reader.readAsText(file);
  };
  const closeGame = () => {
    setConfig(null);
    setScreen(setupReturnScreen);
    window.scrollTo({
      top: 0
    });
  };
  return <div className="app">
      <div className="app-glow app-glow--one" aria-hidden />
      <div className="app-glow app-glow--two" aria-hidden />
      <div className="app-stars" aria-hidden />

      {screen !== 'game' && screen !== 'builder' && <header className="topbar">
          <div className="topbar-inner">
            <button type="button" className="brand" onClick={() => setScreen('setup')}>
              <span className="brand-mark">
                <Atom size={24} strokeWidth={2.1} />
              </span>
              <span className="brand-text">
                <b>{t("ФИЗИКА-ПОЛИ")}</b>
                <small>{t("образовательная монополия")}</small>
              </span>
            </button>

            <nav className="mainnav" aria-label={t("Навигация")}>
              <button type="button" className={screen === 'setup' ? 'is-active' : ''} onClick={() => setScreen('setup')}>
                <Dices size={16} />{" "}{t("Новая игра")}</button>
              <button type="button" className={screen === 'library' ? 'is-active' : ''} onClick={() => setScreen('library')}>
                <Library size={16} />{" "}{t("Мои монополии")}<span className="nav-count">{boards.length}</span>
              </button>
            </nav>

            <div className="topbar-right">
              <button type="button" className="topbar-link" onClick={() => setHelpOpen(true)}>
                <CircleHelp size={16} />{" "}{t("Правила")}</button>
              <LangSwitch />
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <button type="button" className="icon-btn icon-btn--ghost" onClick={toggleSound} aria-label={soundOn ? t("Выключить звук") : t("Включить звук")}>
                {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>
          </div>
        </header>}

      {screen === 'setup' && <SetupScreen boardsCount={boards.length} soundOn={soundOn} onToggleSound={toggleSound} onStart={startGame} onOpenLibrary={() => setScreen('library')} onShowRules={() => setHelpOpen(true)} />}

      {screen === 'game' && config && <GameScreen key={gameKey} config={config} soundOn={soundOn} onToggleSound={toggleSound} theme={theme} onToggleTheme={toggleTheme} onExit={closeGame} onSettings={closeGame} onRestart={startGame} onShowRules={() => setHelpOpen(true)} />}

      {screen === 'library' && <LibraryScreen boards={boards} onCreate={openCreate} onEdit={openEdit} onPlay={playCustom} onDuplicate={duplicateBoard} onDelete={deleteBoard} onBack={() => setScreen('setup')} onShowRules={() => setHelpOpen(true)} onExportAll={() => {
      downloadFile('fizika-poli-monopolii.json', JSON.stringify(boards, null, 2), 'application/json');
      showToast(t("Резервная копия скачана"));
    }} onImport={importBoards} />}

      {screen === 'builder' && editingBoard && <BuilderScreen board={editingBoard} isNew={editingIsNew} onBack={() => {
      setEditingBoard(null);
      setScreen('library');
    }} onSave={handleSaveBoard} onShowRules={() => setHelpOpen(true)} />}

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} size="lg" className="help-modal">
        <div className="help-hero">
          <span className="help-orb">
            <Atom size={30} strokeWidth={1.8} />
          </span>
          <div>
            <div className="eyebrow">
              <Sparkles size={13} />{" "}{t("Правила игры")}</div>
            <h2>{t("Физика-Поли")}</h2>
            <p>{t("Образовательная монополия, в которой команды путешествуют по миру физики.")}</p>
          </div>
        </div>

        <div className="help-steps">
          {HELP_STEPS.map((step, index) => <div key={step.title} className="help-step">
              <span className="help-step-num">{index + 1}</span>
              <span className="help-step-icon">{step.icon}</span>
              <h3>{t(step.title)}</h3>
              <p>{t(step.text)}</p>
            </div>)}
        </div>

        <div className="help-columns">
          <div className="help-column">
            <h3>
              <Trophy size={16} />{" "}{t("Как начисляются очки")}</h3>
            <div className="points-table">
              {POINT_ROWS.map(([label, value]) => <div key={label}>
                  <span>{t(label)}</span>
                  <b>{value}</b>
                </div>)}
            </div>
          </div>
          <div className="help-column">
            <h3>
              <ShieldCheck size={16} />{" "}{t("Панель учителя")}</h3>
            <ul className="help-list">
              <li>{t("На таймере 60 секунд — можно засчитать ответ, даже если время вышло.")}</li>
              <li>{t("Ответ открывается по кнопке — удобно для устной работы у доски.")}</li>
              <li>{t("Кнопка «Пропустить ход» помогает управлять темпом урока.")}</li>
              <li>{t("Итоги можно скачать в CSV и разобрать ошибки после игры.")}</li>
            </ul>
          </div>
        </div>

        <div className="help-note">
          <Wand2 size={17} />
          <span>{t("Хотите свои категории? Перейдите в «Мои монополии» — конструктор поддерживает тесты, открытые вопросы и импорт из CSV.")}</span>
        </div>

        <div className="help-footer">
          <span>
            <FlaskConical size={14} />{" "}{t("7–11 классы · 28 клеток · 6 дизайнов поля")}</span>
          <button type="button" className="btn btn--primary" onClick={() => setHelpOpen(false)}>{t("Понятно, играем")}</button>
        </div>
      </Modal>

      {toast && <div key={toast.id} className="app-toast">
          <Sparkles size={15} /> {toast.text}
        </div>}
    </div>;
}