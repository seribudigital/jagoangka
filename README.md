# Jago Angka - Latihan Matematika Interaktif

## Deskripsi Proyek
Jago Angka adalah aplikasi web interaktif yang dirancang untuk membantu siswa (khususnya tingkat SMP & SMA) melatih kemampuan matematika dasar mereka dengan cara yang menyenangkan. Fokus utama aplikasi ini adalah melatih kecepatan dan ketepatan perhitungan dasar seperti perkalian, pembagian, penjumlahan, dan pengurangan (baik untuk bilangan bulat maupun desimal). Aplikasi ini menawarkan berbagai mode permainan, termasuk latihan santai, ujian berwaktu, hingga mode duel *real-time* dengan pemain lain.

## Fitur Utama
- **Mode Latihan & Ujian**: Latihan santai (10 soal tanpa tekanan waktu) atau Ujian (50 soal dengan batas waktu seperti 7-10 detik per soal).
- **Latihan Fokus (Adaptive Learning)**: Aplikasi mendeteksi kelemahan pengguna (soal yang sering salah) dan secara otomatis merekomendasikan "Latihan Fokus" untuk memperbaikinya.
- **Mode Duel Real-Time**: Bermain dan adu cepat menjawab soal matematika melawan teman secara langsung (*multiplayer*).
- **Papan Peringkat (Leaderboard)**: Pengguna dapat bersaing untuk mendapatkan skor tertinggi dengan siswa lain berdasarkan kelas atau jenis operasi matematika.
- **Sistem Pencapaian (Badges & Achievements)**: Terdapat penghargaan seperti *Speedster*, *Math Warrior*, dan *Perfectionist* untuk memotivasi proses belajar.
- **Riwayat & Statistik Belajar**: Merekam rekam jejak pengguna, nilai, dan visualisasi grafik aktivitas belajar selama 7 hari terakhir.
- **Dukungan Audio & Tema**: Dilengkapi *sound effect* untuk interaksi yang bisa dibisukan (mute), serta *Toggle* Tema. Desain UI menggunakan *Glassmorphism*.
- **Latar Belakang 3D**: Menggunakan elemen kanvas interaktif untuk membuat tampilan web lebih hidup.

## Arsitektur & Teknologi (Tech Stack)
Aplikasi ini dikembangkan dengan arsitektur *Single Page Application* (SPA) berbasis Vanilla JavaScript tanpa memuat *framework* frontend berat seperti React atau Vue.
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES Modules).
- **Styling**: Tailwind CSS (diproses via *standalone executable* CLI atau Node.js) digabungkan dengan Vanilla CSS khusus untuk efek kustom.
- **Libraries**:
  - `Three.js`: Digunakan untuk merender animasi latar belakang 3D yang dinamis.
  - `Chart.js`: Digunakan untuk merender grafik aktivitas belajar di halaman riwayat.
- **Backend & Cloud Services (Firebase)**: 
  - Diintegrasikan menggunakan Firebase SDK v10 (melalui *Import Maps*).
  - **Firebase Hosting**: Untuk melayani aset statis (*deployment*).
  - **Firestore (Database NoSQL)**: Menyimpan dan menyinkronkan data Papan Peringkat (*Leaderboard*), status *room* pada Mode Duel, dan menarik konfigurasi dinamis.
  - **Firebase Analytics**: Memantau interaksi pengguna.

