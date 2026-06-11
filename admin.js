import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, get, set } from "firebase/database";
import { getFirestore, collection, getDocs, getDocsFromServer, doc, updateDoc, deleteDoc, query, where, Timestamp } from "firebase/firestore";

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
const dbFirestore = getFirestore(app);

function sanitizeStudentName(name) {
    if (!name) return "";
    return name.replace(/[\.\#\$\/\[\]]/g, " ").trim().replace(/\s+/g, " ");
}

function sanitizeClassName(className) {
    if (!className) return "";
    return className.replace(/[\.\#\$\/\[\]]/g, "-").replace(/\s+/g, "").toUpperCase();
}

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
    tableAdminStudents: document.getElementById('table-admin-students'),
    btnSyncStudents: document.getElementById('btn-sync-students'),
    syncStatus: document.getElementById('sync-status'),
    btnBackupData: document.getElementById('btn-backup-data'),
    btnCleanupOldData: document.getElementById('btn-cleanup-old-data'),
    btnResetStudentsDb: document.getElementById('btn-reset-students-db'),
    inputCleanupDate: document.getElementById('input-cleanup-date'),
    cleanupStatus: document.getElementById('cleanup-status')
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
                            let kelasVal = sanitizeClassName(String(row[kKelas]));
                            let namaVal = sanitizeStudentName(String(row[kNama]));
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
                            const cleanClass = sanitizeClassName(kelas);
                            finalData[cleanClass] = {};
                            const classData = existingData[kelas];
                            if (Array.isArray(classData)) {
                                classData.forEach(name => {
                                    if (name && typeof name === 'string') {
                                        const cleanName = sanitizeStudentName(name);
                                        finalData[cleanClass][cleanName] = "1234";
                                    }
                                });
                            } else if (typeof classData === 'object') {
                                for (const key in classData) {
                                    if (!isNaN(key)) {
                                        const name = classData[key];
                                        if (name && typeof name === 'string') {
                                            const cleanName = sanitizeStudentName(name);
                                            finalData[cleanClass][cleanName] = "1234";
                                        }
                                    } else {
                                        const cleanKey = sanitizeStudentName(key);
                                        finalData[cleanClass][cleanKey] = classData[key];
                                    }
                                }
                            }
                        }
                        
                        // Merge dengan data baru yang di-import
                        for (const kelas in parsedData) {
                            const cleanClass2 = sanitizeClassName(kelas);
                            if (!finalData[cleanClass2]) finalData[cleanClass2] = {};
                            for (const nama in parsedData[kelas]) {
                                const cleanName = sanitizeStudentName(nama);
                                finalData[cleanClass2][cleanName] = parsedData[kelas][nama];
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

// ===== SYNC STUDENTS FROM EXAMS =====
function showSyncStatus(msg, isError = false) {
    if (!els.syncStatus) return;
    els.syncStatus.textContent = msg;
    els.syncStatus.className = `text-sm font-medium mt-4 ${isError ? 'text-red-400' : 'text-brand-accent'}`;
    els.syncStatus.classList.remove('hidden');
}

if (els.btnSyncStudents) {
    els.btnSyncStudents.addEventListener('click', async () => {
        els.btnSyncStudents.disabled = true;
        const originalText = els.btnSyncStudents.textContent;
        els.btnSyncStudents.textContent = "Sinkronisasi...";
        showSyncStatus("Memulai sinkronisasi...");

        try {
            // 0. Helper untuk Kategori Kelas
            const deriveClassCategory = (inputClass) => {
                const s = inputClass.toString().toUpperCase();
                if (s.includes('7')) return '7';
                if (s.includes('8')) return '8';
                if (s.includes('9')) return '9';
                if (['10', '11', '12', 'X', 'XI', 'XII', 'SMA', 'SMK', 'MA'].some(x => s.includes(x))) return 'SMA';
                return '7';
            };

            // 1. Ambil data Realtime Database terkini
            const snap = await get(ref(db, 'appConfig/students'));
            const currentStudents = {};
            if (snap.exists()) {
                const rawData = snap.val();
                for (const kelas in rawData) {
                    const cleanClass = sanitizeClassName(kelas);
                    currentStudents[cleanClass] = {};
                    const classData = rawData[kelas];
                    if (Array.isArray(classData)) {
                        classData.forEach(name => {
                            if (name && typeof name === 'string') {
                                const cleanName = sanitizeStudentName(name);
                                currentStudents[cleanClass][cleanName] = "1234";
                            }
                        });
                    } else if (typeof classData === 'object') {
                        for (const key in classData) {
                            if (!isNaN(key)) {
                                const name = classData[key];
                                if (name && typeof name === 'string') {
                                    const cleanName = sanitizeStudentName(name);
                                    currentStudents[cleanClass][cleanName] = "1234";
                                }
                            } else {
                                const cleanKey = sanitizeStudentName(key);
                                currentStudents[cleanClass][cleanKey] = classData[key];
                            }
                        }
                    }
                }
            }

            // 2. Ambil data hasil ujian dari Firestore (Bypass Cache Server)
            showSyncStatus("Memindai database ujian di Firestore (remedial_exams)...");
            const remedialSnap = await getDocsFromServer(collection(dbFirestore, 'remedial_exams'));
            
            showSyncStatus("Memindai database latihan/ujian di Firestore (scores)...");
            const scoresSnap = await getDocsFromServer(collection(dbFirestore, 'scores'));

            let addedCount = 0;
            const firestoreUpdatePromises = [];
            const dbUpdateLogs = [];

            // 3. Proses hasil remedial_exams
            remedialSnap.forEach(docSnap => {
                const data = docSnap.data();
                if (data && data.nama && data.kelasRaw) {
                    const originalClass = String(data.kelasRaw).trim();
                    const sanitizedClass = sanitizeClassName(originalClass);
                    
                    const originalName = String(data.nama).trim();
                    const sanitizedName = sanitizeStudentName(originalName);

                    if (sanitizedClass && sanitizedName) {
                        if (originalName !== sanitizedName || originalClass !== sanitizedClass) {
                            const docRef = doc(dbFirestore, 'remedial_exams', docSnap.id);
                            firestoreUpdatePromises.push(updateDoc(docRef, { 
                                nama: sanitizedName, 
                                kelasRaw: sanitizedClass,
                                kelasKategori: deriveClassCategory(sanitizedClass)
                            }));
                            dbUpdateLogs.push(`Migrasi remedial_exams: [${originalClass}, ${originalName}] -> [${sanitizedClass}, ${sanitizedName}]`);
                        }

                        if (!currentStudents[sanitizedClass]) {
                            currentStudents[sanitizedClass] = {};
                        }
                        if (!currentStudents[sanitizedClass][sanitizedName]) {
                            currentStudents[sanitizedClass][sanitizedName] = "1234";
                            addedCount++;
                        }
                    }
                }
            });

            // 4. Proses hasil scores
            scoresSnap.forEach(docSnap => {
                const data = docSnap.data();
                if (data && data.nama && data.kelasRaw) {
                    const originalClass = String(data.kelasRaw).trim();
                    const sanitizedClass = sanitizeClassName(originalClass);
                    
                    const originalName = String(data.nama).trim();
                    const sanitizedName = sanitizeStudentName(originalName);

                    if (sanitizedClass && sanitizedName) {
                        if (originalName !== sanitizedName || originalClass !== sanitizedClass) {
                            const docRef = doc(dbFirestore, 'scores', docSnap.id);
                            firestoreUpdatePromises.push(updateDoc(docRef, { 
                                nama: sanitizedName, 
                                kelasRaw: sanitizedClass,
                                kelasKategori: deriveClassCategory(sanitizedClass)
                            }));
                            dbUpdateLogs.push(`Migrasi scores: [${originalClass}, ${originalName}] -> [${sanitizedClass}, ${sanitizedName}]`);
                        }

                        if (!currentStudents[sanitizedClass]) {
                            currentStudents[sanitizedClass] = {};
                        }
                        if (!currentStudents[sanitizedClass][sanitizedName]) {
                            currentStudents[sanitizedClass][sanitizedName] = "1234";
                            addedCount++;
                        }
                    }
                }
            });

            // Jalankan update Firestore jika ada nama/kelas yang perlu dimigrasikan
            if (firestoreUpdatePromises.length > 0) {
                showSyncStatus(`Memigrasikan ${firestoreUpdatePromises.length} data hasil ujian di Firestore...`);
                await Promise.all(firestoreUpdatePromises);
                console.log("Firestore migration complete:", dbUpdateLogs);
            }

            if (addedCount > 0 || firestoreUpdatePromises.length > 0) {
                showSyncStatus("Mengurutkan data dan menyimpan...");
                // Urutkan alfabetis
                const sortedFinal = {};
                Object.keys(currentStudents).sort().forEach(c => {
                    sortedFinal[c] = {};
                    Object.keys(currentStudents[c]).sort().forEach(n => {
                        sortedFinal[c][n] = currentStudents[c][n];
                    });
                });

                await set(ref(db, 'appConfig/students'), sortedFinal);
                let msg = `✅ Sinkronisasi berhasil! Berhasil menambahkan ${addedCount} siswa lama ke daftar.`;
                if (firestoreUpdatePromises.length > 0) {
                    msg += ` Serta berhasil memigrasi ${firestoreUpdatePromises.length} data nilai/kelas di Firestore.`;
                }
                showSyncStatus(msg, false);
                
                // Refresh data di tabel admin
                loadAdminStudents();
            } else {
                showSyncStatus("✅ Sinkronisasi selesai! Semua siswa di database hasil ujian sudah terdaftar di list PIN (tidak ada siswa baru yang perlu ditambahkan).", false);
            }
        } catch (err) {
            console.error("Gagal sinkronisasi:", err);
            showSyncStatus("Gagal sinkronisasi: " + err.message, true);
        } finally {
            els.btnSyncStudents.disabled = false;
            els.btnSyncStudents.textContent = originalText;
        }
    });
}

// ===== ADMIN STUDENT MANAGEMENT (PIN RESET) =====
async function loadAdminStudents() {
    const snap = await get(ref(db, 'appConfig/students'));
    if (snap.exists()) {
        const rawData = snap.val();
        adminStudentData = {};
        
        // Normalisasi struktur (mengubah format array lama menjadi object dengan PIN)
        for (const kelas in rawData) {
            const cleanClass = sanitizeClassName(kelas);
            adminStudentData[cleanClass] = {};
            const classData = rawData[kelas];
            
            if (Array.isArray(classData)) {
                classData.forEach(name => {
                    if (name && typeof name === 'string') {
                        const cleanName = sanitizeStudentName(name);
                        adminStudentData[cleanClass][cleanName] = "1234";
                    }
                });
            } else if (typeof classData === 'object') {
                for (const key in classData) {
                    if (!isNaN(key)) {
                        const name = classData[key];
                        if (name && typeof name === 'string') {
                            const cleanName = sanitizeStudentName(name);
                            adminStudentData[cleanClass][cleanName] = "1234";
                        }
                    } else {
                        const cleanKey = sanitizeStudentName(key);
                        adminStudentData[cleanClass][cleanKey] = classData[key];
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

// ===== ACADEMIC YEAR MANAGEMENT & DATA CLEANUP =====
if (els.inputCleanupDate) {
    els.inputCleanupDate.value = "2026-06-01";
}

function showCleanupStatus(msg, isError) {
    if (!els.cleanupStatus) return;
    els.cleanupStatus.textContent = msg;
    els.cleanupStatus.className = 'text-sm font-medium mt-4 ' + (isError ? 'text-red-400' : 'text-brand-accent');
    els.cleanupStatus.classList.remove('hidden');
}

if (els.btnBackupData) {
    els.btnBackupData.addEventListener('click', async () => {
        els.btnBackupData.disabled = true;
        const originalText = els.btnBackupData.textContent;
        els.btnBackupData.textContent = "Mengunduh...";
        showCleanupStatus("Mengambil data untuk di-backup...");
        
        try {
            // Helper for operation formatting
            const formatTipeOperasi = (op) => {
                if (!op) return '-';
                const ops = {
                    'multiply': 'Perkalian',
                    'divide': 'Pembagian',
                    'add': 'Penjumlahan',
                    'subtract': 'Pengurangan',
                    'decimal_add': 'Penjumlahan Desimal',
                    'decimal_subtract': 'Pengurangan Desimal',
                    'decimal_multiply': 'Perkalian Desimal',
                    'decimal_divide': 'Pembagian Desimal'
                };
                return ops[op] || op;
            };

            // Fetch all scores (Bypass Cache Server)
            const scoresSnap = await getDocsFromServer(collection(dbFirestore, 'scores'));
            const scoresData = [];
            scoresSnap.forEach(docSnap => {
                const d = docSnap.data();
                const dateStr = d.tanggal && typeof d.tanggal.toDate === 'function'
                    ? d.tanggal.toDate().toISOString()
                    : (d.tanggal ? new Date(d.tanggal).toISOString() : '-');
                scoresData.push({
                    "ID Dokumen": docSnap.id,
                    "Nama Siswa": d.nama || '',
                    "Kelas": d.kelasRaw || '',
                    "Kategori Kelas": d.kelasKategori || '',
                    "Skor / Nilai": d.skor !== undefined ? d.skor : 0,
                    "Tanggal Ujian": dateStr,
                    "Operasi": formatTipeOperasi(d.tipeOperasi),
                    "Mode Game": d.mode === 'exam' ? 'Ujian' : 'Latihan',
                    "Waktu Total (detik)": d.waktuTotal || 0,
                    "Waktu Rata-rata (detik)": d.waktuRataRata || 0
                });
            });

            // Fetch all remedial exams (Bypass Cache Server)
            const remedialSnap = await getDocsFromServer(collection(dbFirestore, 'remedial_exams'));
            const remedialData = [];
            remedialSnap.forEach(docSnap => {
                const d = docSnap.data();
                const dateStr = d.tanggal && typeof d.tanggal.toDate === 'function'
                    ? d.tanggal.toDate().toISOString()
                    : (d.tanggal ? new Date(d.tanggal).toISOString() : '-');
                remedialData.push({
                    "ID Dokumen": docSnap.id,
                    "Nama Siswa": d.nama || '',
                    "Kelas": d.kelasRaw || '',
                    "Kategori Kelas": d.kelasKategori || '',
                    "Skor / Nilai": d.skor !== undefined ? d.skor : 0,
                    "Tanggal Ujian": dateStr,
                    "Operasi": formatTipeOperasi(d.tipeOperasi),
                    "Mode Game": d.mode === 'exam' ? 'Ujian' : 'Latihan',
                    "Waktu Total (detik)": d.waktuTotal || 0,
                    "Waktu Rata-rata (detik)": d.waktuRataRata || 0
                });
            });

            if (scoresData.length === 0 && remedialData.length === 0) {
                showCleanupStatus("Tidak ada data hasil ujian untuk di-backup.", true);
                return;
            }

            // Create spreadsheet using SheetJS
            const wb = XLSX.utils.book_new();
            const wsScores = XLSX.utils.json_to_sheet(scoresData);
            const wsRemedial = XLSX.utils.json_to_sheet(remedialData);
            XLSX.utils.book_append_sheet(wb, wsScores, "Nilai Utama");
            XLSX.utils.book_append_sheet(wb, wsRemedial, "Ujian Remedial");

            const fileName = `jagoangka_backup_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);
            showCleanupStatus(`✅ Backup berhasil diunduh sebagai ${fileName}`, false);
        } catch (err) {
            console.error("Gagal melakukan backup:", err);
            showCleanupStatus(`Gagal melakukan backup: ${err.message}`, true);
        } finally {
            els.btnBackupData.disabled = false;
            els.btnBackupData.textContent = originalText;
        }
    });
}

if (els.btnCleanupOldData) {
    els.btnCleanupOldData.addEventListener('click', async () => {
        const dateVal = els.inputCleanupDate.value;
        if (!dateVal) {
            alert("Pilih tanggal cutoff terlebih dahulu!");
            return;
        }

        const cutoffDate = new Date(dateVal);
        const dateDisplay = cutoffDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        
        const confirmMsg = `PERINGATAN! Anda akan menghapus semua riwayat hasil ujian dan remedial yang dilakukan SEBELUM ${dateDisplay} secara permanen.\n\nTindakan ini tidak dapat dibatalkan. Pastikan Anda sudah mengunduh Backup Excel terlebih dahulu.\n\nKetik 'HAPUS' untuk mengonfirmasi:`;
        const confirmInput = prompt(confirmMsg);
        if (confirmInput !== "HAPUS") {
            alert("Konfirmasi dibatalkan. Tidak ada data yang dihapus.");
            return;
        }

        els.btnCleanupOldData.disabled = true;
        const originalText = els.btnCleanupOldData.textContent;
        els.btnCleanupOldData.textContent = "Menghapus...";
        showCleanupStatus("Memproses pembersihan riwayat...");

        try {
            const firestoreCutoff = Timestamp.fromDate(cutoffDate);

            // Fetch scores query (Bypass Cache Server)
            const qScores = query(collection(dbFirestore, 'scores'), where('tanggal', '<', firestoreCutoff));
            const scoresSnap = await getDocsFromServer(qScores);

            // Fetch remedial query (Bypass Cache Server)
            const qRemedial = query(collection(dbFirestore, 'remedial_exams'), where('tanggal', '<', firestoreCutoff));
            const remedialSnap = await getDocsFromServer(qRemedial);

            const deletePromises = [];
            let deletedScores = 0;
            let deletedRemedial = 0;

            scoresSnap.forEach(docSnap => {
                deletePromises.push(deleteDoc(doc(dbFirestore, 'scores', docSnap.id)));
                deletedScores++;
            });

            remedialSnap.forEach(docSnap => {
                deletePromises.push(deleteDoc(doc(dbFirestore, 'remedial_exams', docSnap.id)));
                deletedRemedial++;
            });

            if (deletePromises.length === 0) {
                showCleanupStatus(`✅ Tidak ditemukan data riwayat sebelum tanggal ${dateDisplay} untuk dihapus.`, false);
                return;
            }

            showCleanupStatus(`Sedang menghapus ${deletePromises.length} dokumen di Firestore...`);
            await Promise.all(deletePromises);
            showCleanupStatus(`✅ Berhasil menghapus ${deletedScores} data nilai utama dan ${deletedRemedial} data ujian remedial sebelum tanggal ${dateDisplay}!`, false);
        } catch (err) {
            console.error("Gagal membersihkan riwayat:", err);
            showCleanupStatus(`Gagal membersihkan riwayat: ${err.message}`, true);
        } finally {
            els.btnCleanupOldData.disabled = false;
            els.btnCleanupOldData.textContent = originalText;
        }
    });
}

if (els.btnResetStudentsDb) {
    els.btnResetStudentsDb.addEventListener('click', async () => {
        const confirmMsg = "PERINGATAN! Anda akan menghapus seluruh daftar kelas, nama siswa, dan PIN di Realtime Database secara permanen.\n\nSiswa yang sedang aktif tidak akan bisa login sampai didaftarkan kembali.\n\nKetik 'RESET SISWA' untuk mengonfirmasi:";
        const confirmInput = prompt(confirmMsg);
        if (confirmInput !== "RESET SISWA") {
            alert("Konfirmasi dibatalkan. Tidak ada data siswa yang di-reset.");
            return;
        }

        els.btnResetStudentsDb.disabled = true;
        const originalText = els.btnResetStudentsDb.textContent;
        els.btnResetStudentsDb.textContent = "Mereset...";
        showCleanupStatus("Mereset daftar siswa di Realtime Database...");

        try {
            await set(ref(db, 'appConfig/students'), null);
            showCleanupStatus("✅ Berhasil mengosongkan seluruh daftar siswa dan PIN di database!", false);
            loadAdminStudents();
        } catch (err) {
            console.error("Gagal mereset siswa:", err);
            showCleanupStatus(`Gagal mereset siswa: ${err.message}`, true);
        } finally {
            els.btnResetStudentsDb.disabled = false;
            els.btnResetStudentsDb.textContent = originalText;
        }
    });
}

