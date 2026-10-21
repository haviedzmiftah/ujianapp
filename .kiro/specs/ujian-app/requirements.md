# Requirements Document

## Introduction

Ujian App adalah aplikasi ujian online berbasis web (Next.js 14) yang dirancang untuk institusi pendidikan. Aplikasi ini mendukung tiga peran pengguna: Admin, Guru, dan Siswa. Guru dapat membuat dan mengelola soal pilihan ganda serta mengatur sesi ujian. Siswa mengerjakan ujian dalam lingkungan terpantau (proctoring) dengan timer, fullscreen mode, dan deteksi tab switching. Admin mengelola pengguna dan institusi. Setelah ujian selesai, sistem menghasilkan laporan nilai, analisis soal, dan visualisasi grafik yang dapat diekspor ke PDF dan Excel.

---

## Glossary

- **System**: Aplikasi Ujian App secara keseluruhan
- **Auth_Service**: Modul autentikasi berbasis NextAuth.js yang mengelola login, logout, dan sesi pengguna
- **Admin**: Pengguna dengan hak akses penuh untuk mengelola akun pengguna dan konfigurasi institusi
- **Guru**: Pengguna yang membuat, mengelola, dan mengawasi ujian serta melihat laporan hasil
- **Siswa**: Pengguna yang mengikuti ujian yang ditugaskan oleh Guru
- **Bank_Soal**: Repositori soal pilihan ganda yang dibuat dan dimiliki oleh Guru
- **Ujian**: Konfigurasi sesi ujian yang terdiri dari sekumpulan soal, durasi, dan aturan proctoring
- **Sesi_Ujian**: Instance aktif dari Ujian yang sedang dikerjakan oleh seorang Siswa
- **Exam_Engine**: Modul yang mengelola alur pengerjaan ujian oleh Siswa
- **Proctor_Service**: Modul yang memantau aktivitas Siswa selama Sesi_Ujian berlangsung
- **Violation**: Catatan pelanggaran yang dihasilkan oleh Proctor_Service ketika aturan proctoring dilanggar
- **Report_Service**: Modul yang menghitung, mengagregasi, dan mengekspor laporan hasil ujian
- **Soal**: Satu butir pertanyaan pilihan ganda dengan empat opsi jawaban dan satu kunci jawaban
- **Opsi_Jawaban**: Satu dari empat pilihan (A, B, C, D) yang tersedia pada setiap Soal
- **Kunci_Jawaban**: Opsi_Jawaban yang ditetapkan sebagai jawaban benar pada setiap Soal
- **Jawaban_Siswa**: Opsi_Jawaban yang dipilih oleh Siswa untuk sebuah Soal dalam Sesi_Ujian
- **Urutan_Acak_Soal**: Urutan tampil soal yang di-generate unik per Sesi_Ujian menggunakan algoritma Fisher-Yates shuffle
- **Urutan_Acak_Opsi**: Urutan tampil keempat opsi jawaban yang di-generate unik per soal per Sesi_Ujian
- **Shuffle_Service**: Modul yang bertanggung jawab menghasilkan dan menyimpan urutan acak untuk soal dan opsi jawaban

---

## Requirements

### Requirement 1: Autentikasi Pengguna

**User Story:** Sebagai pengguna (Admin, Guru, atau Siswa), saya ingin dapat login dan logout dengan aman, sehingga akses ke fitur aplikasi terlindungi sesuai peran saya.

#### Acceptance Criteria

1. WHEN pengguna mengirimkan kredensial yang valid (email dan password terdaftar), THE Auth_Service SHALL mengautentikasi pengguna, membuat sesi aktif dengan durasi 60 menit, dan mengarahkan pengguna ke halaman beranda sesuai perannya dalam waktu 3 detik.
2. WHEN pengguna mengirimkan kredensial yang tidak valid, THE Auth_Service SHALL menolak permintaan login dan menampilkan pesan kesalahan generik ("Email atau password salah") tanpa mengungkap field mana yang salah.
3. WHEN pengguna gagal login sebanyak 5 kali berturut-turut, THE Auth_Service SHALL mengunci akun selama 15 menit dan menampilkan notifikasi bahwa akun terkunci beserta estimasi waktu pembukaan kunci.
4. WHEN pengguna yang telah login melakukan logout, THE Auth_Service SHALL menghapus sesi aktif dan mengarahkan pengguna ke halaman login.
5. WHILE sesi pengguna aktif dengan sisa waktu ≤5 menit, THE Auth_Service SHALL memperbarui token sesi secara otomatis tanpa interaksi pengguna.
6. IF sesi pengguna kedaluwarsa (telah mencapai 60 menit tanpa pembaruan), THEN THE Auth_Service SHALL mengarahkan pengguna ke halaman login dan menampilkan notifikasi "Sesi Anda telah berakhir, silakan login kembali."
7. THE Auth_Service SHALL membatasi akses ke setiap halaman berdasarkan peran pengguna yang telah terautentikasi (Admin, Guru, atau Siswa).
8. IF pengguna yang telah terautentikasi mencoba mengakses halaman yang tidak sesuai dengan perannya, THEN THE Auth_Service SHALL menolak akses dan mengarahkan pengguna ke halaman beranda sesuai perannya masing-masing.

