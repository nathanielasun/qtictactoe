/**
 * Quantum circuit TypeScript type definitions.
 */

/** Gate categories */
export type GateCategory = 'single' | 'rotation' | 'controlled' | 'measurement';

/** Available gate types */
export type GateType =
  | 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'Sdg' | 'Tdg' | 'SX' | 'I'
  | 'Rx' | 'Ry' | 'Rz' | 'P' | 'U'
  | 'CNOT' | 'CX' | 'CZ' | 'SWAP';

/** Gate definition for UI */
export interface GateDefinition {
  id: GateType;
  name: string;
  symbol: string;
  category: GateCategory;
  numQubits: 1 | 2;
  hasAngle?: boolean;
  hasMultipleAngles?: boolean;
  description: string;
  color: string;
}

/** A gate instance placed on the circuit */
export interface GateInstance {
  /** Unique ID for this gate instance */
  id: string;
  /** Gate type */
  type: GateType;
  /** Target qubit index */
  target: number;
  /** Control qubit (for two-qubit gates) */
  control?: number;
  /** Angle in radians (for rotation gates) */
  angle?: number;
  /** Multiple angles (for U gate) */
  angles?: number[];
  /** Column position in circuit */
  column?: number;
  /** Position alias */
  position?: number;
}

/** Circuit state */
export interface CircuitState {
  /** Number of qubits */
  numQubits: number;
  /** Gates in the circuit */
  gates: GateInstance[];
  /** Current circuit depth */
  depth?: number;
  /** Maximum allowed depth */
  maxDepth?: number;
}

/** Measurement results from circuit execution */
export interface MeasurementResults {
  /** Counts for each basis state */
  counts: Record<string, number>;
  /** Total number of shots */
  shots: number;
  /** State with highest count */
  winningState: string;
  /** Count of the winning state */
  winningCount?: number;
  /** Probability distribution */
  probabilities?: Record<string, number>;
}

/** Gate definitions for the UI */
export const GATE_DEFINITIONS: Record<GateType, GateDefinition> = {
  // Single-qubit Clifford gates
  H: {
    id: 'H',
    name: 'Hadamard',
    symbol: 'H',
    category: 'single',
    numQubits: 1,
    description: 'Creates superposition: |0⟩ → (|0⟩+|1⟩)/√2',
    color: '#4A90D9',
  },
  X: {
    id: 'X',
    name: 'Pauli-X',
    symbol: 'X',
    category: 'single',
    numQubits: 1,
    description: 'Bit flip (NOT gate): |0⟩ ↔ |1⟩',
    color: '#E74C3C',
  },
  Y: {
    id: 'Y',
    name: 'Pauli-Y',
    symbol: 'Y',
    category: 'single',
    numQubits: 1,
    description: 'Y rotation with phase',
    color: '#27AE60',
  },
  Z: {
    id: 'Z',
    name: 'Pauli-Z',
    symbol: 'Z',
    category: 'single',
    numQubits: 1,
    description: 'Phase flip: |1⟩ → -|1⟩',
    color: '#9B59B6',
  },
  S: {
    id: 'S',
    name: 'S Gate',
    symbol: 'S',
    category: 'single',
    numQubits: 1,
    description: 'π/2 phase gate (√Z)',
    color: '#F39C12',
  },
  T: {
    id: 'T',
    name: 'T Gate',
    symbol: 'T',
    category: 'single',
    numQubits: 1,
    description: 'π/4 phase gate (√S)',
    color: '#1ABC9C',
  },
  Sdg: {
    id: 'Sdg',
    name: 'S† Gate',
    symbol: 'S†',
    category: 'single',
    numQubits: 1,
    description: 'Inverse of S gate',
    color: '#F39C12',
  },
  Tdg: {
    id: 'Tdg',
    name: 'T† Gate',
    symbol: 'T†',
    category: 'single',
    numQubits: 1,
    description: 'Inverse of T gate',
    color: '#1ABC9C',
  },
  SX: {
    id: 'SX',
    name: '√X Gate',
    symbol: '√X',
    category: 'single',
    numQubits: 1,
    description: 'Square root of X gate',
    color: '#E74C3C',
  },
  I: {
    id: 'I',
    name: 'Identity',
    symbol: 'I',
    category: 'single',
    numQubits: 1,
    description: 'Identity gate (no operation)',
    color: '#95A5A6',
  },

  // Rotation gates
  Rx: {
    id: 'Rx',
    name: 'Rx Rotation',
    symbol: 'Rx',
    category: 'rotation',
    numQubits: 1,
    hasAngle: true,
    description: 'Rotation around X-axis',
    color: '#E74C3C',
  },
  Ry: {
    id: 'Ry',
    name: 'Ry Rotation',
    symbol: 'Ry',
    category: 'rotation',
    numQubits: 1,
    hasAngle: true,
    description: 'Rotation around Y-axis',
    color: '#27AE60',
  },
  Rz: {
    id: 'Rz',
    name: 'Rz Rotation',
    symbol: 'Rz',
    category: 'rotation',
    numQubits: 1,
    hasAngle: true,
    description: 'Rotation around Z-axis',
    color: '#9B59B6',
  },
  P: {
    id: 'P',
    name: 'Phase Gate',
    symbol: 'P',
    category: 'rotation',
    numQubits: 1,
    hasAngle: true,
    description: 'Phase shift gate',
    color: '#3498DB',
  },
  U: {
    id: 'U',
    name: 'U Gate',
    symbol: 'U',
    category: 'rotation',
    numQubits: 1,
    hasMultipleAngles: true,
    description: 'Universal single-qubit gate U(θ, φ, λ)',
    color: '#8E44AD',
  },

  // Two-qubit gates
  CNOT: {
    id: 'CNOT',
    name: 'CNOT',
    symbol: 'CX',
    category: 'controlled',
    numQubits: 2,
    description: 'Controlled-NOT gate',
    color: '#2C3E50',
  },
  CX: {
    id: 'CX',
    name: 'CX',
    symbol: 'CX',
    category: 'controlled',
    numQubits: 2,
    description: 'Controlled-X gate (same as CNOT)',
    color: '#2C3E50',
  },
  CZ: {
    id: 'CZ',
    name: 'CZ Gate',
    symbol: 'CZ',
    category: 'controlled',
    numQubits: 2,
    description: 'Controlled-Z gate',
    color: '#2C3E50',
  },
  SWAP: {
    id: 'SWAP',
    name: 'SWAP',
    symbol: '×',
    category: 'controlled',
    numQubits: 2,
    description: 'Swaps two qubits',
    color: '#2C3E50',
  },
};

