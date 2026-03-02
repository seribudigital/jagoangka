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
        filterTime: 'weekly', // 'weekly' or 'all'
        data: [],
        lastDoc: null, // For pagination (startAfter)
        hasMore: false  // Whether more pages exist
    },
    // New: Audio State
    muted: false,
    // New: Badge System (Per-Mode tracking)
    achievements: {
        multiply: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] },
        divide: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] },
        add: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] },
        subtract: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] }
    },
    // New: Activity Logs
    activityLogs: {}, // { "YYYY-MM-DD": count }

    // New: Adaptive Learning
    weaknesses: {} // { "multiply": { "3x4": { count: 3, q: "3 x 4", a: 12 }, ... } }
};

/**
 * CONFIG
 */
const BADGES = [
    { id: 'speedster', icon: '⚡', title: 'Si Kilat', desc: 'Jawab 5 soal benar berturut-turut dengan cepat', condition: (ach) => ach.streak >= 5 },
    { id: 'math_warrior', icon: '🛡️', title: 'Pejuang Matematika', desc: 'Kumpulkan 50 jawaban benar total', condition: (ach) => ach.totalCorrect >= 50 },
    { id: 'perfectionist', icon: '👑', title: 'Nilai Sempurna', desc: 'Dapatkan nilai 100 di Mode Ujian', condition: (ach) => ach.perfectExams > 0 }
];

const SOUNDS = {
    correct: new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_bb630cc098.mp3'), // Ding
    incorrect: new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3') // Thud/Error
};

/**
 * DOM ELEMENTS
 */
const screens = {
    welcome: document.getElementById('screen-welcome'),
    landing: document.getElementById('screen-landing'),
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

    // Theme
    btnTheme: document.getElementById('btn-theme-toggle'),

    // Audio
    btnSound: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),

    // Badges (New Elements)
    // We will inject these dynamically
};

/**
 * INITIALIZATION
 */
function init() {
    loadData();
    initTheme();
    initAudio();

    // Check if user exists
    if (state.user.name) {
        showMenu();
    } else {
        showLanding();
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
    if (els.btnTheme) els.btnTheme.addEventListener('click', toggleTheme);
    if (els.btnSound) els.btnSound.addEventListener('click', toggleMute);
}

/**
 * AUDIO SYSTEM
 */
function initAudio() {
    updateMuteUI();
}

function toggleMute() {
    state.muted = !state.muted;
    saveData();
    updateMuteUI();
}

function updateMuteUI() {
    if (state.muted) {
        els.iconSoundOn.classList.add('hidden');
        els.iconSoundOff.classList.remove('hidden');
        els.btnSound.classList.add('bg-red-500/20', 'text-red-400');
    } else {
        els.iconSoundOn.classList.remove('hidden');
        els.iconSoundOff.classList.add('hidden');
        els.btnSound.classList.remove('bg-red-500/20', 'text-red-400');
    }
}

function playFeedback(isCorrect) {
    if (state.muted) return;

    const sound = isCorrect ? SOUNDS.correct : SOUNDS.incorrect;
    sound.currentTime = 0; // Reset
    sound.play().catch(e => console.log("Audio play failed interaction required", e));
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

    const savedAchievements = localStorage.getItem('math_mastery_achievements');
    if (savedAchievements) {
        const parsed = JSON.parse(savedAchievements);
        if (parsed.multiply) {
            // New schema format
            state.achievements = { ...state.achievements, ...parsed };
        } else {
            // Backwards compatibility: Migrate old global schema to multiply
            state.achievements.multiply = { ...state.achievements.multiply, ...parsed };
        }
    }

    const savedMute = localStorage.getItem('math_mastery_muted');
    if (savedMute !== null) {
        state.muted = savedMute === 'true';
    }

    const savedActivity = localStorage.getItem('math_mastery_activity');
    if (savedActivity) {
        state.activityLogs = JSON.parse(savedActivity);
        cleanupActivityLogs();
    }

    const savedWeaknesses = localStorage.getItem('math_mastery_weaknesses');
    if (savedWeaknesses) {
        state.weaknesses = JSON.parse(savedWeaknesses);
    }

    // Retroactive badge check for 'perfectionist' per-mode
    ['multiply', 'divide', 'add', 'subtract'].forEach(mode => {
        if (!state.achievements[mode]) {
            state.achievements[mode] = { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] };
        }

        if (state.achievements[mode].perfectExams === 0 && state.game.history.length > 0) {
            const hasPerfectExam = state.game.history.some(h => {
                if (h.type !== 'exam' || h.mode !== mode) return false;
                const max = h.maxScore || (h.score === 100 ? 100 : 500);
                return h.score === max && h.score > 0; // ensure no 0-score logic accidentally counts
            });
            if (hasPerfectExam) {
                state.achievements[mode].perfectExams = 1;
                saveData();
            }
        }
    });

    checkAllAchievementsSilent(); // Update achievements per mode silently without popping up toasts on reload

    // Initial check for recommendation
    // Can't update UI here directly as DOM might not be fully ready or hidden, 
    // but showMenu() will be called anyway if user is logged in.
}