---

### Requirement 2: Manajemen Pengguna oleh Admin

**User Story:** Sebagai Admin, saya ingin dapat membuat, mengubah, dan menonaktifkan akun Guru dan Siswa, sehingga institusi dapat mengelola akses pengguna secara terpusat.

#### Acceptance Criteria

1. THE System SHALL membatasi akses fitur manajemen pengguna hanya kepada pengguna dengan peran Admin; pengguna dengan peran lain SHALL menerima pesan "Akses ditolak" dan diarahkan ke halaman beranda perannya.
2. WHEN Admin membuat akun baru dengan nama (1–100 karakter), email unik dengan format valid, dan peran yang valid (Guru atau Siswa), THE System SHALL menyimpan akun ke basis data dan mengirimkan notifikasi email kepada pengguna baru dalam waktu 60 detik.
3. WHEN Admin membuat akun dengan email yang sudah terdaftar, THE System SHALL menolak permintaan tanpa menyimpan data apapun dan menampilkan pesan "Email sudah digunakan oleh akun lain."
4. IF Admin mengirimkan formulir pembuatan akun dengan nama kosong, format email tidak valid, atau peran yang tidak dikenali, THEN THE System SHALL menolak penyimpanan dan menampilkan pesan validasi spesifik untuk setiap field yang tidak valid.
5. WHEN Admin mengubah data akun pengguna yang ada dengan data yang valid, THE System SHALL menyimpan perubahan dan mencatat waktu modifikasi terakhir dengan akurasi hingga detik.
6. IF Admin mencoba mengubah email pengguna menjadi email yang sudah digunakan oleh akun lain, THEN THE System SHALL menolak perubahan, mengembalikan data ke nilai sebelumnya, dan menampilkan pesan "Email sudah digunakan oleh akun lain."
7. WHEN Admin menonaktifkan akun pengguna, THE System SHALL mengubah status akun menjadi nonaktif dan mencegah pengguna tersebut untuk login.
8. IF pengguna yang dinonaktifkan memiliki sesi aktif, THEN THE System SHALL mengakhiri sesi tersebut dalam waktu 60 detik setelah penonaktifan dan tidak menghapus data historis pengguna.
9. WHEN Admin mengaktifkan kembali akun yang dinonaktifkan, THE System SHALL mengubah status akun menjadi aktif sehingga pengguna dapat kembali login menggunakan kredensial yang sama.

---

### Requirement 3: Manajemen Bank Soal oleh Guru

**User Story:** Sebagai Guru, saya ingin dapat membuat, mengubah, dan menghapus soal pilihan ganda, sehingga saya memiliki kumpulan soal yang siap digunakan dalam ujian.

#### Acceptance Criteria

