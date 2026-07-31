import { db } from './db'

export async function getStorefrontSettings() {
  const settingsObj: Record<string, any> = {}
  try {
    const settings = await db.setting.findMany({ where: { group: 'storefront' } })
    for (const s of settings) {
      try {
        settingsObj[s.key] = JSON.parse(s.value)
      } catch (e) {
        settingsObj[s.key] = s.value
      }
    }
  } catch {
    // DB unreachable (or stale generated client) during build-time prerender.
    // Fall back to empty settings so every section renders with default toggles
    // instead of crashing the whole production build.
  }
  return settingsObj
}
