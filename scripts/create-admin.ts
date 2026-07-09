import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  // Credentials are read from environment variables so that no real
  // password is ever committed to the repository. Set ADMIN_EMAIL and
  // ADMIN_PASSWORD in your .env file before running this script.
  const email = process.env.ADMIN_EMAIL || 'admin@epowerfix.com'
  const password = process.env.ADMIN_PASSWORD || 'change-me-on-first-login'
  const name = process.env.ADMIN_NAME || 'ePowerFix Admin'
  const phone = process.env.ADMIN_PHONE || '01700000000'

  // Check if exists
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    // Update password + ensure ADMIN role
    const hashed = await bcrypt.hash(password, 10)
    await db.user.update({
      where: { email },
      data: { password: hashed, role: 'ADMIN', isActive: true, name },
    })
    console.log('✓ Admin user updated:', email)
    return
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await db.user.create({
    data: {
      name,
      email,
      phone,
      password: hashed,
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
    },
  })
  console.log('✓ Admin user created:')
  console.log('  Email:    ', user.email)
  console.log('  Password: ', password)
  console.log('  Role:     ', user.role)
  console.log('  ID:       ', user.id)
}

main().catch(console.error).finally(() => process.exit(0))
