// Math Mastery - Logic Script

/**
 * STATE MANAGEMENT
 */
const state = {
    appMode: 'pemantauan', // 'pemantauan' or 'remedial' or 'duel'
    user: {
        name: '',
        class: '',
        pin: ''
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
        subtract: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] },
        decimal_add: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] },
        decimal_subtract: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] },
        decimal_multiply: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] },
        decimal_divide: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] }
    },
    // New: Activity Logs
    activityLogs: {}, // { "YYYY-MM-DD": count }

    // New: Adaptive Learning
    weaknesses: {}, // { "multiply": { "3x4": { count: 3, q: "3 x 4", a: 12 }, ... } }

    // Dynamic Configuration from Firebase
    appConfig: {
        multiply: { minA: 1, maxA: 10, minB: 1, maxB: 10, examTimer: 7 },
        divide: { minDivisor: 1, maxDivisor: 10, minAns: 1, maxAns: 10, examTimer: 7 },
        add: { min: -10, max: 10, examTimer: 7 },
        subtract: { min: -10, max: 10, examTimer: 7 },
        decimal_add: { minBase: 1, maxBase: 99, shiftA: -1, shiftB: -1, examTimer: 10 },
        decimal_subtract: { minBase: 1, maxBase: 99, shiftA: -1, shiftB: -1, examTimer: 10 },
        decimal_multiply: { minBase: 1, maxBase: 9, shiftA: -1, shiftB: -1, examTimer: 10 },
        decimal_divide: { minBaseAns: 1, maxBaseAns: 10, minBaseDivisor: 1, maxBaseDivisor: 10, shiftAns: 0, shiftDivisor: -1, examTimer: 10 },
        global_settings: { minExamScore: 90, minPracticeScore: 70, monitoringPracticeCount: 10, practiceQuestionsCount: 10 }
    }
};

/**
 * CONFIG
 */
// --- STATE TAMBAHAN UNTUK ANTI-SPAM & ADAPTIVE LEARNING ---
let spamAnswerCount = 0;
let questionStartTime = 0;
let consecutiveCorrectFocusCount = 0;
let currentFocusCategory = null;

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
    modeSelection: document.getElementById('screen-mode-selection')
};

const els = {
    header: document.getElementById('app-header'),
    greeting: document.getElementById('user-greeting'),
    formWelcome: document.getElementById('form-welcome'),
    inputName: document.getElementById('input-name'),
    inputClass: document.getElementById('input-class'),
    selectName: document.getElementById('select-name'),
    selectClass: document.getElementById('select-class'),
    loginDropdownMode: document.getElementById('login-dropdown-mode'),
    loginManualMode: document.getElementById('login-manual-mode'),
    containerPinDropdown: document.getElementById('container-pin-dropdown'),
    inputPin: document.getElementById('input-pin'),
    errorPin: document.getElementById('error-pin'),
    inputNewPin: document.getElementById('input-new-pin'),
    bannerChangePin: document.getElementById('banner-change-pin'),
    modalChangePin: document.getElementById('modal-change-pin'),
    inputOldPin: document.getElementById('input-old-pin'),
    inputNewPinChange: document.getElementById('input-new-pin-change'),
    errorChangePin: document.getElementById('error-change-pin'),
    modalNewStudent: document.getElementById('modal-new-student'),
    gameScore: document.getElementById('game-score'),
    gameTimer: document.getElementById('game-timer'),
    gameModeLabel: document.getElementById('game-mode-label'),
    gameProgressLabel: document.getElementById('game-progress-label'),
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
    raportMainTitle: document.getElementById('raport-main-title'),
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

async function fetchAppConfig() {
    if (typeof window.firebaseDB !== 'undefined' && typeof window.firebaseGet !== 'undefined') {
        try {
            const configRef = window.firebaseRef(window.firebaseDB, 'appConfig/difficulty');
            const snapshot = await window.firebaseGet(configRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                for (const mode in data) {
                    if (state.appConfig[mode]) {
                        state.appConfig[mode] = { ...state.appConfig[mode], ...data[mode] };
                    }
                }
            }
        } catch (e) {
            console.error("Gagal mengambil konfigurasi tingkat kesulitan dari Firebase:", e);
        }
    } else {
        setTimeout(fetchAppConfig, 2000);
    }
}

let appStudentList = {};

async function fetchStudentList() {
    if (typeof window.firebaseDB !== 'undefined' && typeof window.firebaseGet !== 'undefined') {
        try {
            const listRef = window.firebaseRef(window.firebaseDB, 'appConfig/students');
            const snapshot = await window.firebaseGet(listRef);
            if (snapshot.exists()) {
                const rawData = snapshot.val();
                appStudentList = {};
                
                // Normalisasi struktur (mengubah format array lama menjadi object dengan PIN)
                for (const kelas in rawData) {
                    appStudentList[kelas] = {};
                    const classData = rawData[kelas];
                    
                    if (Array.isArray(classData)) {
                        classData.forEach(name => {
                            if (name && typeof name === 'string') appStudentList[kelas][name] = "1234";
                        });
                    } else if (typeof classData === 'object') {
                        for (const key in classData) {
                            if (!isNaN(key)) {
                                // Format array lama yang tersimpan sebagai object (key 0, 1, 2)
                                const name = classData[key];
                                if (name && typeof name === 'string') appStudentList[kelas][name] = "1234";
                            } else {
                                appStudentList[kelas][key] = classData[key];
                            }
                        }
                    }
                }
                
                populateClassDropdown();
            } else {
                confirmNewStudent(); // Fallback if no students
            }
        } catch (e) {
            console.error("Gagal mengambil daftar siswa:", e);
            confirmNewStudent();
        }
    } else {
        setTimeout(fetchStudentList, 1000);
    }
}

function populateClassDropdown() {
    if (!els.selectClass) return;
    els.selectClass.innerHTML = '<option value="" disabled selected>Pilih Kelas</option>';
    const classes = Object.keys(appStudentList).sort();
    classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        els.selectClass.appendChild(opt);
    });
    els.selectClass.addEventListener('change', populateNameDropdown);
}

