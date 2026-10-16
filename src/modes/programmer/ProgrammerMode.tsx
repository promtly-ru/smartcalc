import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ProgrammerEngine } from '../../core/programmerEngine';
import type { WordSize, Radix, BitwiseOp } from '../../core/programmerEngine';
import type { CalculationHistoryItem } from '../../types/calculator';
import { Delete, CornerDownLeft, HelpCircle } from 'lucide-react';

interface ProgrammerModeProps {
  onAddHistory: (item: CalculationHistoryItem) => void;
}

const RADIX_INFO: Record<Radix, { name: string; desc: string; hint: string }> = {
  16: { name: 'HEX', desc: 'Шестнадцатеричная', hint: 'Цифры 0-9 и буквы A-F' },
  10: { name: 'DEC', desc: 'Десятичная', hint: 'Обычные числа 0-9' },
  8: { name: 'OCT', desc: 'Восьмеричная', hint: 'Цифры 0-7' },
  2: { name: 'BIN', desc: 'Двоичная', hint: 'Только биты 0 и 1' },
};

const WORD_SIZE_INFO: Record<WordSize, { bits: string; desc: string }> = {
  QWORD: { bits: '64 бит', desc: 'до 18.4 квинтиллионов' },
  DWORD: { bits: '32 бит', desc: 'до 4.2 млрд' },
  WORD: { bits: '16 бит', desc: 'до 65 535' },
  BYTE: { bits: '8 бит', desc: 'до 255' },
};

