// duel.js - Logika untuk Mode Duel (Firebase Realtime Database)

/**
 * STATE DUEL
 */
const duelState = {
    roomCode: null,
    playerId: null, // 'player1' atau 'player2'
    opponentId: null,
    isCreator: false,
    questions: [],
    currentQIndex: 0,
    startTimeMs: 0,
    myScore: 0,
    opScore: 0,
    myTotalTime: 0,
    opTotalTime: 0,
    answers: {},
    opAnswers: {},
    currentInput: '',
    roomRef: null,
    listeners: [],
    isFinished: false
};

// Referensi DOM lokal untuk Duel
let duelEls = {};

document.addEventListener('DOMContentLoaded', () => {
    duelEls = {
        lobby: document.getElementById('screen-duel-lobby'),
        waiting: document.getElementById('screen-duel-waiting'),
        game: document.getElementById('screen-duel-game'),
        result: document.getElementById('screen-duel-result'),
        inputCode: document.getElementById('input-duel-code'),
        codeDisplay: document.getElementById('duel-room-code-display'),
        counter: document.getElementById('duel-question-counter'),
        p1Card: document.getElementById('duel-p1-card'),
        p2Card: document.getElementById('duel-p2-card'),
        p1Name: document.getElementById('duel-p1-name'),
        p2Name: document.getElementById('duel-p2-name'),
        p1Score: document.getElementById('duel-p1-score'),
        p2Score: document.getElementById('duel-p2-score'),
        p1Progress: document.getElementById('duel-p1-progress'),
        p2Progress: document.getElementById('duel-p2-progress'),
        questionText: document.getElementById('duel-question-text'),
        inputDisplay: document.getElementById('duel-user-answer'),
        opponentStatus: document.getElementById('duel-opponent-status'),
        feedbackAnim: document.getElementById('duel-feedback-anim'),
        
        resultTitle: document.getElementById('duel-result-title'),
        resultSubtitle: document.getElementById('duel-result-subtitle'),
        resP1Name: document.getElementById('duel-result-p1-name'),
        resP2Name: document.getElementById('duel-result-p2-name'),
        resP1Score: document.getElementById('duel-result-p1-score'),
        resP2Score: document.getElementById('duel-result-p2-score'),
        resP1Time: document.getElementById('duel-result-p1-time'),
        resP2Time: document.getElementById('duel-result-p2-time'),
        resDetails: document.getElementById('duel-result-details')
    };

    // Global Keydown listener specific for duel
    document.addEventListener('keydown', (e) => {
        if (!duelEls.game || duelEls.game.classList.contains('hidden')) return;
        if (e.key >= '0' && e.key <= '9') duelKeypad(e.key);
        if (e.key === '-' || e.key === '.') duelKeypad(e.key);
        if (e.key === 'Backspace' || e.key === 'Delete') duelKeypad('del');
        if (e.key === 'Enter') submitDuelAnswer();
    });
});

window.showDuelLobby = function() {
    if (!window.firebaseDB) {
        alert("Sistem Duel sedang diinisialisasi, silakan tunggu sebentar.");
        return;
    }
    // Sembunyikan semua layar di aplikasi utama
    if (typeof hideAllScreens === 'function') hideAllScreens();
    else {
        document.querySelectorAll('main > section').forEach(el => el.classList.add('hidden'));
    }
    
    // Reset state
    cleanupDuel();
    
    duelEls.lobby.classList.remove('hidden');
    
    // Ambil nama user
    const savedUser = localStorage.getItem('math_mastery_user');
    if (savedUser) {
        let u = JSON.parse(savedUser);
        duelState.myName = u.name || "Pemain Jago";
    } else {
        duelState.myName = "Anonim";
    }
    
    if (duelEls.inputCode) duelEls.inputCode.value = '';
};

// Buat Room Baru (Sebagai Player 1)
window.createDuelRoom = async function() {
    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit code
    duelState.roomCode = code;
    duelState.isCreator = true;
    duelState.playerId = 'player1';
    duelState.opponentId = 'player2';

    // Generate questions
    const qList = generate10Questions();

    const roomRefStr = `duel_rooms/${code}`;
    const roomData = {
        player1: { id: Date.now().toString(), name: duelState.myName },
        status: 'waiting',
        questions: qList,
        scores: { player1: 0, player2: 0 },
        created_at: Date.now()
    };

    try {
        const rRef = window.firebaseRef(window.firebaseDB, roomRefStr);
        await window.firebaseSet(rRef, roomData);
        
        // Setup Disconnect behavior (jika P1 keluar, room hancur)
        window.firebaseOnDisconnect(rRef).remove();
        
        duelState.roomRef = rRef;
        
        duelEls.lobby.classList.add('hidden');
        duelEls.waiting.classList.remove('hidden');
        duelEls.codeDisplay.innerText = code;
        
        listenToRoomState();
        
    } catch (err) {
        console.error(err);
        alert("Gagal membuat room. Periksa koneksi internetmu.");
    }
};

