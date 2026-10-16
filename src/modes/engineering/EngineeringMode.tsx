import React, { useState, useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';

type Category = 'length' | 'mass' | 'temperature';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'length', label: 'Длина' },
  { id: 'mass', label: 'Масса' },
  { id: 'temperature', label: 'Темп.' },
];

const UNIT_DATA: Record<Category, { id: string; label: string; toBase: (v: number) => number; fromBase: (v: number) => number }[]> = {
  length: [
    { id: 'km', label: 'Километры', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: 'm', label: 'Метры', toBase: (v) => v, fromBase: (v) => v },
    { id: 'cm', label: 'Сантиметры', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    { id: 'mm', label: 'Миллиметры', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { id: 'mi', label: 'Мили', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    { id: 'ft', label: 'Футы', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    { id: 'in', label: 'Дюймы', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  ],
  mass: [
    { id: 'kg', label: 'Килограммы', toBase: (v) => v, fromBase: (v) => v },
    { id: 'g', label: 'Граммы', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { id: 'mg', label: 'Миллиграммы', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
    { id: 't', label: 'Тонны', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: 'lb', label: 'Фунты', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
    { id: 'oz', label: 'Унции', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
  ],
  temperature: [
    { id: 'c', label: '°C', toBase: (v) => v, fromBase: (v) => v },
    { id: 'f', label: '°F', toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
    { id: 'k', label: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  ],
};

export const EngineeringMode: React.FC = () => {
  const [category, setCategory] = useState<Category>('length');
  const [fromId, setFromId] = useState('m');
  const [toId, setToId] = useState('cm');
  const [input, setInput] = useState('');

  const units = UNIT_DATA[category];

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    const u = UNIT_DATA[cat];
    setFromId(u[0].id);
    setToId(u[1].id);
    setInput('');
  };

  const swap = () => {
    setFromId(toId);
    setToId(fromId);
  };

  const result = useMemo(() => {
    const num = parseFloat(input.replace(',', '.'));
    if (isNaN(num) || input.trim() === '') return '';
    const fromUnit = units.find((u) => u.id === fromId);
    const toUnit = units.find((u) => u.id === toId);
    if (!fromUnit || !toUnit) return '';
    const base = fromUnit.toBase(num);
    const converted = toUnit.fromBase(base);
    const rounded = Math.abs(converted) < 0.0001 && converted !== 0
      ? converted.toExponential(4)
      : parseFloat(converted.toPrecision(10)).toString();
    return rounded;
  }, [input, fromId, toId, units]);

  return (
    <div className="flex-1 flex flex-col select-none overflow-hidden">
      {/* Category selector */}
      <div className="flex gap-1 p-1 rounded-xl bg-black/10 dark:bg-white/5 border border-neutral-700/40 mb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              category === cat.id
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Conversion card */}
      <div className="rounded-xl bg-black/10 dark:bg-white/5 border border-neutral-700/40 p-3 mb-2 flex flex-col gap-1">
        {/* FROM row */}
        <div className="flex items-center gap-2">
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className="w-[120px] shrink-0 py-1.5 px-2 rounded-lg bg-neutral-800/80 border border-neutral-700/60 text-neutral-200 text-[11px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
          <div className="flex-1 text-right text-xl font-mono font-bold text-neutral-100 truncate">
            {input || '0'}
          </div>
        </div>

        {/* Swap */}
        <div className="flex items-center py-0.5">
          <div className="flex-1 border-t border-neutral-700/40" />
          <button
            onClick={swap}
            className="mx-2 p-1 rounded-full bg-neutral-800/60 border border-neutral-700/50 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-neutral-400 hover:text-emerald-400 transition-all active:scale-90"
            title="Поменять местами"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 border-t border-neutral-700/40" />
        </div>

        {/* TO row */}
        <div className="flex items-center gap-2">
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="w-[120px] shrink-0 py-1.5 px-2 rounded-lg bg-neutral-800/80 border border-neutral-700/60 text-neutral-200 text-[11px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
          <div className="flex-1 text-right text-xl font-mono font-bold text-emerald-400 truncate">
            {result || '0'}
          </div>
        </div>

      </div>

      {/* Numpad */}
      <div className="grid grid-cols-4 gap-1 flex-1 text-sm max-sm:text-xl font-mono font-semibold">
        {['7', '8', '9', 'C', '4', '5', '6', '⌫', '1', '2', '3', '.', '±', '0', '00', ''].map((key, i) => {
          if (key === '') return <div key={i} />;
          const isAction = key === 'C' || key === '⌫' || key === '±';
          return (
            <button
              key={i}
              onClick={() => {
                if (key === 'C') setInput('');
                else if (key === '⌫') setInput((prev) => prev.slice(0, -1));
                else if (key === '±') setInput((prev) => prev.startsWith('-') ? prev.slice(1) : prev ? '-' + prev : '-');
                else if (key === '.' && input.includes('.')) return;
                else setInput((prev) => prev + key);
              }}
              className={`py-2.5 rounded-lg border transition-all active:scale-95 ${
                isAction
                  ? key === 'C'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                    : 'bg-white/5 border-neutral-700/30 text-neutral-300 hover:bg-white/10'
                  : 'bg-black/15 dark:bg-white/5 border-neutral-700/30 hover:bg-white/15 text-neutral-100'
              }`}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
};
