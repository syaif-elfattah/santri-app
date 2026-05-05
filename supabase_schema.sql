-- ============================================================
-- DATABASE SCHEMA: Sistem Prestasi & Keaktifan Santri
-- Jalankan ini di Supabase SQL Editor
-- ============================================================

-- Tabel kelas
create table if not exists kelas (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,       -- "Kelas 7A", "Kelas 7B", dst
  urutan int default 0,
  created_at timestamptz default now()
);

-- Tabel santri
create table if not exists santri (
  id uuid primary key default gen_random_uuid(),
  kelas_id uuid references kelas(id) on delete cascade,
  no_urut int not null,
  nama text not null,
  keterangan text default '',
  aktif boolean default true,
  created_at timestamptz default now(),
  unique(kelas_id, no_urut)
);

-- Tabel prestasi & keaktifan (1 baris = 1 kegiatan/prestasi)
create table if not exists prestasi (
  id uuid primary key default gen_random_uuid(),
  santri_id uuid references santri(id) on delete cascade,
  kegiatan_sekolah text default '',
  kegiatan_pondok text default '',
  prestasi_sekolah text default '',
  prestasi_pondok text default '',
  progres_pribadi text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabel admin (satu akun)
create table if not exists admin_config (
  id int primary key default 1,
  username text not null default 'admin',
  password_hash text not null,   -- bcrypt hash
  check (id = 1)                 -- hanya boleh 1 baris
);

-- ============================================================
-- DATA AWAL: 3 kelas contoh
-- ============================================================
insert into kelas (nama, urutan) values
  ('Kelas 7A', 1),
  ('Kelas 7B', 2),
  ('Kelas 7C', 3)
on conflict (nama) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- Tabel bisa dibaca siapa saja (musyrif tanpa login)
-- Tapi write dibatasi via API route yang kita kontrol sendiri
-- ============================================================
alter table kelas enable row level security;
alter table santri enable row level security;
alter table prestasi enable row level security;
alter table admin_config enable row level security;

-- Baca: semua boleh (musyrif perlu baca data santri)
create policy "Kelas: baca publik" on kelas for select using (true);
create policy "Santri: baca publik" on santri for select using (true);
create policy "Prestasi: baca publik" on prestasi for select using (true);

-- Tulis: hanya service_role (dari API route Next.js)
-- Admin_config: tidak ada akses publik sama sekali
create policy "Admin config: no public access" on admin_config for all using (false);

-- ============================================================
-- FUNGSI: update updated_at otomatis
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger prestasi_updated_at
  before update on prestasi
  for each row execute function update_updated_at();

-- ============================================================
-- VIEW: rekap santri + jumlah kegiatan (untuk dashboard)
-- ============================================================
create or replace view rekap_santri as
select
  s.id,
  s.nama,
  s.no_urut,
  s.keterangan,
  k.nama as kelas,
  count(p.id) as jumlah_entri,
  max(p.updated_at) as terakhir_update
from santri s
join kelas k on k.id = s.kelas_id
left join prestasi p on p.santri_id = s.id
where s.aktif = true
group by s.id, s.nama, s.no_urut, s.keterangan, k.nama
order by k.nama, s.no_urut;
