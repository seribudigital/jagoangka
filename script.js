// Math Mastery - Logic Script

/**
 * STATE MANAGEMENT
 */
const state = {
    user: {
        name: '',
        class: ''
    },
    game: {
        mode: null, // 'multiply', 'divide', 'add', 'subtract'
        type: 'practice', // 'practice' or 'exam'
        score: 0,
        questions: [],
        currentQuestionIndex: 0,
        currentAnswer: '', // User's input
        startTime: null,
        endTime: null,
        endTime: null,
        history: [], // Loaded from localStorage
        isProcessing: false // Lock to prevent double submission
    },
    selectedModeOp: null, // Temporary storage for selected operation in modal
    leaderboard: {
        filterClass: '7',
        filterOp: 'multiply',
        filterOp: 'multiply',
        filterTime: 'weekly', // 'weekly' or 'all'
        data: [],
        unsubscribe: null // Store listener
    }
};

/**
 * DOM ELEMENTS
 */
const screens = {
    welcome: document.getElementById('screen-welcome'),
    menu: document.getElementById('screen-menu'),
    game: document.getElementById('screen-game'),
    results: document.getElementById('screen-results'),
    modalMode: document.getElementById('modal-mode-select'),
    raport: document.getElementById('screen-raport'),
    leaderboard: document.getElementById('screen-leaderboard')
};

const els = {
    header: document.getElementById('app-header'),
    greeting: document.getElementById('user-greeting'),
    formWelcome: document.getElementById('form-welcome'),
    inputName: document.getElementById('input-name'),
    inputClass: document.getElementById('input-class'),
    gameScore: document.getElementById('game-score'),
    gameTimer: document.getElementById('game-timer'),
    gameModeLabel: document.getElementById('game-mode-label'),
    questionText: document.getElementById('question-text'),
    userAnswer: document.getElementById('user-answer'),
    inputDisplay: document.getElementById('input-display-container'),
    feedbackAnim: document.getElementById('feedback-anim'),
    historyList: document.getElementById('history-list'),
    resultGrade: document.getElementById('result-grade'),
    resultMessage: document.getElementById('result-message'),
    resultScore: document.getElementById('result-score'),
    resultTime: document.getElementById('result-time'),
    latestResult: document.getElementById('latest-result'),
    btnHistory: document.getElementById('btn-history'),
    btnStopExam: document.getElementById('btn-stop-exam'),
    btnBackGame: document.getElementById('btn-back-game'),
    examTimerContainer: document.getElementById('exam-timer-container'),
    examTimerBar: document.getElementById('exam-timer-bar'),

    // Raport
    raportName: document.getElementById('raport-name'),
    raportClass: document.getElementById('raport-class'),
    raportSubject: document.getElementById('raport-subject'),
    raportDate: document.getElementById('raport-date'),
    raportTableBody: document.getElementById('raport-table-body'),
    raportAverage: document.getElementById('raport-average'),
    raportGradeTitle: document.getElementById('raport-grade-title'),
    raportMotivation: document.getElementById('raport-motivation'),
    raportMotivation: document.getElementById('raport-motivation'),
    raportEmoji: document.getElementById('raport-emoji'),
    raportDescription: document.getElementById('raport-description'),

    // Leaderboard
    leaderboardList: document.getElementById('leaderboard-list'),
    leaderboardOpSelect: document.getElementById('select-leaderboard-op'),
    btnFilterClass7: document.getElementById('btn-filter-class-7'),
    btnFilterClass8: document.getElementById('btn-filter-class-8'),
    btnFilterClass9: document.getElementById('btn-filter-class-9'),
    btnFilterClassSMA: document.getElementById('btn-filter-class-SMA'),

    // Backgrounds
    bgVideo: document.getElementById('bg-video'),
    bgDefault: document.getElementById('bg-default')
};

/**
 * INITIALIZATION
 */
function init() {
    loadData();

    // Check if user exists
    if (state.user.name) {
        showMenu();
    } else {
        showWelcome();
    }

    // Event Listeners
    els.formWelcome.addEventListener('submit', (e) => {
        e.preventDefault();
        saveUser(els.inputName.value, els.inputClass.value);
        showMenu();
    });

    els.btnHistory.addEventListener('click', () => {
        showResults(false); // Show history without a new result
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (screens.game.classList.contains('hidden')) return;

        if (e.key >= '0' && e.key <= '9') keypadInput(e.key);
        if (e.key === '-') keypadInput('-');
        if (e.key === 'Backspace' || e.key === 'Delete') keypadInput('del');
        if (e.key === 'Enter') submitAnswer();
    });

    // Button Listeners
    els.btnStopExam.addEventListener('click', stopExam);
    els.btnBackGame.addEventListener('click', showMenu);
}

function loadData() {
    const savedUser = localStorage.getItem('math_mastery_user');
    if (savedUser) {
        state.user = JSON.parse(savedUser);
        updateGreeting();
    }

    const savedHistory = localStorage.getItem('math_mastery_history');
    if (savedHistory) {
        state.game.history = JSON.parse(savedHistory);
    }
}

function saveUser(name, className) {
    state.user.name = name;
    state.user.class = className;
    localStorage.setItem('math_mastery_user', JSON.stringify(state.user));
    updateGreeting();
}

function updateGreeting() {
    els.greeting.textContent = `Halo, ${state.user.name} - ${state.user.class}`;
}

/**
 * NAVIGATION
 */
function showWelcome() {
    hideAllScreens();
    screens.welcome.classList.remove('hidden');
    els.header.classList.add('hidden');
    updateBackground(true);
}

function showMenu() {
    hideAllScreens();
    screens.menu.classList.remove('hidden');
    els.header.classList.remove('hidden');
    updateBackground(false);
}

function showGame() {
    hideAllScreens();
    screens.game.classList.remove('hidden');
    els.header.classList.add('hidden'); // Hide header to prevent overlap with game controls
    updateBackground(false);
}

