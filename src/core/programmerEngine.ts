export type WordSize = 'QWORD' | 'DWORD' | 'WORD' | 'BYTE';
export type Radix = 16 | 10 | 8 | 2;
export type BitwiseOp = 'AND' | 'OR' | 'XOR' | 'LSH' | 'RSH' | 'ADD' | 'SUB' | 'MUL' | 'DIV';

export class ProgrammerEngine {
  private value: bigint = 0n;
  private previousValue: bigint | null = null;
  private pendingOp: BitwiseOp | null = null;
  private wordSize: WordSize = 'QWORD';
  private activeRadix: Radix = 10;
  private isNewInput: boolean = true;

  public getWordBits(): number {
    switch (this.wordSize) {
      case 'QWORD': return 64;
      case 'DWORD': return 32;
      case 'WORD': return 16;
      case 'BYTE': return 8;
    }
  }

  public getMask(): bigint {
    const bits = BigInt(this.getWordBits());
    return (1n << bits) - 1n;
  }

  public clamp(val: bigint): bigint {
    const bits = this.getWordBits();
    // Return unsigned representation clamped to word bit size
    return BigInt.asUintN(bits, val);
  }

  public setWordSize(size: WordSize): void {
    this.wordSize = size;
    this.value = this.clamp(this.value);
    if (this.previousValue !== null) {
      this.previousValue = this.clamp(this.previousValue);
    }
  }

  public getWordSize(): WordSize {
    return this.wordSize;
  }

  public setActiveRadix(radix: Radix): void {
    this.activeRadix = radix;
  }

  public getActiveRadix(): Radix {
    return this.activeRadix;
  }

  public getValue(): bigint {
    return this.value;
  }

  public getPendingOp(): BitwiseOp | null {
    return this.pendingOp;
  }

  public getPreviousValue(): bigint | null {
    return this.previousValue;
  }

  public isCharAllowed(char: string): boolean {
    const c = char.toUpperCase();
    if (this.activeRadix === 2) return c === '0' || c === '1';
    if (this.activeRadix === 8) return /^[0-7]$/.test(c);
    if (this.activeRadix === 10) return /^[0-9]$/.test(c);
    if (this.activeRadix === 16) return /^[0-9A-F]$/.test(c);
    return false;
  }

  public inputChar(char: string): void {
    const c = char.toUpperCase();
    if (!this.isCharAllowed(c)) return;

    const radixBig = BigInt(this.activeRadix);
    const digitVal = BigInt(parseInt(c, this.activeRadix));

    if (this.isNewInput) {
      this.value = this.clamp(digitVal);
      this.isNewInput = false;
    } else {
      const nextVal = this.value * radixBig + digitVal;
      this.value = this.clamp(nextVal);
    }
  }

  public backspace(): void {
    if (this.isNewInput) return;
    const radixBig = BigInt(this.activeRadix);
    this.value = this.value / radixBig;
  }

  public clearEntry(): void {
    this.value = 0n;
    this.isNewInput = true;
  }

  public clearAll(): void {
    this.value = 0n;
    this.previousValue = null;
    this.pendingOp = null;
    this.isNewInput = true;
  }

  public not(): void {
    const bits = this.getWordBits();
    this.value = BigInt.asUintN(bits, ~this.value);
    this.isNewInput = true;
  }

  public setOperation(op: BitwiseOp): void {
    if (this.previousValue !== null && this.pendingOp !== null && !this.isNewInput) {
      this.compute();
    }
    this.previousValue = this.value;
    this.pendingOp = op;
    this.isNewInput = true;
  }

  public compute(): void {
    if (this.previousValue === null || this.pendingOp === null) return;

    const a = this.previousValue;
    const b = this.value;
    let res: bigint = 0n;

    switch (this.pendingOp) {
      case 'AND':
        res = a & b;
        break;
      case 'OR':
        res = a | b;
        break;
      case 'XOR':
        res = a ^ b;
        break;
      case 'LSH':
        res = a << (b & 63n);
        break;
      case 'RSH':
        res = a >> (b & 63n);
        break;
      case 'ADD':
        res = a + b;
        break;
      case 'SUB':
        res = a - b;
        break;
      case 'MUL':
        res = a * b;
        break;
      case 'DIV':
        if (b === 0n) {
          this.value = 0n;
          this.previousValue = null;
          this.pendingOp = null;
          this.isNewInput = true;
          return;
        }
        res = a / b;
        break;
    }

    this.value = this.clamp(res);
    this.previousValue = null;
    this.pendingOp = null;
    this.isNewInput = true;
  }

  public getRepresentations(): { hex: string; dec: string; oct: string; bin: string } {
    const bits = this.getWordBits();
    const unsignedVal = BigInt.asUintN(bits, this.value);

    // Format binary with 4-bit spacing
    let rawBin = unsignedVal.toString(2);
    // Pad to multiple of 4
    const padLen = (4 - (rawBin.length % 4)) % 4;
    rawBin = '0'.repeat(padLen) + rawBin;
    const binFormatted = rawBin.match(/.{1,4}/g)?.join(' ') || '0';

    return {
      hex: unsignedVal.toString(16).toUpperCase(),
      dec: unsignedVal.toString(10),
      oct: unsignedVal.toString(8),
      bin: binFormatted,
    };
  }
}