export const ProgrammerMode: React.FC<ProgrammerModeProps> = ({ onAddHistory }) => {
  const engineRef = useRef<ProgrammerEngine>(new ProgrammerEngine());
  const [wordSize, setWordSize] = useState<WordSize>('QWORD');
  const [activeRadix, setActiveRadix] = useState<Radix>(10);
  const [reps, setReps] = useState({ hex: '0', dec: '0', oct: '0', bin: '0' });
  const [subDisplay, setSubDisplay] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);

  const syncState = useCallback(() => {
    const engine = engineRef.current;
    setWordSize(engine.getWordSize());
    setActiveRadix(engine.getActiveRadix());
    setReps(engine.getRepresentations());

    const prev = engine.getPreviousValue();
    const op = engine.getPendingOp();
    if (prev !== null && op !== null) {
      const bits = engine.getWordBits();
      const prevUnsigned = BigInt.asUintN(bits, prev);
      const radix = engine.getActiveRadix();
      let prevStr = prevUnsigned.toString(radix);
      if (radix === 16) prevStr = prevStr.toUpperCase();
      setSubDisplay(`${prevStr} ${op}`);
    } else {
      setSubDisplay('');
    }
  }, []);

  const handleInputChar = useCallback((c: string) => {
    engineRef.current.inputChar(c);
    syncState();
  }, [syncState]);

  const handleSetOp = useCallback((op: BitwiseOp) => {
    engineRef.current.setOperation(op);
    syncState();
  }, [syncState]);

  const handleCompute = useCallback(() => {
    const engine = engineRef.current;
    const prev = engine.getPreviousValue();
    const op = engine.getPendingOp();
    const curr = engine.getValue();
    const radix = engine.getActiveRadix();

    if (prev !== null && op !== null) {
      engine.compute();
      const res = engine.getValue();
      const bits = engine.getWordBits();

      const a = BigInt.asUintN(bits, prev).toString(radix);
      const b = BigInt.asUintN(bits, curr).toString(radix);
      const r = BigInt.asUintN(bits, res).toString(radix);

      onAddHistory({
        id: crypto.randomUUID(),
        mode: 'programmer',
        expression: `${radix === 16 ? a.toUpperCase() : a} ${op} ${radix === 16 ? b.toUpperCase() : b}`,
        result: radix === 16 ? r.toUpperCase() : r,
        timestamp: Date.now(),
      });
    }
    syncState();
  }, [onAddHistory, syncState]);

  const handleNot = useCallback(() => {
    engineRef.current.not();
    syncState();
  }, [syncState]);

  const handleClear = useCallback(() => {
    engineRef.current.clearAll();
    syncState();
  }, [syncState]);

  const handleClearEntry = useCallback(() => {
    engineRef.current.clearEntry();
    syncState();
  }, [syncState]);

  const handleBackspace = useCallback(() => {
    engineRef.current.backspace();
    syncState();
  }, [syncState]);

  const handleChangeRadix = (radix: Radix) => {
    engineRef.current.setActiveRadix(radix);
    syncState();
  };

  const handleChangeWordSize = (size: WordSize) => {
    engineRef.current.setWordSize(size);
    syncState();
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const key = e.key.toUpperCase();

      if (engineRef.current.isCharAllowed(key)) {
        e.preventDefault();
        handleInputChar(key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCompute();
      } else if (e.key === '+') {
        e.preventDefault();
        handleSetOp('ADD');
      } else if (e.key === '-') {
        e.preventDefault();
        handleSetOp('SUB');
      } else if (e.key === '*') {
        e.preventDefault();
        handleSetOp('MUL');
      } else if (e.key === '/') {
        e.preventDefault();
        handleSetOp('DIV');
      } else if (e.key === '&') {
        e.preventDefault();
        handleSetOp('AND');
      } else if (e.key === '|') {
        e.preventDefault();
        handleSetOp('OR');
      } else if (e.key === '^') {
        e.preventDefault();
        handleSetOp('XOR');
      } else if (e.key === '~') {
        e.preventDefault();
        handleNot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInputChar, handleBackspace, handleClear, handleCompute, handleSetOp, handleNot]);

  const isBtnEnabled = (char: string): boolean => {
    return engineRef.current.isCharAllowed(char);
  };

  // Active value to show in big prominent display
  const currentActiveValue = 
    activeRadix === 16 ? reps.hex :
    activeRadix === 10 ? reps.dec :
    activeRadix === 8 ? reps.oct : reps.bin;

  return (
    <div className="flex-1 flex flex-col justify-between select-none relative">
      {/* 1. TOP PROMINENT DISPLAY WITH LARGE DIGITS */}
      <div className="flex flex-col items-end justify-end px-3 py-2 rounded-xl bg-black/10 dark:bg-white/5 border border-neutral-700/40 mb-2 min-h-20">
        <div className="w-full flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
              {RADIX_INFO[activeRadix].name}
            </span>
            <span className="text-[10px] text-neutral-400 hidden sm:inline">
              {RADIX_INFO[activeRadix].desc}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>{subDisplay}</span>
            <button
              onClick={() => setShowHelp(!showHelp)}
              title="Справка по режиму"
              className="text-neutral-400 hover:text-emerald-400 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Large Main Digits */}
        <div className="w-full text-right mt-0.5">
          <span className="text-3xl font-mono font-bold tracking-tight truncate block text-neutral-100">
            {currentActiveValue}
          </span>
        </div>
      </div>

      {/* 2. COMPACT 4-RADIX CONVERTER (Синхронный перевод) */}
      <div className="bg-black/15 dark:bg-white/5 rounded-xl p-1.5 flex flex-col gap-1 border border-neutral-700/40 font-mono text-[11px] mb-2">
        {[
          { r: 16 as Radix, label: 'HEX', val: reps.hex, color: 'text-emerald-400', activeBg: 'bg-emerald-500/20 ring-1 ring-emerald-500/40' },
          { r: 10 as Radix, label: 'DEC', val: reps.dec, color: 'text-sky-400', activeBg: 'bg-sky-500/20 ring-1 ring-sky-500/40' },
          { r: 8 as Radix, label: 'OCT', val: reps.oct, color: 'text-amber-400', activeBg: 'bg-amber-500/20 ring-1 ring-amber-500/40' },
          { r: 2 as Radix, label: 'BIN', val: reps.bin, color: 'text-purple-400', activeBg: 'bg-purple-500/20 ring-1 ring-purple-500/40' },
        ].map((item) => (
          <button
            key={item.r}
            onClick={() => handleChangeRadix(item.r)}
            className={`flex items-center justify-between px-2 py-0.5 rounded transition-colors text-left ${
              activeRadix === item.r ? `${item.activeBg} font-bold` : 'hover:bg-white/5 text-neutral-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`font-semibold w-7 ${item.color}`}>{item.label}</span>
              <span className="text-[9px] text-neutral-400 font-sans">
                {item.r === 16 ? '(16-ричная)' : item.r === 10 ? '(10-тичная)' : item.r === 8 ? '(8-ричная)' : '(двоичная)'}
              </span>
            </div>
            <span className="truncate max-w-[190px] text-right font-mono text-[10px]">
              {item.val}
            </span>
          </button>
        ))}
      </div>

      {/* 3. BIT SIZE SELECTOR */}
      <div className="flex items-center justify-between bg-black/10 dark:bg-white/5 rounded-lg p-1 text-xs mb-2">
        {(['QWORD', 'DWORD', 'WORD', 'BYTE'] as const).map(size => (
          <button
            key={size}
            onClick={() => handleChangeWordSize(size)}
            title={`${size}: ${WORD_SIZE_INFO[size].bits} (${WORD_SIZE_INFO[size].desc})`}
            className={`flex-1 py-1 rounded text-[10px] font-mono font-medium transition-colors text-center ${
              wordSize === size
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div>{size}</div>
            <div className="text-[8px] opacity-75 font-sans">{WORD_SIZE_INFO[size].bits}</div>
          </button>
        ))}
      </div>

      {/* 4. KEYPAD GRID WITH CLEAR LABELS */}
      <div className="grid grid-cols-5 gap-1 flex-1 text-xs font-mono font-medium mb-1">
        {/* Row 1: Bitwise ops with human tooltips */}
        <button title="Побитовое И (AND)" onClick={() => handleSetOp('AND')} className="p-2 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-emerald-500/20 text-emerald-400 transition-all active:scale-95">AND</button>
        <button title="Побитовое ИЛИ (OR)" onClick={() => handleSetOp('OR')} className="p-2 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-emerald-500/20 text-emerald-400 transition-all active:scale-95">OR</button>
        <button title="Исключающее ИЛИ (XOR)" onClick={() => handleSetOp('XOR')} className="p-2 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-emerald-500/20 text-emerald-400 transition-all active:scale-95">XOR</button>
        <button title="Инверсия бит (NOT)" onClick={handleNot} className="p-2 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-emerald-500/20 text-emerald-400 transition-all active:scale-95">NOT</button>
        <button title="Полная очистка" onClick={handleClear} className="p-2 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-rose-500/20 text-rose-400 transition-all active:scale-95 font-sans font-semibold">C</button>

        {/* Row 2: Hex A-B & Shifts */}
        <button disabled={!isBtnEnabled('A')} onClick={() => handleInputChar('A')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold text-emerald-300">A</button>
        <button disabled={!isBtnEnabled('B')} onClick={() => handleInputChar('B')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold text-emerald-300">B</button>
        <button title="Сдвиг влево (LSH <<)" onClick={() => handleSetOp('LSH')} className="p-2 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-emerald-500/20 text-emerald-400 transition-all active:scale-95">&lt;&lt;</button>
        <button title="Сдвиг вправо (RSH >>)" onClick={() => handleSetOp('RSH')} className="p-2 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-emerald-500/20 text-emerald-400 transition-all active:scale-95">&gt;&gt;</button>
        <button title="Стереть ввод" onClick={handleClearEntry} className="p-2 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-rose-500/20 text-rose-400 transition-all active:scale-95 font-sans">CE</button>

        {/* Row 3: Hex C-D & 7-8-9 */}
        <button disabled={!isBtnEnabled('C')} onClick={() => handleInputChar('C')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold text-emerald-300">C</button>
        <button disabled={!isBtnEnabled('D')} onClick={() => handleInputChar('D')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold text-emerald-300">D</button>
        <button disabled={!isBtnEnabled('7')} onClick={() => handleInputChar('7')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold">7</button>
        <button disabled={!isBtnEnabled('8')} onClick={() => handleInputChar('8')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold">8</button>
        <button disabled={!isBtnEnabled('9')} onClick={() => handleInputChar('9')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold">9</button>

        {/* Row 4: Hex E-F & 4-5-6 */}
        <button disabled={!isBtnEnabled('E')} onClick={() => handleInputChar('E')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold text-emerald-300">E</button>
        <button disabled={!isBtnEnabled('F')} onClick={() => handleInputChar('F')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold text-emerald-300">F</button>
        <button disabled={!isBtnEnabled('4')} onClick={() => handleInputChar('4')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold">4</button>
        <button disabled={!isBtnEnabled('5')} onClick={() => handleInputChar('5')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold">5</button>
        <button disabled={!isBtnEnabled('6')} onClick={() => handleInputChar('6')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold">6</button>

        {/* Row 5: 1-2-3, 0, Backspace */}
        <button disabled={!isBtnEnabled('1')} onClick={() => handleInputChar('1')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold">1</button>
        <button disabled={!isBtnEnabled('2')} onClick={() => handleInputChar('2')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold">2</button>
        <button disabled={!isBtnEnabled('3')} onClick={() => handleInputChar('3')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold">3</button>
        <button disabled={!isBtnEnabled('0')} onClick={() => handleInputChar('0')} className="p-2 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 font-semibold">0</button>
        <button onClick={handleBackspace} title="Стереть символ" className="flex items-center justify-center p-2 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-white/15 transition-all active:scale-95 text-neutral-300">
          <Delete className="w-3.5 h-3.5" />
        </button>

        {/* Row 6: Basic Math & Result */}
        <button onClick={() => handleSetOp('ADD')} className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all active:scale-95 font-bold">+</button>
        <button onClick={() => handleSetOp('SUB')} className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all active:scale-95 font-bold">-</button>
        <button onClick={() => handleSetOp('MUL')} className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all active:scale-95 font-bold">×</button>
        <button onClick={() => handleSetOp('DIV')} className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all active:scale-95 font-bold">÷</button>
        <button onClick={handleCompute} title="Вычислить результат" className="flex items-center justify-center p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all active:scale-95 shadow-md shadow-emerald-500/20">
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Helpful Explain modal for Beginners with clean modern typography (Fits completely without scrolling) */}
      {showHelp && (
        <div className="absolute inset-0 bg-neutral-900/98 dark:bg-neutral-950/98 backdrop-blur-md px-3.5 py-3 flex flex-col z-30 animate-in fade-in font-sans rounded-xl overflow-hidden border border-neutral-800/80 shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800 shrink-0 mb-2">
            <span className="font-semibold text-sm text-neutral-100 tracking-wide">
              Справка по IT-режиму
            </span>
            <button 
              onClick={() => setShowHelp(false)}
              className="text-xs px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
            >
              Закрыть
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-2 text-neutral-200">
            <div className="p-2.5 rounded-lg bg-black/30 dark:bg-white/5 border border-white/5">
              <div className="text-emerald-400 font-semibold mb-0.5 text-xs">
                1. Системы счисления
              </div>
              <p className="text-neutral-300 text-xs leading-relaxed">
                Кликните по строке (HEX, DEC, OCT, BIN) для выбора активной системы ввода.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/30 dark:bg-white/5 border border-white/5">
              <div className="text-sky-400 font-semibold mb-0.5 text-xs">
                2. Разрядность чисел
              </div>
              <p className="text-neutral-300 text-xs leading-relaxed">
                <b>BYTE</b> (8 бит), <b>WORD</b> (16), <b>DWORD</b> (32), <b>QWORD</b> (64 бит). Числа отсекаются по лимиту.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/30 dark:bg-white/5 border border-white/5">
              <div className="text-amber-400 font-semibold mb-0.5 text-xs">
                3. Побитовые операции
              </div>
              <p className="text-neutral-300 text-xs leading-relaxed">
                <b>AND</b> (И), <b>OR</b> (ИЛИ), <b>XOR</b> (Искл. ИЛИ), <b>NOT</b> (Инверсия), <b>&lt;&lt; / &gt;&gt;</b> (Сдвиг).
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/30 dark:bg-white/5 border border-white/5">
              <div className="text-purple-400 font-semibold mb-0.5 text-xs">
                4. Арифметика и клавиши
              </div>
              <p className="text-neutral-300 text-xs leading-relaxed">
                Кнопки `+ - × ÷ ↵` вычисляют целые числа. Недопустимые клавиши блокируются.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
