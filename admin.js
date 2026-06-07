import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
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
    btnRegister: document.getElementById('btn-register'),
    configForms: document.getElementById('config-forms'),
    inputImportStudents: document.getElementById('input-import-students'),
    btnImportStudents: document.getElementById('btn-import-students'),
    checkResetStudents: document.getElementById('check-reset-students'),
    importStatus: document.getElementById('import-status'),
    selectAdminClass: document.getElementById('select-admin-class'),
    tableAdminStudents: document.getElementById('table-admin-students')
};

let adminStudentData = {};

const configSchema = {
    "multiply": [
        { key: "minA", label: "Min Faktor A" },
        { key: "maxA", label: "Max Faktor A" },
        { key: "minB", label: "Min Faktor B" },
        { key: "maxB", label: "Max Faktor B" },
        { key: "examTimer", label: "Timer Ujian (Detik)" }
    ],
    "divide": [
        { key: "minDivisor", label: "Min Pembagi" },
        { key: "maxDivisor", label: "Max Pembagi" },
        { key: "minAns", label: "Min Hasil (Ans)" },
        { key: "maxAns", label: "Max Hasil (Ans)" },
        { key: "examTimer", label: "Timer Ujian (Detik)" }
    ],
    "add": [
        { key: "min", label: "Min Angka" },
        { key: "max", label: "Max Angka" },
        { key: "examTimer", label: "Timer Ujian (Detik)" }
    ],
    "subtract": [
        { key: "min", label: "Min Angka" },
        { key: "max", label: "Max Angka" },
        { key: "examTimer", label: "Timer Ujian (Detik)" }
    ],
    "decimal_add": [
        { key: "minBase", label: "Min Base Integer" },
        { key: "maxBase", label: "Max Base Integer" },
        { key: "shiftA", label: "Shift Angka A (contoh: -1)" },
        { key: "shiftB", label: "Shift Angka B" },
        { key: "examTimer", label: "Timer Ujian (Detik)" }
    ],
    "decimal_subtract": [
        { key: "minBase", label: "Min Base Integer" },
        { key: "maxBase", label: "Max Base Integer" },
        { key: "shiftA", label: "Shift Angka A" },
        { key: "shiftB", label: "Shift Angka B" },
        { key: "examTimer", label: "Timer Ujian (Detik)" }
    ],
    "decimal_multiply": [
        { key: "minBase", label: "Min Base Integer" },
        { key: "maxBase", label: "Max Base Integer" },
        { key: "shiftA", label: "Shift Angka A" },
        { key: "shiftB", label: "Shift Angka B" },
        { key: "examTimer", label: "Timer Ujian (Detik)" }
    ],
    "decimal_divide": [
        { key: "minBaseAns", label: "Min Base Hasil Int" },
        { key: "maxBaseAns", label: "Max Base Hasil Int" },
        { key: "minBaseDivisor", label: "Min Base Pembagi Int" },
        { key: "maxBaseDivisor", label: "Max Base Pembagi Int" },
        { key: "shiftAns", label: "Shift Hasil (0=Bulat, -1=Pecahan)" },
        { key: "shiftDivisor", label: "Shift Pembagi (-1=Pecahan)" },
        { key: "examTimer", label: "Timer Ujian (Detik)" }
    ],
    "global_settings": [
        { key: "minExamScore", label: "Target Nilai Ujian (Batas Aman)" },
        { key: "minPracticeScore", label: "Nilai Latihan Diakui (Min)" },
        { key: "monitoringPracticeCount", label: "Syarat Jumlah Latihan Pemantauan" },
        { key: "practiceQuestionsCount", label: "Jumlah Soal Latihan per Sesi" }
    ]
};

const defaultFallback = {
    multiply: { minA: 1, maxA: 10, minB: 1, maxB: 10, examTimer: 7 },
    divide: { minDivisor: 1, maxDivisor: 10, minAns: 1, maxAns: 10, examTimer: 7 },
    add: { min: -10, max: 10, examTimer: 7 },
    subtract: { min: -10, max: 10, examTimer: 7 },
    decimal_add: { minBase: 1, maxBase: 99, shiftA: -1, shiftB: -1, examTimer: 10 },
    decimal_subtract: { minBase: 1, maxBase: 99, shiftA: -1, shiftB: -1, examTimer: 10 },
    decimal_multiply: { minBase: 1, maxBase: 9, shiftA: -1, shiftB: -1, examTimer: 10 },
    decimal_divide: { minBaseAns: 1, maxBaseAns: 10, minBaseDivisor: 1, maxBaseDivisor: 10, shiftAns: 0, shiftDivisor: -1, examTimer: 10 },
    global_settings: { minExamScore: 90, minPracticeScore: 70, monitoringPracticeCount: 10, practiceQuestionsCount: 10 }
};

