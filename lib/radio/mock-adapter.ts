import {
  BF888S_CAPABILITIES,
  type LinkHealth,
  type PortInfo,
  type RadioAdapter,
  type RadioConfig,
  qualityFromHealth,
} from './types'

const demoConfig: RadioConfig = {
  model: 'BF-888S',
  radioId: 'RADIO-001',
  channels: [
    {
      channel: 1,
      name: 'قناة الإدارة',
      rxFrequencyMHz: 446.00625,
      txFrequencyMHz: 446.00625,
      toneMode: 'CTCSS',
      ctcssHz: 88.5,
      squelch: 5,
      power: 'LOW',
    },
  ],
}

export class MockRadioAdapter implements RadioAdapter {
  private connected = false
  private port?: string

  async detectPorts(): Promise<PortInfo[]> {
    return [{ path: 'COM3', manufacturer: 'محاكي كابل BF-888S', vendorId: 'DEMO', productId: '888S' }]
  }

  async connect(port: string): Promise<LinkHealth> {
    this.port = port
    await new Promise((resolve) => setTimeout(resolve, 180))
    this.connected = true
    const latencyMs = 18
    return {
      state: 'RADIO_RESPONDING',
      quality: qualityFromHealth(latencyMs, 0, 0),
      port,
      latencyMs,
      dataErrors: 0,
      retries: 0,
      message: 'استجاب الراديو للمصافحة المحلية التجريبية.',
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.port = undefined
  }

  async readConfiguration(): Promise<RadioConfig> {
    if (!this.connected) throw new Error('الراديو غير متصل.')
    await new Promise((resolve) => setTimeout(resolve, 650))
    return { ...demoConfig, readAt: new Date().toISOString() }
  }

  async writeConfiguration(config: RadioConfig, onProgress?: (progress: number) => void): Promise<void> {
    if (!this.connected) throw new Error('الراديو غير متصل.')
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 70))
      onProgress?.(progress)
    }
  }

  async verifyConfiguration(): Promise<boolean> {
    if (!this.connected) return false
    await new Promise((resolve) => setTimeout(resolve, 220))
    return true
  }
}

export { BF888S_CAPABILITIES }
