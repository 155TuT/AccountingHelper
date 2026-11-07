export function parseMoney(value: string, allowZero = false): number {
  const normalized = value.trim()
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error('请输入金额，最多保留两位小数。')
  }
  const [whole = '0', fraction = ''] = normalized.split('.')
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('金额过大，请调整后再试。')
  if (!allowZero && cents === 0n) throw new Error('金额需要大于 0。')
  return Number(cents)
}

export function formatMoney(cents: number): string {
  const absolute = Math.abs(cents)
  const whole = Math.floor(absolute / 100).toLocaleString('zh-CN')
  return `${cents < 0 ? '-' : ''}${whole}.${String(absolute % 100).padStart(2, '0')}`
}

export function formatCurrency(cents: number): string {
  return `${cents < 0 ? '-' : ''}¥${formatMoney(Math.abs(cents))}`
}