1. THE System SHALL membatasi akses Bank_Soal sehingga hanya Guru pemilik soal yang dapat melihat, mengubah, dan menghapus soal tersebut; pengguna lain SHALL menerima indikasi error akses ditolak.
2. WHEN Guru membuat Soal baru dengan pertanyaan (1–1000 karakter), tepat empat Opsi_Jawaban (masing-masing 1–500 karakter), dan tepat satu Kunci_Jawaban, THE System SHALL menyimpan Soal ke Bank_Soal dan menampilkan konfirmasi bahwa Soal berhasil disimpan.
3. IF Guru mengirimkan formulir pembuatan Soal dengan field yang tidak lengkap (pertanyaan kosong, jumlah opsi kurang dari empat, atau tidak ada Kunci_Jawaban), THEN THE System SHALL menolak penyimpanan, menampilkan pesan validasi spesifik per field, dan mempertahankan data yang telah diisi.
4. WHEN Guru mengubah Soal yang belum pernah digunakan dalam Ujian manapun, THE System SHALL menyimpan perubahan secara langsung dan menampilkan konfirmasi bahwa Soal berhasil diperbarui.
5. WHEN Guru mengubah Soal yang sedang digunakan dalam Ujian yang aktif (berlangsung saat ini), THE System SHALL menolak perubahan dan menampilkan pesan bahwa Soal tidak dapat diubah selama Ujian berlangsung.
6. WHEN Guru mengubah Soal yang sudah digunakan dalam Ujian yang telah selesai, THE System SHALL menyimpan perubahan sebagai versi baru dan mempertahankan versi lama agar data Jawaban_Siswa historis tetap mengacu pada versi soal yang benar.
7. WHEN Guru menghapus Soal yang belum pernah digunakan dalam Ujian manapun, THE System SHALL menghapus Soal secara permanen dari Bank_Soal dan menampilkan konfirmasi penghapusan.
8. IF Guru mencoba menghapus Soal yang sudah atau sedang digunakan dalam Ujian (aktif maupun selesai), THEN THE System SHALL menolak penghapusan dan menampilkan pesan bahwa Soal tidak dapat dihapus karena terkait dengan data ujian.

---

### Requirement 4: Pembuatan dan Konfigurasi Ujian oleh Guru

**User Story:** Sebagai Guru, saya ingin dapat membuat dan mengonfigurasi ujian dari Bank Soal saya, sehingga saya dapat menentukan soal, durasi, dan aturan proctoring untuk setiap sesi ujian.

#### Acceptance Criteria

1. WHEN Guru membuat Ujian baru dengan judul (1–200 karakter), daftar Soal (1–200 Soal), dan durasi (1–300 menit) yang valid, THE System SHALL menyimpan Ujian dengan status "draf".
2. IF Guru mengirimkan formulir pembuatan Ujian dengan judul kosong, jumlah Soal di luar rentang 1–200, atau durasi di luar rentang 1–300 menit, THEN THE System SHALL menolak penyimpanan dan menampilkan pesan validasi spesifik per field.
3. THE System SHALL memungkinkan Guru untuk mengaktifkan atau menonaktifkan aturan fullscreen mode pada setiap Ujian secara independen.
4. THE System SHALL memungkinkan Guru untuk mengaktifkan atau menonaktifkan deteksi tab switching pada setiap Ujian secara independen.
5. WHEN Guru menetapkan batas maksimum Violation dengan nilai bilangan bulat antara 1–100 untuk sebuah Ujian, THE System SHALL menyimpan nilai tersebut sebagai ambang batas pengakhiran ujian otomatis.
6. IF Guru menetapkan batas Violation dengan nilai di luar rentang 1–100 atau nilai bukan bilangan bulat, THEN THE System SHALL menolak input dan menampilkan pesan validasi "Batas pelanggaran harus berupa bilangan bulat antara 1 dan 100."
7. WHEN Guru mempublikasikan Ujian yang berstatus "draf", THE System SHALL mengubah status Ujian menjadi "dipublikasikan" dan mengizinkan penugasan kepada Siswa.
8. IF Guru mencoba mempublikasikan Ujian yang tidak berstatus "draf", THEN THE System SHALL menolak aksi dan menampilkan pesan status tidak valid.
9. WHEN Guru menetapkan Ujian yang berstatus "dipublikasikan" kepada Siswa atau kelompok Siswa, THE System SHALL membuat entri penugasan yang menghubungkan Siswa dengan Ujian.
10. IF Guru mencoba menugaskan Ujian yang tidak berstatus "dipublikasikan", THEN THE System SHALL menolak penugasan dan menampilkan pesan "Ujian harus dipublikasikan terlebih dahulu sebelum dapat ditugaskan."

---

### Requirement 5: Pengerjaan Ujian oleh Siswa (Exam Engine)

**User Story:** Sebagai Siswa, saya ingin dapat mengerjakan ujian yang ditugaskan kepada saya dengan tampilan yang jelas dan navigasi yang mudah, sehingga saya dapat menyelesaikan ujian tanpa kebingungan teknis.

#### Acceptance Criteria