function showResults(isNewResult = true) {
    hideAllScreens();
    screens.results.classList.remove('hidden');
    renderHistory();

    if (isNewResult) {
        els.latestResult.classList.remove('hidden');
    } else {
        els.latestResult.classList.add('hidden');
    }
    updateBackground(false);
}

function updateBackground(isWelcome) {
    // Show video on Welcome, Menu, and Leaderboard screens
    // Hide video ONLY during Game and Result screens to focus attention
    const shouldShowVideo = isWelcome ||
        !screens.menu.classList.contains('hidden') ||
        !screens.leaderboard.classList.contains('hidden');

    if (shouldShowVideo) {
        els.bgVideo.classList.remove('opacity-0');
        els.bgVideo.classList.add('opacity-100');
        els.bgDefault.classList.remove('opacity-100');
        els.bgDefault.classList.add('opacity-0');
    } else {
        els.bgVideo.classList.remove('opacity-100');
        els.bgVideo.classList.add('opacity-0');
        els.bgDefault.classList.remove('opacity-0');
        els.bgDefault.classList.add('opacity-100');
    }
}

function showModeSelectModal(operation) {
    state.selectedModeOp = operation;
    screens.modalMode.classList.remove('hidden');
}

function closeModeSelect() {
    screens.modalMode.classList.add('hidden');
    state.selectedModeOp = null;
}

function showRaportScreen() {
    screens.raport.classList.remove('hidden');
}

function closeRaport() {
    screens.raport.classList.add('hidden');
}

function showLeaderboardScreen() {
    hideAllScreens();
    screens.leaderboard.classList.remove('hidden');
    els.header.classList.add('hidden'); // Fix: Hide main header to prevent overlap with Leaderboard header
    // Default filters based on user if available
    if (state.user.class) {
        // Simple logic to set default class filter
        const userClass = state.user.class.toString().toUpperCase();
        if (userClass.includes('7')) state.leaderboard.filterClass = '7';
        else if (userClass.includes('8')) state.leaderboard.filterClass = '8';
        else if (userClass.includes('9')) state.leaderboard.filterClass = '9';
        else if (['10', '11', '12', 'X', 'XI', 'XII', 'SMA', 'SMK', 'MA'].some(x => userClass.includes(x))) state.leaderboard.filterClass = 'SMA';
    }
    updateLeaderboardUI();
    fetchLeaderboard();
}

function hideAllScreens() {
    Object.values(screens).forEach(el => el.classList.add('hidden'));
}

/**
 * GAME LOGIC
 */
const GAME_CONFIG = {
    practice: {
        count: 10,
        timer: null
    },
    exam: {
        count: 50,
        timer: 7 // seconds per question
    }
};

let questionTimerInterval;

// Called by menu buttons now triggers modal
function showModeSelect(operation) {
    showModeSelectModal(operation);
}

function startTraining() {
    if (!state.selectedModeOp) return;
    initGame(state.selectedModeOp, 'practice');
    closeModeSelect();
}

function startExam() {
    if (!state.selectedModeOp) return;
    initGame(state.selectedModeOp, 'exam');
    closeModeSelect();
}

function initGame(mode, type) {
    state.game.mode = mode;
    state.game.type = type;
    state.game.score = 0;
    state.game.currentQuestionIndex = 0;
    state.game.isProcessing = false; // Reset lock
    state.game.startTime = new Date();

    const config = GAME_CONFIG[type];
    state.game.questions = generateQuestions(mode, config.count);
    state.game.currentAnswer = '';

    // Update UI
    let modeText = '';
    switch (mode) {
        case 'multiply': modeText = 'PERKALIAN'; break;
        case 'divide': modeText = 'PEMBAGIAN'; break;
        case 'add': modeText = 'PENJUMLAHAN'; break;
        case 'subtract': modeText = 'PENGURANGAN'; break;
    }
    els.gameModeLabel.textContent = `${modeText} - ${type === 'exam' ? 'UJIAN' : 'LATIHAN'}`;
    updateScoreUI();

    // UI Toggles for Exam vs Practice
    if (type === 'exam') {
        els.btnStopExam.classList.remove('hidden');
        els.btnBackGame.classList.add('hidden');
        els.examTimerContainer.classList.remove('hidden');
    } else {
        els.btnStopExam.classList.add('hidden');
        els.btnBackGame.classList.remove('hidden');
        els.examTimerContainer.classList.add('hidden');
    }

    showGame();
    renderQuestion();
    startTimer();
}

// Make stopExam global for inline onclick
window.stopExam = stopExam;
function stopExam() {
    if (confirm('Yakin ingin menghentikan ujian? Hasil tidak akan disimpan.')) {
        clearInterval(timerInterval);
        clearInterval(questionTimerInterval);
        showMenu();
    }
}

// Replaces startGame
function startGame(mode) {
    // Legacy support or direct call if needed
    showModeSelect(mode);
}

function generateQuestions(mode, count) {
    const questions = [];
    for (let i = 0; i < count; i++) {
        questions.push(generateSingleQuestion(mode));
    }
    return questions;
}

