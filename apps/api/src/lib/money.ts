/** Exact two-decimal monetary arithmetic using integer paisa. */

type MoneyInput = string | number | { toString(): string }

const MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/

function moneyText(value: MoneyInput): string {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Amount must be a valid monetary amount')
    return String(value)
  }
  return value.toString().trim()
}

export function toPaisa(value: MoneyInput): number {
  const text = moneyText(value)
  if (text.startsWith('-')) throw new Error('Amount must be non-negative')
  if (!MONEY_PATTERN.test(text)) {
    if (/^\d+\.\d{3,}$/.test(text)) throw new Error('Amount must have at most two decimal places')
    throw new Error('Amount must be a valid monetary amount')
  }

  const [whole, fractional = ''] = text.split('.')
  const paisa = Number(whole) * 100 + Number(fractional.padEnd(2, '0'))
  if (!Number.isSafeInteger(paisa)) throw new Error('Amount is too large')
  return paisa
}

export function formatPaisa(paisa: number): string {
  if (!Number.isSafeInteger(paisa) || paisa < 0) throw new Error('Paisa must be a non-negative integer')
  return `${Math.floor(paisa / 100)}.${String(paisa % 100).padStart(2, '0')}`
}

export function percentageOfPaisa(amountPaisa: number, percentage: MoneyInput): number {
  const basisPoints = toPaisa(percentage)
  return Math.round((amountPaisa * basisPoints) / 10_000)
}

export function calculateCouponDiscount({
  subtotalPaisa,
  type,
  value,
  maxDiscount,
}: {
  subtotalPaisa: number
  type: string
  value: MoneyInput
  maxDiscount: MoneyInput | null
}): number {
  if (!Number.isSafeInteger(subtotalPaisa) || subtotalPaisa < 0) {
    throw new Error('Subtotal must be a non-negative paisa amount')
  }

  const rawDiscount = type === 'PERCENTAGE'
    ? percentageOfPaisa(subtotalPaisa, value)
    : toPaisa(value)
  const cappedDiscount = maxDiscount === null
    ? rawDiscount
    : Math.min(rawDiscount, toPaisa(maxDiscount))

  return Math.min(cappedDiscount, subtotalPaisa)
}
