export function formatBDT(amount: number): string {
  return '৳ ' + amount.toLocaleString('bn-BD')
}

export function formatBDTEn(amount: number): string {
  return '৳ ' + amount.toLocaleString('en-BD')
}
