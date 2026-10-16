import React, { useState, useMemo } from 'react';
import { FinanceEngine } from '../../core/financeEngine';
import type { CalculationHistoryItem } from '../../types/calculator';
import { Landmark, TrendingUp, ReceiptText, Percent, Save, HelpCircle } from 'lucide-react';

interface FinanceModeProps {
  onAddHistory: (item: CalculationHistoryItem) => void;
}

type FinanceTab = 'loan' | 'invest' | 'tax' | 'margin';

export const FinanceMode: React.FC<FinanceModeProps> = ({ onAddHistory }) => {
  const [tab, setTab] = useState<FinanceTab>('loan');
  const [showHelp, setShowHelp] = useState(false);

  // 1. Кредитный калькулятор
  const [loanPrincipal, setLoanPrincipal] = useState<string>('500000');
  const [loanRate, setLoanRate] = useState<string>('16.5');
  const [loanTermYears, setLoanTermYears] = useState<string>('3');

  const loanResult = useMemo(() => {
    const p = parseFloat(loanPrincipal) || 0;
    const r = parseFloat(loanRate) || 0;
    const months = Math.round((parseFloat(loanTermYears) || 0) * 12);
    return FinanceEngine.calculateLoan(p, r, months);
  }, [loanPrincipal, loanRate, loanTermYears]);

  // 2. Вклад / Инвестиции
  const [investDeposit, setInvestDeposit] = useState<string>('100000');
  const [investMonthly, setInvestMonthly] = useState<string>('15000');
  const [investRate, setInvestRate] = useState<string>('18.0');
  const [investYears, setInvestYears] = useState<string>('5');

  const investResult = useMemo(() => {
    const d = parseFloat(investDeposit) || 0;
    const m = parseFloat(investMonthly) || 0;
    const r = parseFloat(investRate) || 0;
    const y = parseFloat(investYears) || 0;
    return FinanceEngine.calculateInvestment(d, m, r, y);
  }, [investDeposit, investMonthly, investRate, investYears]);

  // 3. Налог / НДС
  const [taxAmount, setTaxAmount] = useState<string>('10000');
  const [taxRate, setTaxRate] = useState<string>('20');
  const [isVatIncluded, setIsVatIncluded] = useState<boolean>(false);

  const taxResult = useMemo(() => {
    const a = parseFloat(taxAmount) || 0;
    const r = parseFloat(taxRate) || 0;
    return FinanceEngine.calculateTax(a, r, isVatIncluded);
  }, [taxAmount, taxRate, isVatIncluded]);

  // 4. Наценка и маржа
  const [marginCost, setMarginCost] = useState<string>('1500');
  const [marginPrice, setMarginPrice] = useState<string>('2500');

  const marginResult = useMemo(() => {
    const c = parseFloat(marginCost) || 0;
    const p = parseFloat(marginPrice) || 0;
    return FinanceEngine.calculateMarginMarkup(c, p);
  }, [marginCost, marginPrice]);

  // Сохранить текущий расчет в историю
  const saveToHistory = () => {
    if (tab === 'loan') {
      onAddHistory({
        id: crypto.randomUUID(),
        mode: 'finance',
        expression: `Кредит ${loanPrincipal} ₽ (${loanRate}%, ${loanTermYears}г)`,
        result: `Платёж ${loanResult.monthlyPayment} ₽/мес (Переплата ${loanResult.totalInterest} ₽)`,
        timestamp: Date.now(),
      });
    } else if (tab === 'invest') {
      onAddHistory({
        id: crypto.randomUUID(),
        mode: 'finance',
        expression: `Вклад ${investDeposit} ₽ + ${investMonthly} ₽/мес (${investRate}%, ${investYears}г)`,
        result: `Итог ${investResult.futureValue} ₽ (Доход ${investResult.interestEarned} ₽)`,
        timestamp: Date.now(),
      });
    } else if (tab === 'tax') {
      onAddHistory({
        id: crypto.randomUUID(),
        mode: 'finance',
        expression: `НДС ${taxRate}% от ${taxAmount} ₽ (${isVatIncluded ? 'вкл' : 'сверху'})`,
        result: `Налог ${taxResult.taxAmount} ₽, Итого ${taxResult.totalWithTax} ₽`,
        timestamp: Date.now(),
      });
    } else if (tab === 'margin') {
      onAddHistory({
        id: crypto.randomUUID(),
        mode: 'finance',
        expression: `Маржа: Себест. ${marginCost} ₽ -> Цена ${marginPrice} ₽`,
        result: `Прибыль ${marginResult.profit} ₽ (Маржа ${marginResult.margin}%, Наценка ${marginResult.markup}%)`,
        timestamp: Date.now(),
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-xs overflow-hidden relative">
      {/* Шапка подвкладок с кнопкой справки */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <div className="flex-1 grid grid-cols-4 gap-1 p-1 bg-black/10 dark:bg-white/5 rounded-xl">
          {[
            { id: 'loan', label: 'Кредит', icon: Landmark },
            { id: 'invest', label: 'Вклад', icon: TrendingUp },
            { id: 'tax', label: 'НДС', icon: ReceiptText },
            { id: 'margin', label: 'Маржа', icon: Percent },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as FinanceTab)}
                className={`flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-lg transition-all text-center ${
                  isActive
                    ? 'bg-emerald-500 text-white font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] truncate">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Кнопка справки */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          title="Справка по финансовым расчётам"
          className="p-2 rounded-xl bg-black/10 dark:bg-white/5 hover:bg-emerald-500/20 text-neutral-400 hover:text-emerald-400 transition-colors shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Рабочая область выбранного калькулятора */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-0.5">
        {/* 1. КРЕДИТНЫЙ КАЛЬКУЛЯТОР */}
        {tab === 'loan' && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 bg-black/10 dark:bg-white/5 p-2.5 rounded-xl border border-white/5">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Сумма кредита (₽)</label>
                <input
                  type="number"
                  value={loanPrincipal}
                  onChange={(e) => setLoanPrincipal(e.target.value)}
                  className="w-full bg-black/20 dark:bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-neutral-100 font-mono text-sm focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Ставка (% год)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={loanRate}
                    onChange={(e) => setLoanRate(e.target.value)}
                    className="w-full bg-black/20 dark:bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-neutral-100 font-mono text-sm focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Срок (лет)</label>
                  <input
                    type="number"
                    value={loanTermYears}
                    onChange={(e) => setLoanTermYears(e.target.value)}
                    className="w-full bg-black/20 dark:bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-neutral-100 font-mono text-sm focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Карточка результатов */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-neutral-400">Ежемесячный платёж:</span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {Number(loanResult.monthlyPayment).toLocaleString()} ₽
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px] text-neutral-400 border-t border-white/5 pt-1 mt-0.5">
                <span>Переплата по процентам:</span>
                <span className="font-mono text-neutral-200">
                  {Number(loanResult.totalInterest).toLocaleString()} ₽
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px] text-neutral-400">
                <span>Итоговая выплата:</span>
                <span className="font-mono text-neutral-200">
                  {Number(loanResult.totalPayment).toLocaleString()} ₽
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. ВКЛАД И СЛОЖНЫЙ ПРОЦЕНТ */}
        {tab === 'invest' && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 bg-black/10 dark:bg-white/5 p-2.5 rounded-xl border border-white/5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Стартовый вклад (₽)</label>
                  <input
                    type="number"
                    value={investDeposit}
                    onChange={(e) => setInvestDeposit(e.target.value)}
                    className="w-full bg-black/20 dark:bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-neutral-100 font-mono text-sm focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Пополнение/мес (₽)</label>
                  <input
                    type="number"
                    value={investMonthly}
                    onChange={(e) => setInvestMonthly(e.target.value)}
                    className="w-full bg-black/20 dark:bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-neutral-100 font-mono text-sm focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Доходность (% год)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={investRate}
                    onChange={(e) => setInvestRate(e.target.value)}
                    className="w-full bg-black/20 dark:bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-neutral-100 font-mono text-sm focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Срок (лет)</label>
                  <input
                    type="number"
                    value={investYears}
                    onChange={(e) => setInvestYears(e.target.value)}
                    className="w-full bg-black/20 dark:bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-neutral-100 font-mono text-sm focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Карточка результатов */}
            <div className="bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-xl flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-neutral-400">Итоговый капитал:</span>
                <span className="text-lg font-bold font-mono text-sky-400">
                  {Number(investResult.futureValue).toLocaleString()} ₽
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px] text-neutral-400 border-t border-white/5 pt-1 mt-0.5">
                <span>Начисленный доход:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  +{Number(investResult.interestEarned).toLocaleString()} ₽
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px] text-neutral-400">
                <span>Сумма внесённых средств:</span>
                <span className="font-mono text-neutral-200">
                  {Number(investResult.totalDeposited).toLocaleString()} ₽
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. НДС И НАЛОГ */}
        {tab === 'tax' && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 bg-black/10 dark:bg-white/5 p-2.5 rounded-xl border border-white/5">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Сумма (₽)</label>
                <input
                  type="number"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  className="w-full bg-black/20 dark:bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-neutral-100 font-mono text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Ставка налога (%)</label>
                <div className="flex gap-1.5">
                  {['20', '10', '13', '6'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setTaxRate(r)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                        taxRate === r ? 'bg-emerald-500 text-white font-semibold' : 'bg-black/20 dark:bg-white/10 text-neutral-300'
                      }`}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[11px] text-neutral-300">Налог включён в сумму:</span>
                <button
                  onClick={() => setIsVatIncluded(!isVatIncluded)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isVatIncluded ? 'bg-emerald-500 text-white' : 'bg-black/20 dark:bg-white/10 text-neutral-400'
                  }`}
                >
                  {isVatIncluded ? 'Да (Включён)' : 'Нет (Сверху)'}
                </button>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-neutral-400">Сумма налога:</span>
                <span className="text-lg font-bold font-mono text-amber-400">
                  {Number(taxResult.taxAmount).toLocaleString()} ₽
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px] text-neutral-400 border-t border-white/5 pt-1 mt-0.5">
                <span>Итого к оплате:</span>
                <span className="font-mono text-neutral-200">
                  {Number(taxResult.totalWithTax).toLocaleString()} ₽
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px] text-neutral-400">
                <span>Сумма без налога:</span>
                <span className="font-mono text-neutral-200">
                  {Number(taxResult.netWithoutTax).toLocaleString()} ₽
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4. МАРЖА И НАЦЕНКА */}
        {tab === 'margin' && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 bg-black/10 dark:bg-white/5 p-2.5 rounded-xl border border-white/5">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Себестоимость (₽)</label>
                <input
                  type="number"
                  value={marginCost}
                  onChange={(e) => setMarginCost(e.target.value)}
                  className="w-full bg-black/20 dark:bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-neutral-100 font-mono text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Цена продажи (₽)</label>
                <input
                  type="number"
                  value={marginPrice}
                  onChange={(e) => setMarginPrice(e.target.value)}
                  className="w-full bg-black/20 dark:bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-neutral-100 font-mono text-sm focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-xl flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-neutral-400">Чистая прибыль:</span>
                <span className="text-lg font-bold font-mono text-purple-400">
                  {Number(marginResult.profit).toLocaleString()} ₽
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px] text-neutral-400 border-t border-white/5 pt-1 mt-0.5">
                <span>Рентабельность (Маржа):</span>
                <span className="font-mono text-emerald-400 font-semibold">{marginResult.margin}%</span>
              </div>
              <div className="flex justify-between items-baseline text-[11px] text-neutral-400">
                <span>Торговая наценка:</span>
                <span className="font-mono text-sky-400 font-semibold">{marginResult.markup}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Кнопка сохранить расчет в историю */}
        <button
          onClick={saveToHistory}
          className="mt-2.5 w-full py-2 px-3 rounded-xl bg-black/10 dark:bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-neutral-300 transition-all flex items-center justify-center gap-1.5 font-medium active:scale-98"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Сохранить расчет в историю</span>
        </button>
      </div>

      {/* Модальное окно справки по финансовому режиму (Скруглённые края, увеличенный текст, минимальный отступ) */}
      {showHelp && (
        <div className="absolute inset-0 bg-neutral-900/98 dark:bg-neutral-950/98 backdrop-blur-md px-3.5 py-3 flex flex-col z-30 animate-in fade-in font-sans rounded-xl overflow-hidden border border-neutral-800/80 shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800 shrink-0 mb-2">
            <span className="font-semibold text-sm text-neutral-100 tracking-wide">
              Справка по финансовым расчётам
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
                1. Кредит (Аннуитет)
              </div>
              <p className="text-neutral-300 text-xs leading-relaxed">
                Рассчитывает равные ежемесячные платежи и точную переплату по процентам.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/30 dark:bg-white/5 border border-white/5">
              <div className="text-sky-400 font-semibold mb-0.5 text-xs">
                2. Сложный процент (Вклады)
              </div>
              <p className="text-neutral-300 text-xs leading-relaxed">
                Ежемесячная капитализация дохода с учётом ваших регулярных довнесений.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/30 dark:bg-white/5 border border-white/5">
              <div className="text-amber-400 font-semibold mb-0.5 text-xs">
                3. НДС и налоги
              </div>
              <p className="text-neutral-300 text-xs leading-relaxed">
                «Включён» — выделение налога из суммы. «Сверху» — начисление процента к чистой сумме.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/30 dark:bg-white/5 border border-white/5">
              <div className="text-purple-400 font-semibold mb-0.5 text-xs">
                4. Маржа и наценка
              </div>
              <p className="text-neutral-300 text-xs leading-relaxed">
                <b>Маржа</b> — доля прибыли в цене продажи. <b>Наценка</b> — процент надбавки к себестоимости.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
