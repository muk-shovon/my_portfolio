/* About Me 4 x 5 sliding puzzle. */
const MOVE_DURATION = 100; // ms per tile move
const SCRAMBLE_MOVES = 28; // legal moves generated from the solved board
const RESET_ON_LEAVE = true; // replay the scramble when the pointer leaves

(function () {
  const photo = document.querySelector(".about-photo");
  const image = photo && photo.querySelector("img");
  if (!photo || !image) return;

  const COLS = 4;
  const ROWS = 5;
  const EMPTY = -1;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const boardEl = document.createElement("div");
  boardEl.className = "puzzle-board";
  boardEl.setAttribute("aria-hidden", "true");
  const tiles = [];
  const board = Array.from({ length: COLS * ROWS }, (_, i) => i < 19 ? i : EMPTY);
  const moves = [];
  let empty = COLS * ROWS - 1;
  let previousEmpty = -1;
  let cursor = 0;
  let wantsSolved = false;
  let running = false;
  let state = "scrambled";
  let lastInputWasTouch = false;

  for (let id = 0; id < 19; id++) {
    const tile = document.createElement("span");
    const sourceRow = Math.floor(id / COLS);
    const sourceCol = id % COLS;
    tile.className = "puzzle-tile";
    tile.style.left = (sourceCol * 25) + "%";
    tile.style.top = (sourceRow * 20) + "%";
    tile.style.width = "25%";
    tile.style.height = "20%";
    tile.style.backgroundImage = "url('assets/about-photo.jpg')";
    tile.style.backgroundSize = "400% 500%";
    tile.style.backgroundPosition = (sourceCol * (100 / 3)) + "% " + (sourceRow * 25) + "%";
    tile.style.transitionDuration = MOVE_DURATION + "ms";
    tile.dataset.id = id;
    tiles.push(tile);
    boardEl.appendChild(tile);
  }

  const lastPiece = document.createElement("span");
  lastPiece.className = "puzzle-empty-piece";
  boardEl.appendChild(lastPiece);

  function adjacentCells(index) {
    const row = Math.floor(index / COLS);
    const col = index % COLS;
    const cells = [];
    if (row > 0) cells.push(index - COLS);
    if (row < ROWS - 1) cells.push(index + COLS);
    if (col > 0) cells.push(index - 1);
    if (col < COLS - 1) cells.push(index + 1);
    return cells;
  }

  for (let i = 0; i < SCRAMBLE_MOVES; i++) {
    const choices = adjacentCells(empty).filter((cell) => cell !== previousEmpty);
    const from = choices[Math.floor(Math.random() * choices.length)];
    moves.push({ tile: board[from], from, to: empty });
    board[empty] = board[from];
    board[from] = EMPTY;
    previousEmpty = empty;
    empty = from;
  }
  cursor = moves.length;
  photo.classList.add("is-scrambled");
  photo.dataset.puzzleState = state;

  const locations = new Array(19);
  board.forEach((id, cell) => { if (id !== EMPTY) locations[id] = cell; });

  function transformFor(tileId, cell) {
    const source = tileId;
    const dx = ((cell % COLS) - (source % COLS)) * (photo.clientWidth / COLS);
    const dy = (Math.floor(cell / COLS) - Math.floor(source / COLS)) * (photo.clientHeight / ROWS);
    return "translate3d(" + dx + "px," + dy + "px,0)";
  }

  tiles.forEach((tile, id) => {
    const cell = locations[id];
    tile.style.transition = "none";
    tile.style.transform = transformFor(id, cell);
  });
  photo.appendChild(boardEl);
  photo.classList.add("puzzle-ready");
  boardEl.offsetHeight;
  tiles.forEach((tile) => { tile.style.transition = "transform " + MOVE_DURATION + "ms ease-out"; });

  function waitForMove(tile) {
    return new Promise((resolve) => {
      function done(event) {
        if (event.target !== tile || event.propertyName !== "transform") return;
        tile.removeEventListener("transitionend", done);
        tile.removeEventListener("transitioncancel", done);
        resolve();
      }
      tile.addEventListener("transitionend", done);
      tile.addEventListener("transitioncancel", done);
    });
  }

  function setState(next) {
    state = next;
    photo.dataset.puzzleState = state;
  }

  async function run() {
    if (running) return;
    running = true;
    photo.classList.remove("is-solved", "is-scrambled");
    if (reducedMotion.matches) {
      setState(wantsSolved ? "solving" : "scrambling");
      boardEl.style.opacity = "0";
      await new Promise((resolve) => requestAnimationFrame(resolve));
      tiles.forEach((tile) => { tile.style.transition = "none"; });
      while ((wantsSolved && cursor > 0) || (!wantsSolved && cursor < moves.length)) {
        const solving = wantsSolved;
        const move = solving ? moves[cursor - 1] : moves[cursor];
        const destination = solving ? move.from : move.to;
        locations[move.tile] = destination;
        tiles[move.tile].style.transform = transformFor(move.tile, destination);
        board[destination] = move.tile;
        board[solving ? move.to : move.from] = EMPTY;
        if (solving) cursor--; else cursor++;
      }
      photo.classList.toggle("is-solved", wantsSolved);
      photo.classList.toggle("is-scrambled", !wantsSolved);
      setState(wantsSolved ? "solved" : "scrambled");
      tiles.forEach((tile) => { tile.style.transition = "transform " + MOVE_DURATION + "ms ease-out"; });
      boardEl.style.opacity = "";
      running = false;
      return;
    }
    while ((wantsSolved && cursor > 0) || (!wantsSolved && cursor < moves.length)) {
      const solving = wantsSolved;
      setState(solving ? "solving" : "scrambling");
      const move = solving ? moves[cursor - 1] : moves[cursor];
      const destination = solving ? move.from : move.to;
      const tile = tiles[move.tile];
      const animation = waitForMove(tile);
      locations[move.tile] = destination;
      tile.style.transform = transformFor(move.tile, destination);
      board[destination] = move.tile;
      board[solving ? move.to : move.from] = EMPTY;
      if (solving) cursor--; else cursor++;
      await animation;
    }
    setState(wantsSolved ? "solved" : "scrambled");
    photo.classList.toggle("is-solved", wantsSolved);
    photo.classList.toggle("is-scrambled", !wantsSolved);
    running = false;
    if ((wantsSolved && cursor > 0) || (!wantsSolved && cursor < moves.length)) run();
  }

  function setSolved(solved) {
    wantsSolved = solved;
    run();
  }

  photo.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") setSolved(true);
  });
  photo.addEventListener("pointerdown", (event) => {
    lastInputWasTouch = event.pointerType === "touch";
  });
  photo.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "touch" && RESET_ON_LEAVE) setSolved(false);
  });
  photo.addEventListener("pointerup", (event) => {
    if (event.pointerType === "touch") setSolved(!wantsSolved);
  });
  photo.addEventListener("focus", () => { if (!lastInputWasTouch) setSolved(true); });
  photo.addEventListener("blur", () => setSolved(false));
  photo.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSolved(!wantsSolved);
    }
  });
  window.addEventListener("keydown", () => { lastInputWasTouch = false; }, true);

  if ("ResizeObserver" in window) {
    let resizeFrame = 0;
    new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        tiles.forEach((tile, id) => {
          tile.style.transition = "none";
          tile.style.transform = transformFor(id, locations[id]);
        });
        boardEl.offsetHeight;
        tiles.forEach((tile) => { tile.style.transition = "transform " + MOVE_DURATION + "ms ease-out"; });
      });
    }).observe(photo);
  }
})();