let currentConfigData = {};

onAuthStateChanged(auth, (user) => {
    if (user) {
        els.screenLogin.classList.add('hidden');
        els.screenDashboard.classList.remove('hidden');
        els.btnLogout.classList.remove('hidden');
        loadConfigData();
        loadAdminStudents();
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

els.btnRegister.addEventListener('click', async () => {
    els.loginError.classList.add('hidden');
    
    if(!els.inputEmail.value || !els.inputPassword.value) {
        els.loginError.textContent = "Isi Email dan Password terlebih dahulu!";
        els.loginError.classList.remove('hidden');
        return;
    }

    const originalText = els.btnRegister.textContent;
    els.btnRegister.textContent = "Mendaftar...";
    els.btnRegister.disabled = true;
    
    try {
        await createUserWithEmailAndPassword(auth, els.inputEmail.value, els.inputPassword.value);
        console.log("Register sukses!");
        // We rely on onAuthStateChanged to switch screens.
    } catch (error) {
        console.error("Firebase Register Error:", error);
        els.loginError.textContent = `Daftar gagal: ${error.message}`;
        els.loginError.classList.remove('hidden');
    } finally {
        els.btnRegister.textContent = originalText;
        els.btnRegister.disabled = false;
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

// ===== IMPORT STUDENTS LOGIC =====
function showImportStatus(msg, isError = false) {
    els.importStatus.textContent = msg;
    els.importStatus.className = `text-sm font-medium mt-4 ${isError ? 'text-red-400' : 'text-brand-accent'}`;
    els.importStatus.classList.remove('hidden');
}

els.btnImportStudents.addEventListener('click', async () => {
    const file = els.inputImportStudents.files[0];
    if (!file) {
        showImportStatus("Silakan pilih file terlebih dahulu!", true);
        return;
    }

    const resetOld = els.checkResetStudents.checked;
    els.btnImportStudents.textContent = "Memproses...";
    els.btnImportStudents.disabled = true;
    showImportStatus("Membaca file...");

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                let parsedData = {};
                
                if (file.name.endsWith('.json')) {
                    const text = e.target.result;
                    parsedData = JSON.parse(text);
                } else {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {type: 'array'});
                    const firstSheetName = workbook.SheetNames[0];
                    const firstSheet = workbook.Sheets[firstSheetName];
                    const rows = XLSX.utils.sheet_to_json(firstSheet, {defval: ""});
                    
                    rows.forEach(row => {
                        let kKelas = Object.keys(row).find(k => k.toLowerCase() === 'kelas');
                        let kNama = Object.keys(row).find(k => k.toLowerCase() === 'nama');
                        let kPin = Object.keys(row).find(k => k.toLowerCase() === 'pin');
                        
                        if (kKelas && kNama && row[kKelas] && row[kNama]) {
                            let kelasVal = String(row[kKelas]).replace(/\s+/g, '').toUpperCase();
                            let namaVal = String(row[kNama]).trim();
                            let pinVal = (kPin && row[kPin]) ? String(row[kPin]).trim() : "1234";
                            
                            if (kelasVal && namaVal) {
                                if (!parsedData[kelasVal]) parsedData[kelasVal] = {};
                                parsedData[kelasVal][namaVal] = pinVal;
                            }
                        }
                    });
                }

                if (Object.keys(parsedData).length === 0) {
                    showImportStatus("Format tidak sesuai atau data kosong. Pastikan ada kolom 'Kelas' dan 'Nama'.", true);
                    return;
                }

                let finalData = parsedData;
                if (!resetOld) {
                    const existingSnap = await get(ref(db, 'appConfig/students'));
                    if (existingSnap.exists()) {
                        const existingData = existingSnap.val();
                        finalData = {};
                        
                        // Normalisasi data yang ada sebelum di-merge
                        for (const kelas in existingData) {
                            finalData[kelas] = {};
                            const classData = existingData[kelas];
                            if (Array.isArray(classData)) {
                                classData.forEach(name => {
                                    if (name && typeof name === 'string') finalData[kelas][name] = "1234";
                                });
                            } else if (typeof classData === 'object') {
                                for (const key in classData) {
                                    if (!isNaN(key)) {
                                        const name = classData[key];
                                        if (name && typeof name === 'string') finalData[kelas][name] = "1234";
                                    } else {
                                        finalData[kelas][key] = classData[key];
                                    }
                                }
                            }
                        }
                        
                        // Merge dengan data baru yang di-import
                        for (const kelas in parsedData) {
                            if (!finalData[kelas]) finalData[kelas] = {};
                            for (const nama in parsedData[kelas]) {
                                finalData[kelas][nama] = parsedData[kelas][nama];
                            }
                        }
                    }
                }

                const sortedFinal = {};
                Object.keys(finalData).sort().forEach(c => {
                    sortedFinal[c] = {};
                    Object.keys(finalData[c]).sort().forEach(n => {
                        sortedFinal[c][n] = finalData[c][n];
                    });
                });

                showImportStatus("Menyimpan ke database...");
                await set(ref(db, 'appConfig/students'), sortedFinal);
                
                showImportStatus(`✅ Import berhasil! Disimpan ${Object.keys(sortedFinal).length} kelas.`);
                els.inputImportStudents.value = "";
                
                // Refresh admin table
                loadAdminStudents();
            } catch (err) {
                console.error("Parse Error:", err);
                showImportStatus("Gagal memproses file: " + err.message, true);
            } finally {
                els.btnImportStudents.textContent = "Proses Import";
                els.btnImportStudents.disabled = false;
            }
        };

        if (file.name.endsWith('.json')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    } catch (e) {
        showImportStatus("Terjadi kesalahan sistem.", true);
        els.btnImportStudents.textContent = "Proses Import";
        els.btnImportStudents.disabled = false;
    }
});

// ===== ADMIN STUDENT MANAGEMENT (PIN RESET) =====
async function loadAdminStudents() {
    const snap = await get(ref(db, 'appConfig/students'));
    if (snap.exists()) {
        const rawData = snap.val();
        adminStudentData = {};
        
        // Normalisasi struktur (mengubah format array lama menjadi object dengan PIN)
        for (const kelas in rawData) {
            adminStudentData[kelas] = {};
            const classData = rawData[kelas];
            
            if (Array.isArray(classData)) {
                classData.forEach(name => {
                    if (name && typeof name === 'string') adminStudentData[kelas][name] = "1234";
                });
            } else if (typeof classData === 'object') {
                for (const key in classData) {
                    if (!isNaN(key)) {
                        // Format array lama yang tersimpan sebagai object (key 0, 1, 2)
                        const name = classData[key];
                        if (name && typeof name === 'string') adminStudentData[kelas][name] = "1234";
                    } else {
                        adminStudentData[kelas][key] = classData[key];
                    }
                }
            }
        }
    } else {
        adminStudentData = {};
    }
    
    // Populate class dropdown
    els.selectAdminClass.innerHTML = '<option value="" disabled selected>Pilih Kelas</option>';
    Object.keys(adminStudentData).sort().forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        els.selectAdminClass.appendChild(opt);
    });
    
    els.tableAdminStudents.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-brand-text-muted">Pilih kelas untuk melihat data.</td></tr>';
}

els.selectAdminClass.addEventListener('change', () => {
    const selectedClass = els.selectAdminClass.value;
    if (!selectedClass || !adminStudentData[selectedClass]) return;
    
    const studentsObj = adminStudentData[selectedClass];
    const sortedNames = Object.keys(studentsObj).sort();
    
    if (sortedNames.length === 0) {
        els.tableAdminStudents.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-brand-text-muted">Kelas kosong.</td></tr>';
        return;
    }
    
    els.tableAdminStudents.innerHTML = '';
    sortedNames.forEach(name => {
        const currentPin = studentsObj[name];
        const isDefault = currentPin === "1234";
        
        const tr = document.createElement('tr');
        tr.className = "hover:bg-brand-surface/50 transition-colors";
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium">${name}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-xs font-bold ${isDefault ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}">
                    ${currentPin}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
                <button class="btn-reset-pin text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors text-white" data-class="${selectedClass}" data-name="${name}">
                    Reset (1234)
                </button>
            </td>
        `;
        els.tableAdminStudents.appendChild(tr);
    });
    
    // Add reset listeners
    document.querySelectorAll('.btn-reset-pin').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const cls = e.target.getAttribute('data-class');
            const nm = e.target.getAttribute('data-name');
            if (confirm(`Yakin mereset PIN ${nm} di kelas ${cls} menjadi 1234?`)) {
                try {
                    await set(ref(db, `appConfig/students/${cls}/${nm}`), "1234");
                    // Refresh data
                    loadAdminStudents().then(() => {
                        els.selectAdminClass.value = cls;
                        els.selectAdminClass.dispatchEvent(new Event('change'));
                    });
                    alert("PIN berhasil direset ke 1234.");
                } catch(err) {
                    alert("Gagal mereset PIN: " + err.message);
                }
            }
        });
    });
});
