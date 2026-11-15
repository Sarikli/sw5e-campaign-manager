import { create } from 'zustand';
import {
  rollDamage,
  rollNotation,
  SUPPORTED_DICE,
  type AdvantageMode,
  type DieSides,
  type RollOutcome,
} from '../../domain/calculations/dice';

export interface RollLogEntry {
  id: string;
  label: string;
  outcome: RollOutcome;
  rolledAt: string;
}

interface DiceUiState {
  mode: AdvantageMode;
  history: RollLogEntry[];
  setMode: (mode: AdvantageMode) => void;
  rollCheck: (label: string, modifier: number) => RollOutcome;
  rollDieQuick: (sides: DieSides, count?: number, modifier?: number) => RollOutcome;
  rollWeaponDamage: (label: string, notation: string, critical?: boolean) => RollOutcome;
  clearHistory: () => void;
}

let seq = 0;

export const useDiceStore = create<DiceUiState>((set, get) => ({
  mode: 'normal',
  history: [],
  setMode: (mode) => set({ mode }),
  rollCheck: (label, modifier) => {
    const { mode, history } = get();
    const sign = modifier >= 0 ? `+${modifier}` : `${modifier}`;
    const outcome = rollNotation(`1d20${sign}`, mode);
    const entry: RollLogEntry = {
      id: `roll-${Date.now()}-${++seq}`,
      label,
      outcome,
      rolledAt: new Date().toISOString(),
    };
    set({ history: [entry, ...history].slice(0, 40) });
    return outcome;
  },
  rollDieQuick: (sides, count = 1, modifier = 0) => {
    const { mode, history } = get();
    const sign = modifier === 0 ? '' : modifier > 0 ? `+${modifier}` : `${modifier}`;
    const effectiveMode = count === 1 && sides === 20 ? mode : 'normal';
    const outcome = rollNotation(`${count}d${sides}${sign}`, effectiveMode);
    const entry: RollLogEntry = {
      id: `roll-${Date.now()}-${++seq}`,
      label: `${count}d${sides}${sign}`,
      outcome,
      rolledAt: new Date().toISOString(),
    };
    set({ history: [entry, ...history].slice(0, 40) });
    return outcome;
  },
  rollWeaponDamage: (label, notation, critical = false) => {
    const { history } = get();
    const outcome = rollDamage(notation, { critical });
    const entry: RollLogEntry = {
      id: `roll-${Date.now()}-${++seq}`,
      label: critical ? `${label} (CRIT)` : label,
      outcome,
      rolledAt: new Date().toISOString(),
    };
    set({ history: [entry, ...history].slice(0, 40) });
    return outcome;
  },
  clearHistory: () => set({ history: [] }),
}));

export { SUPPORTED_DICE };
