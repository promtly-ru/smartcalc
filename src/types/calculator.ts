import React from 'react';

export type CalculatorMode = 'basic' | 'programmer' | 'finance' | 'engineering';

export interface CalculatorModePlugin {
  id: CalculatorMode;
  title: string;
  iconName: string;
  component: React.FC;
  shortcuts?: Record<string, () => void>;
}

export interface CalculationHistoryItem {
  id: string;
  mode: CalculatorMode;
  expression: string;
  result: string;
  timestamp: number;
}
