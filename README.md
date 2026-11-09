# ABEE SHORTS v2

Versi ini mengganti katalog otomatis Internet Archive dengan katalog film yang dimasukkan dan dikurasi admin. Database menggunakan Supabase. Pemutar mendukung YouTube embed resmi dan MP4 yang memang memiliki lisensi/izin tayang.

## A. Buat database Supabase
1. Buat akun/proyek di https://supabase.com/
2. Buka SQL Editor.
3. Jalankan seluruh isi file `supabase-schema.sql`.

## B. Siapkan Environment Variables
Di Supabase buka Project Settings > API. Salin:
- Project URL → `SUPABASE_URL`
- `service_role` key (jangan pernah dibagikan) → `SUPABASE_SERVICE_ROLE_KEY`

Buat password admin panjang sendiri → `ABEE_ADMIN_PASSWORD`.

Tambahkan ketiga nilai tersebut di Vercel:
Project → Settings → Environment Variables.
Pilih Production, Preview, Development, lalu Save.
Kemudian lakukan Redeploy.

## C. Admin
Buka `https://DOMAIN-KAMU/admin`, masukkan `ABEE_ADMIN_PASSWORD`.
Tambahkan film. Film baru berstatus `pending`.
Periksa sumber dan hak tayang terlebih dahulu, lalu klik Setujui.
Hanya film berstatus approved yang tampil di halaman publik.

## D. Aturan hak tayang
- YouTube: masukkan URL video dari kanal resmi yang memang mengizinkan embedding. Jangan mengunduh atau mengunggah ulang.
- MP4: hanya gunakan file yang dibuat sendiri atau ada izin tertulis/lisensi yang mengizinkan penggunaan di website. Periksa juga hak musik, gambar, pemeran, dan wilayah distribusi.
- Jangan menyetujui film hanya karena dapat diputar atau tombol embed tersedia.
- Catat bukti izin, pemegang hak, wilayah, masa berlaku, dan apakah penggunaan komersial diizinkan.

## Keamanan
Service role key hanya digunakan pada API server dan tidak boleh diberi awalan NEXT_PUBLIC. Admin menggunakan password server-side. Gunakan password kuat dan jangan membagikannya.
Untuk produksi dengan banyak admin, ganti password bersama ini dengan Supabase Auth dan role admin.
