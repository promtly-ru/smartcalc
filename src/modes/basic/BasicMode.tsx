import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CalculationEngine } from '../../core/calculationEngine';
import type { Operation } from '../../core/calculationEngine';
import type { CalculationHistoryItem } from '../../types/calculator';
import { Delete, Divide, Minus, Plus, X } from 'lucide-react';

interface BasicModeProps {
  onAddHistory: (item: CalculationHistoryItem) => void;
}

export const BasicMode: React.FC<BasicModeProps> = ({ onAddHistory }) => {
  const engineRef = useRef<CalculationEngine>(new CalculationEngine());
  const [display, setDisplay] = useState('0');
  const [subDisplay, setSubDisplay] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateDisplay = useCallback(() => {
    const state = engineRef.current.getState();
    setDisplay(state.currentInput);
    if (state.previousInput && state.operation) {
      setSubDisplay(`${state.previousInput} ${state.operation}`);
    } else {
      setSubDisplay('');
    }
  }, []);

  const handleDigit = useCallback((d: string) => {
    setErrorMsg(null);
    engineRef.current.inputDigit(d);
    updateDisplay();
  }, [updateDisplay]);

  const handleDecimal = useCallback(() => {
    setErrorMsg(null);
    engineRef.current.inputDecimal();
    updateDisplay();
  }, [updateDisplay]);

  const handleOp = useCallback((op: Operation) => {
    setErrorMsg(null);
    const result = engineRef.current.setOperation(op);
    if (result && result.error) {
      setErrorMsg(result.error);
    } else if (result && result.expression && result.result) {
      onAddHistory({
        id: crypto.randomUUID(),
        mode: 'basic',
        expression: result.expression,
        result: result.result,
        timestamp: Date.now(),
      });
    }
    updateDisplay();
  }, [onAddHistory, updateDisplay]);

  const handleEquals = useCallback(() => {
    setErrorMsg(null);
    const result = engineRef.current.compute();
    if (result.error) {
      setErrorMsg(result.error);
    } else if (result.expression && result.result) {
      onAddHistory({
        id: crypto.randomUUID(),
        mode: 'basic',
        expression: result.expression,
        result: result.result,
        timestamp: Date.now(),
      });
    }
    updateDisplay();
  }, [onAddHistory, updateDisplay]);

  const handleClear = useCallback(() => {
    setErrorMsg(null);
    engineRef.current.clearAll();
    updateDisplay();
  }, [updateDisplay]);

  const handleClearEntry = useCallback(() => {
    setErrorMsg(null);
    engineRef.current.clearEntry();
    updateDisplay();
  }, [updateDisplay]);

  const handleBackspace = useCallback(() => {
    setErrorMsg(null);
    engineRef.current.backspace();
    updateDisplay();
  }, [updateDisplay]);

  const handleToggleSign = useCallback(() => {
    setErrorMsg(null);
    engineRef.current.toggleSign();
    updateDisplay();
  }, [updateDisplay]);

  // Memory operations
  const handleMC = () => { engineRef.current.memoryClear(); };
  const handleMR = () => { engineRef.current.memoryRecall(); updateDisplay(); };
  const handleMPlus = () => { engineRef.current.memoryAdd(); };
  const handleMMinus = () => { engineRef.current.memorySubtract(); };

  // Keyboard support (numpad + standard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === '+' || e.key === '-') {
        e.preventDefault();
        handleOp(e.key as Operation);
      } else if (e.key === '*') {
        e.preventDefault();
        handleOp('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOp('÷');
      } else if (e.key === '%') {
        e.preventDefault();
        handleOp('%');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDecimal, handleOp, handleEquals, handleBackspace, handleClear]);

  return (
    <div className="flex-1 flex flex-col justify-between select-none">
      {/* Display Card */}
      <div className="flex flex-col items-end justify-end px-3 py-2 rounded-xl bg-black/10 dark:bg-white/5 border border-neutral-700/40 mb-2 min-h-24">
        <span className="text-[11px] text-neutral-400 font-mono tracking-wider h-4">
          {subDisplay}
        </span>
        {errorMsg ? (
          <span className="text-sm font-medium text-rose-500 font-mono mt-1">
            {errorMsg}
          </span>
        ) : (
          <span className="text-3xl max-sm:text-5xl font-mono font-semibold tracking-tight text-right truncate w-full mt-1">
            {display}
          </span>
        )}
      </div>

      {/* Memory Row */}
      <div className="grid grid-cols-4 gap-1.5 mb-2 text-xs font-mono">
        <button 
          onClick={handleMC} 
          className="py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          MC
        </button>
        <button 
          onClick={handleMR} 
          className="py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          MR
        </button>
        <button 
          onClick={handleMPlus} 
          className="py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          M+
        </button>
        <button 
          onClick={handleMMinus} 
          className="py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          M-
        </button>
      </div>

      {/* Keypad Grid (4 columns) */}
      <div className="grid grid-cols-4 gap-1.5 flex-1 text-sm max-sm:text-xl font-medium">
        {/* Row 1 */}
        <button onClick={handleClearEntry} className="py-2.5 rounded-xl bg-black/10 dark:bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 transition-all active:scale-95 text-neutral-300">
          CE
        </button>
        <button onClick={handleClear} className="py-2.5 rounded-xl bg-black/10 dark:bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 transition-all active:scale-95 text-neutral-300">
          C
        </button>
        <button onClick={handleBackspace} className="flex items-center justify-center py-2.5 rounded-xl bg-black/10 dark:bg-white/5 hover:bg-white/15 transition-all active:scale-95 text-neutral-300">
          <Delete className="w-4 h-4" />
        </button>
        <button onClick={() => handleOp('÷')} className="flex items-center justify-center py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all active:scale-95">
          <Divide className="w-4 h-4" />
        </button>

        {/* Row 2 */}
        <button onClick={() => handleDigit('7')} className="py-2.5 rounded-xl bg-black/15 dark:bg-white/10 hover:bg-white/20 transition-all active:scale-95 font-semibold">
          7
        </button>
        <button onClick={() => handleDigit('8')} className="py-2.5 rounded-xl bg-black/15 dark:bg-white/10 hover:bg-white/20 transition-all active:scale-95 font-semibold">
          8
        </button>
        <button onClick={() => handleDigit('9')} className="py-2.5 rounded-xl bg-black/15 dark:bg-white/10 hover:bg-white/20 transition-all active:scale-95 font-semibold">
          9
        </button>
        <button onClick={() => handleOp('×')} className="flex items-center justify-center py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all active:scale-95">
          <X className="w-4 h-4" />
        </button>

        {/* Row 3 */}
        <button onClick={() => handleDigit('4')} className="py-2.5 rounded-xl bg-black/15 dark:bg-white/10 hover:bg-white/20 transition-all active:scale-95 font-semibold">
          4
        </button>
        <button onClick={() => handleDigit('5')} className="py-2.5 rounded-xl bg-black/15 dark:bg-white/10 hover:bg-white/20 transition-all active:scale-95 font-semibold">
          5
        </button>
        <button onClick={() => handleDigit('6')} className="py-2.5 rounded-xl bg-black/15 dark:bg-white/10 hover:bg-white/20 transition-all active:scale-95 font-semibold">
          6
        </button>
        <button onClick={() => handleOp('-')} className="flex items-center justify-center py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all active:scale-95">
          <Minus className="w-4 h-4" />
        </button>

        {/* Row 4 */}
        <button onClick={() => handleDigit('1')} className="py-2.5 rounded-xl bg-black/15 dark:bg-white/10 hover:bg-white/20 transition-all active:scale-95 font-semibold">
          1
        </button>
        <button onClick={() => handleDigit('2')} className="py-2.5 rounded-xl bg-black/15 dark:bg-white/10 hover:bg-white/20 transition-all active:scale-95 font-semibold">
          2
        </button>
        <button onClick={() => handleDigit('3')} className="py-2.5 rounded-xl bg-black/15 dark:bg-white/10 hover:bg-white/20 transition-all active:scale-95 font-semibold">
          3
        </button>
        <button onClick={() => handleOp('+')} className="flex items-center justify-center py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all active:scale-95">
          <Plus className="w-4 h-4" />
        </button>

        {/* Row 5 */}
        <button onClick={handleToggleSign} className="py-2.5 rounded-xl bg-black/10 dark:bg-white/5 hover:bg-white/15 transition-all active:scale-95 text-neutral-300">
          ±
        </button>
        <button onClick={() => handleDigit('0')} className="py-2.5 rounded-xl bg-black/15 dark:bg-white/10 hover:bg-white/20 transition-all active:scale-95 font-semibold">
          0
        </button>
        <button onClick={handleDecimal} className="py-2.5 rounded-xl bg-black/10 dark:bg-white/5 hover:bg-white/15 transition-all active:scale-95 font-bold">
          .
        </button>
        <button onClick={handleEquals} className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all active:scale-95 shadow-md shadow-emerald-500/20">
          =
        </button>
      </div>
    </div>
  );
};