// Join Room (Sebagai Player 2)
window.joinDuelRoom = async function() {
    const code = duelEls.inputCode.value.trim();
    if (code.length !== 4) {
        alert("Masukkan 4 digit kode room!");
        return;
    }

    try {
        const rRef = window.firebaseRef(window.firebaseDB, `duel_rooms/${code}`);
        const snapshot = await window.firebaseGet(rRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.status !== 'waiting') {
                alert("Room sudah penuh atau sedang bermain!");
                return;
            }
            
            // Join as player 2
            duelState.roomCode = code;
            duelState.isCreator = false;
            duelState.playerId = 'player2';
            duelState.opponentId = 'player1';
            duelState.roomRef = rRef;
            
            const updates = {};
            updates['player2'] = { id: Date.now().toString(), name: duelState.myName };
            updates['status'] = 'playing';
            
            await window.firebaseUpdate(rRef, updates);
            
            window.firebaseOnDisconnect(rRef).remove(); // Optional, P2 dc hapus room juga
            
            duelEls.lobby.classList.add('hidden');
            listenToRoomState();
            
        } else {
            alert("Room tidak ditemukan!");
        }
    } catch(err) {
        console.error(err);
        alert("Gagal bergabung ke room.");
    }
};

window.cancelDuel = function() {
    if (duelState.roomRef) {
        window.firebaseRemove(duelState.roomRef);
    }
    cleanupDuel();
    if (typeof showMenu === 'function') showMenu();
};

function cleanupDuel() {
    duelState.listeners.forEach(unsub => unsub());
    duelState.listeners = [];
    duelState.roomCode = null;
    duelState.roomRef = null;
    duelState.questions = [];
    duelState.answers = {};
    duelState.opAnswers = {};
    duelState.currentQIndex = 0;
    duelState.myScore = 0;
    duelState.opScore = 0;
    duelState.isFinished = false;
    
    duelEls.waiting.classList.add('hidden');
    duelEls.game.classList.add('hidden');
    duelEls.result.classList.add('hidden');
}

// ---- GAME LOOP & LISTENER ----

function listenToRoomState() {
    if (!duelState.roomRef) return;
    
    // Status Listener
    const unsubStatus = window.firebaseOnValue(duelState.roomRef, (snapshot) => {
        if (!snapshot.exists()) {
            if (!duelState.isFinished) {
                alert("Room telah ditutup oleh lawan.");
                cancelDuel();
            }
            return;
        }
        
        const data = snapshot.val();
        duelState.questions = data.questions || [];
        
        // P1 wait for P2 -> starts game
        if (duelState.isCreator && data.status === 'playing' && duelEls.game.classList.contains('hidden')) {
            duelState.opName = data.player2?.name || "Lawan";
            startDuelGame(data);
        } else if (!duelState.isCreator && data.status === 'playing' && duelEls.game.classList.contains('hidden')) {
            duelState.opName = data.player1?.name || "Pemain 1";
            startDuelGame(data);
        }
        
        // Update Scores
        if (data.scores) {
            duelState.myScore = data.scores[duelState.playerId] || 0;
            duelState.opScore = data.scores[duelState.opponentId] || 0;
            updateDuelScores();
        }
        
        // Cek jawaban lawan untuk status
        if (data.answers && data.answers[duelState.opponentId]) {
            duelState.opAnswers = data.answers[duelState.opponentId];
            checkOpponentStatus();
            checkFinishCondition(data);
        }
        if (data.answers && data.answers[duelState.playerId]) {
            duelState.answers = data.answers[duelState.playerId];
            checkFinishCondition(data);
        }
        
    });
    
    duelState.listeners.push(unsubStatus);
}