function populateNameDropdown() {
    if (!els.selectClass || !els.selectName) return;
    const selectedClass = els.selectClass.value;
    els.selectName.innerHTML = '<option value="" disabled selected>Pilih Nama</option>';
    els.selectName.disabled = true;

    if (selectedClass && appStudentList[selectedClass]) {
        const names = Object.keys(appStudentList[selectedClass]).sort();
        names.forEach(n => {
            const opt = document.createElement('option');
            opt.value = n;
            opt.textContent = n;
            els.selectName.appendChild(opt);
        });
        els.selectName.disabled = false;
    }
}

els.selectName.addEventListener('change', () => {
    if (els.selectName.value) {
        els.containerPinDropdown.classList.remove('hidden');
        els.inputPin.value = '';
        els.errorPin.classList.add('hidden');
        els.inputPin.focus();
    } else {
        els.containerPinDropdown.classList.add('hidden');
    }
});

window.showNewStudentModal = function() {
    if(els.modalNewStudent) els.modalNewStudent.classList.remove('hidden');
}
window.closeNewStudentModal = function() {
    if(els.modalNewStudent) els.modalNewStudent.classList.add('hidden');
}
window.confirmNewStudent = function() {
    if(els.modalNewStudent) els.modalNewStudent.classList.add('hidden');
    if(els.loginDropdownMode) els.loginDropdownMode.classList.add('hidden');
    if(els.loginManualMode) els.loginManualMode.classList.remove('hidden');
    
    if(els.selectClass) els.selectClass.removeAttribute('required');
    if(els.selectName) els.selectName.removeAttribute('required');
    if(els.inputClass) els.inputClass.setAttribute('required', 'true');
    if(els.inputName) els.inputName.setAttribute('required', 'true');
}
window.cancelNewStudent = function() {
    if(els.loginDropdownMode) els.loginDropdownMode.classList.remove('hidden');
    if(els.loginManualMode) els.loginManualMode.classList.add('hidden');
    
    if(els.selectClass) els.selectClass.setAttribute('required', 'true');
    if(els.selectName) els.selectName.setAttribute('required', 'true');
    if(els.inputClass) els.inputClass.removeAttribute('required');
    if(els.inputName) els.inputName.removeAttribute('required');
    if(els.inputNewPin) els.inputNewPin.removeAttribute('required');
}

async function appendNewStudentToFirebase(className, name, pin) {
    if (!className || !name) return;
    const cleanClass = className.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanPin = pin ? pin.trim() : "1234";
    
    try {
        if (!appStudentList[cleanClass]) {
            appStudentList[cleanClass] = {};
        }
        if (!appStudentList[cleanClass][cleanName]) {
            appStudentList[cleanClass][cleanName] = cleanPin;
            if (typeof window.firebaseDB !== 'undefined' && typeof window.firebaseSet !== 'undefined') {
                const listRef = window.firebaseRef(window.firebaseDB, 'appConfig/students');
                await window.firebaseSet(listRef, appStudentList);
            }
        }
    } catch(e) {
        console.error("Failed to append new student to DB", e);
    }
}

function init() {
    loadData();
    initTheme();
    initAudio();

    // Check if user exists
    if (state.user.name) {
        showModeSelection();
    } else {
        showLanding();
    }

    // Event Listeners
    els.formWelcome.addEventListener('submit', (e) => {
        e.preventDefault();
        let name = '';
        let className = '';
        let pin = '';
        
        if (els.loginManualMode && !els.loginManualMode.classList.contains('hidden')) {
            name = els.inputName.value;
            className = els.inputClass.value;
            pin = els.inputNewPin.value || "1234";
            if (pin.length < 4) {
                alert("PIN harus terdiri dari minimal 4 angka!");
                return;
            }
            appendNewStudentToFirebase(className, name, pin);
        } else {
            name = els.selectName ? els.selectName.value : '';
            className = els.selectClass ? els.selectClass.value : '';
            pin = els.inputPin.value;
            
            if (name && className) {
                const correctPin = appStudentList[className][name] || "1234";
                if (pin !== correctPin) {
                    els.errorPin.classList.remove('hidden');
                    return;
                }
                els.errorPin.classList.add('hidden');
            }
        }

        if (!name || !className) {
            alert("Harap isi nama dan kelas!");
            return;
        }

        saveUser(name, className, pin);
        showModeSelection();
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

    // Button Listeners (Some are inline in HTML: stopExam, handleBackGame)
    if (els.btnTheme) els.btnTheme.addEventListener('click', toggleTheme);
    if (els.btnSound) els.btnSound.addEventListener('click', toggleMute);

    // Fetch Dynamic Configuration
    fetchAppConfig();
    fetchStudentList();
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
    ['multiply', 'divide', 'add', 'subtract', 'decimal_add', 'decimal_subtract', 'decimal_multiply', 'decimal_divide'].forEach(mode => {
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

function saveUser(name, className, pin) {
    const isNewUser = (!state.user || !state.user.name) || (state.user.name.trim().toLowerCase() !== name.trim().toLowerCase());

    if (isNewUser) {
        // Clear old data when a different user registers
        state.game.history = [];
        state.achievements = {
            multiply: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] },
            divide: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] },
            add: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] },
            subtract: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] },
            decimal_add: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] },
            decimal_subtract: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] },
            decimal_multiply: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] },
            decimal_divide: { totalCorrect: 0, streak: 0, perfectExams: 0, badges: [] }
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
    if (pin) state.user.pin = pin;
    
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
        showModeSelection();
    } else {
        showWelcome();
    }
}

