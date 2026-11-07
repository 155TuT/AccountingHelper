/**
 * 币种列表与换算规则。
 *
 * 汇率是离线参考值，单位为“1 单位外币可兑换的人民币元 × 1,000,000”，仅用于界面展示的换算，
 * 不会联网更新；账本仍按记账时的币种和金额原样保存。
 * 金额统一按 100 分 = 1 单位保存，六种币种共用同一精度。
 */

export const CURRENCIES = [
  { code: 'CNY', name: '人民币', symbol: '¥', unit: '元', rateMicro: 1_000_000 },
  { code: 'USD', name: '美元', symbol: '$', unit: '美元', rateMicro: 7_100_000 },
  { code: 'EUR', name: '欧元', symbol: '€', unit: '欧元', rateMicro: 7_750_000 },
  { code: 'JPY', name: '日元', symbol: 'JP¥', unit: '日元', rateMicro: 48_000 },
  { code: 'HKD', name: '港币', symbol: 'HK$', unit: '港币', rateMicro: 910_000 },
  { code: 'GBP', name: '英镑', symbol: '£', unit: '英镑', rateMicro: 8_950_000 },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]['code']
export type CurrencyDefinition = (typeof CURRENCIES)[number]

export const DEFAULT_CURRENCY: CurrencyCode = 'CNY'

const BY_CODE = new Map<string, CurrencyDefinition>(
  CURRENCIES.map((currency) => [currency.code, currency]),
)

export function currencyInfo(code: CurrencyCode): CurrencyDefinition {
  const info = BY_CODE.get(code)
  if (!info) throw new Error(`不支持的币种：${String(code)}。`)
  return info
}

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && BY_CODE.has(value)
}

/** 参考换算比例，例如 `1 USD ≈ ¥7.1`；人民币自身作为基准。 */
export function rateLabel(code: CurrencyCode): string {
  if (code === DEFAULT_CURRENCY) return '基准币种'
  const rate = currencyInfo(code).rateMicro / 1_000_000
  const text = rate.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
  return `1 ${code} ≈ ${currencyInfo(DEFAULT_CURRENCY).symbol}${text}`
}

/**
 * 把某一币种的金额分换算为另一币种的金额分。
 * 用整数运算完成四舍五入，避免浮点误差；结果超出安全整数时拒绝换算。
 */
export function convertCents(cents: number, from: CurrencyCode, to: CurrencyCode): number {
  if (!Number.isSafeInteger(cents)) throw new Error('待换算金额超出精确计算范围。')
  if (from === to) return cents
  const product = BigInt(cents) * BigInt(currencyInfo(from).rateMicro)
  const divisor = BigInt(currencyInfo(to).rateMicro)
  const negative = product < 0n
  const magnitude = negative ? -product : product
  const rounded = (magnitude + divisor / 2n) / divisor
  const result = Number(negative ? -rounded : rounded)
  if (!Number.isSafeInteger(result)) throw new Error('换算后的金额超出精确计算范围，请调整账本。')
  return result
}