function saveData() {
    localStorage.setItem('math_mastery_achievements', JSON.stringify(state.achievements));
    localStorage.setItem('math_mastery_muted', state.muted);
    localStorage.setItem('math_mastery_activity', JSON.stringify(state.activityLogs));
    localStorage.setItem('math_mastery_weaknesses', JSON.stringify(state.weaknesses));
}

function saveUser(name, className) {
    const isNewUser = (!state.user || !state.user.name) || (state.user.name.trim().toLowerCase() !== name.trim().toLowerCase());

    if (isNewUser) {
        // Clear old data when a different user registers
        state.game.history = [];
        state.achievements = {
            totalCorrect: 0,
            streak: 0,
            perfectExams: 0,
            badges: []
        };
        state.activityLogs = {};
        state.weaknesses = {};

        localStorage.removeItem('math_mastery_history');
        localStorage.removeItem('math_mastery_achievements');
        localStorage.removeItem('math_mastery_activity');
        localStorage.removeItem('math_mastery_weaknesses');

        // Ensure state user is initialized to avoid null errors below
        if (!state.user) state.user = {};
    }

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

const btnLandingAction = document.getElementById('btn-landing-action');

function showLanding() {
    hideAllScreens();
    screens.landing.classList.remove('hidden');
    els.header.classList.add('hidden');
    updateBackground(true);

    // Update Button Text/State
    if (state.user.name) {
        btnLandingAction.textContent = "Kembali ke Menu";
    } else {
        btnLandingAction.textContent = "Mulai Belajar";
    }
}

function handleLandingAction() {
    if (state.user.name) {
        showMenu();
    } else {
        showWelcome();
    }
}

window.showWelcome = showWelcome;
window.showLanding = showLanding;
window.showWelcome = showWelcome;
window.showLanding = showLanding;
window.handleLandingAction = handleLandingAction;
window.startFocusedPractice = startFocusedPractice;

function showMenu() {
    hideAllScreens();
    screens.menu.classList.remove('hidden');
    els.header.classList.remove('hidden');
    updateBackground(false);
    updateDashboardRecommendation();
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
        // Render badges specifically for results screen
        renderBadges('results-badges');
    } else {
        els.latestResult.classList.add('hidden');
        // If viewing history, also show badges? 
        // Logic says "Gallery Badge" at bottom of results or profile.
        // Let's show it always in results screen for motivation.
        renderBadges('results-badges');
    }

    // Render Activity Chart
    setTimeout(() => {
        renderActivityChart();
    }, 100);

    updateBackground(false);
}

function updateBackground(isWelcome) {
    // 3D Background takes care of itself. We can dim canvas opacity during game.
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const shouldShowFull = isWelcome ||
            !screens.landing.classList.contains('hidden') ||
            !screens.menu.classList.contains('hidden') ||
            !screens.leaderboard.classList.contains('hidden');

        if (shouldShowFull) {
            canvas.style.opacity = '1';
            canvas.style.transition = 'opacity 1s ease';
        } else {
            // Dim the canvas slightly during gameplay/results to focus on questions
            canvas.style.opacity = '0.3';
            canvas.style.transition = 'opacity 1s ease';
        }
    }
}

function showModeSelectModal(operation) {
    state.selectedModeOp = operation;

    // Check if Focused Mode should be available
    const btnFocused = document.getElementById('btn-focused-mode');
    const weakCount = countWeaknesses(operation);

    if (weakCount > 0) {
        btnFocused.classList.remove('hidden');
        btnFocused.classList.add('flex'); // Ensure flex display
    } else {
        btnFocused.classList.add('hidden');
        btnFocused.classList.remove('flex');
    }

    screens.modalMode.classList.remove('hidden');
}

