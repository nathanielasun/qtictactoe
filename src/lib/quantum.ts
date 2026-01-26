/**
 * Quantum Circuit Library
 * Uses qcjs submodule for circuit execution in the quantum tic-tac-toe game.
 * Source: https://github.com/nathanielasun/qcjs
 */

import { GateInstance, MeasurementResults, CircuitState } from '@/types';
// @ts-ignore - qcjs is a JS submodule without type declarations
import { Circuit } from './qcjs/index.js';

/**
 * Build a qcjs circuit from gate instances.
 * @param gates - Array of gate instances to apply
 * @param numQubits - Number of qubits in the circuit
 * @returns The constructed circuit
 */
function buildCircuit(gates: GateInstance[], numQubits: number): InstanceType<typeof Circuit> {
  const circuit = new Circuit(numQubits);

  for (const gate of gates) {
    const target = gate.target;

    switch (gate.type) {
      // Single-qubit gates
      case 'H':
        circuit.h(target);
        break;
      case 'X':
        circuit.x(target);
        break;
      case 'Y':
        circuit.y(target);
        break;
      case 'Z':
        circuit.z(target);
        break;
      case 'S':
        circuit.s(target);
        break;
      case 'T':
        circuit.t(target);
        break;

      // Parametric gates
      case 'Rx':
        if (gate.angle === undefined) {
          throw new Error('Rx gate requires an angle parameter');
        }
        circuit.rx(target, gate.angle);
        break;
      case 'Ry':
        if (gate.angle === undefined) {
          throw new Error('Ry gate requires an angle parameter');
        }
        circuit.ry(target, gate.angle);
        break;
      case 'Rz':
        if (gate.angle === undefined) {
          throw new Error('Rz gate requires an angle parameter');
        }
        circuit.rz(target, gate.angle);
        break;
      case 'P':
        if (gate.angle === undefined) {
          throw new Error('P gate requires an angle parameter');
        }
        circuit.p(target, gate.angle);
        break;

      // Two-qubit gates
      case 'CNOT':
        if (gate.control === undefined) {
          throw new Error('CNOT gate requires a control qubit');
        }
        circuit.cnot(gate.control, target);
        break;
      case 'CZ':
        if (gate.control === undefined) {
          throw new Error('CZ gate requires a control qubit');
        }
        circuit.cz(gate.control, target);
        break;
      case 'SWAP':
        if (gate.control === undefined) {
          throw new Error('SWAP gate requires two qubits');
        }
        circuit.swap(gate.control, target);
        break;

      default:
        console.warn(`Unknown gate type: ${gate.type}`);
    }
  }

  return circuit;
}

/**
 * Execute a quantum circuit and return measurement results.
 * @param gates - Array of gate instances to apply
 * @param numQubits - Number of qubits in the circuit
 * @param shots - Number of measurement shots (default 1024)
 * @returns Measurement results including counts and winning state
 */
export async function executeCircuit(
  gates: GateInstance[],
  numQubits: number,
  shots: number = 1024
): Promise<MeasurementResults> {
  const circuit = buildCircuit(gates, numQubits);

  // Execute the circuit
  await circuit.execute(shots);

  // Get measurement counts (big-endian for our game mapping)
  const counts: Record<string, number> = circuit.getCountsBigEndian() || {};

  // Find the winning state (highest count)
  let winningState = '0'.repeat(numQubits);
  let maxCount = 0;

  for (const [state, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      winningState = state;
    }
  }

  // Get probability distribution if available
  const probabilities = circuit.getProbabilities();
  const probabilityMap: Record<string, number> = {};

  if (probabilities) {
    for (let i = 0; i < probabilities.length; i++) {
      const state = i.toString(2).padStart(numQubits, '0');
      if (probabilities[i] > 1e-10) {
        probabilityMap[state] = probabilities[i];
      }
    }
  }

  return {
    counts,
    shots,
    winningState,
    probabilities: probabilityMap,
  };
}

/**
 * Get the theoretical probability distribution without sampling.
 * @param gates - Array of gate instances to apply
 * @param numQubits - Number of qubits in the circuit
 * @returns Probability distribution for each state
 */
