# ABEE SHORTS

Starter web app katalog film pendek dengan Next.js. Versi awal mengambil metadata dari Internet Archive dan menampilkan item yang metadata lisensinya cocok dengan daftar lisensi terbuka yang dikenali.

## Jalankan di komputer

1. Install Node.js versi LTS dari https://nodejs.org/
2. Buka terminal di folder proyek.
3. Jalankan `npm install`
4. Jalankan `npm run dev`
5. Buka http://localhost:3000

## Deploy ke Vercel

1. Upload isi folder proyek ke repository GitHub.
2. Masuk ke https://vercel.com/ lalu pilih Add New → Project.
3. Import repository `abee-short`.
4. Framework akan terdeteksi sebagai Next.js. Klik Deploy.

Tidak perlu API key untuk prototipe ini.

## Sumber katalog

Katalog awal menggunakan Internet Archive Advanced Search dan metadata item:
- https://archive.org/advancedsearch.php
- https://archive.org/metadata/

## PENTING: hak cipta dan lisensi

Filter lisensi di kode ini hanya pemeriksaan otomatis awal, bukan verifikasi hukum dan bukan jaminan bahwa video boleh di-host ulang, disiarkan, atau dimonetisasi. Metadata dapat tidak lengkap atau keliru. Sebelum menayangkan atau memonetisasi setiap film, buka halaman sumber aslinya dan periksa:
- lisensi spesifik pada item dan versi karya;
- kewajiban atribusi dan ketentuan ShareAlike/NonCommercial/NoDerivatives;
- hak musik, pemeran, gambar, merek, dan materi pihak ketiga;
- apakah pengunduhan, embedding, distribusi ulang, dan monetisasi diizinkan.

Versi awal ini menautkan ke sumber asli untuk item tanpa MP4 yang cocok. Jangan menghapus atribusi atau menganggap seluruh katalog otomatis aman untuk monetisasi.

## Catatan prototipe

- Katalog di-cache sekitar satu jam.
- Belum ada akun pengguna, daftar favorit, admin panel, database, atau monetisasi.
- Pengelompokan kategori masih heuristik berdasarkan subject dari Internet Archive.
