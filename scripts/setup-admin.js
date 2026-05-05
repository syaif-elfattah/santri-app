// Jalankan SEKALI setelah deploy untuk set password admin:
// node scripts/setup-admin.js
//
// Pastikan .env.local sudah diisi dengan SUPABASE_SERVICE_ROLE_KEY
// dan ADMIN_PASSWORD_AWAL

const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

async function main() {
  const { createClient } = require('@supabase/supabase-js')

  const url      = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key      = process.env.SUPABASE_SERVICE_ROLE_KEY
  const password = process.env.ADMIN_PASSWORD_AWAL || 'admin123'
  const username = 'admin'

  if (!url || !key) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diisi di .env.local')
    process.exit(1)
  }

  const db = createClient(url, key, { auth: { persistSession: false } })

  console.log('🔑 Membuat hash password...')
  const hash = await bcrypt.hash(password, 12)

  const { error } = await db
    .from('admin_config')
    .upsert({ id: 1, username, password_hash: hash })

  if (error) {
    console.error('❌ Gagal:', error.message)
    process.exit(1)
  }

  console.log('✅ Admin berhasil dikonfigurasi!')
  console.log(`   Username : ${username}`)
  console.log(`   Password : ${password}`)
  console.log('')
  console.log('⚠  Segera hapus ADMIN_PASSWORD_AWAL dari .env.local setelah ini.')
}

main()
