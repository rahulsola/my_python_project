import { useState, useEffect, useRef, useCallback } from "react";

// Web Audio API Retro Synthesizer
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === "eat") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "gameover") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5); // E2
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === "click") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "match") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === "win") {
      osc.type = "sine";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start();
      osc.stop(now + 0.6);
    } else if (type === "shoot") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "block") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {
    console.warn("Web Audio API not supported or blocked:", e);
  }
};

export default function ArcadeCabinet({ game, onClose, highScore, onUpdateHighScore }) {
  const [activeGameType, setActiveGameType] = useState("");

  useEffect(() => {
    if (!game) return;
    const title = game.title.toLowerCase();
    if (title.includes("cyberpunk")) {
      setActiveGameType("snake");
    } else if (title.includes("witcher")) {
      setActiveGameType("memory");
    } else if (title.includes("elden")) {
      setActiveGameType("tictactoe");
    } else if (title.includes("minecraft")) {
      setActiveGameType("sandbox");
    } else if (title.includes("red dead")) {
      setActiveGameType("quickdraw");
    } else {
      setActiveGameType("snake"); // Default fallback
    }
  }, [game]);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      {/* Retro Arcade Cabinet Shell */}
      <div className="bg-slate-900 border-4 border-indigo-500 rounded-3xl shadow-2xl shadow-indigo-500/20 w-full max-w-2xl overflow-hidden flex flex-col relative animate-zoom-in">
        {/* Cabinet Marquee Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-fuchsia-900 p-5 border-b-4 border-indigo-500 flex justify-between items-center relative overflow-hidden">
          {/* Decorative scanlines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none" />
          
          <div className="flex items-center gap-3 z-10">
            <div className="bg-indigo-500 text-white p-2 rounded-lg font-black animate-pulse shadow-lg shadow-indigo-500/50">
              🕹️
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-fuchsia-400 tracking-widest uppercase font-mono animate-pulse">
                NEXUS ARCADE
              </h2>
              <p className="text-[10px] text-indigo-300 font-bold tracking-widest uppercase mt-0.5">
                Now Playing: {game?.title || "Retro Game"}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSound("click");
              onClose();
            }}
            className="p-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl border-2 border-red-400 shadow-md hover:shadow-red-500/30 transition-all cursor-pointer z-10 text-xs uppercase tracking-wider"
          >
            Exit Cabinet
          </button>
        </div>

        {/* CRT Screen Area */}
        <div className="bg-slate-950 p-6 flex flex-col items-center justify-center relative min-h-[450px] border-b-4 border-indigo-500">
          {/* Scanline overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] pointer-events-none z-10" />
          {/* Screen glare effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/2 to-white/5 pointer-events-none z-10" />

          {activeGameType === "snake" && (
            <SnakeGame gameTitle={game?.title} highScore={highScore[game?.title] || 0} onUpdateHighScore={(score) => onUpdateHighScore(game?.title, score)} />
          )}
          {activeGameType === "memory" && (
            <MemoryGame gameTitle={game?.title} highScore={highScore[game?.title] || 0} onUpdateHighScore={(score) => onUpdateHighScore(game?.title, score)} />
          )}
          {activeGameType === "tictactoe" && (
            <TicTacToeGame gameTitle={game?.title} highScore={highScore[game?.title] || 0} onUpdateHighScore={(score) => onUpdateHighScore(game?.title, score)} />
          )}
          {activeGameType === "sandbox" && (
            <SandboxGame gameTitle={game?.title} />
          )}
          {activeGameType === "quickdraw" && (
            <QuickDrawGame gameTitle={game?.title} highScore={highScore[game?.title] || 9999} onUpdateHighScore={(score) => onUpdateHighScore(game?.title, score)} />
          )}
        </div>

        {/* Cabinet Control Panel (Decorative Retro Joysticks & Buttons) */}
        <div className="bg-slate-800 p-4 flex justify-between items-center px-8 border-t border-slate-700">
          <div className="flex items-center gap-4">
            {/* Joystick */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-slate-700 rounded-full border-4 border-slate-600 flex items-center justify-center relative shadow-inner">
                <div className="w-6 h-6 bg-red-600 rounded-full border-2 border-red-500 shadow-lg shadow-red-500/50 animate-bounce absolute" />
              </div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">JOYSTICK</span>
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-slate-400 tracking-wider">PLAYER 1 READY</p>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">INSERT COIN [FREE PLAY]</p>
            </div>
          </div>

          {/* Retro Action Buttons */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-red-600 rounded-full border-2 border-red-500 shadow-md shadow-red-500/30 active:scale-90 transition-all" />
              <span className="text-[8px] font-bold text-slate-500 mt-1">A</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-yellow-500 rounded-full border-2 border-yellow-400 shadow-md shadow-yellow-500/30 active:scale-90 transition-all" />
              <span className="text-[8px] font-bold text-slate-500 mt-1">B</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full border-2 border-blue-500 shadow-md shadow-blue-600/30 active:scale-90 transition-all" />
              <span className="text-[8px] font-bold text-slate-500 mt-1">X</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   GAME 1: NEON CYBERPUNK SNAKE
   ========================================== */
function SnakeGame({ gameTitle, highScore, onUpdateHighScore }) {
  const GRID_SIZE = 15;
  const [snake, setSnake] = useState([
    { x: 7, y: 7 },
    { x: 7, y: 8 },
  ]);
  const [food, setFood] = useState({ x: 3, y: 4 });
  const [direction, setDirection] = useState("UP");
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const gameInterval = useRef(null);

  const generateFood = useCallback(() => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y));
    setFood(newFood);
  }, [snake]);

  const resetGame = () => {
    playSound("click");
    setSnake([
      { x: 7, y: 7 },
      { x: 7, y: 8 },
    ]);
    setDirection("UP");
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  const moveSnake = useCallback(() => {
    if (!isPlaying || isGameOver) return;

    setSnake((prevSnake) => {
      const head = { ...prevSnake[0] };

      switch (direction) {
        case "UP":
          head.y -= 1;
          break;
        case "DOWN":
          head.y += 1;
          break;
        case "LEFT":
          head.x -= 1;
          break;
        case "RIGHT":
          head.x += 1;
          break;
        default:
          break;
      }

      // Check wall collisions
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setIsGameOver(true);
        setIsPlaying(false);
        playSound("gameover");
        onUpdateHighScore(score);
        return prevSnake;
      }

      // Check self collisions
      if (prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        setIsGameOver(true);
        setIsPlaying(false);
        playSound("gameover");
        onUpdateHighScore(score);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check if food eaten
      if (head.x === food.x && head.y === food.y) {
        setScore((s) => {
          const nextScore = s + 10;
          updateHighScoreOnEat(nextScore);
          return nextScore;
        });
        playSound("eat");
        generateFood();
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isPlaying, isGameOver, generateFood, score]);

  const updateHighScoreOnEat = (currentScore) => {
    if (currentScore > highScore) {
      onUpdateHighScore(currentScore);
    }
  };

  useEffect(() => {
    if (isPlaying && !isGameOver) {
      const speed = Math.max(80, 200 - Math.floor(score / 50) * 15);
      gameInterval.current = setInterval(moveSnake, speed);
    }
    return () => clearInterval(gameInterval.current);
  }, [isPlaying, isGameOver, moveSnake, score]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying) return;
      switch (e.key) {
        case "ArrowUp":
          if (direction !== "DOWN") setDirection("UP");
          break;
        case "ArrowDown":
          if (direction !== "UP") setDirection("DOWN");
          break;
        case "ArrowLeft":
          if (direction !== "RIGHT") setDirection("LEFT");
          break;
        case "ArrowRight":
          if (direction !== "LEFT") setDirection("RIGHT");
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [direction, isPlaying]);

  return (
    <div className="flex flex-col items-center w-full max-w-sm z-10">
      {/* Score Header */}
      <div className="flex justify-between w-full mb-4 bg-slate-900 border border-indigo-500/50 p-2.5 rounded-xl font-mono text-xs">
        <div className="text-indigo-400">SCORE: <span className="text-white font-bold">{score}</span></div>
        <div className="text-yellow-400">HIGH SCORE: <span className="text-white font-bold">{highScore}</span></div>
      </div>

      {/* Grid Screen */}
      <div className="relative bg-slate-950 border-2 border-indigo-500/40 rounded-xl overflow-hidden w-72 h-72 grid grid-cols-15 grid-rows-15 shadow-2xl shadow-indigo-500/5">
        {isPlaying &&
          Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
            const x = idx % GRID_SIZE;
            const y = Math.floor(idx / GRID_SIZE);
            const isSnakeSegment = snake.some((segment) => segment.x === x && segment.y === y);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isFoodItem = food.x === x && food.y === y;

            return (
              <div
                key={idx}
                className={`border-[0.5px] border-indigo-950/20 flex items-center justify-center ${
                  isHead
                    ? "bg-emerald-400 shadow-md shadow-emerald-500/50 rounded-xs"
                    : isSnakeSegment
                    ? "bg-emerald-500/80 rounded-xs"
                    : isFoodItem
                    ? "bg-rose-500 shadow-md shadow-rose-500/50 rounded-full animate-pulse"
                    : ""
                }`}
              />
            );
          })}

        {/* Start / Game Over Overlays */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
            {isGameOver ? (
              <div className="space-y-4">
                <h3 className="text-red-500 font-mono font-black text-2xl tracking-widest uppercase animate-bounce">
                  GAME OVER
                </h3>
                <p className="text-xs text-slate-400 font-mono">You crashed into the grid boundary!</p>
                <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm font-mono">
                  FINAL SCORE: <span className="text-emerald-400 font-bold">{score}</span>
                </div>
                <button
                  onClick={resetGame}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl border-2 border-emerald-400 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  Insert Coin / Retry
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-indigo-400 font-mono font-black text-xl tracking-widest uppercase">
                  CYBER SNAKE
                </h3>
                <p className="text-xs text-slate-400 font-mono max-w-[200px] leading-relaxed">
                  Use your keyboard arrow keys or the on-screen buttons to eat the neon cores.
                </p>
                <button
                  onClick={resetGame}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl border-2 border-indigo-400 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  Press Start
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* On-Screen Touch Controls */}
      <div className="grid grid-cols-3 gap-2 w-36 mt-5 z-10">
        <div />
        <button
          onClick={() => {
            playSound("click");
            if (direction !== "DOWN") setDirection("UP");
          }}
          disabled={!isPlaying}
          className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold rounded-xl active:scale-90 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
        >
          ▲
        </button>
        <div />
        <button
          onClick={() => {
            playSound("click");
            if (direction !== "RIGHT") setDirection("LEFT");
          }}
          disabled={!isPlaying}
          className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold rounded-xl active:scale-90 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
        >
          ◀
        </button>
        <button
          onClick={() => {
            playSound("click");
            if (direction !== "UP") setDirection("DOWN");
          }}
          disabled={!isPlaying}
          className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold rounded-xl active:scale-90 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
        >
          ▼
        </button>
        <button
          onClick={() => {
            playSound("click");
            if (direction !== "LEFT") setDirection("RIGHT");
          }}
          disabled={!isPlaying}
          className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold rounded-xl active:scale-90 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

/* ==========================================
   GAME 2: WITCHER'S MEMORY MATCH
   ========================================== */
function MemoryGame({ gameTitle, highScore, onUpdateHighScore }) {
  const EMOJIS = ["⚔️", "🐺", "🔮", "📜", "🧪", "👑", "🐉", "🏰"];
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWon, setIsWin] = useState(false);

  const initGame = () => {
    playSound("click");
    // Duplicate and shuffle
    const deck = [...EMOJIS, ...EMOJIS]
      .map((emoji, idx) => ({ id: idx, emoji, isFlipped: false }))
      .sort(() => Math.random() - 0.5);
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setIsWin(false);
    setIsPlaying(true);
  };

  const handleCardClick = (index) => {
    if (!isPlaying || flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;

    playSound("click");
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const firstCard = cards[newFlipped[0]];
      const secondCard = cards[newFlipped[1]];

      if (firstCard.emoji === secondCard.emoji) {
        // Match found
        setTimeout(() => {
          playSound("match");
          const newMatched = [...matched, newFlipped[0], newFlipped[1]];
          setMatched(newMatched);
          setFlipped([]);

          if (newMatched.length === cards.length) {
            setIsWin(true);
            setIsPlaying(false);
            playSound("win");
            const score = Math.max(10, 200 - moves * 5); // Score calculation
            if (highScore === 0 || score > highScore) {
              onUpdateHighScore(score);
            }
          }
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm z-10">
      {/* Stats Header */}
      <div className="flex justify-between w-full mb-4 bg-slate-900 border border-indigo-500/50 p-2.5 rounded-xl font-mono text-xs">
        <div className="text-indigo-400">MOVES: <span className="text-white font-bold">{moves}</span></div>
        <div className="text-yellow-400">BEST SCORE: <span className="text-white font-bold">{highScore} pts</span></div>
      </div>

      {/* Grid Board */}
      <div className="relative bg-slate-950 border-2 border-indigo-500/40 rounded-xl p-4 w-72 h-72 grid grid-cols-4 grid-rows-4 gap-2 shadow-2xl">
        {isPlaying &&
          cards.map((card, idx) => {
            const isCardFlipped = flipped.includes(idx) || matched.includes(idx);
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                className={`w-full h-full flex items-center justify-center text-xl rounded-lg border transition-all duration-300 transform cursor-pointer ${
                  isCardFlipped
                    ? "bg-indigo-900/40 border-indigo-500 text-white rotate-y-180"
                    : "bg-slate-800 hover:bg-slate-700 border-slate-600 text-transparent"
                }`}
              >
                {isCardFlipped ? card.emoji : "❓"}
              </button>
            );
          })}

        {/* Start / Victory Overlays */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center rounded-xl">
            {isWon ? (
              <div className="space-y-4">
                <h3 className="text-emerald-400 font-mono font-black text-2xl tracking-widest uppercase animate-bounce">
                  VICTORY!
                </h3>
                <p className="text-xs text-slate-400 font-mono">You matched all the fantasy runes!</p>
                <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm font-mono space-y-1">
                  <div>TOTAL MOVES: <span className="text-emerald-400 font-bold">{moves}</span></div>
                  <div>SCORE: <span className="text-yellow-400 font-bold">{Math.max(10, 200 - moves * 5)} pts</span></div>
                </div>
                <button
                  onClick={initGame}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl border-2 border-emerald-400 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  Play Again
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-indigo-400 font-mono font-black text-lg tracking-widest uppercase">
                  WITCHER RUNES
                </h3>
                <p className="text-xs text-slate-400 font-mono max-w-[200px] leading-relaxed">
                  Flip and match pairs of magical runes in the fewest moves possible.
                </p>
                <button
                  onClick={initGame}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl border-2 border-indigo-400 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  Begin Quest
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================
   GAME 3: ELDEN RING TIC-TAC-TOE VS BOSS
   ========================================== */
function TicTacToeGame({ gameTitle, highScore, onUpdateHighScore }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState(null); // 'X', 'O', 'draw', or null
  const [battleLog, setBattleLog] = useState(["Tarnished, arise! Face Malenia, Blade of Miquella."]);
  const [stats, setStats] = useState({ wins: 0, losses: 0 });

  const checkWinner = (grid) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (grid[a] && grid[a] === grid[b] && grid[a] === grid[c]) {
        return grid[a];
      }
    }
    if (grid.every((cell) => cell !== null)) return "draw";
    return null;
  };

  const addLog = (msg) => {
    setBattleLog((prev) => [msg, ...prev.slice(0, 3)]);
  };

  const resetGame = () => {
    playSound("click");
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
    setBattleLog(["Your battle begins anew! Arise, Tarnished."]);
  };

  const makeBossMove = useCallback((currentBoard) => {
    // Boss AI (Malenia)
    // 1. Can boss win?
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        const testBoard = [...currentBoard];
        testBoard[i] = "O";
        if (checkWinner(testBoard) === "O") {
          return i;
        }
      }
    }

    // 2. Can player win? Block!
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        const testBoard = [...currentBoard];
        testBoard[i] = "X";
        if (checkWinner(testBoard) === "X") {
          return i;
        }
      }
    }

    // 3. Take center if available
    if (currentBoard[4] === null) return 4;

    // 4. Take corners
    const corners = [0, 2, 6, 8].filter((c) => currentBoard[c] === null);
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

    // 5. Take remaining sides
    const sides = [1, 3, 5, 7].filter((s) => currentBoard[s] === null);
    if (sides.length > 0) return sides[Math.floor(Math.random() * sides.length)];

    return null;
  }, []);

  const handleCellClick = (index) => {
    if (board[index] || winner || !isPlayerTurn) return;

    playSound("click");
    const nextBoard = [...board];
    nextBoard[index] = "X";
    setBoard(nextBoard);

    const currentWinner = checkWinner(nextBoard);
    if (currentWinner) {
      handleEndGame(currentWinner);
      return;
    }

    setIsPlayerTurn(false);
    addLog("You swing your Greatsword! Malenia dodges.");

    // Boss turn with slight delay
    setTimeout(() => {
      const bossIndex = makeBossMove(nextBoard);
      if (bossIndex !== null) {
        playSound("block");
        const finalBoard = [...nextBoard];
        finalBoard[bossIndex] = "O";
        setBoard(finalBoard);

        const bossWinner = checkWinner(finalBoard);
        if (bossWinner) {
          handleEndGame(bossWinner);
        } else {
          setIsPlayerTurn(true);
          const quotes = [
            "Malenia: 'I am Malenia, Blade of Miquella.'",
            "Malenia unleashes Waterfowl Dance! You dodge roll.",
            "Malenia: 'Heed my words. I am the blade of Miquella.'",
            "Malenia strikes! Your shield absorbs the blow."
          ];
          addLog(quotes[Math.floor(Math.random() * quotes.length)]);
        }
      }
    }, 600);
  };

  const handleEndGame = (gameWinner) => {
    setWinner(gameWinner);
    if (gameWinner === "X") {
      playSound("win");
      addLog("GREAT ENEMY FELLED! You defeated Malenia!");
      setStats((s) => ({ ...s, wins: s.wins + 1 }));
      onUpdateHighScore(highScore + 1);
    } else if (gameWinner === "O") {
      playSound("gameover");
      addLog("YOU DIED. Malenia: 'And I have never known defeat.'");
      setStats((s) => ({ ...s, losses: s.losses + 1 }));
    } else {
      playSound("block");
      addLog("STALEMATE. Both combatants draw back to rest.");
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm z-10">
      {/* Score Header */}
      <div className="flex justify-between w-full mb-4 bg-slate-900 border border-indigo-500/50 p-2.5 rounded-xl font-mono text-xs">
        <div className="text-emerald-400">WINS: <span className="text-white font-bold">{stats.wins}</span></div>
        <div className="text-red-400">LOSSES: <span className="text-white font-bold">{stats.losses}</span></div>
        <div className="text-yellow-400">RUNES HELD: <span className="text-white font-bold">{highScore}</span></div>
      </div>

      {/* Grid Screen */}
      <div className="bg-slate-950 border-2 border-indigo-500/40 rounded-xl p-4 w-72 h-72 grid grid-cols-3 grid-rows-3 gap-2 shadow-2xl relative">
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleCellClick(idx)}
            disabled={cell !== null || winner || !isPlayerTurn}
            className={`w-full h-full flex flex-col items-center justify-center text-2xl font-black rounded-lg border transition-all cursor-pointer ${
              cell === "X"
                ? "bg-blue-900/20 border-blue-500 text-blue-400 shadow-md shadow-blue-500/10"
                : cell === "O"
                ? "bg-rose-900/20 border-rose-500 text-rose-400 shadow-md shadow-rose-500/10"
                : "bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-transparent"
            }`}
          >
            {cell === "X" ? "⚔️" : cell === "O" ? "🌸" : ""}
            <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase">
              {cell === "X" ? "Player" : cell === "O" ? "Boss" : `Slot ${idx + 1}`}
            </span>
          </button>
        ))}

        {/* Game End Overlay */}
        {winner && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center rounded-xl">
            <h3 className={`font-mono font-black text-2xl tracking-widest uppercase mb-2 ${
              winner === "X" ? "text-yellow-500 animate-bounce" : winner === "O" ? "text-red-600" : "text-slate-400"
            }`}>
              {winner === "X" ? "FOE FELLED" : winner === "O" ? "YOU DIED" : "STALEMATE"}
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4 max-w-[200px]">
              {winner === "X"
                ? "You have brandished the power of the Elden Ring!"
                : winner === "O"
                ? "Malenia remains undefeated. Arise once more."
                : "A hard-fought draw. Neither could land the final blow."}
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl border-2 border-indigo-400 shadow-md transition-all cursor-pointer"
            >
              Challenge Boss
            </button>
          </div>
        )}
      </div>

      {/* Battle Log */}
      <div className="w-full mt-4 bg-slate-900 border border-slate-800 p-3 rounded-xl font-mono text-[10px] text-slate-400 h-24 overflow-y-auto space-y-1">
        <p className="text-slate-500 font-bold border-b border-slate-800 pb-1 uppercase tracking-wider">Battle Feed Log</p>
        {battleLog.map((log, idx) => (
          <p key={idx} className={idx === 0 ? "text-white font-semibold" : "opacity-60"}>
            {idx === 0 ? "▶ " : "• "}{log}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ==========================================
   GAME 4: MINECRAFT BLOCK SANDBOX
   ========================================== */
function SandboxGame({ gameTitle }) {
  const COLS = 10;
  const ROWS = 8;
  const BLOCKS = [
    { type: "empty", label: "Air", icon: "💨", color: "bg-slate-950" },
    { type: "grass", label: "Grass", icon: "🟩", color: "bg-emerald-600 border-emerald-500" },
    { type: "dirt", label: "Dirt", icon: "🟫", color: "bg-amber-800 border-amber-700" },
    { type: "stone", label: "Stone", icon: "⬜", color: "bg-slate-500 border-slate-400" },
    { type: "wood", label: "Wood", icon: "🪵", color: "bg-yellow-800 border-yellow-700" },
    { type: "diamond", label: "Diamond", icon: "💎", color: "bg-cyan-400 border-cyan-300 shadow-md shadow-cyan-500/20" },
    { type: "gold", label: "Gold", icon: "🪙", color: "bg-yellow-500 border-yellow-400 shadow-md shadow-yellow-500/20" },
  ];

  const [selectedBlock, setSelectedBlock] = useState(BLOCKS[1]); // Default Grass
  const [grid, setGrid] = useState(() => Array(ROWS * COLS).fill("empty"));

  const handleCellClick = (index) => {
    playSound("click");
    setGrid((prev) => {
      const next = [...prev];
      // If cell already has the selected block, clear it (toggle behavior)
      if (next[index] === selectedBlock.type) {
        next[index] = "empty";
      } else {
        next[index] = selectedBlock.type;
      }
      return next;
    });
  };

  const clearGrid = () => {
    playSound("click");
    setGrid(Array(ROWS * COLS).fill("empty"));
  };

  const loadPreset = (presetName) => {
    playSound("match");
    const emptyGrid = Array(ROWS * COLS).fill("empty");
    if (presetName === "sword") {
      // Draw a simple 2D sword
      const swordIndices = [
        { idx: 7, type: "diamond" },
        { idx: 16, type: "diamond" },
        { idx: 25, type: "diamond" },
        { idx: 34, type: "diamond" },
        { idx: 43, type: "wood" },
        { idx: 52, type: "stone" },
        { idx: 53, type: "stone" },
        { idx: 51, type: "stone" },
        { idx: 62, type: "wood" },
        { idx: 71, type: "stone" },
      ];
      swordIndices.forEach((item) => {
        if (item.idx < ROWS * COLS) emptyGrid[item.idx] = item.type;
      });
    } else if (presetName === "house") {
      // Draw a simple house
      const houseIndices = [
        // Roof
        { idx: 14, type: "stone" }, { idx: 15, type: "stone" },
        { idx: 23, type: "stone" }, { idx: 24, type: "stone" }, { idx: 25, type: "stone" }, { idx: 26, type: "stone" },
        // Walls
        { idx: 33, type: "wood" }, { idx: 34, type: "wood" }, { idx: 35, type: "wood" }, { idx: 36, type: "wood" },
        { idx: 43, type: "wood" }, { idx: 44, type: "empty" }, { idx: 45, type: "empty" }, { idx: 46, type: "wood" },
        { idx: 53, type: "wood" }, { idx: 54, type: "empty" }, { idx: 55, type: "empty" }, { idx: 56, type: "wood" },
        // Ground
        { idx: 60, type: "grass" }, { idx: 61, type: "grass" }, { idx: 62, type: "grass" }, { idx: 63, type: "grass" },
        { idx: 64, type: "grass" }, { idx: 65, type: "grass" }, { idx: 66, type: "grass" }, { idx: 67, type: "grass" },
        { idx: 68, type: "grass" }, { idx: 69, type: "grass" },
        { idx: 70, type: "dirt" }, { idx: 71, type: "dirt" }, { idx: 72, type: "dirt" }, { idx: 73, type: "dirt" },
        { idx: 74, type: "dirt" }, { idx: 75, type: "dirt" }, { idx: 76, type: "dirt" }, { idx: 77, type: "dirt" },
        { idx: 78, type: "dirt" }, { idx: 79, type: "dirt" },
      ];
      houseIndices.forEach((item) => {
        if (item.idx < ROWS * COLS) emptyGrid[item.idx] = item.type;
      });
    }
    setGrid(emptyGrid);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md z-10">
      {/* Block Selector */}
      <div className="flex flex-wrap justify-center gap-2 mb-4 bg-slate-900 border border-indigo-500/40 p-2 rounded-xl w-full">
        {BLOCKS.map((block) => (
          <button
            key={block.type}
            onClick={() => {
              playSound("click");
              setSelectedBlock(block);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1 cursor-pointer border ${
              selectedBlock.type === block.type
                ? "bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
            }`}
          >
            <span>{block.icon}</span>
            <span>{block.label}</span>
          </button>
        ))}
      </div>

      {/* Grid Screen */}
      <div className="bg-slate-950 border-2 border-indigo-500/40 rounded-xl p-3 w-80 h-64 grid grid-cols-10 grid-rows-8 gap-1 shadow-2xl">
        {grid.map((cellType, idx) => {
          const block = BLOCKS.find((b) => b.type === cellType) || BLOCKS[0];
          return (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              className={`w-full h-full rounded-sm border-[0.5px] border-slate-900/40 flex items-center justify-center text-xs transition-all cursor-pointer ${block.color}`}
            >
              {block.type !== "empty" ? block.icon : ""}
            </button>
          );
        })}
      </div>

      {/* Presets and Actions */}
      <div className="flex gap-3 mt-4 w-full justify-center">
        <button
          onClick={() => loadPreset("sword")}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold font-mono text-[10px] uppercase tracking-wider rounded-xl border border-slate-600 shadow-sm cursor-pointer"
        >
          ⚔️ Sword Preset
        </button>
        <button
          onClick={() => loadPreset("house")}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold font-mono text-[10px] uppercase tracking-wider rounded-xl border border-slate-600 shadow-sm cursor-pointer"
        >
          🏠 House Preset
        </button>
        <button
          onClick={clearGrid}
          className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-bold font-mono text-[10px] uppercase tracking-wider rounded-xl border border-red-900/50 shadow-sm cursor-pointer"
        >
          🗑️ Clear Air
        </button>
      </div>
    </div>
  );
}

/* ==========================================
   GAME 5: RED DEAD QUICK DRAW
   ========================================== */
function QuickDrawGame({ gameTitle, highScore, onUpdateHighScore }) {
  const [gameState, setGameState] = useState("idle"); // 'idle', 'waiting', 'draw', 'shot', 'early', 'slow'
  const [reactionTime, setReactionTime] = useState(null);
  const [message, setMessage] = useState("Hold your hand steady near your holster...");
  const [opponentTime, setOpponentTime] = useState(350); // Opponent shoots in 350ms
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const startDuel = () => {
    playSound("click");
    setGameState("waiting");
    setMessage("HOLD YOUR HORSES... WAIT FOR IT...");
    const randomDelay = 2000 + Math.random() * 3000; // 2 to 5 seconds

    // Set opponent speed randomly between 280ms and 450ms
    setOpponentTime(Math.floor(280 + Math.random() * 170));

    timerRef.current = setTimeout(() => {
      setGameState("draw");
      setMessage("DRAW!!!");
      playSound("shoot");
      startTimeRef.current = Date.now();
    }, randomDelay);
  };

  const handleShoot = () => {
    if (gameState === "waiting") {
      // Shot too early! FOUL!
      clearTimeout(timerRef.current);
      setGameState("early");
      setMessage("FOUL DRAW! You shot too early! You were hanged for cheating.");
      playSound("gameover");
    } else if (gameState === "draw") {
      const timeTaken = Date.now() - startTimeRef.current;
      setReactionTime(timeTaken);

      if (timeTaken < opponentTime) {
        setGameState("shot");
        setMessage(`YOU WON! Fastest gun in the West! You shot him in ${timeTaken}ms (Opponent: ${opponentTime}ms)`);
        playSound("win");
        if (timeTaken < highScore) {
          onUpdateHighScore(timeTaken);
        }
      } else {
        setGameState("slow");
        setMessage(`YOU GOT SHOT! Too slow... He drew in ${opponentTime}ms, you took ${timeTaken}ms.`);
        playSound("gameover");
      }
    }
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-sm z-10">
      {/* High Score Header */}
      <div className="flex justify-between w-full mb-4 bg-slate-900 border border-indigo-500/50 p-2.5 rounded-xl font-mono text-xs">
        <div className="text-indigo-400">OPPONENT SPEED: <span className="text-white font-bold">{opponentTime}ms</span></div>
        <div className="text-yellow-400">YOUR BEST DRAW: <span className="text-white font-bold">{highScore === 9999 ? "N/A" : `${highScore}ms`}</span></div>
      </div>

      {/* Duel Screen */}
      <div className={`relative border-2 rounded-xl p-6 w-80 h-64 flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 ${
        gameState === "draw"
          ? "bg-red-600 border-red-500 shadow-red-500/30 animate-flash"
          : gameState === "waiting"
          ? "bg-amber-950/40 border-amber-500/50"
          : gameState === "shot"
          ? "bg-emerald-950/40 border-emerald-500/50"
          : gameState === "slow" || gameState === "early"
          ? "bg-rose-950/40 border-rose-500/50"
          : "bg-slate-950 border-indigo-500/40"
      }`}>
        {/* Visual indicators */}
        <div className="space-y-4">
          <div className="text-4xl">
            {gameState === "idle" && "🤠"}
            {gameState === "waiting" && "⏳"}
            {gameState === "draw" && "💥"}
            {gameState === "shot" && "🏆"}
            {gameState === "slow" && "💀"}
            {gameState === "early" && "🚫"}
          </div>

          <h3 className="font-mono font-black text-lg tracking-widest uppercase text-white">
            {gameState === "idle" && "QUICK DRAW DUEL"}
            {gameState === "waiting" && "STEADY..."}
            {gameState === "draw" && "FIRE!!!"}
            {gameState === "shot" && "VICTORY"}
            {gameState === "slow" && "WASTED"}
            {gameState === "early" && "DISQUALIFIED"}
          </h3>

          <p className="text-xs text-slate-300 font-mono max-w-[240px] leading-relaxed">
            {message}
          </p>

          {reactionTime && (gameState === "shot" || gameState === "slow") && (
            <div className="font-mono text-sm bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              YOUR TIME: <span className={gameState === "shot" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{reactionTime}ms</span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 mt-5 w-full justify-center z-10">
        {gameState === "idle" || gameState === "shot" || gameState === "slow" || gameState === "early" ? (
          <button
            onClick={startDuel}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl border-2 border-indigo-400 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Start Duel ⚔️
          </button>
        ) : (
          <button
            onClick={handleShoot}
            className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black font-mono text-sm uppercase tracking-widest rounded-2xl border-4 border-red-400 shadow-lg shadow-red-600/30 active:scale-90 transition-all cursor-pointer animate-pulse"
          >
            💥 SHOOT! 💥
          </button>
        )}
      </div>
    </div>
  );
}
