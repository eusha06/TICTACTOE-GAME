
const X = 'X';
const O = 'O';
const EMPTY = null;

let board = initialState();
let humanStarts = true; 
let gameOver = false;

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const playerSelectEl = document.getElementById('playerSelect');
const newGameBtn = document.getElementById('newGameBtn');

function initialState() {
  return [
    [EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY]
  ];
}

function currentPlayer(b) {
  let countX = 0, countO = 0;
  for (const row of b) {
    for (const cell of row) {
      if (cell === X) countX++; else if (cell === O) countO++;
    }
  }
  return countX > countO ? O : X;
}

function actions(b) {
  const acts = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (b[i][j] === EMPTY) acts.push([i, j]);
    }
  }
  return acts;
}

function result(b, action) {
  const [i, j] = action;
  if (b[i][j] !== EMPTY) throw new Error('Invalid action');
  const newB = b.map(row => row.slice());
  newB[i][j] = currentPlayer(b);
  return newB;
}

function winner(b) {
  // rows & cols
  for (let i = 0; i < 3; i++) {
    if (b[i][0] && b[i][0] === b[i][1] && b[i][1] === b[i][2]) return b[i][0];
    if (b[0][i] && b[0][i] === b[1][i] && b[1][i] === b[2][i]) return b[0][i];
  }
  // diagonals
  if (b[0][0] && b[0][0] === b[1][1] && b[1][1] === b[2][2]) return b[0][0];
  if (b[0][2] && b[0][2] === b[1][1] && b[1][1] === b[2][0]) return b[0][2];
  return null;
}

function terminal(b) {
  if (winner(b)) return true;
  return actions(b).length === 0;
}

function utility(b) {
  const w = winner(b);
  if (w === X) return 1;
  if (w === O) return -1;
  return 0;
}

function minimaxDecision(b) {
  if (terminal(b)) return null;
  const player = currentPlayer(b);
  let bestAction = null;

  if (player === X) {
    let bestVal = -Infinity;
    for (const act of actions(b)) {
      const val = minValue(result(b, act), -Infinity, Infinity);
      if (val > bestVal) {
        bestVal = val;
        bestAction = act;
      }
    }
  } else {
    let bestVal = Infinity;
    for (const act of actions(b)) {
      const val = maxValue(result(b, act), -Infinity, Infinity);
      if (val < bestVal) {
        bestVal = val;
        bestAction = act;
      }
    }
  }
  return bestAction;
}

function maxValue(b, alpha, beta) {
  if (terminal(b)) return utility(b);
  let v = -Infinity;
  for (const act of actions(b)) {
    v = Math.max(v, minValue(result(b, act), alpha, beta));
    if (v >= beta) return v; 
    alpha = Math.max(alpha, v);
  }
  return v;
}

function minValue(b, alpha, beta) {
  if (terminal(b)) return utility(b);
  let v = Infinity;
  for (const act of actions(b)) {
    v = Math.min(v, maxValue(result(b, act), alpha, beta));
    if (v <= alpha) return v; 
    beta = Math.min(beta, v);
  }
  return v;
}

function render() {
  boardEl.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const cellBtn = document.createElement('button');
      cellBtn.className = 'cell';
      const val = board[i][j];
      if (val) cellBtn.classList.add(val);
      cellBtn.textContent = val ? val : '';
      cellBtn.setAttribute('data-i', i);
      cellBtn.setAttribute('data-j', j);
      cellBtn.disabled = gameOver || val !== EMPTY || !isHumanTurn();
      cellBtn.addEventListener('click', onCellClick);
      boardEl.appendChild(cellBtn);
    }
  }
  updateStatus();
  highlightWinningCells();
}

function highlightWinningCells() {
  const w = winner(board);
  if (!w) return;
  const lines = [
    // rows
    [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]],
    // cols
    [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]],
    // diags
    [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]]
  ];
  for (const line of lines) {
    const [a,b,c] = line;
    if (board[a[0]][a[1]] && board[a[0]][a[1]] === board[b[0]][b[1]] && board[b[0]][b[1]] === board[c[0]][c[1]]) {
      // mark
      const cells = boardEl.querySelectorAll('.cell');
      for (const cell of cells) {
        const i = parseInt(cell.getAttribute('data-i'),10);
        const j = parseInt(cell.getAttribute('data-j'),10);
        if (line.some(([x,y]) => x===i && y===j)) cell.classList.add('winning');
      }
    }
  }
}

function isHumanTurn() {
  const player = currentPlayer(board);
  if (player === X) return humanStarts; 
  return !humanStarts;
}

function onCellClick(e) {
  if (gameOver) return;
  const i = parseInt(e.currentTarget.getAttribute('data-i'), 10);
  const j = parseInt(e.currentTarget.getAttribute('data-j'), 10);
  if (board[i][j] !== EMPTY) return;
  if (!isHumanTurn()) return;
  board = result(board, [i,j]);
  postMove();
}

function postMove() {
  if (terminal(board)) {
    gameOver = true;
    render();
    return;
  }
  render();
 
  if (!gameOver && !isHumanTurn()) {
    statusEl.textContent = 'AI thinking...';
    setTimeout(() => {
      const act = minimaxDecision(board);
      if (act) board = result(board, act);
      if (terminal(board)) gameOver = true;
      render();
    }, 80); \
  }
}

function updateStatus() {
  if (winner(board)) {
    statusEl.textContent = `Winner: ${winner(board)}`;
    return;
  }
  if (terminal(board)) {
    statusEl.textContent = 'Draw';
    return;
  }
  const p = currentPlayer(board);
  statusEl.textContent = `Turn: ${p} (${isHumanTurn() ? 'Human' : 'AI'})`;
}

function newGame() {
  board = initialState();
  gameOver = false;
  humanStarts = playerSelectEl.value === 'human';

  render();
  if (!isHumanTurn() && !gameOver) {
    statusEl.textContent = 'AI thinking...';
    setTimeout(() => {
      const act = minimaxDecision(board);
      if (act) board = result(board, act);
      if (terminal(board)) gameOver = true;
      render();
    }, 100);
  }
}

newGameBtn.addEventListener('click', newGame);
playerSelectEl.addEventListener('change', newGame);


statusEl.textContent = 'Ready';
render();

