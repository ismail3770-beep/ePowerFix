// Shared in-memory store for the admin security panel.
// Resets on server restart — for production, persist to the database instead.

export interface IpRule {
  id: string
  type: string
  ip: string
  reason: string
  createdAt: string
}

export const ipRules: IpRule[] = []
