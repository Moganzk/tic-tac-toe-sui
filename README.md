# 🕹️ Tic Tac Toe on Sui Blockchain

This is a simple **Tic Tac Toe game implemented as a smart contract** using the [Sui Move](https://docs.sui.io/) programming language and deployed on the Sui blockchain.

## 📦 What This Project Does

- Allows two players to play a classic Tic Tac Toe game on-chain.
- Stores game state on the blockchain using Sui’s object model.
- Ensures fairness: players take turns, and the game enforces valid moves.
- Determines the winner or draw on-chain after each move.

## ⚙️ How It Works

- A player **creates a new game object**, which is stored on the blockchain.
- Another player joins the game.
- Players take turns by calling `make_move(row, col)` function.
- The game checks for:
  - Valid moves (empty cell, correct turn)
  - Win condition (3 in a row)
  - Draw (board full)
- Once the game is over, the result is stored and no further moves are allowed.

## 🧱 Core Move Modules

### `TicTacToe.move`

- Defines the `Game` struct with:
  - Board state (`vector<vector<u8>>`)
  - Player addresses
  - Turn control
  - Winner (if any)

- Public functions:
  - `create_game`: Initializes a game with player1.
  - `join_game`: Adds player2 to the game.
  - `make_move`: Validates and applies a move.
  - `check_winner`: Checks rows, columns, and diagonals for a win.
  - `is_draw`: Checks if all cells are filled.

## 🧪 Running Locally

### Prerequisites

- [Sui CLI](https://docs.sui.io/build/install)
- Git

### Steps

```bash
# Clone the repo
git clone https://github.com/Moganzk/sui-tic-tac-toe.git
cd sui-tic-tac-toe