1. WHEN Siswa membuka Ujian yang ditugaskan dan belum ada Sesi_Ujian aktif untuk Ujian tersebut, THE Exam_Engine SHALL membuat Sesi_Ujian baru dan memulai countdown timer sesuai durasi yang dikonfigurasi Guru.
2. WHEN Siswa membuka Ujian yang memiliki Sesi_Ujian aktif yang sudah ada, THE Exam_Engine SHALL melanjutkan Sesi_Ujian tersebut, memulihkan semua Jawaban_Siswa yang tersimpan, dan melanjutkan countdown timer dari sisa waktu yang tersimpan.
3. THE Exam_Engine SHALL menampilkan satu Soal per halaman beserta nomor urut soal, empat Opsi_Jawaban, dan panel navigasi yang menampilkan semua nomor soal dengan penanda status "sudah dijawab" atau "belum dijawab" untuk setiap nomor.
4. THE Exam_Engine SHALL menyediakan tombol navigasi "Sebelumnya", "Berikutnya", dan panel nomor soal yang dapat diklik untuk berpindah antar soal.
5. WHEN Siswa memilih sebuah Opsi_Jawaban, THE Exam_Engine SHALL menyimpan Jawaban_Siswa secara otomatis ke server tanpa memerlukan tindakan simpan manual, dan memperbarui status soal tersebut menjadi "sudah dijawab" pada panel navigasi.
6. IF penyimpanan otomatis Jawaban_Siswa ke server gagal, THEN THE Exam_Engine SHALL menampilkan indikator error di panel navigasi untuk soal tersebut, mempertahankan pilihan jawaban di UI, dan tidak memperbarui status soal menjadi "sudah dijawab".
7. WHILE Sesi_Ujian berlangsung, THE Exam_Engine SHALL menampilkan sisa waktu yang diperbarui setiap detik.
8. WHEN Siswa mengklik tombol "Selesai" dan mengonfirmasi pengakhiran ujian pada dialog konfirmasi, THE Exam_Engine SHALL mengakhiri Sesi_Ujian, menghitung nilai akhir berdasarkan Jawaban_Siswa yang cocok dengan Kunci_Jawaban, dan menyimpan nilai tersebut pada Sesi_Ujian.
9. WHEN waktu Sesi_Ujian habis, THE Exam_Engine SHALL secara otomatis mengakhiri Sesi_Ujian dan menyimpan semua Jawaban_Siswa yang telah terisi hingga saat itu.
10. IF pengguna mencoba mengakses Sesi_Ujian yang telah berakhir, THEN THE Exam_Engine SHALL menolak akses, menampilkan pesan "Sesi ujian ini telah berakhir dan tidak dapat dilanjutkan," dan mengarahkan pengguna ke halaman hasil ujian.

---

### Requirement 6: Proctoring dan Deteksi Pelanggaran

**User Story:** Sebagai Guru, saya ingin aktivitas mencurigakan Siswa selama ujian dicatat secara otomatis, sehingga saya dapat mengevaluasi integritas ujian setelah selesai.

#### Acceptance Criteria

1. WHERE fullscreen mode diaktifkan pada Ujian, THE Proctor_Service SHALL mencegah Sesi_Ujian dimulai hingga Siswa memasuki mode fullscreen; tombol "Mulai Ujian" SHALL dinonaktifkan hingga fullscreen aktif.
2. WHERE fullscreen mode diaktifkan pada Ujian, WHEN Siswa keluar dari mode fullscreen selama Sesi_Ujian berlangsung, THE Proctor_Service SHALL menampilkan modal peringatan yang membutuhkan konfirmasi dan mencatat satu entri Violation bertipe "fullscreen_exit" dengan timestamp saat kejadian.
3. WHERE deteksi tab switching diaktifkan pada Ujian, WHEN Siswa berpindah ke tab atau aplikasi lain selama Sesi_Ujian berlangsung, THE Proctor_Service SHALL menampilkan modal peringatan yang membutuhkan konfirmasi dan mencatat satu entri Violation bertipe "tab_switch" dengan timestamp saat perpindahan terjadi.
4. WHILE Sesi_Ujian berlangsung dengan batas Violation yang ditetapkan, THE Proctor_Service SHALL menampilkan jumlah Violation terkini kepada Siswa dan memperbarui tampilan setiap kali entri Violation baru dicatat.
5. WHEN jumlah Violation Siswa mencapai batas maksimum yang ditetapkan oleh Guru, THE Proctor_Service SHALL secara otomatis mengakhiri Sesi_Ujian dengan status "submitted", menyimpan semua jawaban yang telah diisi sebagai submission resmi yang dihitung dalam penilaian.
6. IF proses pengakhiran otomatis akibat batas Violation gagal dieksekusi, THEN THE Proctor_Service SHALL menampilkan pesan kesalahan kepada Siswa dan mempertahankan Sesi_Ujian dalam status aktif agar dapat mencoba submit ulang.
7. THE Proctor_Service SHALL menyimpan seluruh riwayat Violation suatu Sesi_Ujian, termasuk tipe pelanggaran dan timestamp, dan menyediakan riwayat tersebut untuk diakses oleh Guru segera setelah Sesi_Ujian berakhir.

