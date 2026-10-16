import Decimal from 'decimal.js';

// Configure high precision arithmetic
Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

export type Operation = '+' | '-' | '×' | '÷' | '%';

export interface CalculatorState {
  currentInput: string;
  previousInput: string | null;
  operation: Operation | null;
  isNewInput: boolean;
  memory: Decimal;
}

export class CalculationEngine {
  private state: CalculatorState;

  constructor() {
    this.state = {
      currentInput: '0',
      previousInput: null,
      operation: null,
      isNewInput: true,
      memory: new Decimal(0),
    };
  }

  public getState(): CalculatorState {
    return { ...this.state };
  }

  public inputDigit(digit: string): void {
    if (this.state.isNewInput) {
      this.state.currentInput = digit;
      this.state.isNewInput = false;
    } else {
      if (this.state.currentInput === '0') {
        this.state.currentInput = digit;
      } else {
        this.state.currentInput += digit;
      }
    }
  }

  public inputDecimal(): void {
    if (this.state.isNewInput) {
      this.state.currentInput = '0.';
      this.state.isNewInput = false;
    } else if (!this.state.currentInput.includes('.')) {
      this.state.currentInput += '.';
    }
  }

  public toggleSign(): void {
    if (this.state.currentInput === '0') return;
    if (this.state.currentInput.startsWith('-')) {
      this.state.currentInput = this.state.currentInput.slice(1);
    } else {
      this.state.currentInput = '-' + this.state.currentInput;
    }
  }

  public setOperation(op: Operation): { expression?: string; result?: string; error?: string } | void {
    if (this.state.previousInput && this.state.operation && !this.state.isNewInput) {
      const calcResult = this.compute();
      if (calcResult.error) {
        return calcResult;
      }
    }

    this.state.previousInput = this.state.currentInput;
    this.state.operation = op;
    this.state.isNewInput = true;
  }

  public compute(): { expression?: string; result?: string; error?: string } {
    if (!this.state.previousInput || !this.state.operation) {
      return {};
    }

    const prev = new Decimal(this.state.previousInput);
    const curr = new Decimal(this.state.currentInput);
    const op = this.state.operation;
    let res: Decimal;

    try {
      switch (op) {
        case '+':
          res = prev.plus(curr);
          break;
        case '-':
          res = prev.minus(curr);
          break;
        case '×':
          res = prev.times(curr);
          break;
        case '÷':
          if (curr.isZero()) {
            return { error: 'Деление на ноль' };
          }
          res = prev.dividedBy(curr);
          break;
        case '%':
          // Modulo or percentage calculation: prev * (curr / 100)
          res = prev.times(curr.dividedBy(100));
          break;
        default:
          return {};
      }

      const expression = `${this.state.previousInput} ${op} ${this.state.currentInput}`;
      const resultStr = res.toString();

      this.state.currentInput = resultStr;
      this.state.previousInput = null;
      this.state.operation = null;
      this.state.isNewInput = true;

      return { expression, result: resultStr };
    } catch (err: any) {
      return { error: err.message || 'Ошибка вычислений' };
    }
  }

  public clearEntry(): void {
    this.state.currentInput = '0';
    this.state.isNewInput = true;
  }

  public clearAll(): void {
    this.state.currentInput = '0';
    this.state.previousInput = null;
    this.state.operation = null;
    this.state.isNewInput = true;
  }

  public backspace(): void {
    if (this.state.isNewInput) return;
    if (this.state.currentInput.length <= 1 || (this.state.currentInput.length === 2 && this.state.currentInput.startsWith('-'))) {
      this.state.currentInput = '0';
      this.state.isNewInput = true;
    } else {
      this.state.currentInput = this.state.currentInput.slice(0, -1);
    }
  }

  // Memory functions
  public memoryClear(): void {
    this.state.memory = new Decimal(0);
  }

  public memoryRecall(): void {
    this.state.currentInput = this.state.memory.toString();
    this.state.isNewInput = true;
  }

  public memoryAdd(): void {
    try {
      this.state.memory = this.state.memory.plus(new Decimal(this.state.currentInput));
      this.state.isNewInput = true;
    } catch {
      // ignore
    }
  }

  public memorySubtract(): void {
    try {
      this.state.memory = this.state.memory.minus(new Decimal(this.state.currentInput));
      this.state.isNewInput = true;
    } catch {
      // ignore
    }
  }
}