## Struktur Direktori dan File Utama
- `index.html`: File entri utama yang merangkum keseluruhan *User Interface* (UI). Layar yang berbeda (seperti *Welcome*, *Menu*, *Game*, *Results*, *Leaderboard*) dikendalikan menggunakan penambahan/penghapusan kelas CSS `hidden` via JavaScript.
- `script.js`: "Otak" utama dari aplikasi. Mengelola status (*state*), perpindahan halaman, generator soal secara *random* namun terukur, logika ujian, perhitungan *adaptive learning*, manajemen audio, hingga pemanggilan fungsi Firebase.
- `duel.js` & `duel.css`: Skrip dan *styling* spesifik yang bertugas menangani interaksi sinkronisasi *real-time* untuk "Mode Duel".
- `background3d.js`: Skrip khusus yang berisi logika perenderan objek 3D menggunakan Three.js untuk latar belakang *website*.
- `admin.html` & `admin.js`: Halaman *dashboard* kontrol bagi admin (misal: melihat data keseluruhan pengguna).
- `style.css`: File *styling* kustom (*Vanilla CSS*) tempat mendefinisikan warna *root variables* dan elemen spesifik yang sulit dicapai dengan *utility classes*.
- `main.css`: Berkas *stylesheet* hasil kompilasi/build akhir dari Tailwind CSS. File inilah yang dipanggil oleh HTML.
- `tailwind.config.js`: Konfigurasi *custom theme*, warna, dan jenis *font* Tailwind (menggunakan *font* Outfit).
- `firebase.json`, `firestore.rules`, `firestore.indexes.json`: File pengaturan *deployment*, keamanan akses (aturan baca/tulis), dan indeks basis data Firebase.

## Mekanisme Manajemen Data (State & Storage)
Aplikasi sangat mengandalkan `localStorage` di *browser* untuk menyimpan *progress* profil pemain agar pengalaman pengguna lebih mulus (sebelum akhirnya dikirim secara opsional ke Firestore):
- `math_mastery_user`: Menyimpan data profil (Nama, Kelas).
- `math_mastery_history`: Riwayat setiap sesi *game* / latihan yang selesai.
- `math_mastery_achievements`: Statistik global dan koleksi *badge* (medali).
- `math_mastery_activity`: Data log harian pengguna (digunakan untuk mem-plot *Chart* aktivitas).
- `math_mastery_weaknesses`: Objek pemetaan (map) yang menghitung frekuensi kegagalan pada soal-soal tertentu untuk menyajikan fitur Latihan Fokus.

## Panduan Pengembangan (Development Guide)

### Prasyarat (*Prerequisites*)
Untuk menjalankan atau memodifikasi secara lokal, Anda hanya membutuhkan web browser modern. Karena kode menggunakan ES Modules (`<script type="importmap">` dan `import/export`), Anda harus menjalankannya melalui HTTP Server.

### Menjalankan secara Lokal
1. Buka folder proyek di *Code Editor* Anda (misal: VS Code).
2. Gunakan ekstensi seperti **Live Server** di VS Code.
3. Alternatif menggunakan Python (jika terinstal): Jalankan perintah `python -m http.server 8000` di dalam folder proyek, lalu buka `http://localhost:8000` di *browser*.

### Mengkompilasi Ulang CSS (Tailwind)
Proyek ini berisi *executable file* `tailwind.exe` (versi *standalone* CLI Tailwind) untuk memproses *class-class* Tailwind di file HTML/JS menjadi file CSS (*main.css*).
Jika Anda menambahkan elemen HTML dengan *class* Tailwind baru, Anda wajib melakukan *build* agar perubahannya masuk ke dalam `main.css`. Jalankan perintah ini di terminal:
```bash
./tailwind.exe -i ./style.css -o ./main.css --watch
```
Atau jika Anda lebih suka menggunakan *Node.js* (npm):
```bash
npx tailwindcss -i ./style.css -o ./main.css --watch
```

### Menambah/Memodifikasi Fitur
- **Menambah Mode Perhitungan Baru**: 
  1. Tambahkan tombol menu mode di `index.html`. 
  2. Perbarui konfigurasi parameter di variabel objek `state.appConfig` pada `script.js`.
  3. Modifikasi fungsi `generateSingleQuestion(mode)` di `script.js` untuk mengakomodasi mode baru tersebut.
- **Mengedit Tampilan/UI**: Anda dapat memodifikasi struktur di `index.html` menggunakan *utility class* Tailwind, atau menimpa *style* spesifik di `style.css`.
- **Konfigurasi Database/Cloud**: Jika ingin melakukan tes terpisah atau mengganti proyek, ubah inisialisasi Firebase Configuration di bagian import CDN `firebase/app` atau atur ulang proyek Firebase Hosting Anda melalui `firebase-tools` CLI.

---
*Dibuat untuk memudahkan pemahaman proyek, pemeliharaan kode (maintenance), dan kolaborasi pengembangan Jago Angka di masa mendatang.*
