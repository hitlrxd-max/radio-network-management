export type AuditAction = 'اتصال' | 'قراءة إعدادات' | 'تحقق' | 'برمجة' | 'نسخ احتياطي' | 'فشل'

export interface LocalAuditEntry {
  id: string
  timestamp: string
  action: AuditAction
  radioId?: string
  port?: string
  result: 'نجاح' | 'تحذير' | 'فشل'
  details: string
}

const AUDIT_KEY = 'radiocore.audit.v1'
const BACKUP_KEY = 'radiocore.backups.v1'

export function readAuditLog(): LocalAuditEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(AUDIT_KEY) ?? '[]') as LocalAuditEntry[]
  } catch {
    return []
  }
}

export function appendAuditLog(entry: Omit<LocalAuditEntry, 'id' | 'timestamp'>): LocalAuditEntry {
  const next = { ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() }
  if (typeof window !== 'undefined') {
    const current = readAuditLog()
    window.localStorage.setItem(AUDIT_KEY, JSON.stringify([next, ...current].slice(0, 500)))
  }
  return next
}

export function saveConfigurationBackup(radioId: string, configuration: unknown): void {
  if (typeof window === 'undefined') return
  const current = JSON.parse(window.localStorage.getItem(BACKUP_KEY) ?? '{}') as Record<string, unknown[]>
  current[radioId] = [{ savedAt: new Date().toISOString(), configuration }, ...(current[radioId] ?? [])].slice(0, 10)
  window.localStorage.setItem(BACKUP_KEY, JSON.stringify(current))
}