---

### Requirement 7: Perhitungan Nilai dan Laporan Ujian

**User Story:** Sebagai Guru, saya ingin melihat laporan hasil ujian yang komprehensif dengan grafik dan kemampuan ekspor, sehingga saya dapat mengevaluasi performa Siswa dan kualitas soal secara efisien.

#### Acceptance Criteria

1. WHEN Sesi_Ujian berakhir, THE Report_Service SHALL menghitung nilai akhir Siswa dengan formula: (jumlah Jawaban_Siswa yang cocok dengan Kunci_Jawaban / total Soal dalam Ujian) × 100, dibulatkan ke dua desimal, dengan rentang nilai 0.00–100.00.
2. THE Report_Service SHALL menyediakan laporan per Ujian yang menampilkan daftar Siswa beserta nilai akhir masing-masing dan jumlah Violation, diurutkan berdasarkan nilai akhir dari tertinggi ke terendah.
3. IF suatu Ujian memiliki minimal satu Sesi_Ujian dengan status selesai, THEN THE Report_Service SHALL menghitung dan menampilkan nilai rata-rata kelas sebagai rata-rata aritmetika dari seluruh nilai akhir Siswa, dibulatkan ke dua desimal.
4. THE Report_Service SHALL menampilkan analisis per Soal yang mencakup persentase jawaban benar (jumlah jawaban benar / jumlah Siswa yang menjawab × 100, dibulatkan ke dua desimal) dan jumlah pemilihan untuk setiap Opsi_Jawaban.
5. THE Report_Service SHALL menampilkan visualisasi grafik distribusi nilai Siswa dalam interval 10 poin (0–10, 11–20, …, 91–100) yang menunjukkan jumlah Siswa di setiap interval.
6. WHEN Guru meminta ekspor laporan dalam format PDF, THE Report_Service SHALL menghasilkan file PDF berisi daftar nilai Siswa, rata-rata kelas, dan analisis per Soal dalam waktu 30 detik, atau menampilkan pesan kesalahan jika melebihi batas waktu.
7. WHEN Guru meminta ekspor laporan dalam format Excel, THE Report_Service SHALL menghasilkan file Excel dengan satu baris per Siswa memuat kolom nama, nilai akhir, dan jumlah Violation dalam waktu 30 detik, atau menampilkan pesan kesalahan jika melebihi batas waktu.
8. IF Guru meminta ekspor tetapi Ujian tidak memiliki Sesi_Ujian yang telah selesai, THEN THE Report_Service SHALL menampilkan pesan "Laporan tidak tersedia karena belum ada sesi ujian yang selesai."
9. FOR ALL Sesi_Ujian dengan data yang sama, THE Report_Service SHALL menghasilkan nilai akhir yang identik setiap kali perhitungan dilakukan (determinisme kalkulasi).

---

### Requirement 8: Konsistensi dan Integritas Data

**User Story:** Sebagai pengguna sistem, saya ingin data ujian tersimpan secara konsisten dan dapat dipulihkan, sehingga tidak ada jawaban atau hasil ujian yang hilang akibat gangguan teknis.

#### Acceptance Criteria