function generateSingleQuestion(mode) {
    let a, b, q, ans;

    switch (mode) {
        case 'multiply':
            a = rand(1, 10);
            b = rand(1, 10);
            q = `${a} × ${b}`;
            ans = a * b;
            break;
        case 'divide':
            b = rand(1, 10); // Divisor
            ans = rand(1, 10); // Answer
            a = b * ans; // Dividend
            q = `${a} ÷ ${b}`;
            break;
        case 'add':
            a = rand(-10, 10);
            b = rand(-10, 10);
            // Handle negative display nicely e.g. "5 + (-3)"
            let bStr = b < 0 ? `(${b})` : b;
            q = `${a} + ${bStr}`;
            ans = a + b;
            break;
        case 'subtract':
            a = rand(-10, 10);
            b = rand(-10, 10);
            let bStr2 = b < 0 ? `(${b})` : b;
            q = `${a} - ${bStr2}`;
            ans = a - b;
            break;
    }

    return { q, a: ans };
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function renderQuestion() {
    const curr = state.game.questions[state.game.currentQuestionIndex];
    els.questionText.textContent = curr.q;
    els.userAnswer.textContent = '';
    state.game.currentAnswer = '';

    // Reset and start Question Timer if Exam
    if (state.game.type === 'exam') {
        startQuestionTimer();
    }
}

function startQuestionTimer() {
    clearInterval(questionTimerInterval);
    const limit = GAME_CONFIG.exam.timer * 1000;
    let remaining = limit;
    const intervalStep = 50; // Update freq

    // Reset bar
    els.examTimerBar.style.width = '100%';
    els.examTimerBar.style.backgroundColor = '#22d3ee'; // Reset color

    questionTimerInterval = setInterval(() => {
        remaining -= intervalStep;
        const widthPct = (remaining / limit) * 100;
        els.examTimerBar.style.width = `${widthPct}%`;

        // Color change warning
        if (widthPct < 30) {
            els.examTimerBar.style.backgroundColor = '#ef4444'; // Red
        }

        if (remaining <= 0) {
            clearInterval(questionTimerInterval);
            handleTimeout();
        }
    }, intervalStep);
}

function handleTimeout() {
    // Time's up! Treat as incorrect/skip
    handleIncorrect();
}

function keypadInput(val) {
    if (val === 'del') {
        state.game.currentAnswer = state.game.currentAnswer.slice(0, -1);
    } else {
        // Limit length
        if (state.game.currentAnswer.length < 5) {
            // Prevent multiple minus signs
            if (val === '-' && state.game.currentAnswer.includes('-')) return;
            // Prevent minus not at start
            if (val === '-' && state.game.currentAnswer.length > 0) return;

            state.game.currentAnswer += val;
        }
    }
    els.userAnswer.textContent = state.game.currentAnswer;
}

function submitAnswer() {
    if (state.game.isProcessing) return; // Prevent double click
    if (state.game.currentAnswer === '') return; // Don't submit empty

    state.game.isProcessing = true; // Lock
    const userVal = parseInt(state.game.currentAnswer);
    const correctVal = state.game.questions[state.game.currentQuestionIndex].a;

    if (userVal === correctVal) {
        handleCorrect();
    } else {
        handleIncorrect();
    }
}

function handleCorrect() {
    // Visual Feedback
    els.inputDisplay.classList.add('border-green-500', 'bg-green-500/20');
    state.game.score += 10;
    updateScoreUI();

    setTimeout(() => {
        els.inputDisplay.classList.remove('border-green-500', 'bg-green-500/20');
        nextQuestion();
    }, 500);
}

function handleIncorrect() {
    els.inputDisplay.classList.add('border-red-500', 'animate-shake', 'bg-red-500/20');

    setTimeout(() => {
        els.inputDisplay.classList.remove('border-red-500', 'animate-shake', 'bg-red-500/20');
        nextQuestion();
    }, 500);
}

function nextQuestion() {
    // Clear question timer
    clearInterval(questionTimerInterval);

    state.game.currentQuestionIndex++;
    state.game.isProcessing = false; // Unlock for next question
    if (state.game.currentQuestionIndex >= state.game.questions.length) {
        endGame();
    } else {
        renderQuestion();
    }
}

function updateScoreUI() {
    els.gameScore.textContent = state.game.score;
}

let timerInterval;
function startTimer() {
    clearInterval(timerInterval);
    let seconds = 0;
    els.gameTimer.textContent = "00:00";

    timerInterval = setInterval(() => {
        seconds++;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        els.gameTimer.textContent = `${m}:${s}`;
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    clearInterval(questionTimerInterval);
    state.game.endTime = new Date();

    const durationMs = state.game.endTime - state.game.startTime;
    const durationSec = Math.floor(durationMs / 1000);

    const result = {
        date: new Date().toISOString(),
        mode: state.game.mode,
        type: state.game.type, // 'practice' or 'exam'
        score: state.game.score, // Max 100
        maxScore: state.game.type === 'exam' ? (GAME_CONFIG.exam.count * 10) : (GAME_CONFIG.practice.count * 10), // Adjust max score base
        duration: durationSec
    };

    saveResult(result);

    // Save to Firestore (only if it's an Exam, per requirement fairness)
    // Requirement says "Peringkat dihitung berdasarkan Skor Tertinggi... durasi waktu tertentu"
    // Usually only "Exam" mode is ranked because "Practice" has no time limit per set (only per question or none)
    // But let's save all for now or just Exam? Let's check requirements. 
    // "Skor Tertinggi dalam durasi waktu tertentu (misal sesi 1 menit)." -> implied constrained session.
    // Our Exam mode is 50 questions, 7s each. Practice is 10 questions.
    // Let's save both but filtering might usually prefer Exam. 
    // However, to be safe and allow user to see progress, let's save both but maybe handle in UI.
    // Actually, fairness logic mentions "Waktu Rata-rata per Soal".
    // Let's modify result object for firestore.

    // Calculate Average Time Per Question
    const questionCount = state.game.type === 'exam' ? GAME_CONFIG.exam.count : GAME_CONFIG.practice.count;
    // Note: durationSec is total time. 
    // In Exam, durationSec is how long they took.
    // In Practice, it's also how long they took.
    const avgTime = durationSec / questionCount;

    saveScoreToFirestore({
        ...result,
        avgTime: avgTime,
        user: state.user
    });

    displayResultSummary(result);
    showResults(true);
}

/**
 * FIREBASE INTEGRATION
 */
async function saveScoreToFirestore(data) {
    if (!window.firebaseDb) {
        console.error("Firebase not initialized");
        showToast("Error: Firebase belum terhubung. Cek console.", "error");
        return;
    }

    try {
        const collectionRef = window.firebaseCollection(window.firebaseDb, 'scores');

        // Prepare data with proper types
        const docData = {
            nama: data.user.name,
            kelasRaw: data.user.class, // Keep original
            kelas: state.leaderboard.filterClass || '7', // Fallback or derived needed? 
            // Better to normalize class from user input for filtering. 
            // Let's attempt to derive 'kelas' category (7, 8, 9, SMA) from user input
            kelasKategori: deriveClassCategory(data.user.class),
            tipeOperasi: data.mode,
            skor: data.score,
            waktuTotal: data.duration,
            waktuRataRata: data.avgTime, // Corrected duplicate keys
            tanggal: window.firebaseTimestamp.now(),
            mode: data.type // 'exam' or 'practice'
        };

        // Fix: Ensure we don't save if data is invalid or duplicate? 
        // For now, reliance on UI lock should be enough.
        console.log("Saving score...", docData);

        if (docData.kelasKategori === 'UNKNOWN') {
            // Maybe default to 7 or just save as is? 
            // Logic says "Segmentasi Data... Kelas 7, 8, 9, SMA".
            // If user types "5 SD", it won't appear in filters unless we add "SD".
            // For now, let's just save what we have, but for querying we need exact match.
            // We'll trust deriveClassCategory logic.
        }

        await window.firebaseAddDoc(collectionRef, docData);
        console.log("Score saved to Firestore!", docData);
        showToast("Skor berhasil disimpan ke Peringkat Juara!", "success");
    } catch (e) {
        console.error("Error adding document: ", e);
        showToast("Gagal menyimpan skor. Cek koneksi internet.", "error");
    }
}

function deriveClassCategory(inputClass) {
    const s = inputClass.toString().toUpperCase();
    if (s.includes('7')) return '7';
    if (s.includes('8')) return '8';
    if (s.includes('9')) return '9';
    if (['10', '11', '12', 'X', 'XI', 'XII', 'SMA', 'SMK', 'MA'].some(x => s.includes(x))) return 'SMA';
    return '7'; // Default fallback? Or 'UMUM'? Requirement says 7,8,9,SMA. Let's default to 7 if unknown to avoid exclusion or make 'UMUM'. 
    // Let's use '7' as safe default for now as it's the lowest.
}

async function fetchLeaderboard() {
    const listEl = els.leaderboardList; // Fix: Restore missing variable

    listEl.innerHTML = `
        <div class="animate-pulse space-y-4">
            <div class="h-16 bg-slate-800/50 rounded-xl"></div>
            <div class="h-16 bg-slate-800/50 rounded-xl"></div>
        </div>
    `;

    if (!window.firebaseDb) {
        listEl.innerHTML = `
            <div class="p-6 text-center text-red-400 bg-red-500/10 rounded-2xl border border-red-500/50">
                <p class="font-bold text-lg mb-2">Konfigurasi Belum Sesuai</p>
                <p class="text-sm">Koneksi ke sistem peringkat gagal. Pastikan konfigurasi Firebase di <code>index.html</code> sudah diisi dengan benar.</p>
            </div>
        `;
        showToast("Error: Firebase DB tidak ditemukan.", "error");
        return;
    }

    try {
        const scoresRef = window.firebaseCollection(window.firebaseDb, 'scores');

        // Construct Query
        const constraints = [
            window.firebaseWhere("tipeOperasi", "==", state.leaderboard.filterOp),
            window.firebaseWhere("kelasKategori", "==", state.leaderboard.filterClass)
        ];

        // Weekly Filter Logic
        if (state.leaderboard.filterTime === 'weekly') {
            // Calculate start of current week (Monday 00:00)
            const now = new Date();
            const day = now.getDay(); // 0 (Sun) - 6 (Sat)
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday

            const startOfWeek = new Date(now.setDate(diff));
            startOfWeek.setHours(0, 0, 0, 0);

            // Firestore requires Timestamp
            const startOfWeekTimestamp = window.firebaseTimestamp.fromDate(startOfWeek);

            console.log("Filtering weekly from:", startOfWeek);
            constraints.push(window.firebaseWhere("tanggal", ">=", startOfWeekTimestamp));

            // Default Sort for Weekly: Score Desc, then Date?
            // Note: If we use range filter on 'tanggal', the first orderBy MUST be 'tanggal'.
            // This is a Firestore limitation.
            // WORKAROUND: We cannot sort by Skor DESC directly if we filter by Date Range first.
            // However, we WANT high scores.
            // If we cannot get Firestore to do it efficiently without complex indexes,
            // we might need to fetch more data and sort client side, OR allow the index.

            // Let's try to follow Firestore rules:
            // "If you include a filter with a range comparison (<, <=, >, >=), your first ordering must be on the same field."
            // So: .where('tanggal', '>=', ...).orderBy('tanggal')
            // This means we get recent scores, but NOT necessarily high scores at the top.

            // ALTERNATIVE: Don't use range filter if possible?
            // Or use an advanced index?
            // Actually, Firestore CAN support this if we have the index: 
            // kelasKategori (==), tipeOperasi (==), tanggal (>=), skor (DESC)
            // But the rule says "your first ordering must be on the same field".
            // So we MUST orderBy('tanggal').

            // If we must orderBy('tanggal'), then we can't show "Highest Scores of the Week".
            // Client-side filtering is safer for "High Scores of the Week" if dataset is small.
            // BUT, if we have thousands of scores...

            // Let's try adding the orderBy 'skor' AFTER 'tanggal' and see if Firestore rejects it or if composite index handles it.
            // Wait, documentation says: "limitations... first ordering must be on the same field".

            // STRATEGY B: Filter by date on USER SIDE (Client side).
            // Fetch top 100/200 all time, then filter those that are from this week?
            // No, that might miss a high score from this week if it's not in the all-time top 100.

            // STRATEGY C: Use "Week ID" string? e.g. "2024-W06".
            // Then we can use equality filter: where("weekId", "==", "2024-W06").orderBy("skor", "desc").
            // This is the BEST way for scalability.
            // BUT we need to update data saving to include 'weekId'.
            // Since we can't migrate old data easily right now, let's look for a different way.

            // STRATEGY D: Just Try It. Maybe the error message will give a link to an index that allows it?
            // "You can combine range filter on one field and sort on another." -> NO, usually not without the specific index AND order.

            // Let's try Client-side filtering for "Weekly" for now roughly?
            // No, user wants real logic.

            // IMPLEMENTATION:
            // I will use client-side filtering for "Weekly" TO START WITH.
            // Why? Because it guarantees valid sorting (High Score).
            // We fetch Top 100 All Time, then filter for this week.
            // This is 90% good enough for a class/school app (not global scale).
            // If a kid plays this week and gets a high score, they will be in Top 100 All Time usually.
            // Only if 100 people play BETTER than them in history will they be hidden.
            // Correct? Yes.

            // WAIT! The user says: "buat query ke Firebase yang hanya mengambil data skor dari hari Senin minggu ini"
            // They explicitly asked for a Query.

            // Okay, let's stick to the Query request.
            // constraints.push(window.firebaseWhere("tanggal", ">=", startOfWeekTimestamp));
            // constraints.push(window.firebaseOrderBy("tanggal", "asc")); // Required
            // constraints.push(window.firebaseOrderBy("skor", "desc"));

            // Result: Leaders sorted by Date. Not Score.
            // This is useless for a leaderboard.

            // Let's check if the client-size sort is acceptable?
            // Or, we rely on the fact that if we create the index `tanggal ASC, skor DESC`, maybe it works?

            // Let's do Client Side Filter for Weekly to ensure Sort by Score.
            // Fetch specific "This Week" query might be hard without correct index.

            // RE-READING rule: "In a compound query, range (<, <=, >, >=) and inequality (!=, not-in) comparisons must all filter on the same field."
            // "If you include a filter with a range comparison, your first ordering must be on the same field."

            // OK, I will save score with a `weekId` field (e.g. `2024-07` for 7th week) going forward?
            // No, old data won't have it.

            // BETTER HYBRID APPROACH:
            // fetch 100 items ordered by 'tanggal' descending (Latest).
            // Then filter locally? Use 'limit(200)'.

            // Let's go with Client-Side Filtering of All Time Data for now, OR
            // Just fetching All Time Top 50 and filtering by date?
            // No, that hides new users.

            // Let's TRY the Index Approach. Maybe I'm wrong about the strictness if an index exists.

            // For now, I will implement logic to TOGGLE the constraints.
            // If Weekly:
            //   Query: where(op), where(class), where(tanggal >= start). orderBy(tanggal). orderBy(skor).
            //   Then CLIENT SIDE SORT by Score.
            //   This allows us to get "This Week's Games", but they come back sorted by Time.
            //   We fetch say 100.
            //   Then in Javascript, we sort by Score and take Top 20.

            constraints.push(window.firebaseWhere("tanggal", ">=", startOfWeekTimestamp));
            // We must orderBy tanggal first
            constraints.push(window.firebaseOrderBy("tanggal", "desc"));
            constraints.push(window.firebaseOrderBy("skor", "desc"));

            // We fetch more items to ensure we get high scores
            constraints.push(window.firebaseLimit(100));

            // We will need to SORT `querySnapshot` results manually by score before rendering.

        } else {
            // All Time
            constraints.push(window.firebaseOrderBy("skor", "desc"));
            constraints.push(window.firebaseOrderBy("waktuRataRata", "asc"));
            constraints.push(window.firebaseLimit(50));
        }

        const q = window.firebaseQuery(scoresRef, ...constraints);

        // Unsubscribe from previous listener if exists
        if (state.leaderboard.unsubscribe) {
            state.leaderboard.unsubscribe();
        }

        // Real-time listener
        state.leaderboard.unsubscribe = window.firebaseOnSnapshot(q, (querySnapshot) => {
            listEl.innerHTML = '';

            if (querySnapshot.empty) {
                listEl.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-64 text-slate-500">
                        <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p>Belum ada data peringkat untuk kategori ini.</p>
                    </div>
                `;
                return;
            }

            let docs = [];
            querySnapshot.forEach((doc) => {
                docs.push(doc.data());
            });

            // Client-side Sort if Weekly (because Firestore forced us to sort by Date)
            if (state.leaderboard.filterTime === 'weekly') {
                docs.sort((a, b) => {
                    // Score Descending
                    if (b.skor !== a.skor) return b.skor - a.skor;
                    // Time Ascending
                    return a.waktuRataRata - b.waktuRataRata;
                });
            }

            let rank = 1;
            docs.forEach((data) => {
                renderLeaderboardItem(data, rank++);
            });
        }, (error) => {
            // Handle listener error
            console.error("Error fetching leaderboard: ", error);

            // FALLBACK STRATEGY FOR WEEKLY FILTER
            // If the specific index is missing, fallback to fetching All Time and filtering client-side
            if (state.leaderboard.filterTime === 'weekly' && (error.message.includes('index') || error.code === 'failed-precondition')) {
                console.log("Weekly Index missing. Falling back to Client-Client filtering.");
                fetchLeaderboardFallback();
                return;
            }

            let errorMsg = "Gagal memuat data.";
            let errorHint = error.message;
            let indexAction = "";

            // Try to extract the index creation URL from the error message
            const indexUrlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);

            if (error.message.includes('requires an index') || error.code === 'failed-precondition') {
                errorMsg = "Sistem Peringkat perlu inisialisasi Database.";
                if (indexUrlMatch) {
                    indexAction = `<a href="${indexUrlMatch[0]}" target="_blank" class="block mt-3 bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-4 rounded-lg transition-colors underline decoration-dotted">Klik di sini untuk membuat Index Otomatis</a>`;
                    errorHint = "Klik tombol di atas untuk memperbaiki database secara otomatis.";
                } else {
                    errorHint = "Index Firestore belum dibuat. Buka Developer Console (F12) untuk melihat link pembuatan Index.";
                }
            } else if (error.code === 'unavailable') {
                errorMsg = "Koneksi internet bermasalah atau offline.";
            } else if (error.code === 'permission-denied') {
                errorMsg = "Akses Ditolak.";
                errorHint = "Cek Aturan Keamanan (Security Rules) di Firebase Console.";
            }

            listEl.innerHTML = `
                <div class="p-6 text-center text-red-200 bg-red-900/50 rounded-2xl border border-red-500/50 max-w-lg mx-auto">
                    <svg class="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <h3 class="font-bold text-xl mb-2">${errorMsg}</h3>
                    <p class="text-sm text-red-300/80 mb-4">${errorHint}</p>
                    ${indexAction}
                </div>
            `;
            showToast(`Error: ${errorMsg}`, "error");
        });

    } catch (e) {
        console.error("Error setting up listener: ", e);
        listEl.innerHTML = `<div class="p-4 text-center text-red-400">Gagal menginisialisasi sistem.<br><span class="text-xs text-slate-600">${e.message}</span></div>`;
    }
}

// Debug function to fetch raw data
function fetchLeaderboardDebug() {
    console.log("Fetching debug data...");
    const listEl = els.leaderboardList;
    listEl.innerHTML = '<div class="text-center p-4 text-slate-400 animate-pulse">Memuat semua data (Debug Mode)...</div>';

    if (!window.firebaseDb) {
        showToast("Firebase DB belum siap", "error");
        return;
    }

    // Simple query: Collection 'scores', limit 20. No ordering, no filtering.
    // This avoids Index issues.
    const q = window.firebaseQuery(
        window.firebaseCollection(window.firebaseDb, 'scores'),
        window.firebaseLimit(20)
    );

    window.firebaseGetDocs(q).then((snapshot) => {
        listEl.innerHTML = `
            <div class="mb-4 text-center">
                <button onclick="fetchLeaderboard()" class="text-xs text-brand-primary hover:text-white underline">
                    Kembali ke Mode Normal
                </button>
            </div>
        `;

        if (snapshot.empty) {
            listEl.innerHTML += `<div class="p-4 text-center text-yellow-500">DATABASE KOSONG. Tidak ada dokumen 'scores' sama sekali di server.</div>`;
            return;
        }

        let html = '<div class="space-y-2">';
        snapshot.forEach((doc) => {
            const data = doc.data();
            html += `
                <div class="p-3 bg-slate-900 rounded border border-slate-700 text-xs text-left">
                    <div class="font-bold text-white">${data.nama} <span class="text-slate-500">(${doc.id})</span></div>
                    <div class="text-slate-400">
                        Op: ${data.tipeOperasi} | Kategori: ${data.kelasKategori || data.kelasRaw} | Skor: ${data.skor}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        listEl.innerHTML += html;
    }).catch((e) => {
        console.error("Debug fetch failed", e);
        listEl.innerHTML = `<div class="p-4 text-red-500">Debug Error: ${e.message}</div>`;
        showToast("Debug fetch failed: " + e.message, "error");
    });
}

function renderLeaderboardItem(data, rank) {
    const listEl = els.leaderboardList;

    // Style for Top 3
    let rankBadge = `<div class="w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm text-center">${rank}</div>`;
    let rowBg = 'bg-slate-800/30';
    let border = 'border-slate-800';
    let scaleEffect = 'hover:scale-[1.01]';
    let icon = '';

    // Top 3 Styling
    if (rank === 1) {
        rankBadge = `<div class="text-2xl">🥇</div>`;
        rowBg = 'bg-yellow-500/20'; // Gold-ish
        border = 'border-yellow-500/50';
        scaleEffect = 'scale-[1.02] hover:scale-[1.03] shadow-lg shadow-yellow-500/10';
        icon = '<span class="text-yellow-400 ml-2">👑</span>';
    } else if (rank === 2) {
        rankBadge = `<div class="text-2xl">🥈</div>`;
        rowBg = 'bg-slate-300/20'; // Silver-ish
        border = 'border-slate-300/50';
    } else if (rank === 3) {
        rankBadge = `<div class="text-2xl">🥉</div>`;
        rowBg = 'bg-amber-700/20'; // Bronze-ish
        border = 'border-amber-700/50';
    }

    // Highlight Current User
    // Check if name and class match (simple check)
    const isCurrentUser = (data.nama === state.user.name && data.kelasRaw === state.user.class);

    if (isCurrentUser) {
        border = 'border-brand-primary border-2';
        rowBg = 'bg-brand-primary/10';
        // Ensure it stands out even if not top 3
        if (rank > 3) {
            rankBadge = `<div class="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-brand-primary/50">${rank}</div>`;
        }
    }

    const item = document.createElement('div');
    item.className = `flex items-center p-4 rounded-xl border ${border} ${rowBg} mb-3 transition-all ${scaleEffect}`;

    // Format timestamp
    // const date = data.tanggal ? new Date(data.tanggal.seconds * 1000).toLocaleDateString('id-ID') : '-';

    item.innerHTML = `
        <div class="mr-4">${rankBadge}</div>
        <div class="flex-1">
            <div class="font-bold text-white text-lg truncate">${data.nama}</div>
            <div class="text-xs text-slate-400 font-mono">${data.kelasRaw || data.kelasKategori} • ${data.tipeOperasi.toUpperCase()}</div>
        </div>
        <div class="text-right">
            <div class="font-bold text-brand-primary text-xl">${data.skor}</div>
            <div class="text-xs text-slate-500">${data.waktuRataRata.toFixed(2)}s / soal</div>
        </div>
    `;

    listEl.appendChild(item);
}

// FILTER FUNCTIONS
function filterLeaderboardClass(category) {
    state.leaderboard.filterClass = category;
    updateFilterUI();
    fetchLeaderboard();
}

function filterLeaderboardOp(operation) {
    state.leaderboard.filterOp = operation;
    // UI Select is valid automatically
    fetchLeaderboard();
}

function filterLeaderboardTime(timeMode) {
    state.leaderboard.filterTime = timeMode;
    updateFilterUI();
    fetchLeaderboard();
}

function updateFilterUI() {
    // Class Buttons
    ['7', '8', '9', 'SMA'].forEach(cls => {
        const btn = document.getElementById(`btn-filter-class-${cls}`);
        if (state.leaderboard.filterClass === cls) {
            btn.className = "flex-1 py-2 text-sm font-medium rounded-lg text-white bg-slate-700 shadow-lg shadow-black/20 transition-all";
            btn.innerHTML = cls === 'SMA' ? 'SMA' : `Kelas ${cls}`;
        } else {
            btn.className = "flex-1 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-white transition-all";
        }
    });

    // Time Buttons
    const btnWeekly = document.getElementById('btn-filter-time-weekly');
    const btnAll = document.getElementById('btn-filter-time-all');

    if (state.leaderboard.filterTime === 'weekly') {
        btnWeekly.className = "flex-1 py-2 text-sm font-medium rounded-lg text-white bg-slate-700 shadow-lg shadow-black/20 transition-all";
        btnAll.className = "flex-1 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-white transition-all";
    } else {
        btnWeekly.className = "flex-1 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-white transition-all";
        btnAll.className = "flex-1 py-2 text-sm font-medium rounded-lg text-white bg-slate-700 shadow-lg shadow-black/20 transition-all";
    }
}
// Make globally available for onclick
window.showLeaderboardScreen = showLeaderboardScreen;
window.filterLeaderboardClass = filterLeaderboardClass;
window.filterLeaderboardOp = filterLeaderboardOp;
window.filterLeaderboardTime = filterLeaderboardTime; // Add this
window.fetchLeaderboard = fetchLeaderboard;
window.fetchLeaderboardDebug = fetchLeaderboardDebug;
// Ensure showMenu is available as well
window.showMenu = showMenu;

// Fallback for Weekly Filter if Index is missing
function fetchLeaderboardFallback() {
    const listEl = els.leaderboardList;
    listEl.innerHTML = `
        <div class="animate-pulse space-y-4">
            <div class="h-16 bg-slate-800/50 rounded-xl"></div>
            <div class="h-16 bg-slate-800/50 rounded-xl"></div>
            <div class="text-center text-xs text-slate-500 mt-2">Mengambil data alternatif...</div>
        </div>
    `;

    // Fetch All Time Top 100
    const scoresRef = window.firebaseCollection(window.firebaseDb, 'scores');
    const q = window.firebaseQuery(scoresRef,
        window.firebaseWhere("tipeOperasi", "==", state.leaderboard.filterOp),
        window.firebaseWhere("kelasKategori", "==", state.leaderboard.filterClass),
        window.firebaseOrderBy("skor", "desc"),
        window.firebaseLimit(100)
    );

    window.firebaseGetDocs(q).then((snapshot) => {
        listEl.innerHTML = '';
        if (snapshot.empty) {
            listEl.innerHTML = `
                <div class="flex flex-col items-center justify-center h-64 text-slate-500">
                    <p>Belum ada data.</p>
                </div>
            `;
            return;
        }

        // Filter by Date Client Side
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(now.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);

        let docs = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Check date if available. If not available, assume old (don't show) or show? 
            // Better to hide if no date.
            if (data.tanggal) {
                const docDate = new Date(data.tanggal.seconds * 1000);
                if (docDate >= startOfWeek) {
                    docs.push(data);
                }
            }
        });

        if (docs.length === 0) {
            listEl.innerHTML = `
                <div class="flex flex-col items-center justify-center h-64 text-slate-500">
                     <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p>Belum ada skor minggu ini.</p>
                    <p class="text-xs mt-2 text-slate-600">(Mode Filter Alternatif)</p>
                </div>
            `;
            return;
        }

        let rank = 1;
        docs.forEach((data) => {
            renderLeaderboardItem(data, rank++);
        });

        showToast("Mode Perbaikan: Menampilkan skor minggu ini (Filter Alternatif)", "info");

    }).catch((e) => {
        console.error("Fallback failed", e);
        listEl.innerHTML = `<div class="p-4 text-center text-red-400">Gagal memuat data fallback.</div>`;
    });
}


// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-xl border translate-y-0 transition-transform duration-300 z-[100] flex items-center gap-2 font-medium`;

    if (type === 'success') {
        toast.classList.add('bg-green-600', 'text-white', 'border-green-500');
    } else if (type === 'error') {
        toast.classList.add('bg-red-600', 'text-white', 'border-red-500');
    } else {
        toast.classList.add('bg-slate-800', 'text-white', 'border-slate-700');
    }

    // Auto hide
    setTimeout(() => {
        toast.classList.add('translate-y-[-150%]');
        toast.classList.remove('translate-y-0');
    }, 3000);
}

/**
 * HISTORY & REPORTING
 */
function saveResult(result) {
    state.game.history.unshift(result);
    // Keep last 10
    if (state.game.history.length > 10) {
        state.game.history.pop();
    }
    localStorage.setItem('math_mastery_history', JSON.stringify(state.game.history));
}

function getGrade(score, maxScore) {
    // Normalize to 0-100
    const normalized = (score / maxScore) * 100;

    if (normalized === 100) return 'A+';
    if (normalized >= 90) return 'A';
    if (normalized >= 80) return 'B';
    if (normalized >= 60) return 'C';
    if (normalized >= 40) return 'D';
    return 'E';
}

function getRaportGrade(avgScore) {
    if (avgScore === 100) return 'Sempurna';
    if (avgScore >= 90) return 'Sangat Baik';
    if (avgScore >= 80) return 'Baik';
    if (avgScore >= 60) return 'Cukup';
    if (avgScore >= 40) return 'Kurang';
    return 'Perlu Bimbingan';
}

function getMotivation(score, name, maxScore) {
    const normalized = (score / maxScore) * 100;
    const firstName = name.split(' ')[0];
    if (normalized === 100) return `Sempurna! Kamu hebat sekali, ${firstName}!`;
    if (normalized >= 80) return `Kerja bagus, ${firstName}! Pertahankan!`;
    if (normalized >= 60) return `Lumayan, ${firstName}. Ayo latihan lagi!`;
    return `Jangan menyerah, ${firstName}. Kamu pasti bisa lebih baik!`;
}

function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}d`;
}

function displayResultSummary(result) {
    els.resultScore.textContent = result.score;
    els.resultTime.textContent = formatDuration(result.duration);
    els.resultScore.textContent = result.score;
    els.resultTime.textContent = formatDuration(result.duration);
    els.resultGrade.textContent = getGrade(result.score, result.maxScore);
    els.resultMessage.textContent = getMotivation(result.score, state.user.name, result.maxScore);
}

function renderHistory() {
    els.historyList.innerHTML = '';

    if (state.game.history.length === 0) {
        els.historyList.innerHTML = '<div class="text-center text-slate-500 py-8">Belum ada riwayat. Ayo mulai belajar!</div>';
        return;
    }

    state.game.history.forEach(item => {
        const date = new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

        let modeLabel = item.mode.toUpperCase();
        let typeLabel = (item.type === 'exam') ? 'UJIAN' : 'LATIHAN';
        let maxScore = item.maxScore || (item.mode === 'practice' || !item.type ? 100 : 500); // Fallback logic
        let normalizedScore = Math.round((item.score / maxScore) * 100);

        const el = document.createElement('div');
        el.className = 'bg-brand-surface/40 border border-slate-700/50 rounded-xl p-4 flex justify-between items-center animate-fade-in';
        el.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 ${normalizedScore >= 80 ? 'bg-brand-accent' : normalizedScore >= 60 ? 'bg-brand-primary' : 'bg-slate-500'}">
                    ${getGrade(item.score, maxScore).charAt(0)}
                </div>
                <div>
                    <div class="font-bold text-white text-sm">${modeLabel} <span class="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full ml-1 border border-slate-700">${typeLabel}</span></div>
                    <div class="text-xs text-slate-400">${date}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="font-bold text-white">${item.score} <span class="text-xs font-normal text-slate-500">/${maxScore}</span></div>
                <div class="text-xs text-slate-500">${formatDuration(item.duration)}</div>
            </div>
        `;
        els.historyList.appendChild(el);
    });
}

