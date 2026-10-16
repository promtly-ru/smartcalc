import Decimal from 'decimal.js';

export interface LoanResult {
  monthlyPayment: string;
  totalPayment: string;
  totalInterest: string;
}

export interface InvestmentResult {
  futureValue: string;
  totalDeposited: string;
  interestEarned: string;
}

export interface TaxMarginResult {
  taxAmount: string;
  totalWithTax: string;
  netWithoutTax: string;
  marginPercent?: string;
  markupPercent?: string;
}

export class FinanceEngine {
  /**
   * Кредитный / Ипотечный аннуитет
   * @param principal Сумма кредита
   * @param annualRate Годовая ставка в процентах (например, 14.5)
   * @param months Срок в месяцах
   */
  public static calculateLoan(principal: number, annualRate: number, months: number): LoanResult {
    if (principal <= 0 || months <= 0) {
      return { monthlyPayment: '0', totalPayment: '0', totalInterest: '0' };
    }

    const P = new Decimal(principal);
    if (annualRate <= 0) {
      const monthly = P.dividedBy(months);
      return {
        monthlyPayment: monthly.toFixed(2),
        totalPayment: P.toFixed(2),
        totalInterest: '0.00',
      };
    }

    // Месячная ставка = (годовая ставка / 100) / 12
    const r = new Decimal(annualRate).dividedBy(100).dividedBy(12);
    // (1 + r)^n
    const onePlusRToN = new Decimal(1).plus(r).pow(months);
    // Аннуитетный коэффициент = (r * (1 + r)^n) / ((1 + r)^n - 1)
    const annuityRatio = r.times(onePlusRToN).dividedBy(onePlusRToN.minus(1));

    const monthlyPayment = P.times(annuityRatio);
    const totalPayment = monthlyPayment.times(months);
    const totalInterest = totalPayment.minus(P);

    return {
      monthlyPayment: monthlyPayment.toFixed(2),
      totalPayment: totalPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
    };
  }

  /**
   * Сложный процент / Инвестиционный вклад с ежемесячной капитализацией
   * @param initialDeposit Начальный вклад
   * @param monthlyAdd Ежемесячное пополнение
   * @param annualRate Годовая доходность в процентах
   * @param years Срок инвестирования в годах
   */
  public static calculateInvestment(
    initialDeposit: number,
    monthlyAdd: number,
    annualRate: number,
    years: number
  ): InvestmentResult {
    const totalMonths = Math.round(years * 12);
    if (totalMonths <= 0) {
      const init = new Decimal(initialDeposit || 0);
      return { futureValue: init.toFixed(2), totalDeposited: init.toFixed(2), interestEarned: '0.00' };
    }

    const P = new Decimal(initialDeposit || 0);
    const PMT = new Decimal(monthlyAdd || 0);
    const r = new Decimal(annualRate || 0).dividedBy(100).dividedBy(12);

    let futureValue: Decimal;

    if (r.isZero()) {
      futureValue = P.plus(PMT.times(totalMonths));
    } else {
      // FV = P * (1 + r)^n + PMT * [ ((1 + r)^n - 1) / r ]
      const compoundFactor = new Decimal(1).plus(r).pow(totalMonths);
      const principalFV = P.times(compoundFactor);
      const annuityFV = PMT.times(compoundFactor.minus(1).dividedBy(r));
      futureValue = principalFV.plus(annuityFV);
    }

    const totalDeposited = P.plus(PMT.times(totalMonths));
    const interestEarned = futureValue.minus(totalDeposited);

    return {
      futureValue: futureValue.toFixed(2),
      totalDeposited: totalDeposited.toFixed(2),
      interestEarned: interestEarned.toFixed(2),
    };
  }

  /**
   * Расчет НДС / Налога и Скидки / Наценки
   */
  public static calculateTax(amount: number, taxRate: number, isVatIncluded: boolean): TaxMarginResult {
    const A = new Decimal(amount || 0);
    const rate = new Decimal(taxRate || 0).dividedBy(100);

    if (isVatIncluded) {
      // Цена включает налог: НДС = Сумма * rate / (1 + rate)
      const tax = A.times(rate).dividedBy(new Decimal(1).plus(rate));
      const net = A.minus(tax);
      return {
        taxAmount: tax.toFixed(2),
        totalWithTax: A.toFixed(2),
        netWithoutTax: net.toFixed(2),
      };
    } else {
      // Цена без налога: Налог = Сумма * rate
      const tax = A.times(rate);
      const total = A.plus(tax);
      return {
        taxAmount: tax.toFixed(2),
        totalWithTax: total.toFixed(2),
        netWithoutTax: A.toFixed(2),
      };
    }
  }

  /**
   * Наценка и маржа
   * Себестоимость (cost) и Цена продажи (price)
   */
  public static calculateMarginMarkup(cost: number, price: number) {
    if (cost <= 0 || price <= 0) {
      return { profit: '0.00', margin: '0.0', markup: '0.0' };
    }
    const C = new Decimal(cost);
    const P = new Decimal(price);
    const profit = P.minus(C);

    // Маржа = (Прибыль / Цена) * 100
    const margin = profit.dividedBy(P).times(100);
    // Наценка = (Прибыль / Себестоимость) * 100
    const markup = profit.dividedBy(C).times(100);

    return {
      profit: profit.toFixed(2),
      margin: margin.toFixed(1),
      markup: markup.toFixed(1),
    };
  }
}