1. WHEN koneksi jaringan Siswa terputus selama Sesi_Ujian, THE Exam_Engine SHALL menyimpan Jawaban_Siswa secara lokal dalam waktu 5 detik setelah terputus, dan mensinkronisasi data ke server dalam waktu 10 detik setelah koneksi pulih.
2. WHEN Siswa memuat ulang halaman selama Sesi_Ujian berlangsung, THE Exam_Engine SHALL memulihkan status Sesi_Ujian termasuk semua Jawaban_Siswa tersimpan dan sisa waktu dalam waktu 5 detik dengan toleransi ketidakakuratan clock ≤3 detik.
3. THE System SHALL memastikan bahwa setiap Siswa hanya dapat memiliki satu Sesi_Ujian aktif untuk satu Ujian pada waktu yang bersamaan.
4. IF operasi penyimpanan Jawaban_Siswa ke server gagal, THEN THE Exam_Engine SHALL mencoba ulang dengan interval 5 detik hingga maksimal 3 kali sebelum menampilkan notifikasi kesalahan dan menyimpan jawaban secara lokal sebagai fallback.
5. WHEN Sesi_Ujian berakhir, THE Exam_Engine SHALL memverifikasi bahwa jumlah Jawaban_Siswa di server sesuai dengan data lokal sebelum menandai sesi sebagai selesai; IF terdapat ketidaksesuaian, THEN THE Exam_Engine SHALL secara otomatis mengunggah ulang data lokal sebelum finalisasi.

---

### Requirement 9: Randomisasi Soal dan Opsi Jawaban

**User Story:** Sebagai Guru, saya ingin setiap Siswa mendapatkan urutan soal dan urutan opsi jawaban yang diacak secara unik, sehingga risiko contekan antar siswa berkurang dan integritas ujian meningkat.

#### Acceptance Criteria

1. THE System SHALL memungkinkan Guru untuk mengaktifkan atau menonaktifkan fitur randomisasi urutan soal pada setiap Ujian secara independen dari fitur lainnya.
2. THE System SHALL memungkinkan Guru untuk mengaktifkan atau menonaktifkan fitur randomisasi urutan opsi jawaban pada setiap Ujian secara independen dari fitur lainnya.
3. WHEN randomisasi urutan soal diaktifkan pada Ujian dan Sesi_Ujian baru dibuat, THE Shuffle_Service SHALL menghasilkan Urutan_Acak_Soal menggunakan algoritma Fisher-Yates shuffle dan menyimpan Urutan_Acak_Soal tersebut ke server sebelum Siswa dapat mengakses soal pertama.
4. WHEN randomisasi urutan opsi jawaban diaktifkan pada Ujian dan Sesi_Ujian baru dibuat, THE Shuffle_Service SHALL menghasilkan Urutan_Acak_Opsi untuk setiap Soal dalam Ujian menggunakan algoritma Fisher-Yates shuffle dan menyimpan seluruh Urutan_Acak_Opsi tersebut ke server sebelum Siswa dapat mengakses soal pertama.
5. IF penyimpanan Urutan_Acak_Soal atau Urutan_Acak_Opsi ke server gagal saat pembuatan Sesi_Ujian, THEN THE Shuffle_Service SHALL membatalkan pembuatan Sesi_Ujian dan menampilkan pesan kesalahan kepada Siswa tanpa menampilkan soal apapun.
6. WHEN Siswa memuat ulang halaman atau melanjutkan Sesi_Ujian yang sudah ada, THE Shuffle_Service SHALL mengambil Urutan_Acak_Soal dan Urutan_Acak_Opsi yang tersimpan di server dan menampilkan soal serta opsi dalam urutan yang identik dengan sesi sebelumnya.
7. WHILE Sesi_Ujian berlangsung dengan randomisasi diaktifkan, THE Exam_Engine SHALL menampilkan nomor urut soal berdasarkan posisi dalam Urutan_Acak_Soal (bukan nomor asli dari Bank_Soal) kepada Siswa.
8. WHEN Sesi_Ujian berakhir dan nilai dihitung, THE Report_Service SHALL mengevaluasi setiap Jawaban_Siswa terhadap Kunci_Jawaban asli dari Soal yang bersangkutan tanpa mempertimbangkan posisi tampil opsi dalam Urutan_Acak_Opsi.
9. THE Report_Service SHALL menampilkan teks soal dan teks setiap Opsi_Jawaban dalam urutan asli yang ditetapkan Guru pada laporan hasil ujian, bukan dalam urutan tampil yang diterima masing-masing Siswa.
10. WHEN randomisasi urutan soal tidak diaktifkan pada Ujian, THE Exam_Engine SHALL menampilkan soal kepada seluruh Siswa dalam urutan yang ditetapkan Guru saat membuat Ujian.
11. WHEN randomisasi urutan opsi jawaban tidak diaktifkan pada Ujian, THE Exam_Engine SHALL menampilkan keempat Opsi_Jawaban kepada seluruh Siswa dalam urutan yang ditetapkan Guru saat membuat Soal.