export async function getCircuitProbabilities(
  gates: GateInstance[],
  numQubits: number
): Promise<Record<string, number>> {
  const circuit = buildCircuit(gates, numQubits);

  // Execute with minimal shots to compute statevector
  await circuit.execute(1);

  const probabilities = circuit.getProbabilities();
  const result: Record<string, number> = {};

  if (probabilities) {
    for (let i = 0; i < probabilities.length; i++) {
      const state = i.toString(2).padStart(numQubits, '0');
      if (probabilities[i] > 1e-10) {
        result[state] = probabilities[i];
      }
    }
  }

  return result;
}

/**
 * Create the initial circuit state for a given number of qubits.
 * @param n - Number of qubits
 * @returns Initial circuit state
 */
export function createInitialCircuitState(n: number): CircuitState {
  return {
    numQubits: n,
    gates: [],
    depth: 0,
    maxDepth: 20,
  };
}

/**
 * Validate a circuit state.
 * @param state - Circuit state to validate
 * @returns True if valid, error message otherwise
 */
export function validateCircuitState(
  state: CircuitState
): { valid: true } | { valid: false; error: string } {
  if (state.numQubits < 1 || state.numQubits > 6) {
    return { valid: false, error: 'Number of qubits must be between 1 and 6' };
  }

  if (state.gates.length > 100) {
    return { valid: false, error: 'Circuit has too many gates (max 100)' };
  }

  for (const gate of state.gates) {
    if (gate.target < 0 || gate.target >= state.numQubits) {
      return {
        valid: false,
        error: `Gate target ${gate.target} is out of range`,
      };
    }

    if (gate.control !== undefined) {
      if (gate.control < 0 || gate.control >= state.numQubits) {
        return {
          valid: false,
          error: `Gate control ${gate.control} is out of range`,
        };
      }
      if (gate.control === gate.target) {
        return {
          valid: false,
          error: 'Control and target qubits must be different',
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Calculate the circuit depth from gates.
 * @param gates - Array of gate instances
 * @param numQubits - Number of qubits
 * @returns Circuit depth
 */
export function calculateCircuitDepth(
  gates: GateInstance[],
  numQubits: number
): number {
  if (gates.length === 0) return 0;

  const qubitDepth = new Array(numQubits).fill(0);

  for (const gate of gates) {
    const involved = [gate.target];
    if (gate.control !== undefined) {
      involved.push(gate.control);
    }

    const maxDepth = Math.max(...involved.map((q) => qubitDepth[q]));
    const newDepth = maxDepth + 1;

    for (const q of involved) {
      qubitDepth[q] = newDepth;
    }
  }

  return Math.max(...qubitDepth);
}

/**
 * Get a simple circuit that selects a specific target state.
 * @param targetState - The state to target (e.g., "101")
 * @returns Array of gates to apply
 */
export function getTargetStateCircuit(targetState: string): GateInstance[] {
  const gates: GateInstance[] = [];

  // Apply X gates where the target state has a '1'
  for (let i = 0; i < targetState.length; i++) {
    if (targetState[i] === '1') {
      gates.push({
        id: `auto-x-${i}`,
        type: 'X',
        target: i,
        position: i,
      });
    }
  }

  return gates;
}

/**
 * Create a superposition circuit that gives equal probability to all states.
 * @param numQubits - Number of qubits
 * @returns Array of gates for superposition
 */
export function getSuperpositionCircuit(numQubits: number): GateInstance[] {
  const gates: GateInstance[] = [];

  // Apply H to all qubits
  for (let i = 0; i < numQubits; i++) {
    gates.push({
      id: `h-${i}`,
      type: 'H',
      target: i,
      position: i,
    });
  }

  return gates;
}

/**
 * Execute multiple independent measurements of the same circuit.
 * Used for Easy mode collapses.
 * @param gates - Array of gate instances to apply
 * @param numQubits - Number of qubits in the circuit
 * @param numMeasurements - Number of independent measurements
 * @param shots - Number of shots per measurement
 * @returns Array of measurement count results
 */
export async function executeMultipleMeasurements(
  gates: GateInstance[],
  numQubits: number,
  numMeasurements: number,
  shots: number = 1024
): Promise<Record<string, number>[]> {
  const results: Record<string, number>[] = [];

  for (let i = 0; i < numMeasurements; i++) {
    const measurement = await executeCircuit(gates, numQubits, shots);
    results.push(measurement.counts);
  }

  return results;
}