function startDuelGame(data) {
    duelEls.waiting.classList.add('hidden');
    duelEls.game.classList.remove('hidden');
    
    duelEls.p1Name.innerText = `[${duelState.myName}] (Kamu)`;
    duelEls.p2Name.innerText = `[${duelState.opName}]`;
    
    duelState.currentQIndex = 0;
    duelState.answers = {};
    duelState.opAnswers = {};
    duelState.isFinished = false;
    
    renderDuelQuestion();
}

function renderDuelQuestion() {
    if (duelState.currentQIndex >= 10) {
        // Wait for opponent or finish
        duelEls.questionText.innerText = "Selesai!";
        duelEls.inputDisplay.innerText = "Menunggu lawan...";
        duelEls.opponentStatus.innerText = "Mengkalkulasi hasil...";
        return;
    }
    
    const q = duelState.questions[duelState.currentQIndex];
    duelEls.questionText.innerText = q.q + " =";
    duelState.currentInput = '';
    duelEls.inputDisplay.innerText = '';
    duelEls.counter.innerText = `${duelState.currentQIndex + 1}/10`;
    
    // Animasi muncul soal
    duelEls.questionText.classList.remove('animate-fade-in');
    void duelEls.questionText.offsetWidth; // trigger reflow
    duelEls.questionText.classList.add('animate-fade-in');

    checkOpponentStatus();
    duelState.startTimeMs = Date.now();
}

window.duelKeypad = function(char) {
    if (duelState.currentQIndex >= 10 || duelState.isFinished) return;
    
    if (char === 'del') {
        duelState.currentInput = duelState.currentInput.slice(0, -1);
    } else {
        if (duelState.currentInput.length < 5) duelState.currentInput += char;
    }
    duelEls.inputDisplay.innerText = duelState.currentInput;
}

window.submitDuelAnswer = async function() {
    if (duelState.currentQIndex >= 10 || duelState.isFinished) return;
    if (duelState.currentInput === '') return;
    
    const q = duelState.questions[duelState.currentQIndex];
    const isCorrect = parseFloat(duelState.currentInput) === q.a;
    const timeMs = Date.now() - duelState.startTimeMs;
    
    // Play sound from global if available
    try {
        if (typeof playFeedback === 'function') playFeedback(isCorrect);
    } catch(e) {}

    // Show visual feedback
    duelEls.feedbackAnim.className = `absolute inset-0 pointer-events-none transition-opacity duration-300 z-10 ${isCorrect ? 'bg-green-500/30' : 'bg-red-500/30'}`;
    duelEls.feedbackAnim.style.opacity = '1';
    setTimeout(() => duelEls.feedbackAnim.style.opacity = '0', 300);

    // Save answer to Firebase
    const ansKey = `q${duelState.currentQIndex}`;
    const ansData = { correct: isCorrect, timeMs: timeMs, answer: parseFloat(duelState.currentInput), qString: q.q, correctA: q.a };
    
    duelState.answers[ansKey] = ansData;
    
    try {
        const updatePath = {};
        updatePath[`answers/${duelState.playerId}/${ansKey}`] = ansData;
        
        if (isCorrect) {
            updatePath[`scores/${duelState.playerId}`] = duelState.myScore + 1;
        }
        await window.firebaseUpdate(duelState.roomRef, updatePath);
    } catch (e) {
        console.error("Gagal mengirim jawaban", e);
    }
    
    duelState.currentQIndex++;
    renderDuelQuestion();
}

function updateDuelScores() {
    duelEls.p1Score.innerText = duelState.myScore;
    duelEls.p2Score.innerText = duelState.opScore;
    
    // Update progress bar (Max score is 10)
    duelEls.p1Progress.style.width = `${(duelState.myScore / 10) * 100}%`;
    duelEls.p2Progress.style.width = `${(duelState.opScore / 10) * 100}%`;
    
    // Pulse animation
    duelEls.p1Card.classList.add('pulse-border');
    setTimeout(() => duelEls.p1Card.classList.remove('pulse-border'), 1500);
}

function checkOpponentStatus() {
    if (duelState.currentQIndex >= 10) return;
    const qKey = `q${duelState.currentQIndex}`;
    
    if (duelState.opAnswers && duelState.opAnswers[qKey]) {
        duelEls.opponentStatus.innerHTML = `<span class="text-red-400">✅ Lawan sudah menjawab soal ini!</span>`;
    } else {
        duelEls.opponentStatus.innerHTML = `<span class="text-brand-text-muted">⏳ Lawan sedang berpikir...</span>`;
    }
}

