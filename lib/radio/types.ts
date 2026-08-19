export type RadioModel = 'BF-888S'

export type ConnectionState = 'DISCONNECTED' | 'CABLE_CONNECTED' | 'RADIO_RESPONDING'
export type ConnectionQuality = 'EXCELLENT' | 'GOOD' | 'POOR' | 'DISCONNECTED'

export type ToneMode = 'OFF' | 'CTCSS' | 'DCS'

export interface ChannelConfig {
  channel: number
  name: string
  rxFrequencyMHz: number
  txFrequencyMHz: number
  toneMode: ToneMode
  ctcssHz?: number
  dcsCode?: string
  squelch: number
  power: 'HIGH' | 'LOW'
}

export interface RadioConfig {
  model: RadioModel
  radioId: string
  channels: ChannelConfig[]
  readAt?: string
}

export interface PortInfo {
  path: string
  manufacturer?: string
  serialNumber?: string
  vendorId?: string
  productId?: string
}

export interface LinkHealth {
  state: ConnectionState
  quality: ConnectionQuality
  port?: string
  latencyMs?: number
  dataErrors: number
  retries: number
  message: string
}

export interface RadioAdapter {
  detectPorts(): Promise<PortInfo[]>
  connect(port: string): Promise<LinkHealth>
  disconnect(): Promise<void>
  readConfiguration(): Promise<RadioConfig>
  writeConfiguration(config: RadioConfig, onProgress?: (progress: number) => void): Promise<void>
  verifyConfiguration(config: RadioConfig): Promise<boolean>
}

export const BF888S_HANDSHAKE = Buffer.from([0x06, 0x02, 0x50, 0x38, 0x38, 0x38])

export const BF888S_CAPABILITIES = {
  model: 'BF-888S',
  channels: { min: 1, max: 16 },
  frequencyMHz: { min: 400, max: 470 },
  supports: {
    gps: false,
    rssi: false,
    batteryTelemetry: false,
    networkHeartbeat: false,
    encryption: false,
  },
} as const

export function validateChannel(channel: ChannelConfig): string[] {
  const errors: string[] = []
  if (!Number.isInteger(channel.channel) || channel.channel < 1 || channel.channel > 16) errors.push('رقم القناة يجب أن يكون بين 1 و16.')
  if (channel.rxFrequencyMHz < 400 || channel.rxFrequencyMHz > 470) errors.push('تردد الاستقبال يجب أن يكون بين 400.000 و470.000 ميجاهرتز.')
  if (channel.txFrequencyMHz < 400 || channel.txFrequencyMHz > 470) errors.push('تردد الإرسال يجب أن يكون بين 400.000 و470.000 ميجاهرتز.')
  if (!Number.isInteger(channel.squelch) || channel.squelch < 0 || channel.squelch > 9) errors.push('مستوى كتم الضوضاء يجب أن يكون بين 0 و9.')
  if (channel.toneMode === 'CTCSS' && (!channel.ctcssHz || channel.ctcssHz <= 0)) errors.push('أدخل نغمة CTCSS صحيحة.')
  if (channel.toneMode === 'DCS' && !channel.dcsCode) errors.push('أدخل رمز DCS صحيحًا.')
  return errors
}

export function validateRadioConfig(config: RadioConfig, existingIds: string[] = []): string[] {
  const errors: string[] = []
  if (!config.radioId.trim()) errors.push('معرف الراديو مطلوب.')
  if (existingIds.includes(config.radioId.trim())) errors.push('معرف الراديو موجود مسبقًا.')
  if (config.channels.length > 16) errors.push('لا يمكن أن يتجاوز عدد القنوات 16 قناة لهذا الموديل.')
  for (const channel of config.channels) errors.push(...validateChannel(channel))
  return [...new Set(errors)]
}

export function qualityFromHealth(latencyMs: number, dataErrors: number, retries: number): ConnectionQuality {
  if (dataErrors > 0 || retries > 2 || latencyMs > 150) return 'POOR'
  if (latencyMs >= 50 || retries > 0) return 'GOOD'
  return 'EXCELLENT'
}