window.showWelcome = showWelcome;
window.showLanding = showLanding;
window.handleLandingAction = handleLandingAction;
window.startFocusedPractice = startFocusedPractice;

function showModeSelection() {
    hideAllScreens();
    screens.modeSelection.classList.remove('hidden');
    els.header.classList.remove('hidden');
    updateBackground(false);
}
window.showModeSelection = showModeSelection;

function selectAppMode(mode) {
    state.appMode = mode;
    if (mode === 'duel') {
        showDuelLobby();
    } else {
        showMenu();
    }
}
window.selectAppMode = selectAppMode;

function showMenu() {
    try {
        state.game.isProcessing = false;
        hideAllScreens();
        screens.menu.classList.remove('hidden');
        els.header.classList.remove('hidden');
        updateBackground(false);
        try {
            updateDashboardRecommendation();
        } catch (e) {
            console.error("Dashboard error:", e);
        }
        
        if (state.user.pin === "1234") {
            els.bannerChangePin.classList.remove('hidden');
        } else {
            els.bannerChangePin.classList.add('hidden');
        }
    } catch (e) {
        console.error("Error showing menu:", e);
    }
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
    try {
        state.selectedModeOp = operation;

        // Update modal title based on operation
        const modeTitle = document.getElementById('mode-select-title');
        if (modeTitle) modeTitle.textContent = getModeName(operation) || 'Pilih Mode';

        // Check monitoring status
        const banner = document.getElementById('monitoring-banner');
        const bannerText = document.getElementById('monitoring-text');
        const lockOverlay = document.getElementById('exam-lock-overlay');
        const btnExam = document.getElementById('btn-start-exam');
        
        const mStatus = state.user.monitoring_status?.[operation];
        
        if (mStatus && mStatus.active) {
            const needed = mStatus.exercises_needed - (mStatus.exercises_done || 0);
            if (banner) {
                banner.classList.remove('hidden');
                if(bannerText) bannerText.textContent = `Selesaikan ${needed} latihan lagi dengan nilai di atas batas minimal untuk membuka ujian.`;
            }
            if (lockOverlay) lockOverlay.classList.remove('hidden');
            if (btnExam) btnExam.classList.add('opacity-80', 'cursor-not-allowed');
        } else {
            if (banner) banner.classList.add('hidden');
            if (lockOverlay) lockOverlay.classList.add('hidden');
            if (btnExam) btnExam.classList.remove('opacity-80', 'cursor-not-allowed');
        }

        // Check if Focused Mode should be available
        const btnFocused = document.getElementById('btn-focused-mode');
        const weakCount = countWeaknesses(operation);

        if (btnFocused) {
            if (weakCount > 0) {
                btnFocused.classList.remove('hidden');
                btnFocused.classList.add('flex'); // Ensure flex display
            } else {
                btnFocused.classList.add('hidden');
                btnFocused.classList.remove('flex');
            }
        }

        if (screens.modalMode) {
            screens.modalMode.classList.remove('hidden');
        }
    } catch (e) {
        console.error("showModeSelectModal error:", e);
    }
}