/** Gate categories for UI organization */
export const GATE_CATEGORIES = [
  {
    id: 'single',
    name: 'Single Qubit',
    gates: ['H', 'X', 'Y', 'Z', 'S', 'T'] as GateType[],
  },
  {
    id: 'rotation',
    name: 'Rotation',
    gates: ['Rx', 'Ry', 'Rz'] as GateType[],
  },
  {
    id: 'controlled',
    name: 'Two-Qubit',
    gates: ['CNOT', 'CZ', 'SWAP'] as GateType[],
  },
];

/** Common angle presets */
export const ANGLE_PRESETS = [
  { label: 'π', value: Math.PI },
  { label: 'π/2', value: Math.PI / 2 },
  { label: 'π/4', value: Math.PI / 4 },
  { label: '-π', value: -Math.PI },
  { label: '-π/2', value: -Math.PI / 2 },
  { label: '-π/4', value: -Math.PI / 4 },
];

/** Circuit limits for gameplay */
export const CIRCUIT_LIMITS = {
  maxDepth: 20,
  maxGates: 50,
};

/** Create an empty circuit */
export function createEmptyCircuit(numQubits: number): CircuitState {
  return {
    numQubits,
    gates: [],
  };
}

/** Generate unique ID for gate instance */
export function generateGateId(): string {
  return `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Format angle for display */
export function formatAngle(angle: number): string {
  const piMultiple = angle / Math.PI;

  if (Math.abs(piMultiple - 1) < 0.001) return 'π';
  if (Math.abs(piMultiple + 1) < 0.001) return '-π';
  if (Math.abs(piMultiple - 0.5) < 0.001) return 'π/2';
  if (Math.abs(piMultiple + 0.5) < 0.001) return '-π/2';
  if (Math.abs(piMultiple - 0.25) < 0.001) return 'π/4';
  if (Math.abs(piMultiple + 0.25) < 0.001) return '-π/4';

  return angle.toFixed(2);
}