function countWeaknesses(mode) {
    if (!state.weaknesses[mode]) return 0;
    // Count items with > 2 errors
    return Object.values(state.weaknesses[mode]).filter(item => item.count > 2).length;
}

function closeModeSelect() {
    screens.modalMode.classList.add('hidden');
    state.selectedModeOp = null;
}

function updateDashboardRecommendation() {
    const hintContainer = document.getElementById('recommendation-hint');
    const hintText = document.getElementById('recommendation-text');

    if (!hintContainer || !hintText) return;

    // Find mode with most weaknesses
    let maxWeakness = 0;
    let worstMode = null;

    ['multiply', 'divide', 'add', 'subtract'].forEach(mode => {
        const count = countWeaknesses(mode);
        if (count > maxWeakness) {
            maxWeakness = count;
            worstMode = mode;
        }
    });

    if (maxWeakness > 0 && worstMode) {
        let modeName = '';
        switch (worstMode) {
            case 'multiply': modeName = 'Perkalian'; break;
            case 'divide': modeName = 'Pembagian'; break;
            case 'add': modeName = 'Penjumlahan'; break;
            case 'subtract': modeName = 'Pengurangan'; break;
        }

        hintText.innerHTML = `Kamu punya <b>${maxWeakness} soal sulit</b> di <span class='text-brand-text font-bold'>${modeName}</span>. Yuk, perbaiki nilai kamu!`;
        hintContainer.classList.remove('hidden');
    } else {
        hintContainer.classList.add('hidden');
    }
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
    updateFilterUI();
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

// Focused Mode Logic
function startFocusedPractice() {
    if (!state.selectedModeOp) return;
    initFocusedGame(state.selectedModeOp);
    closeModeSelect();
}

// Re-uses initGame but with specific question generation
function initFocusedGame(mode) {
    state.game.mode = mode;
    state.game.type = 'practice'; // Treat as practice
    state.game.score = 0;
    state.game.currentQuestionIndex = 0;
    state.game.isProcessing = false;
    state.game.startTime = new Date();

    // Generate Focused Questions
    state.game.questions = generateFocusedQuestions(mode, GAME_CONFIG.practice.count);
    state.game.currentAnswer = '';

    // Update UI
    let modeText = '';
    switch (mode) {
        case 'multiply': modeText = 'PERKALIAN'; break;
        case 'divide': modeText = 'PEMBAGIAN'; break;
        case 'add': modeText = 'PENJUMLAHAN'; break;
        case 'subtract': modeText = 'PENGURANGAN'; break;
    }
    els.gameModeLabel.textContent = `${modeText} - FOKUS`; // Special label
    updateScoreUI();

    // UI Toggles (Same as Practice)
    els.btnStopExam.classList.add('hidden');
    els.btnBackGame.classList.remove('hidden');
    els.examTimerContainer.classList.add('hidden');

    showGame();
    renderQuestion();
    startTimer();
}

function generateFocusedQuestions(mode, count) {
    const questions = [];
    const weakItems = [];

    // 1. Collect Weaknesses (> 2 errors)
    if (state.weaknesses[mode]) {
        Object.values(state.weaknesses[mode]).forEach(item => {
            if (item.count > 2) {
                weakItems.push(item);
            }
        });
    }

    // 2. Determine Strategy
    // Threshold: If < 3 weaknesses, mix with random.
    let needed = count;

    if (weakItems.length === 0) {
        // Fallback if user clicked Focused but has no weaknesses
        // Just generate random
        return generateQuestions(mode, count);
    }

    // Fill with weaknesses first
    while (questions.length < count) {
        if (weakItems.length >= 3) {
            // Enough weaknesses, mostly use them
            // Pick random weakness
            const randWeak = weakItems[Math.floor(Math.random() * weakItems.length)];
            questions.push({ q: randWeak.q, a: randWeak.a });
        } else {
            // Mixed Mode (Broadening the horizong to avoid boredom)
            // 50% chance weakness, 50% chance random
            if (Math.random() > 0.5 || weakItems.length === 0) {
                questions.push(generateSingleQuestion(mode));
            } else {
                const randWeak = weakItems[Math.floor(Math.random() * weakItems.length)];
                questions.push({ q: randWeak.q, a: randWeak.a });
            }
        }
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
    els.inputDisplay.classList.add('border-green-500', 'bg-green-500/20', 'animate-bounce-custom');
    state.game.score += 10;

    // Badge Logic Updates (Per-Mode tracking)
    state.achievements[state.game.mode].totalCorrect++;
    state.achievements[state.game.mode].streak++;

    // Activity Log Update
    const today = new Date().toISOString().split('T')[0];
    state.activityLogs[today] = (state.activityLogs[today] || 0) + 1;

    // Adaptive Learning: Reduce weakness count
    // Identify current question key
    const currentQ = state.game.questions[state.game.currentQuestionIndex];
    // We need to reconstruct key or store it. Let's use question string as unique enough for now?
    // actually, let's use a standard key format if possible, but question text is unique per operation usually.
    // Better to have a helper to generate key?
    // For now, let's use the question string 'q' as key.
    trackWeakness(currentQ.q, currentQ.a, state.game.mode, true); // true = correct answer

    saveData();

    playFeedback(true);
    checkAchievements();
    updateScoreUI();

    setTimeout(() => {
        els.inputDisplay.classList.remove('border-green-500', 'bg-green-500/20', 'animate-bounce-custom');
        nextQuestion();
    }, 500);
}

function handleIncorrect() {
    els.inputDisplay.classList.add('border-red-500', 'animate-shake', 'bg-red-500/20');

    // Adaptive Learning: Track Weakness
    const currentQ = state.game.questions[state.game.currentQuestionIndex];
    trackWeakness(currentQ.q, currentQ.a, state.game.mode, false); // false = incorrect answer

    // Badge Logic Updates (Per-Mode tracking)
    state.achievements[state.game.mode].streak = 0; // Reset streak

    playFeedback(false);
    updateScoreUI(); // Just in case we want to show streak loss later

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

    // Check specific Exam badges
    if (state.game.type === 'exam') {
        const correctAnswers = state.game.score / 10;
        const totalAnswers = state.game.currentQuestionIndex; // Using currentQuestionIndex to represent answers given
        if (state.game.score === result.maxScore && correctAnswers === totalAnswers && totalAnswers > 0) {
            state.achievements[state.game.mode].perfectExams++;
            checkAchievements(); // Will unlock 'perfectionist'
        }
    }

    saveData(); // Save achievements persistence
    displayResultSummary(result);
    showResults(true);
}

/**
 * ADAPTIVE LEARNING SYSTEM
 */
function trackWeakness(questionText, answer, mode, isCorrect) {
    // Ensure mode object exists
    if (!state.weaknesses[mode]) {
        state.weaknesses[mode] = {};
    }

    const key = questionText.replace(/\s/g, ''); // Remove spaces for key e.g. "3x4"

    if (isCorrect) {
        // Recovering / Mastery
        if (state.weaknesses[mode][key]) {
            state.weaknesses[mode][key].count--;

            // Visual Reward if mastery happens (count drops to 0 or below)
            // But let's just show "Good Job" if it WAS a weakness.
            if (state.weaknesses[mode][key].count <= 0) {
                delete state.weaknesses[mode][key];
                showToast("Mantap! Kelemahanmu berkurang! 💪", "success");
            } else {
                // Still weak but improving
            }
        }
    } else {
        // Incorrect
        if (!state.weaknesses[mode][key]) {
            state.weaknesses[mode][key] = {
                q: questionText,
                a: answer,
                count: 0
            };
        }
        state.weaknesses[mode][key].count++;

        // Only persist if count > 2? Or just persist all failures and filter later?
        // Requirement: "dijawab salah lebih dari 2 kali".
        // Let's count every error, but only consider it a "Weakness" for Focused Mode if count > 2.
    }

    // Auto-save happens in handleCorrect/handleIncorrect via saveData()
}

// Show Toast Helper (if not exists, create simple one)
function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return; // Should be in HTML

    toast.textContent = msg;
    toast.classList.remove('translate-y-[-150%]', 'bg-brand-surface', 'border-brand-border', 'text-brand-text');

    if (type === 'success') {
        toast.style.backgroundColor = '#10b981'; // Green
        toast.style.color = 'white';
    } else if (type === 'error') {
        toast.style.backgroundColor = '#ef4444'; // Red
        toast.style.color = 'white';
    } else {
        toast.style.backgroundColor = '#1f2937'; // Dark
        toast.style.color = 'white';
    }

    toast.classList.remove('translate-y-[-150%]');
    setTimeout(() => {
        toast.classList.add('translate-y-[-150%]');
    }, 3000);
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

const LEADERBOARD_PAGE_SIZE = 20;

async function fetchLeaderboard(isLoadMore = false) {
    const listEl = els.leaderboardList;

    if (!isLoadMore) {
        // Reset pagination state on fresh fetch
        state.leaderboard.lastDoc = null;
        state.leaderboard.hasMore = false;

        listEl.innerHTML = `
            <div class="animate-pulse space-y-4">
                <div class="h-16 bg-slate-800/50 rounded-xl"></div>
                <div class="h-16 bg-slate-800/50 rounded-xl"></div>
            </div>
        `;
    }

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
            window.firebaseWhere("kelasKategori", "==", state.leaderboard.filterClass),
            window.firebaseOrderBy("skor", "desc"),
            window.firebaseOrderBy("waktuRataRata", "asc")
        ];

        // Pagination: startAfter last document if loading more
        if (isLoadMore && state.leaderboard.lastDoc) {
            constraints.push(window.firebaseStartAfter(state.leaderboard.lastDoc));
        }

        // Weekly fetches slightly more to account for client-side date filtering
        const pageSize = state.leaderboard.filterTime === 'weekly'
            ? LEADERBOARD_PAGE_SIZE * 3  // 60 docs, filter client-side
            : LEADERBOARD_PAGE_SIZE;     // 20 docs

        constraints.push(window.firebaseLimit(pageSize));

        const q = window.firebaseQuery(scoresRef, ...constraints);

        // One-time fetch (with offline cache support from IndexedDB persistence)
        const querySnapshot = await window.firebaseGetDocs(q);

        // Remove loading indicator or "Load More" button
        if (!isLoadMore) {
            listEl.innerHTML = '';
        } else {
            // Remove the existing "Load More" button
            const loadMoreBtn = listEl.querySelector('#btn-load-more');
            if (loadMoreBtn) loadMoreBtn.remove();
        }

        // Save last document for pagination
        const allDocs = querySnapshot.docs;
        if (allDocs.length > 0) {
            state.leaderboard.lastDoc = allDocs[allDocs.length - 1];
        }
        state.leaderboard.hasMore = allDocs.length >= pageSize;

        let docs = [];
        querySnapshot.forEach((doc) => {
            docs.push(doc.data());
        });

        // Client-side date filtering for Weekly
        if (state.leaderboard.filterTime === 'weekly') {
            const now = new Date();
            const dayOfWeek = now.getDay();
            const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday, 0, 0, 0, 0);

            docs = docs.filter(data => {
                if (!data.tanggal) return false;
                const docDate = new Date(data.tanggal.seconds * 1000);
                return docDate >= startOfWeek;
            });
        }

        // Deduplicate: keep only the best score per person
        const seen = new Set();
        docs = docs.filter(data => {
            const key = (data.nama || '').toLowerCase().trim() + '|' + (data.kelasRaw || '');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        if (docs.length === 0 && !isLoadMore) {
            listEl.innerHTML = `
                <div class="flex flex-col items-center justify-center h-64 text-slate-500">
                    <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p>Belum ada data peringkat untuk kategori ini.</p>
                </div>
            `;
            return;
        }

        // Calculate rank offset for pagination
        const existingItems = listEl.querySelectorAll('.leaderboard-item');
        let rank = existingItems.length + 1;

        docs.forEach((data) => {
            renderLeaderboardItem(data, rank++);
        });

        // Add "Load More" button if there may be more data
        if (state.leaderboard.hasMore) {
            const loadMoreDiv = document.createElement('div');
            loadMoreDiv.id = 'btn-load-more';
            loadMoreDiv.innerHTML = `
                <button onclick="loadMoreLeaderboard()"
                    class="w-full mt-4 py-3 bg-brand-surface/50 hover:bg-brand-surface border border-brand-border/50 rounded-xl text-brand-text-muted hover:text-brand-text transition-all text-sm font-medium">
                    Muat Lebih Banyak
                </button>
            `;
            listEl.appendChild(loadMoreDiv);
        }

    } catch (error) {
        console.error("Error fetching leaderboard: ", error);

        // FALLBACK STRATEGY FOR WEEKLY FILTER
        if (state.leaderboard.filterTime === 'weekly' && (error.message.includes('index') || error.code === 'failed-precondition')) {
            console.log("Weekly Index missing. Falling back to client-side filtering.");
            fetchLeaderboardFallback();
            return;
        }

        let errorMsg = "Gagal memuat data.";
        let errorHint = error.message;
        let indexAction = "";

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
    }
}

async function loadMoreLeaderboard() {
    await fetchLeaderboard(true);
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
    item.className = `leaderboard-item flex items-center p-4 rounded-xl border ${border} ${rowBg} mb-3 transition-all ${scaleEffect}`;

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
window.filterLeaderboardTime = filterLeaderboardTime;
window.fetchLeaderboard = fetchLeaderboard;
window.fetchLeaderboardDebug = fetchLeaderboardDebug;
window.loadMoreLeaderboard = loadMoreLeaderboard;
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

    // Fetch Top 50 using the existing composite index (reduced from 200)
    const scoresRef = window.firebaseCollection(window.firebaseDb, 'scores');
    const q = window.firebaseQuery(scoresRef,
        window.firebaseWhere("tipeOperasi", "==", state.leaderboard.filterOp),
        window.firebaseWhere("kelasKategori", "==", state.leaderboard.filterClass),
        window.firebaseOrderBy("skor", "desc"),
        window.firebaseOrderBy("waktuRataRata", "asc"),
        window.firebaseLimit(50)
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

        // Filter by Date Client Side (non-mutating date calculation)
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
        const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday, 0, 0, 0, 0);

        let docs = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.tanggal) {
                const docDate = new Date(data.tanggal.seconds * 1000);
                if (docDate >= startOfWeek) {
                    docs.push(data);
                }
            }
        });

        // Deduplicate: keep only the best score per person
        const seen = new Set();
        docs = docs.filter(data => {
            const key = (data.nama || '').toLowerCase().trim() + '|' + (data.kelasRaw || '');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
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

    // Render Badges in Raport
    renderBadges('raport-badges', mode);
}

/**
 * BADGE SYSTEM LOGIC
 */
function checkAchievements() {
    const mode = state.game.mode;
    if (!mode || !state.achievements[mode]) return;

    BADGES.forEach(badge => {
        // If not already unlocked
        if (!state.achievements[mode].badges.includes(badge.id)) {
            if (badge.condition(state.achievements[mode])) {
                unlockBadge(badge.id, mode, false);
            }
        }
    });
}

function checkAllAchievementsSilent() {
    ['multiply', 'divide', 'add', 'subtract'].forEach(mode => {
        if (!state.achievements[mode]) return;

        BADGES.forEach(badge => {
            if (!state.achievements[mode].badges.includes(badge.id)) {
                if (badge.condition(state.achievements[mode])) {
                    unlockBadge(badge.id, mode, true);
                }
            }
        });
    });
}

function unlockBadge(badgeId, mode, isSilent) {
    if (!state.achievements[mode]) return;

    state.achievements[mode].badges.push(badgeId);
    saveData();

    if (isSilent) return; // Do not show UI if checking quietly on load

    const badge = BADGES.find(b => b.id === badgeId);
    if (!badge) return;

    // Show Toast
    const toast = document.getElementById('badge-toast');
    const title = document.getElementById('badge-toast-title');
    const desc = document.getElementById('badge-toast-desc');

    if (toast && title && desc) {
        title.textContent = badge.title;
        desc.textContent = badge.desc;

        toast.classList.add('show');

        // Play success sound
        playFeedback(true); // Or a special sound if available

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

function renderBadges(containerId, mode) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    if (!mode || !state.achievements[mode]) return;

    BADGES.forEach(badge => {
        const isUnlocked = state.achievements[mode].badges.includes(badge.id);
        const statusClass = isUnlocked ? 'unlocked' : 'locked';

        const el = document.createElement('div');
        el.className = `badge-item ${statusClass}`;

        // Tooltip Text Logic
        // If unlocked: "Diraih pada [Date?]" (We don't store date yet, just text)
        // If locked: badge.desc (Instruction how to get)
        const tooltipText = isUnlocked ? 'Badge Telah Diraih!' : badge.desc;

        el.innerHTML = `
            <div class="badge-icon text-3xl">
                ${badge.icon}
            </div>
            <div class="text-xs font-bold text-center text-brand-text leading-tight">${badge.title}</div>
            
            <!-- Tooltip -->
            <div class="tooltip">
                ${tooltipText}
            </div>
        `;

        // Z-Index fix for locked hover
        if (!isUnlocked) {
            el.addEventListener('mouseenter', () => {
                el.style.zIndex = '50';
            });
            el.addEventListener('mouseleave', () => {
                el.style.zIndex = 'auto';
            });
        }

        container.appendChild(el);
    });
}

/**
 * THEME MANANGEMENT
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    // Default to dark if not set, or follow saved
    const isLight = savedTheme === 'light';

    if (isLight) {
        document.documentElement.classList.add('light');
    } else {
        document.documentElement.classList.remove('light');
    }
    updateThemeIcon(isLight);
}

function toggleTheme() {
    const isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeIcon(isLight);
}

function updateThemeIcon(isLight) {
    if (!els.btnTheme) return;

    if (isLight) {
        // Light Mode -> Show Moon (switch to Dark)
        els.btnTheme.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
        `;
        els.btnTheme.classList.add('text-brand-text');
        els.btnTheme.classList.remove('text-yellow-400');
        els.btnTheme.classList.remove('text-brand-text-muted');
    } else {
        // Dark Mode -> Show Sun (switch to Light)
        els.btnTheme.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        `;
        els.btnTheme.classList.add('text-yellow-400');
        els.btnTheme.classList.remove('text-brand-text');
        els.btnTheme.classList.remove('text-brand-text-muted');
    }
}

// Start
/**
 * ACTIVITY TRACKING & CHART
 */
let activityChartInstance = null;

function cleanupActivityLogs() {
    const today = new Date();
    const cutoff = new Date();
    cutoff.setDate(today.getDate() - 10); // Keep last 10 days
    const cutoffStr = cutoff.toISOString().split('T')[0];

    // Ensure logs exist
    if (!state.activityLogs) state.activityLogs = {};

    Object.keys(state.activityLogs).forEach(date => {
        if (date < cutoffStr) {
            delete state.activityLogs[date];
        }
    });
}

function renderActivityChart() {
    const ctx = document.getElementById('activity-chart');
    const emptyState = document.getElementById('activity-empty-state');

    if (!ctx) return;

    // Check if there is any data at all
    const hasData = state.activityLogs && Object.keys(state.activityLogs).length > 0;

    if (!hasData) {
        ctx.style.display = 'none';
        if (emptyState) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
        }
        return;
    } else {
        ctx.style.display = 'block';
        if (emptyState) {
            emptyState.classList.add('hidden');
            emptyState.classList.remove('flex');
        }
    }

    // Prepare Last 7 Days Data
    const labels = [];
    const data = [];
    const daysIndo = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        labels.push(daysIndo[d.getDay()]);
        data.push(state.activityLogs[dateStr] || 0);
    }

    // Determine Theme Colors
    const isDark = !document.documentElement.classList.contains('light');
    const colorBar = isDark ? '#22d3ee' : '#6366f1'; // Cyan (Dark) vs Indigo (Light)
    const colorGrid = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const colorText = isDark ? '#94a3b8' : '#64748b';

    // Destroy existing chart
    if (activityChartInstance) {
        activityChartInstance.destroy();
    }

    // Create New Chart
    activityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Soal Benar',
                data: data,
                backgroundColor: colorBar,
                borderRadius: 6,
                hoverBackgroundColor: isDark ? '#67e8f9' : '#818cf8',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#f8fafc' : '#0f172a',
                    bodyColor: isDark ? '#f8fafc' : '#0f172a',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return `${context.raw} Soal Benar`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: colorGrid },
                    ticks: {
                        color: colorText,
                        stepSize: 1, // FORCE INTEGER INTERVAL
                        precision: 0 // FORCE NO DECIMALS
                    },
                    border: { display: false }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: colorText },
                    border: { display: false }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Start
init();