function checkFinishCondition(data) {
    if (duelState.isFinished) return;
    
    const p1Ans = data.answers && data.answers[duelState.playerId] ? Object.keys(data.answers[duelState.playerId]).length : 0;
    const p2Ans = data.answers && data.answers[duelState.opponentId] ? Object.keys(data.answers[duelState.opponentId]).length : 0;
    
    if (p1Ans === 10 && p2Ans === 10) {
        finishDuel(data);
    }
}

function finishDuel(data) {
    duelState.isFinished = true;
    
    // Calculate Total Times
    let myMs = 0;
    let opMs = 0;
    
    for (let i=0; i<10; i++) {
        myMs += duelState.answers[`q${i}`]?.timeMs || 0;
        opMs += duelState.opAnswers[`q${i}`]?.timeMs || 0;
    }
    
    let isWin = false;
    let isDraw = false;
    
    if (duelState.myScore > duelState.opScore) {
        isWin = true;
    } else if (duelState.myScore < duelState.opScore) {
        isWin = false;
    } else {
        // Tie breaker by time
        if (myMs < opMs) isWin = true;
        else if (myMs > opMs) isWin = false;
        else isDraw = true; // Langka terjadi imbang persis MS
    }
    
    renderDuelResult(isWin, isDraw, myMs, opMs);
}

function renderDuelResult(isWin, isDraw, myMs, opMs) {
    duelEls.game.classList.add('hidden');
    duelEls.result.classList.remove('hidden');
    
    if (isDraw) {
        duelEls.resultTitle.innerText = "SERI!";
        duelEls.resultTitle.className = "text-3xl font-extrabold mb-1 mt-4 text-yellow-400";
    } else if (isWin) {
        duelEls.resultTitle.innerText = "🏆 KAMU MENANG!";
        duelEls.resultTitle.className = "text-3xl font-extrabold mb-1 mt-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 text-animate";
        // Putar suara kalau ada fungsi global
        try { if(typeof playFeedback === 'function') SOUNDS.correct.play(); } catch(e){}
    } else {
        duelEls.resultTitle.innerText = "😢 KAMU KALAH";
        duelEls.resultTitle.className = "text-3xl font-extrabold mb-1 mt-4 text-slate-400";
    }
    
    duelEls.resP1Name.innerText = `Kamu (${duelState.myName})`;
    duelEls.resP2Name.innerText = `Lawan (${duelState.opName})`;
    
    duelEls.resP1Score.innerText = duelState.myScore;
    duelEls.resP2Score.innerText = duelState.opScore;
    
    duelEls.resP1Time.innerText = (myMs / 1000).toFixed(1);
    duelEls.resP2Time.innerText = (opMs / 1000).toFixed(1);
    
    // Kosongkan list
    duelEls.resDetails.innerHTML = '';
    
    // Generate breakdown
    for (let i=0; i<10; i++) {
        const qData = duelState.questions[i];
        const myA = duelState.answers[`q${i}`];
        const opA = duelState.opAnswers[`q${i}`];
        
        let t = document.createElement('div');
        t.className = "w-full bg-brand-surface/30 p-3 rounded-xl border border-brand-border/50 flex justify-between items-center";
        
        const myIcon = myA?.correct ? '✅' : '❌';
        const opIcon = opA?.correct ? '✅' : '❌';
        
        t.innerHTML = `
            <div class="text-xs w-1/4 text-left ${myA?.correct ? 'text-green-400' : 'text-red-400'}">${myIcon} ${myA?.answer ?? '-'}</div>
            <div class="font-bold text-center w-2/4">${qData.q} = ${qData.a}</div>
            <div class="text-xs w-1/4 text-right ${opA?.correct ? 'text-green-400' : 'text-red-400'}">${opA?.answer ?? '-'} ${opIcon}</div>
        `;
        duelEls.resDetails.appendChild(t);
    }
}

window.setupDuelLobby = function() {
    cleanupDuel();
    showDuelLobby();
};

/**
 * HELPER: Soal Generator
 * Menghasilkan 10 soal perkalian acak dari 1x1 sampai 10x10.
 */
function generate10Questions() {
    const list = [];
    for(let i = 0; i < 10; i++) {
        let a = Math.floor(Math.random() * 10) + 1;
        let b = Math.floor(Math.random() * 10) + 1;
        list.push({ q: `${a} × ${b}`, a: a * b, operator: 'multiply' });
    }
    return list;
}
