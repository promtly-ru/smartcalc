import { useState, useEffect, useLayoutEffect } from 'react';
import type { CSSProperties } from 'react';
import { 
  Calculator, 
  Binary, 
  Landmark, 
  FlaskConical, 
  History, 
  Sun, 
  Moon, 
  Pin,
  Clock,
  Trash2,
  Minus,
  X
} from 'lucide-react';
import type { CalculatorMode, CalculationHistoryItem } from './types/calculator';
import { ProgrammerMode } from './modes/programmer/ProgrammerMode';
import { BasicMode } from './modes/basic/BasicMode';
import { FinanceMode } from './modes/finance/FinanceMode';
import { EngineeringMode } from './modes/engineering/EngineeringMode';

type Theme = 'dark' | 'light';
const THEME_KEY = 'smartcalc_theme';

// Первый запуск — тема Windows, дальше — последний выбор пользователя
function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // ignore
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

// Приложение на весь экран: Electron, Android (Capacitor) или установленная PWA.
// В обычном браузере — карточка на ПК и весь экран на телефоне.
const isNative = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
const isStandalone =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

const THEME_COLORS: Record<Theme, string> = { dark: '#171717', light: '#fafafa' };

export function App() {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
  const fullscreen = isElectron || isNative || isStandalone;
  const drag = isElectron
    ? ({ WebkitAppRegion: 'drag' } as unknown as CSSProperties)
    : undefined;
  const noDrag = isElectron
    ? ({ WebkitAppRegion: 'no-drag' } as unknown as CSSProperties)
    : undefined;

  const [mode, setMode] = useState<CalculatorMode>('basic');
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<CalculationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('smartcalc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save history on changes
  useEffect(() => {
    try {
      localStorage.setItem('smartcalc_history', JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Sync theme (до отрисовки, чтобы не мигала другая тема)
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    // Иконка под тему: окно/панель задач в Electron, вкладка — в веб-версии
    window.electronAPI?.setTheme(theme);
    document.querySelector('link[rel="icon"]')?.setAttribute('href', `${import.meta.env.BASE_URL}${theme === 'dark' ? 'icon-dark.svg' : 'icon.svg'}`);
    // Цвет строки состояния на телефоне и заголовка установленной PWA
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
    document.body.style.backgroundColor = THEME_COLORS[theme];
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleAlwaysOnTop = () => {
    setAlwaysOnTop((prev) => {
      const next = !prev;
      window.electronAPI?.setAlwaysOnTop(next);
      return next;
    });
  };

  const handleAddHistory = (item: CalculationHistoryItem) => {
    setHistory(prev => [item, ...prev.slice(0, 49)]); // keep last 50
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className={`${
      isElectron
        ? 'w-screen h-screen rounded-none border-0'
        : fullscreen
          ? 'w-screen h-dvh rounded-none border-0 safe-area'
          : 'w-screen h-dvh safe-area sm:w-[360px] sm:h-[600px] sm:rounded-2xl sm:border sm:shadow-2xl'
    } flex flex-col font-sans transition-colors duration-200 select-none overflow-hidden ${
      theme === 'dark' 
        ? 'bg-neutral-900 border-neutral-800 text-neutral-100' 
        : 'bg-neutral-50 border-neutral-300 text-neutral-900'
    }`}>
      {/* Top Header */}
      <header
        style={drag}
        className="flex items-center justify-between px-3.5 pt-2.5 pb-1 bg-black/5 dark:bg-white/5 backdrop-blur"
      >
        <div className="flex items-center gap-1.5 font-semibold text-sm tracking-wide">
          <Calculator className="w-4 h-4 text-emerald-500" />
          <span>SmartCalc</span>
        </div>

        <div className="flex items-center gap-1" style={noDrag}>
          {isElectron && (
          <button
            onClick={toggleAlwaysOnTop}
            title={alwaysOnTop ? "Закреплено поверх окон" : "Закрепить поверх окон"}
            className={`p-1.5 rounded-lg transition-all ${
              alwaysOnTop 
                ? 'bg-emerald-500/20 text-emerald-400 font-bold' 
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/10'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${alwaysOnTop ? 'rotate-45' : ''}`} />
          </button>
          )}

          <button 
            onClick={toggleTheme}
            title="Переключить тему"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
          </button>

          <button 
            onClick={() => setHistoryOpen(!historyOpen)}
            title="История вычислений"
            className={`p-1.5 rounded-lg transition-colors relative ${
              historyOpen 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/10'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            {history.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            )}
          </button>

          {isElectron && (
            <>
              <button
                onClick={() => window.electronAPI?.minimize()}
                title="Свернуть"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => window.electronAPI?.close()}
                title="Закрыть"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Modes Navigation Bar (No border between header and nav) */}
      <nav className="grid grid-cols-4 gap-1 px-2 pb-2 pt-1 border-b border-inherit bg-black/5 dark:bg-white/5 text-xs">
        {[
          { id: 'basic', label: 'Базовый', icon: Calculator },
          { id: 'programmer', label: 'Программист', icon: Binary },
          { id: 'finance', label: 'Финансы', icon: Landmark },
          { id: 'engineering', label: 'Инженер', icon: FlaskConical },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = mode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id as CalculatorMode)}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg transition-all text-center ${
                isActive 
                  ? 'bg-emerald-500 text-white font-medium shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[10px] leading-tight truncate w-full">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col px-3 pt-3 pb-3.5 relative overflow-hidden">
        {mode === 'basic' && (
          <BasicMode onAddHistory={handleAddHistory} />
        )}

        {mode === 'programmer' && (
          <ProgrammerMode onAddHistory={handleAddHistory} />
        )}

        {mode === 'finance' && (
          <FinanceMode onAddHistory={handleAddHistory} />
        )}

        {mode === 'engineering' && (
          <EngineeringMode />
        )}

        {/* Slide-over History Drawer */}
        {historyOpen && (
          <aside className="absolute inset-0 bg-neutral-900/95 dark:bg-neutral-950/95 backdrop-blur-md p-3.5 flex flex-col z-20 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>История операций</span>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    title="Очистить историю"
                    className="p-1 rounded hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button 
                  onClick={() => setHistoryOpen(false)}
                  className="text-[11px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-2">
              {history.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-neutral-500">
                  История пока пуста
                </div>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-2 rounded-lg bg-black/20 dark:bg-white/5 border border-white/5 flex flex-col gap-0.5 font-mono text-right"
                  >
                    <span className="text-[11px] text-neutral-400">{item.expression} =</span>
                    <span className="text-sm font-semibold text-emerald-400">{item.result}</span>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}

export default App;
