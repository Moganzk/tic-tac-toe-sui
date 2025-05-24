# 🎮 Tic Tac Toe on Sui Blockchain

A decentralized Tic Tac Toe game powered by smart contracts on the Sui blockchain. Two players can play entirely on-chain, with all game logic, state, and outcomes managed securely and transparently through Sui Move modules.

---

## 🚀 Features

- **Fully On-Chain Gameplay**  
  All moves, turns, and results are stored and validated on the blockchain.

- **Smart Contract-Enforced Rules**  
  - Players alternate turns.
  - Only the current player can make a move.
  - Automatic detection of win and draw conditions.

- **Decentralized Game Lifecycle**  
  - **Create Game** – Start a new on-chain game instance.  
  - **Join Game** – A second player can join the game.  
  - **Play Game** – Players take turns by calling `make_move(row, col)`.  
  - **Game End** – Contract determines if someone wins or the game ends in a draw.

---

## 🛠️ Technical Overview

- **Language:** Move (via the Sui framework)
- **Architecture:**  
  - Each game is stored as a unique on-chain object.  
  - The state includes:
    - 3x3 game board
    - Players (X and O)
    - Current turn
    - Game status (`waiting`, `in_progress`, `complete`)
    - Result (`X wins`, `O wins`, or `draw`)

---

## 🧩 Game Logic

- **Validations per Move:**
  - It must be the player's turn.
  - Coordinates must be within bounds.
  - The selected cell must be empty.

- **After Every Move:**
  - The contract checks for a win condition.
  - If the board is full with no winner, the game ends in a draw.

- **Restrictions:**
  - No moves if the game is not in progress.
  - Players cannot move out of turn or into filled cells.

---

## 🧪 Developer Usage

> 🚧 Deployment and CLI usage instructions coming soon.

This repo currently contains only the core smart contract logic. Integration with a frontend is planned.

---

## 📂 Project Structure

├── sources/
│ └── tic_tac_toe.move # Smart contract logic in Move
├── Move.toml # Project configuration
├── README.md # Documentation


---

## ✅ To-Do

- [ ] Frontend DApp integration
- [ ] Rematch functionality
- [ ] Move history tracking
- [ ] Gas usage optimization
