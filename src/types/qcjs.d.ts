/**
 * Type declarations for qcjs (GPU Accelerated Quantum Circuit Simulator)
 */

declare module 'qcjs' {
  export interface CircuitOptions {
    device?: 'cpu' | 'gpu' | 'webgl' | 'wasm' | 'cuda' | 'metal';
  }

  export class Circuit {
    size: number;
    device: string;

    constructor(size: number, options?: CircuitOptions);

    // Single-qubit gates
    h(target: number): Circuit;
    x(target: number): Circuit;
    y(target: number): Circuit;
    z(target: number): Circuit;
    s(target: number): Circuit;
    t(target: number): Circuit;

    // Rotation gates
    rx(target: number, angle: number): Circuit;
    ry(target: number, angle: number): Circuit;
    rz(target: number, angle: number): Circuit;
    p(target: number, angle: number): Circuit;
    u(target: number, theta: number, phi: number, lam: number): Circuit;

    // Two-qubit gates
    cx(control: number, target: number): Circuit;
    cnot(control: number, target: number): Circuit;
    cz(control: number, target: number): Circuit;
    swap(qubit1: number, qubit2: number): Circuit;

    // Measurement
    measure(target: number): Circuit;

    // Circuit operations
    add(gate: string, target: number, options?: {
      control?: number;
      controls?: number[];
      angle?: number;
      angles?: number[];
    }): Circuit;

    barrier(): Circuit;

    // Execution
    execute(shots?: number, options?: { cache?: boolean }): Promise<Circuit>;

    // Results
    getStatevector(): { real: number[]; imag: number[] } | null;
    getProbabilities(): number[] | null;
    getCounts(): Record<string, number> | null;
    getCountsBigEndian(): Record<string, number> | null;

    // Circuit info
    depth(): number;
    gateCount(): Record<string, number>;
    readonly length: number;

    // Utilities
    reset(): Circuit;
    copy(): Circuit;
    dispose(): void;
    toString(): string;
    printCircuit(): void;
  }

  export function configureBackend(device: string): Promise<string>;

  export class Gate {
    H: number[][];
    X: number[][];
    Y: number[][];
    Z: number[][];
    S: number[][];
    T: number[][];
    I: number[][];

    Rx(angle: number): number[][];
    Ry(angle: number): number[][];
    Rz(angle: number): number[][];
    P(angle: number): number[][];
    U(theta: number, phi: number, lam: number): number[][];

    CNOT(state: any, control: number, target: number): void;
    CZ(state: any, control: number, target: number): void;
    SWAP(state: any, qubit1: number, qubit2: number): void;

    apply(gate: number[][], state: any, target: number, controls?: number[]): void;
    measure(state: any, target: number): void;
  }

  export class Complex {
    constructor(real: number, imag?: number);
    real: number;
    imag: number;
  }

  export const VERSION: string;
  export const AUTHOR: string;
}
