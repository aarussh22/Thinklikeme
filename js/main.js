let board, game;
let currentPuzzle = null;
let currentLevel = 1;
let correctStreak = 0;
let failCount = 0;
let timer = 0;
let interval;
let userMoves = [];

function startPuzzle() {
    const levelPuzzles = puzzles[currentLevel];
    currentPuzzle = levelPuzzles[Math.floor(Math.random() * levelPuzzles.length)];

    game = new Chess(currentPuzzle.fen);
    board = Chessboard('board', {
        position: currentPuzzle.fen,
        draggable: true,
        onDrop: onDrop
    });

    userMoves = [];
    document.getElementById("result").innerText = "";

    // Start timer
    clearInterval(interval);
    timer = 0;
    document.getElementById("timer").innerText = timer;
    interval = setInterval(() => {
        timer++;
        document.getElementById("timer").innerText = timer;
    }, 1000);
}

function onDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    userMoves.push(`${source}-${target}`);
}

function submitSolution() {
    clearInterval(interval);

    const correctMoves = currentPuzzle.solution.map(m => m.toLowerCase().replace(/\s/g, ''));
    const user = userMoves.map(m => m.toLowerCase());

    const isCorrect = JSON.stringify(user) === JSON.stringify(correctMoves);

    if (isCorrect) {
        correctStreak++;
        failCount = 0;
        if (correctStreak === 3 && currentLevel < 5) {
            currentLevel++;
            correctStreak = 0;
        }
        document.getElementById("result").innerText = "✅ Correct!";
    } else {
        failCount++;
        correctStreak = 0;
        if (failCount >= 2) {
            document.getElementById("result").innerText = "❌ Challenge Over! Try Again.";
            resetGame();
            return;
        } else {
            document.getElementById("result").innerText = "❌ Incorrect. Try the next one.";
            if (currentLevel > 1) currentLevel--;
        }
    }

    document.getElementById("level").innerText = currentLevel;
    setTimeout(startPuzzle, 2000);
}

function resetGame() {
    currentLevel = 1;
    correctStreak = 0;
    failCount = 0;
    timer = 0;
    document.getElementById("timer").innerText = "0";
    document.getElementById("level").innerText = "1";
    board.position('start');
}