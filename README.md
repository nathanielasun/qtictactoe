# Quantum Tic-Tac-Toe

A browser-based tic-tac-toe game variant where players compete in multiple simultaneous games against an AI bot, then use quantum computing to strategically select their best outcome.

## Game Concept

1. **Setup**: Choose the number of qubits (n = 1-6), which determines how many simultaneous games you'll play (2^n games)
2. **Play**: Compete against a bot with adjustable difficulty (leniency slider) in all games simultaneously
3. **Score**: Each game awards points based on outcome:
   - Win: **+2 points**
   - Loss: **-2 points**
   - Draw: **-1 point**
4. **Quantum Phase**: After all games conclude, build a quantum circuit with n qubits
5. **Measurement**: Execute ~1024 shots to determine the winning quantum state
6. **Selection**: The state with the highest measurement count determines which single game's score counts (all other games are eliminated!)
7. **Leaderboard**: Submit your final score with your name

## Quantum Mechanics

The game's unique twist lies in the quantum circuit building:

- Each possible quantum state (|00...0⟩ through |11...1⟩) corresponds to a game index
- Your circuit determines the probability distribution across all 2^n states
- The most frequently measured state "selects" which game survives
- Strategic circuit building lets you target your best-outcome game!

### Example (n=2, 4 games)

| Game | State | Outcome | Points |
|------|-------|---------|--------|
| 0    | \|00⟩ | Loss    | -2     |
| 1    | \|01⟩ | Win     | +2     |
| 2    | \|10⟩ | Draw    | -1     |
| 3    | \|11⟩ | Loss    | -2     |

**Raw total: -3 points**

To select Game 1 (the win), apply an X gate to qubit 0:
```
q0: ──[X]──
q1: ───────
```
This outputs |01⟩ with 100% probability → **Final score: +2 points!**

## Technology Stack

- **Language**: TypeScript
- **Framework**: React 18
- **Build Tool**: Vite
- **Quantum Engine**: [qcjs](../qcjs) (local GPU-accelerated quantum simulator)
- **UI Components**: Adapted from [web_qc_builder](../web_qc_builder)

## Project Structure

```
qtictactoe/
├── plans/                    # Implementation planning documents
│   ├── 01-architecture.md    # Overall architecture & tech stack
│   ├── 02-game-logic.md      # Tic-tac-toe rules, bot AI, scoring
│   ├── 03-quantum-mechanics.md # Quantum circuit integration
│   └── 04-ui-ux.md           # User interface design
│
├── src/                      # Source code (to be implemented)
│   ├── components/           # React components
│   ├── hooks/                # Custom React hooks
│   ├── context/              # State management
│   ├── types/                # TypeScript definitions
│   ├── utils/                # Helper functions
│   └── lib/                  # qcjs integration
│
├── public/                   # Static assets
├── README.md                 # This file
└── package.json              # Dependencies
```

## Planning Documents

Before implementation, comprehensive plans have been created:

| Document | Description |
|----------|-------------|
| [01-architecture.md](plans/01-architecture.md) | Project structure, technology choices, state management, data flow |
| [02-game-logic.md](plans/02-game-logic.md) | Tic-tac-toe rules, minimax AI, leniency system, scoring |
| [03-quantum-mechanics.md](plans/03-quantum-mechanics.md) | Qubit-to-game mapping, circuit execution, elimination logic |
| [04-ui-ux.md](plans/04-ui-ux.md) | Visual design, layouts, components, animations, accessibility |

## Features

### Core Gameplay
- Play 2-64 simultaneous tic-tac-toe games (based on n)
- Intelligent bot opponent with adjustable leniency (0-100%)
- Real-time score tracking across all games

### Quantum Circuit Builder
- Drag-and-drop gate placement
- Support for H, X, Y, Z, S, T, CNOT, CZ, SWAP, Rx, Ry, Rz gates
- Pre-built circuit templates for beginners
- Real-time probability preview (optional)

### Results & Leaderboard
- Visual measurement histogram
- Animated game elimination
- Persistent local leaderboard
- Score submission with player names

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Dependencies

- `qcjs` (local): GPU-accelerated quantum circuit simulator
- `react`, `react-dom`: UI framework
- `react-dnd`: Drag-and-drop for circuit builder
- `lucide-react`: Icons
- `vite`: Build tool

## License

MIT License - See [LICENSE](LICENSE) file.

## Author

Nathaniel Sun

---

*Built with quantum principles using the [qcjs](../qcjs) simulator*
