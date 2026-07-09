import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  const email = 'admin@epowerfix.com'
  const password = 'admin123'
  const name = 'ePowerFix Admin'
  const phone = '01700000000'

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
