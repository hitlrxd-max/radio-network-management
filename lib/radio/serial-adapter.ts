import { SerialPort } from 'serialport'
import type { LinkHealth, PortInfo, RadioAdapter, RadioConfig } from './types'
import { BF888S_HANDSHAKE, qualityFromHealth } from './types'

/**
 * Adapter محلي فقط. يجب تشغيله داخل Electron main process أو خدمة محلية موثوقة.
 * لا يتم استخدامه داخل المتصفح مباشرة لأن serialport يحتاج صلاحيات النظام.
 */
export class SerialRadioAdapter implements RadioAdapter {
  private port?: SerialPort
  private portPath?: string

  async detectPorts(): Promise<PortInfo[]> {
    const ports = await SerialPort.list()
    return ports.map((port) => ({
      path: port.path,
      manufacturer: port.manufacturer,
      serialNumber: port.serialNumber,
      vendorId: port.vendorId,
      productId: port.productId,
    }))
  }

  async connect(path: string): Promise<LinkHealth> {
    const started = performance.now()
    this.port = new SerialPort({ path, baudRate: 9600, autoOpen: false })
    await new Promise<void>((resolve, reject) => this.port!.open((error) => (error ? reject(error) : resolve())))
    this.portPath = path
    const latencyMs = Math.round(performance.now() - started)
    // المصافحة يجب أن تُطابق بروتوكول الجهاز الفعلي قبل اعتبار الراديو مستجيبًا.
    await this.write(BF888S_HANDSHAKE)
    const response = await this.readOnce(300)
    const responding = response.subarray(0, BF888S_HANDSHAKE.length).equals(BF888S_HANDSHAKE)
    if (!responding) {
      return { state: 'CABLE_CONNECTED', quality: 'DISCONNECTED', port: path, latencyMs, dataErrors: 1, retries: 0, message: 'الكابل متصل، لكن الراديو لم يستجب للمصافحة.' }
    }
    return { state: 'RADIO_RESPONDING', quality: qualityFromHealth(latencyMs, 0, 0), port: path, latencyMs, dataErrors: 0, retries: 0, message: 'الراديو استجاب للمصافحة.' }
  }

  async disconnect(): Promise<void> {
    if (this.port?.isOpen) await new Promise<void>((resolve) => this.port!.close(() => resolve()))
    this.port = undefined
    this.portPath = undefined
  }

  async readConfiguration(): Promise<RadioConfig> {
    throw new Error('لم تُنفذ قراءة EEPROM بعد. اربط أوامر بروتوكول BF-888S الموثقة هنا قبل الإنتاج.')
  }

  async writeConfiguration(): Promise<void> {
    throw new Error('لم تُنفذ كتابة EEPROM بعد. لا ترسل بيانات قبل إضافة إطار البروتوكول والتحقق منه.')
  }

  async verifyConfiguration(): Promise<boolean> {
    return false
  }

  private async write(data: Buffer): Promise<void> {
    if (!this.port?.isOpen) throw new Error('منفذ السيريال غير مفتوح.')
    await new Promise<void>((resolve, reject) => this.port!.write(data, (error) => (error ? reject(error) : resolve())))
  }

  private async readOnce(timeoutMs: number): Promise<Buffer> {
    if (!this.port) throw new Error('منفذ السيريال غير متاح.')
    return new Promise((resolve) => {
      const chunks: Buffer[] = []
      const onData = (chunk: Buffer) => chunks.push(chunk)
      const finish = () => {
        this.port?.off('data', onData)
        resolve(Buffer.concat(chunks))
      }
      this.port!.on('data', onData)
      setTimeout(finish, timeoutMs)
    })
  }
}