function countWeaknesses(mode) {
    if (!state.weaknesses || !state.weaknesses[mode]) return 0;
    
    try {
        const weakness = state.weaknesses[mode];
        if (typeof weakness.total_salah !== 'undefined') {
            return weakness.total_salah;
        }
        
        return Object.values(weakness).filter(item => item && item.count > 2).length;
    } catch (e) {
        return 0;
    }
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

    ['multiply', 'divide', 'add', 'subtract', 'decimal_add', 'decimal_subtract', 'decimal_multiply', 'decimal_divide'].forEach(mode => {
        const count = countWeaknesses(mode);
        if (count > maxWeakness) {
            maxWeakness = count;
            worstMode = mode;
        }
    });

    if (maxWeakness > 0 && worstMode) {
        const modeName = getModeName(worstMode);

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

function downloadRaportPDF() {
    // Use browser's native print dialog — supports "Save as PDF" in all browsers.
    // CSS @media print rules in style.css handle the layout.
    window.print();
}
window.downloadRaportPDF = downloadRaportPDF;

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
    state.selectedModeOp = operation;
    if (state.appMode === 'remedial') {
        startExam();
    } else {
        showModeSelectModal(operation);
    }
}

function startTraining() {
    if (!state.selectedModeOp) return;
    initGame(state.selectedModeOp, 'practice');
    closeModeSelect();
}

function startExam() {
    if (!state.selectedModeOp) return;
    const mode = state.selectedModeOp;
    
    // Remedial bypasses all locks
    if (state.appMode !== 'remedial') {
        const mStatus = state.user.monitoring_status?.[mode];
        if (mStatus && mStatus.active) {
            const minPracticeScore = state.appConfig.global_settings?.minPracticeScore || 70;
            alert(`🔒 UJIAN TERKUNCI!\nKamu sedang dalam pemantauan. Selesaikan ${mStatus.exercises_needed - (mStatus.exercises_done || 0)} Latihan lagi dengan nilai minimal ${minPracticeScore} untuk membuka ujian.`);
            return;
        }
    }
    
    initGame(mode, 'exam');
    closeModeSelect();
}

function initGame(mode, type) {
    state.game.mode = mode;
    state.game.type = type;
    state.game.isFocused = false;
    state.game.score = 0;
    state.game.currentQuestionIndex = 0;
    state.game.isLocked = false;
    state.game.isProcessing = false; // Reset lock
    state.game.startTime = new Date();

    // Update config dynamically from global settings
    if (state.appConfig.global_settings && state.appConfig.global_settings.practiceQuestionsCount) {
        GAME_CONFIG.practice.count = state.appConfig.global_settings.practiceQuestionsCount;
    }
    const config = GAME_CONFIG[type];
    state.game.questions = generateQuestions(mode, config.count);
    state.game.currentAnswer = '';

    // Update UI
    let modeText = getModeName(mode).toUpperCase();
    els.gameModeLabel.textContent = `${modeText} - ${type === 'exam' ? 'UJIAN' : 'LATIHAN'}`;
    updateScoreUI();

    // UI Toggles for Exam vs Practice
    if (type === 'exam') {
        els.btnStopExam.classList.remove('hidden');
        els.examTimerContainer.classList.remove('hidden');
    } else {
        els.btnStopExam.classList.add('hidden');
        els.examTimerContainer.classList.add('hidden');
    }

    if (els.gameProgressLabel) {
        if (state.game.questions && state.game.questions.length > 0) {
            els.gameProgressLabel.classList.remove('hidden');
        } else {
            els.gameProgressLabel.classList.add('hidden');
        }
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

window.handleBackGame = handleBackGame;
function handleBackGame() {
    if (state.game.type === 'exam') {
        stopExam();
    } else {
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
    state.game.isFocused = true;
    state.game.score = 0;
    state.game.currentQuestionIndex = 0;
    state.game.isProcessing = false;
    state.game.startTime = new Date();

    // Generate Focused Questions
    // Update config dynamically
    if (state.appConfig.global_settings && state.appConfig.global_settings.practiceQuestionsCount) {
        GAME_CONFIG.practice.count = state.appConfig.global_settings.practiceQuestionsCount;
    }
    state.game.questions = generateFocusedQuestions(mode, GAME_CONFIG.practice.count);
    state.game.currentAnswer = '';

    // Update UI
    let modeText = getModeName(mode).toUpperCase();
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
    if (state.weaknesses && state.weaknesses[mode]) {
        try {
            const weakness = state.weaknesses[mode];
            if (typeof weakness.total_salah !== 'undefined' && Array.isArray(weakness.contoh_kasus)) {
                weakness.contoh_kasus.forEach(qStr => {
                    const operators = ['+', '-', '×', '÷'];
                    for (let op of operators) {
                        if (qStr.includes(` ${op} `)) {
                            let parts = qStr.split(` ${op} `);
                            if (parts.length === 2) {
                                let num1 = parseFloat(parts[0].replace(/[()]/g, ''));
                                let num2 = parseFloat(parts[1].replace(/[()]/g, ''));
                                if (!isNaN(num1) && !isNaN(num2)) {
                                    let a;
                                    if (op === '+') a = num1 + num2;
                                    else if (op === '-') a = num1 - num2;
                                    else if (op === '×') a = num1 * num2;
                                    else if (op === '÷') a = num1 / num2;
                                    weakItems.push({ q: qStr, a: a });
                                }
                            }
                            break;
                        }
                    }
                });
            } else {
                Object.values(weakness).forEach(item => {
                    if (item && item.count > 2) {
                        weakItems.push(item);
                    }
                });
            }
        } catch (e) {
            console.error("Error reading weaknesses:", e);
        }
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

function randNegativeOrPositive(min, max) {
    let val = rand(min, max);
    return Math.random() > 0.5 ? val : -val; 
}

function generateSingleQuestion(mode) {
    if (mode === 'fokus') {
        let maxErrors = 0;
        let worstCategory = null;
        
        const savedWeaknesses = localStorage.getItem('math_mastery_weaknesses');
        if (savedWeaknesses) {
            const weaknesses = JSON.parse(savedWeaknesses);
            for (let cat in weaknesses) {
                if (weaknesses[cat].total_salah > maxErrors) {
                    maxErrors = weaknesses[cat].total_salah;
                    worstCategory = cat;
                }
            }
        }
        
        if (worstCategory) {
            currentFocusCategory = worstCategory;
            mode = worstCategory;
        } else {
            mode = 'multiply';
        }
    } else {
        currentFocusCategory = null;
    }

    let a, b, q, ans;
    const baseModeMap = {
        'penjumlahan_negatif': 'add', 'pengurangan_negatif': 'subtract',
        'perkalian_negatif': 'multiply', 'pembagian_acak': 'divide', 'desimal': 'decimal_add'
    };
    const configMode = baseModeMap[mode] || mode;
    const cfg = state.appConfig[configMode] || { min: 1, max: 10, minA: 1, maxA: 10, minB: 1, maxB: 10, minDivisor: 2, maxDivisor: 9, minAns: 2, maxAns: 9 };

    switch (mode) {
        case 'penjumlahan_negatif':
            a = randNegativeOrPositive(cfg.min, cfg.max);
            b = randNegativeOrPositive(cfg.min, cfg.max);
            if (a > 0 && b > 0) a = -a; 
            q = `${a} + ${b < 0 ? `(${b})` : b}`;
            ans = a + b;
            break;
        case 'pengurangan_negatif':
            a = randNegativeOrPositive(cfg.min, cfg.max);
            b = randNegativeOrPositive(cfg.min, cfg.max);
            if (a > 0 && b > 0) b = -b; 
            q = `${a} - ${b < 0 ? `(${b})` : b}`;
            ans = a - b;
            break;
        case 'perkalian_negatif':
            a = randNegativeOrPositive(cfg.minA, cfg.maxA);
            b = randNegativeOrPositive(cfg.minB, cfg.maxB);
            if (a > 0 && b > 0) a = -a;
            q = `${a} × ${b < 0 ? `(${b})` : b}`;
            ans = a * b;
            break;
        case 'pembagian_acak':
            b = rand(cfg.minDivisor, cfg.maxDivisor);
            ans = randNegativeOrPositive(cfg.minAns, cfg.maxAns);
            a = b * ans;
            q = `${a} ÷ ${b}`;
            break;
        case 'desimal':
            a = roundTo((Math.random() * 10) + 1, 1);
            b = roundTo((Math.random() * 10) + 1, 1);
            q = `${a} + ${b}`;
            ans = roundTo(a + b, 1);
            break;
        case 'multiply':
            a = rand(cfg.minA, cfg.maxA);
            b = rand(cfg.minB, cfg.maxB);
            q = `${a} × ${b}`;
            ans = a * b;
            break;
        case 'divide':
            b = rand(cfg.minDivisor, cfg.maxDivisor);
            ans = rand(cfg.minAns, cfg.maxAns);
            a = b * ans;
            q = `${a} ÷ ${b}`;
            break;
        case 'add':
            a = rand(cfg.min, cfg.max);
            b = rand(cfg.min, cfg.max);
            q = `${a} + ${b < 0 ? `(${b})` : b}`;
            ans = a + b;
            break;
        case 'subtract':
            a = rand(cfg.min, cfg.max);
            b = rand(cfg.min, cfg.max);
            q = `${a} - ${b < 0 ? `(${b})` : b}`;
            ans = a - b;
            break;
        case 'decimal_add': {
            let baseA = rand(cfg.minBase, cfg.maxBase);
            let baseB = rand(cfg.minBase, cfg.maxBase);
            a = baseA * Math.pow(10, cfg.shiftA);
            b = baseB * Math.pow(10, cfg.shiftB);
            a = roundTo(a, Math.abs(cfg.shiftA));
            b = roundTo(b, Math.abs(cfg.shiftB));
            ans = roundTo(a + b, Math.max(Math.abs(cfg.shiftA), Math.abs(cfg.shiftB)));
            q = `${a} + ${b < 0 ? `(${b})` : b}`;
            break;
        }
        case 'decimal_subtract': {
            let baseA = rand(cfg.minBase, cfg.maxBase);
            let baseB = rand(cfg.minBase, cfg.maxBase);
            a = baseA * Math.pow(10, cfg.shiftA);
            b = baseB * Math.pow(10, cfg.shiftB);
            a = roundTo(a, Math.abs(cfg.shiftA));
            b = roundTo(b, Math.abs(cfg.shiftB));
            if (b > a) { const tmp = a; a = b; b = tmp; }
            ans = roundTo(a - b, Math.max(Math.abs(cfg.shiftA), Math.abs(cfg.shiftB)));
            q = `${a} - ${b}`;
            break;
        }
        case 'decimal_multiply': {
            let baseA = rand(cfg.minBase, cfg.maxBase);
            let baseB = rand(cfg.minBase, cfg.maxBase);
            a = baseA * Math.pow(10, cfg.shiftA);
            b = baseB * Math.pow(10, cfg.shiftB);
            a = roundTo(a, Math.abs(cfg.shiftA));
            b = roundTo(b, Math.abs(cfg.shiftB));
            ans = roundTo(a * b, Math.abs(cfg.shiftA) + Math.abs(cfg.shiftB));
            q = `${a} × ${b}`;
            break;
        }
        case 'decimal_divide': {
            let baseAns = rand(cfg.minBaseAns, cfg.maxBaseAns);
            let baseDivisor = rand(cfg.minBaseDivisor, cfg.maxBaseDivisor);
            ans = baseAns * Math.pow(10, cfg.shiftAns);
            b = baseDivisor * Math.pow(10, cfg.shiftDivisor);
            ans = roundTo(ans, Math.abs(cfg.shiftAns));
            b = roundTo(b, Math.abs(cfg.shiftDivisor));
            a = roundTo(b * ans, Math.abs(cfg.shiftAns) + Math.abs(cfg.shiftDivisor));
            q = `${a} ÷ ${b}`;
            break;
        }
    }

    return { q, a: ans };
}

function isKeyboardOpen() {
    return window.innerHeight < screen.height * 0.7; // Asumsi jika tinggi viewport < 70% layar
}

window.logoutUser = function() {
    if (confirm('Apakah Anda yakin ingin mengganti akun? Data latihan saat ini akan disetel ulang.')) {
        localStorage.removeItem('math_mastery_user');
        location.reload();
    }
}


function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roundTo(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

function getModeName(mode) {
    const names = {
        'multiply': 'Perkalian', 'divide': 'Pembagian',
        'add': 'Penjumlahan', 'subtract': 'Pengurangan',
        'decimal_add': 'Penjumlahan Desimal', 'decimal_subtract': 'Pengurangan Desimal',
        'decimal_multiply': 'Perkalian Desimal', 'decimal_divide': 'Pembagian Desimal'
    };
    return names[mode] || mode;
}

function renderQuestion() {
    const curr = state.game.questions[state.game.currentQuestionIndex];
    els.questionText.textContent = curr.q;
    els.userAnswer.textContent = '';
    state.game.currentAnswer = '';

    if (els.gameProgressLabel) {
        const total = state.game.questions.length;
        const current = state.game.currentQuestionIndex + 1;
        els.gameProgressLabel.textContent = `Soal ${current} / ${total}`;
    }

    // [ANTI-SPAM] Catat waktu awal soal dirender
    questionStartTime = Date.now();

    // Reset and start Question Timer if Exam
    if (state.game.type === 'exam') {
        startQuestionTimer();
    }
}

function startQuestionTimer() {
    clearInterval(questionTimerInterval);
    const cfg = state.appConfig[state.game.mode];
    const timerSeconds = cfg && cfg.examTimer ? cfg.examTimer : GAME_CONFIG.exam.timer;
    const limit = timerSeconds * 1000;
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
    if (state.game.isLocked) return;
    if (val === 'del') {
        state.game.currentAnswer = state.game.currentAnswer.slice(0, -1);
    } else if (val === '.') {
        // Allow only one decimal point
        if (state.game.currentAnswer.includes('.')) return;
        if (state.game.currentAnswer.length >= 7) return;
        state.game.currentAnswer += val;
    } else {
        // Limit length
        if (state.game.currentAnswer.length < 7) {
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
    try {
        if (state.game.isLocked || state.game.isProcessing) return; 
        if (state.game.currentAnswer === '' || state.game.currentAnswer === '-' || state.game.currentAnswer === '.') return;

        state.game.isProcessing = true; 
        
        const answerDurationInSeconds = (Date.now() - questionStartTime) / 1000;

        const isDecimalMode = state.game.mode && state.game.mode.startsWith('decimal_');
        const userVal = isDecimalMode ? parseFloat(state.game.currentAnswer) : parseInt(state.game.currentAnswer);
        const correctVal = state.game.questions[state.game.currentQuestionIndex].a;

        if (isNaN(userVal)) {
            state.game.isProcessing = false;
            return;
        }

        const isCorrect = isDecimalMode
            ? Math.abs(userVal - correctVal) < 0.001
            : userVal === correctVal;

        if (!isCorrect && answerDurationInSeconds < 1.5) {
            spamAnswerCount++;
            if (spamAnswerCount >= 3) {
                triggerAntiSpamLock();
                return;
            }
        } else {
            spamAnswerCount = 0; 
        }

        if (isCorrect) {
            handleCorrect();
            
            if (state.game.isFocused && state.game.mode) {
                consecutiveCorrectFocusCount++;
                if (consecutiveCorrectFocusCount >= 5) {
                    if (state.weaknesses[state.game.mode] && state.weaknesses[state.game.mode].total_salah > 0) {
                        state.weaknesses[state.game.mode].total_salah -= 2; 
                        if (state.weaknesses[state.game.mode].total_salah < 0) {
                            state.weaknesses[state.game.mode].total_salah = 0;
                        }
                        localStorage.setItem('math_mastery_weaknesses', JSON.stringify(state.weaknesses));
                        showToast("Luar Biasa! Pemahamanmu di materi ini meningkat pesat! 🌟", "success");
                    }
                    consecutiveCorrectFocusCount = 0; 
                }
            }
        } else {
            consecutiveCorrectFocusCount = 0; 
            handleIncorrect();
        }
    } catch (e) {
        state.game.isProcessing = false;
        showToast("System error: " + e.message, "error");
        console.error("submitAnswer error:", e);
    }
}
window.submitAnswer = submitAnswer;

function triggerAntiSpamLock() {
    state.game.isLocked = true; 
    alert("Hei, jangan asal menebak. Tarik napas, hitung pelan-pelan ya! 😉");
    setTimeout(() => {
        state.game.isLocked = false;
        spamAnswerCount = 0; 
        state.game.isProcessing = false; 
        state.game.currentAnswer = '';
        els.userAnswer.textContent = '';
        questionStartTime = Date.now(); 
    }, 3000);
}

function handleCorrect() {
    try {
        els.inputDisplay.classList.add('border-green-500', 'bg-green-500/20', 'animate-bounce-custom');
        state.game.score += GAME_CONFIG[state.game.type].pointsPerQuestion || 10;
        
        // Badge Logic Updates (Per-Mode tracking)
        if (state.achievements && state.game.mode && state.achievements[state.game.mode]) {
            state.achievements[state.game.mode].totalCorrect++;
            state.achievements[state.game.mode].streak++;
        }

        // Identify current question key
        const currentQ = state.game.questions[state.game.currentQuestionIndex];
        trackWeakness(currentQ.q, currentQ.a, state.game.mode, true); // true = correct answer

        saveData();

        playFeedback(true);
        checkAchievements();
        updateScoreUI();

        setTimeout(() => {
            els.inputDisplay.classList.remove('border-green-500', 'bg-green-500/20', 'animate-bounce-custom');
            nextQuestion();
        }, 500);
    } catch (e) {
        state.game.isProcessing = false;
        showToast("System error: " + e.message, "error");
        console.error("handleCorrect error:", e);
    }
}

function handleIncorrect() {
    try {
        els.inputDisplay.classList.add('border-red-500', 'animate-shake', 'bg-red-500/20');

        // Adaptive Learning: Track Weakness
        const currentQ = state.game.questions[state.game.currentQuestionIndex];
        trackWeakness(currentQ.q, currentQ.a, state.game.mode, false); // false = incorrect answer

        // Badge Logic Updates (Per-Mode tracking)
        if (state.achievements && state.game.mode && state.achievements[state.game.mode]) {
            state.achievements[state.game.mode].streak = 0; // Reset streak
        }

        playFeedback(false);
        updateScoreUI(); // Just in case we want to show streak loss later

        setTimeout(() => {
            els.inputDisplay.classList.remove('border-red-500', 'animate-shake', 'bg-red-500/20');
            nextQuestion();
        }, 500);
    } catch (e) {
        state.game.isProcessing = false;
        showToast("System error: " + e.message, "error");
        console.error("handleIncorrect error:", e);
    }
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

    // --- MONITORING LOGIC START ---
    if (!state.user.monitoring_status) state.user.monitoring_status = {};
    const opMode = state.game.mode;
    const targetExamScore = state.appConfig.global_settings?.minExamScore || 90;
    const minPracticeScore = state.appConfig.global_settings?.minPracticeScore || 70;
    const requiredPractices = state.appConfig.global_settings?.monitoringPracticeCount || 10;
    const scorePercentage = (result.score / result.maxScore) * 100;
    
    if (state.game.type === 'exam') {
        if (scorePercentage < targetExamScore) {
            state.user.monitoring_status[opMode] = {
                active: true,
                target_score: targetExamScore,
                exercises_done: 0,
                exercises_needed: requiredPractices
            };
            setTimeout(() => alert(`⚠️ Nilai Ujianmu ${scorePercentage} (Target: ${targetExamScore}).\nKamu masuk masa Pemantauan! Kamu harus menyelesaikan ${requiredPractices} Latihan sebelum bisa ujian ulang.`), 500);
        } else {
            state.user.monitoring_status[opMode] = { active: false };
        }
    } else if (state.game.type === 'practice' || state.game.isFocused) {
        const mStatus = state.user.monitoring_status[opMode];
        if (mStatus && mStatus.active) {
            if (scorePercentage >= minPracticeScore) {
                mStatus.exercises_done = (mStatus.exercises_done || 0) + 1;
                if (mStatus.exercises_done >= mStatus.exercises_needed) {
                    mStatus.active = false;
                    setTimeout(() => alert(`🎉 Selamat! Kamu telah menyelesaikan ${mStatus.exercises_needed} Latihan. Kunci Ujian telah dibuka!`), 500);
                } else {
                    setTimeout(() => alert(`👍 Bagus! Progres Latihan Pemantauan: ${mStatus.exercises_done} / ${mStatus.exercises_needed}`), 500);
                }
            } else {
                setTimeout(() => alert(`❌ Nilai Latihanmu ${scorePercentage} (Minimal ${minPracticeScore} agar dihitung pemantauan). Ayo coba lagi!`), 500);
            }
        }
    }
    // Save updated user state to localStorage
    localStorage.setItem('math_mastery_user', JSON.stringify(state.user));
    // --- MONITORING LOGIC END ---

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
function getQuestionCategory(mode, questionText) {
    if (mode && mode.startsWith('decimal')) return 'desimal';
    
    const hasNegative = questionText.includes('(-') || questionText.startsWith('-');
    
    if (mode === 'add' && hasNegative) return 'penjumlahan_negatif';
    if (mode === 'subtract' && hasNegative) return 'pengurangan_negatif';
    if (mode === 'multiply' && hasNegative) return 'perkalian_negatif';
    if (mode === 'divide') return 'pembagian_acak';
    
    return mode;
}

function trackWeakness(questionText, answer, mode, isCorrect) {
    if (!state.weaknesses) state.weaknesses = {};
    
    const category = getQuestionCategory(mode, questionText);

    if (!state.weaknesses[category]) {
        state.weaknesses[category] = { total_salah: 0, contoh_kasus: [] };
    } else {
        if (typeof state.weaknesses[category].total_salah === 'undefined') {
            state.weaknesses[category].total_salah = 0;
        }
        if (!Array.isArray(state.weaknesses[category].contoh_kasus)) {
            state.weaknesses[category].contoh_kasus = [];
        }
    }

    if (!isCorrect) {
        state.weaknesses[category].total_salah++;
        
        if (!state.weaknesses[category].contoh_kasus.includes(questionText)) {
            state.weaknesses[category].contoh_kasus.push(questionText);
            if (state.weaknesses[category].contoh_kasus.length > 5) {
                state.weaknesses[category].contoh_kasus.shift();
            }
        }
        localStorage.setItem('math_mastery_weaknesses', JSON.stringify(state.weaknesses));
    }
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
        let collectionName = state.appMode === 'remedial' ? 'remedial_exams' : 'scores';
        const collectionRef = window.firebaseCollection(window.firebaseDb, collectionName);

        // Prepare data with proper types
        const docData = {
            nama: data.user.name,
            kelasRaw: data.user.class, // Keep original
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
        
        // Removed Toast for Leaderboard
        // showToast("Skor berhasil disimpan ke Peringkat Juara!", "success");
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
    /* 
    // Leaderboard/Peringkat dihapus sementara demi efisiensi storage
    // Fondasi ini disisakan untuk rilis Mode Olimpiade di masa depan.
    
    const listEl = els.leaderboardList;
    if (!listEl) return;
    */
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

    let modeName = getModeName(mode);
    els.raportSubject.textContent = `Operasi ${modeName}`;
    els.raportDate.textContent = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    if (state.appMode === 'remedial') {
        if (els.raportMainTitle) els.raportMainTitle.textContent = "BUKTI LULUS REMEDIAL MATEMATIKA";
    } else {
        if (els.raportMainTitle) els.raportMainTitle.textContent = "RAPOR HASIL BELAJAR";
    }

    // Generate Exam Description
    const config = GAME_CONFIG.exam;
    const isDecimalMode = mode && mode.startsWith('decimal_');
    const examTimer = isDecimalMode ? 10 : config.timer;
    let rangeDesc = "1 sampai 10";
    if (mode === 'add' || mode === 'subtract') rangeDesc = "-10 sampai 10";
    if (mode === 'decimal_add' || mode === 'decimal_subtract') rangeDesc = "desimal maks 3 digit (contoh: 1.5, 12.3, 5.67)";
    if (mode === 'decimal_multiply') rangeDesc = "desimal 1 digit signifikan (contoh: 0.3, 0.02, 5)";
    if (mode === 'decimal_divide') rangeDesc = "desimal 1 sampai 100, hasil bilangan bulat 1-10";

    const desc = `${modeName} acak dari angka ${rangeDesc} sebanyak ${config.count} soal dengan waktu tiap soal ${examTimer} detik.`;
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
    ['multiply', 'divide', 'add', 'subtract', 'decimal_add', 'decimal_subtract', 'decimal_multiply', 'decimal_divide'].forEach(mode => {
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

// Integer Mode Functions
function showIntegerModeSelect() {
    document.getElementById('modal-integer-select').classList.remove('hidden');
}

function closeIntegerSelect() {
    document.getElementById('modal-integer-select').classList.add('hidden');
}

function selectIntegerOp(op) {
    closeIntegerSelect();
    showModeSelect(op);
}

// Decimal Mode Functions
function showDecimalModeSelect() {
    document.getElementById('modal-decimal-select').classList.remove('hidden');
}

function closeDecimalSelect() {
    document.getElementById('modal-decimal-select').classList.add('hidden');
}

function selectDecimalOp(op) {
    closeDecimalSelect();
    showModeSelect(op);
}

window.showIntegerModeSelect = showIntegerModeSelect;
window.closeIntegerSelect = closeIntegerSelect;
window.selectIntegerOp = selectIntegerOp;
window.showDecimalModeSelect = showDecimalModeSelect;
window.closeDecimalSelect = closeDecimalSelect;
window.selectDecimalOp = selectDecimalOp;

// ===== CHANGE PIN LOGIC =====
window.showChangePinModal = function() {
    els.modalChangePin.classList.remove('hidden');
    setTimeout(() => {
        els.modalChangePin.classList.remove('opacity-0');
        els.modalChangePin.querySelector('.bg-brand-surface').classList.remove('scale-95');
    }, 10);
    els.inputOldPin.value = '';
    els.inputNewPinChange.value = '';
    els.errorChangePin.classList.add('hidden');
}

window.hideChangePinModal = function() {
    els.modalChangePin.classList.add('opacity-0');
    els.modalChangePin.querySelector('.bg-brand-surface').classList.add('scale-95');
    setTimeout(() => {
        els.modalChangePin.classList.add('hidden');
    }, 300);
}

window.submitChangePin = async function() {
    const oldPin = els.inputOldPin.value;
    const newPin = els.inputNewPinChange.value;
    
    els.errorChangePin.classList.remove('hidden');
    
    if (!oldPin || !newPin) {
        els.errorChangePin.textContent = "Harap isi kedua kolom!";
        return;
    }
    
    if (newPin.length < 4) {
        els.errorChangePin.textContent = "PIN baru minimal 4 angka!";
        return;
    }
    
    if (oldPin !== state.user.pin) {
        els.errorChangePin.textContent = "PIN Lama salah!";
        return;
    }
    
    try {
        els.errorChangePin.className = "text-yellow-400 text-sm text-center";
        els.errorChangePin.textContent = "Menyimpan...";
        
        // Save to Firebase
        if (typeof window.firebaseDB !== 'undefined' && typeof window.firebaseSet !== 'undefined') {
            const pinRef = window.firebaseRef(window.firebaseDB, `appConfig/students/${state.user.class}/${state.user.name}`);
            await window.firebaseSet(pinRef, newPin);
            
            // Update local memory
            if (appStudentList[state.user.class] && appStudentList[state.user.class][state.user.name]) {
                appStudentList[state.user.class][state.user.name] = newPin;
            }
        }
        
        // Update local storage user state
        state.user.pin = newPin;
        localStorage.setItem('math_mastery_user', JSON.stringify(state.user));
        
        els.errorChangePin.className = "text-green-400 text-sm text-center font-bold";
        els.errorChangePin.textContent = "PIN Berhasil Diganti!";
        
        // Hide banner if exists
        els.bannerChangePin.classList.add('hidden');
        
        setTimeout(() => {
            hideChangePinModal();
        }, 1500);
        
    } catch(e) {
        console.error("Gagal ganti PIN", e);
        els.errorChangePin.className = "text-red-400 text-sm text-center";
        els.errorChangePin.textContent = "Gagal: " + (e.message || "Terjadi kesalahan");
    }
}

// Start
init();
