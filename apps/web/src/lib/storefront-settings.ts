import { db } from './db'

export async function getStorefrontSettings() {
  const settings = await db.setting.findMany({ where: { group: 'storefront' } })
  const settingsObj: Record<string, any> = {}
  for (const s of settings) {
    try {
      settingsObj[s.key] = JSON.parse(s.value)
    } catch (e) {
      settingsObj[s.key] = s.value
    }
  }
  return settingsObj
}
