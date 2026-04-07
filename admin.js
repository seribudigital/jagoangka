import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, get, set } from "firebase/database";

const firebaseConfig = {
    apiKey: atob("QUl6YVN5RGJBeXNtUVJrSUFUWE1JVnNJYWY4ZWktcUo0cWM5QzBr"),
    authDomain: "jagoangka-7f05a.firebaseapp.com",
    databaseURL: "https://jagoangka-7f05a-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "jagoangka-7f05a",
    storageBucket: "jagoangka-7f05a.firebasestorage.app",
    messagingSenderId: "219151682477",
    appId: "1:219151682477:web:cc560ae348f5e6228c2f24"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const els = {
    screenLogin: document.getElementById('screen-login'),
    screenDashboard: document.getElementById('screen-dashboard'),
    formLogin: document.getElementById('form-login'),
    inputEmail: document.getElementById('input-email'),
    inputPassword: document.getElementById('input-password'),
    loginError: document.getElementById('login-error'),
    btnLogout: document.getElementById('btn-logout'),
    btnSave: document.getElementById('btn-save'),
    configForms: document.getElementById('config-forms')
};

const configSchema = {
    "multiply": [
        { key: "minA", label: "Min Faktor A" },
        { key: "maxA", label: "Max Faktor A" },
        { key: "minB", label: "Min Faktor B" },
        { key: "maxB", label: "Max Faktor B" }
    ],
    "divide": [
        { key: "minDivisor", label: "Min Pembagi" },
        { key: "maxDivisor", label: "Max Pembagi" },
        { key: "minAns", label: "Min Hasil (Ans)" },
        { key: "maxAns", label: "Max Hasil (Ans)" }
    ],
    "add": [
        { key: "min", label: "Min Angka" },
        { key: "max", label: "Max Angka" }
    ],
    "subtract": [
        { key: "min", label: "Min Angka" },
        { key: "max", label: "Max Angka" }
    ],
    "decimal_add": [
        { key: "minBase", label: "Min Base Integer" },
        { key: "maxBase", label: "Max Base Integer" },
        { key: "shiftA", label: "Shift Angka A (contoh: -1)" },
        { key: "shiftB", label: "Shift Angka B" }
    ],
    "decimal_subtract": [
        { key: "minBase", label: "Min Base Integer" },
        { key: "maxBase", label: "Max Base Integer" },
        { key: "shiftA", label: "Shift Angka A" },
        { key: "shiftB", label: "Shift Angka B" }
    ],
    "decimal_multiply": [
        { key: "minBase", label: "Min Base Integer" },
        { key: "maxBase", label: "Max Base Integer" },
        { key: "shiftA", label: "Shift Angka A" },
        { key: "shiftB", label: "Shift Angka B" }
    ],
    "decimal_divide": [
        { key: "minBaseAns", label: "Min Base Hasil Int" },
        { key: "maxBaseAns", label: "Max Base Hasil Int" },
        { key: "minBaseDivisor", label: "Min Base Pembagi Int" },
        { key: "maxBaseDivisor", label: "Max Base Pembagi Int" },
        { key: "shiftAns", label: "Shift Hasil (0=Bulat, -1=Pecahan)" },
        { key: "shiftDivisor", label: "Shift Pembagi (-1=Pecahan)" }
    ]
};

const defaultFallback = {
    multiply: { minA: 1, maxA: 10, minB: 1, maxB: 10 },
    divide: { minDivisor: 1, maxDivisor: 10, minAns: 1, maxAns: 10 },
    add: { min: -10, max: 10 },
    subtract: { min: -10, max: 10 },
    decimal_add: { minBase: 1, maxBase: 99, shiftA: -1, shiftB: -1 },
    decimal_subtract: { minBase: 1, maxBase: 99, shiftA: -1, shiftB: -1 },
    decimal_multiply: { minBase: 1, maxBase: 9, shiftA: -1, shiftB: -1 },
    decimal_divide: { minBaseAns: 1, maxBaseAns: 10, minBaseDivisor: 1, maxBaseDivisor: 10, shiftAns: 0, shiftDivisor: -1 }
};

let currentConfigData = {};

onAuthStateChanged(auth, (user) => {
    if (user) {
        els.screenLogin.classList.add('hidden');
        els.screenDashboard.classList.remove('hidden');
        els.btnLogout.classList.remove('hidden');
        loadConfigData();
    } else {
        els.screenLogin.classList.remove('hidden');
        els.screenDashboard.classList.add('hidden');
        els.btnLogout.classList.add('hidden');
    }
});

els.formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.loginError.classList.add('hidden');
    const btn = els.formLogin.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = "Sedang Login...";
    btn.disabled = true;
    
    try {
        console.log("Mencoba login untuk:", els.inputEmail.value);
        await signInWithEmailAndPassword(auth, els.inputEmail.value, els.inputPassword.value);
        console.log("Login sukses!");
        // We rely on onAuthStateChanged to switch screens.
    } catch (error) {
        console.error("Firebase Login Error:", error);
        els.loginError.textContent = `Login gagal: ${error.message}`;
        els.loginError.classList.remove('hidden');
        alert("Gagal login! Periksa Console browser (F12) untuk detail error.\n\nAksen Firebase: " + error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

els.btnLogout.addEventListener('click', () => {
    signOut(auth);
});

async function loadConfigData() {
    els.configForms.innerHTML = '<p class="text-brand-text-muted">Loading data dari server...</p>';
    try {
        const snapshot = await get(ref(db, 'appConfig/difficulty'));
        let data = snapshot.exists() ? snapshot.val() : {};
        
        // Merge with defaults for UI fields to appear even if empty
        for(let mode in defaultFallback) {
            if(!data[mode]) data[mode] = { ...defaultFallback[mode] };
        }
        currentConfigData = data;
        renderFields();
    } catch (e) {
        els.configForms.innerHTML = '<p class="text-red-400">Gagal load data. Pastikan Rule Database Anda memberi akses ke Auth.</p>';
    }
}

function renderFields() {
    els.configForms.innerHTML = '';
    
    for (const [mode, fields] of Object.entries(configSchema)) {
        const modeTitleDesc = mode.replace('_', ' ').toUpperCase();
        let sectionHtml = `
            <div class="mb-6 border border-brand-border/30 rounded-2xl p-4 bg-brand-surface/20">
                <h3 class="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-brand-primary">Mode: ${modeTitleDesc}</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        `;
        
        fields.forEach(field => {
            const val = currentConfigData[mode]?.[field.key] ?? defaultFallback[mode][field.key];
            sectionHtml += `
            <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">${field.label}</label>
                <input type="number" 
                       data-mode="${mode}" 
                       data-key="${field.key}" 
                       value="${val}" 
                       class="input-admin cfg-input">
            </div>
            `;
        });
        
        sectionHtml += `</div></div>`;
        els.configForms.innerHTML += sectionHtml;
    }
}

els.btnSave.addEventListener('click', async () => {
    const inputs = document.querySelectorAll('.cfg-input');
    const newData = {};
    
    inputs.forEach(input => {
        const mode = input.getAttribute('data-mode');
        const key = input.getAttribute('data-key');
        const val = parseFloat(input.value);
        if(!newData[mode]) newData[mode] = {};
        newData[mode][key] = isNaN(val) ? 0 : val;
    });

    els.btnSave.textContent = "Menyimpan...";
    try {
        await set(ref(db, 'appConfig/difficulty'), newData);
        els.btnSave.textContent = "✅ Tersimpan!";
        setTimeout(() => els.btnSave.textContent = "Simpan Config", 2000);
    } catch (e) {
        alert("Gagal menyimpan. Pastikan Rule Database Firebase benar.");
        els.btnSave.textContent = "Simpan Config";
    }
});