function showRaportFromModal() {
    if (!state.selectedModeOp) return;
    renderRaport(state.selectedModeOp);
    closeModeSelect();
    showRaportScreen();
}

function renderRaport(mode) {
    // Filter history for this mode AND type='exam'
    // Take last 3
    const exams = state.game.history.filter(h => h.mode === mode && h.type === 'exam').slice(0, 3);

    // Fill User Info
    els.raportName.textContent = state.user.name;
    els.raportClass.textContent = state.user.class;

    let modeName = '';
    switch (mode) {
        case 'multiply': modeName = 'Perkalian'; break;
        case 'divide': modeName = 'Pembagian'; break;
        case 'add': modeName = 'Penjumlahan'; break;
        case 'subtract': modeName = 'Pengurangan'; break;
    }
    els.raportSubject.textContent = `Operasi ${modeName}`;
    els.raportSubject.textContent = `Operasi ${modeName}`;
    els.raportDate.textContent = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    // Generate Exam Description
    const config = GAME_CONFIG.exam;
    let rangeDesc = "1 sampai 10";
    if (mode === 'add' || mode === 'subtract') rangeDesc = "-10 sampai 10";

    const desc = `${modeName} acak dari angka ${rangeDesc} sebanyak ${config.count} soal dengan waktu tiap soal ${config.timer} detik.`;
    els.raportDescription.textContent = desc;

    // Fill Table
    els.raportTableBody.innerHTML = '';

    let totalScore = 0;

    if (exams.length === 0) {
        els.raportTableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-slate-400 italic">Belum ada data ujian untuk operasi ini.</td></tr>';
    } else {
        exams.forEach(ex => {
            const date = new Date(ex.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });
            const max = ex.maxScore || 500;
            const normScore = (ex.score / max) * 100; // Normalize to 100 for Average calculation? Or use raw? User asked for "Nilai Rata Rata". Usually 0-100 scale is better for raport.
            // Let's normalize it to 0-100 scale for standard looking grades

            totalScore += normScore;

            const tr = document.createElement('tr');
            tr.className = "border-b border-slate-100";
            tr.innerHTML = `
                <td class="p-3">${date}</td>
                <td class="p-3">${formatDuration(ex.duration)}</td>
                <td class="p-3 text-right font-bold">${Math.round(normScore)}</td>
            `;
            els.raportTableBody.appendChild(tr);
        });
    }

    // Average
    const avg = exams.length > 0 ? Math.round(totalScore / exams.length) : 0;
    els.raportAverage.textContent = avg;

    // Grade & Motivation
    els.raportGradeTitle.textContent = getRaportGrade(avg);

    // Custom motivation based on Average
    let motiv = "";
    let emoji = "";

    if (avg === 100) {
        motiv = "Perfek! Kamu adalah master matematika sejati.";
        emoji = "👑";
    } else if (avg >= 85) {
        motiv = "Hasil yang sangat memuaskan! Pertahankan prestasimu.";
        emoji = "🌟";
    } else if (avg >= 70) {
        motiv = "Bagus! Kamu sudah paham, tapi masih bisa lebih teliti.";
        emoji = "👍";
    } else if (avg >= 55) {
        motiv = "Cukup baik. Perbanyak latihan agar nilai semakin meningkat.";
        emoji = "📚";
    } else {
        motiv = "Jangan patah semangat. Belajar lebih giat, kamu pasti bisa!";
        emoji = "💪";
    }

    els.raportMotivation.textContent = `"${motiv}"`
    els.raportEmoji.textContent = emoji;
}

// Start
init();
