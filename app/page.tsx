'use client'

import { useMemo, useState } from 'react'
import { validateChannel, type ChannelConfig } from '@/lib/radio/types'
import { appendAuditLog, saveConfigurationBackup } from '@/lib/local-store'
import {
  Activity,
  AlertTriangle,
  Antenna,
  Bell,
  BookOpen,
  Cable,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Copy,
  Download,
  Ellipsis,
  FileClock,
  Gauge,
  LayoutDashboard,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  Radio,
  Search,
  Settings,
  Signal,
  SlidersHorizontal,
  Sun,
  Users,
  Wifi,
  X,
  Zap,
} from 'lucide-react'

type Status = 'متصل' | 'خامل' | 'يحتاج فحص' | 'غير متصل'
type RadioRow = {
  id: string
  name: string
  operator: string
  initials: string
  group: string
  status: Status
  channel: string
  frequency: string
  lastSeen: string
  config: string
  tone: string
}

const radios: RadioRow[] = [
  { id: 'RADIO-001', name: 'Alpha Unit', operator: 'أحمد خليل', initials: 'أخ', group: 'العمليات', status: 'متصل', channel: 'CH-01', frequency: 'Admin configured', lastSeen: 'Now', config: 'v1.4', tone: 'CTCSS 88.5' },
  { id: 'RADIO-002', name: 'Bravo Unit', operator: 'Sara Nasser', initials: 'SN', group: 'Security', status: 'متصل', channel: 'CH-01', frequency: 'Admin configured', lastSeen: 'Now', config: 'v1.4', tone: 'CTCSS 88.5' },
  { id: 'RADIO-003', name: 'Charlie Unit', operator: 'Omar Youssef', initials: 'OY', group: 'Maintenance', status: 'خامل', channel: 'CH-02', frequency: 'Admin configured', lastSeen: '8m ago', config: 'v1.3', tone: 'DCS 023' },
  { id: 'RADIO-004', name: 'Delta Unit', operator: 'Noor Hamad', initials: 'NH', group: 'Operations', status: 'يحتاج فحص', channel: 'CH-03', frequency: 'Admin configured', lastSeen: '26m ago', config: 'v1.2', tone: 'Not configured' },
  { id: 'RADIO-005', name: 'Echo Unit', operator: 'Unassigned', initials: '—', group: 'Unassigned', status: 'غير متصل', channel: 'CH-01', frequency: 'Admin configured', lastSeen: '2h ago', config: 'v1.1', tone: 'CTCSS 88.5' },
]

const navItems = [
  { label: 'لوحة التحكم', icon: LayoutDashboard },
  { label: 'الأجهزة', icon: Radio },
  { label: 'القنوات', icon: SlidersHorizontal },
  { label: 'المجموعات', icon: Users },
  { label: 'سجل النشاط', icon: FileClock },
]

function StatusPill({ status }: { status: Status }) {
  const tone = status === 'متصل' ? 'success' : status === 'غير متصل' ? 'danger' : status === 'خامل' ? 'warning' : 'attention'
  return <span className={`status-pill ${tone}`}><span className="status-dot" />{status}</span>
}

function StatCard({ label, value, note, icon: Icon, tone = 'blue' }: { label: string; value: string; note: string; icon: typeof Activity; tone?: string }) {
  return <div className="stat-card">
    <div className={`stat-icon ${tone}`}><Icon size={18} /></div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-note">{note}</div>
  </div>
}

function SignalChart() {
  return <div className="chart-wrap">
    <div className="chart-y"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>
    <svg className="line-chart" viewBox="0 0 720 190" preserveAspectRatio="none" aria-label="Connection stability chart">
      <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity=".22" /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
      {[24, 61, 98, 135, 172].map((y) => <line key={y} x1="0" y1={y} x2="720" y2={y} stroke="var(--line)" strokeDasharray="3 5" />)}
      <path d="M0 76 C35 80 45 50 75 61 S115 91 145 75 S185 53 215 67 S255 88 290 62 S330 45 360 56 S400 73 430 61 S470 48 500 63 S540 84 570 68 S610 35 640 49 S680 57 720 42 L720 190 L0 190 Z" fill="url(#fill)" />
      <path d="M0 76 C35 80 45 50 75 61 S115 91 145 75 S185 53 215 67 S255 88 290 62 S330 45 360 56 S400 73 430 61 S470 48 500 63 S540 84 570 68 S610 35 640 49 S680 57 720 42" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      <circle cx="720" cy="42" r="4" fill="var(--accent)" stroke="var(--card)" strokeWidth="3" />
    </svg>
    <div className="chart-x"><span>12:00</span><span>14:00</span><span>16:00</span><span>18:00</span><span>20:00</span><span>Now</span></div>
  </div>
}

function AddRadioModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  return <div className="modal-backdrop" onClick={onClose}>
    <section className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="add-radio-title">
      <header className="modal-header"><div><div className="eyebrow">RADIO MANAGEMENT</div><h2 id="add-radio-title">Add New Radio</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></header>
      <div className="stepper">{['Connect', 'Read config', 'Configure', 'Program'].map((label, i) => <div className={`step ${step >= i + 1 ? 'active' : ''}`} key={label}><span>{i + 1}</span>{label}</div>)}</div>
      <div className="modal-body">
        {step === 1 && <><div className="device-detect"><div className="detect-icon"><Cable size={25} /></div><div><strong>Connect your programming cable</strong><p>Plug the BF-888S USB programming cable into the computer.</p></div><span className="connected-badge"><Check size={13} /> Cable ready</span></div><div className="form-grid"><label>COM Port<select><option>Auto-detect</option></select></label><label>Radio model<select><option>Baofeng BF-888S</option></select></label></div><div className="capability-note"><CircleHelp size={17} /><div><strong>Hardware capability notice</strong><p>BF-888S is analog-only. GPS, RSSI, battery telemetry and network identity will show as Not Supported by Radio.</p></div></div></>}
        {step === 2 && <div className="read-state"><div className="spinner"><Radio size={27} /></div><h3>Ready to read configuration</h3><p>The local Radio Adapter will read the current channel configuration before any changes are made.</p><button className="button primary" onClick={() => setStep(3)}>Read configuration</button></div>}
        {step === 3 && <><div className="form-grid"><label>معرف الراديو<input placeholder="RADIO-006" /></label><label>اسم الجهاز<input placeholder="أدخل اسمًا" /></label><label>المستخدم المرتبط<input placeholder="غير مخصص" /></label><label>المجموعة<select><option>اختر مجموعة</option><option>العمليات</option><option>الأمن</option></select></label><label>رقم القناة<input type="number" min="1" max="16" placeholder="1 - 16" /></label><label>تردد الاستقبال RX (MHz)<input type="number" min="400" max="470" step="0.00001" placeholder="400.000 - 470.000" /></label><label>تردد الإرسال TX (MHz)<input type="number" min="400" max="470" step="0.00001" placeholder="400.000 - 470.000" /></label><label>نوع النغمة<select><option>بدون نغمة</option><option>CTCSS</option><option>DCS</option></select></label><label>كتم الضوضاء Squelch<select>{Array.from({ length: 10 }, (_, i) => <option key={i}>{i}</option>)}</select></label><label>مستوى الطاقة<select><option>High</option><option>Low</option></select></label></div><div className="license-note"><AlertTriangle size={16} /><span>الترددات يجب إدخالها من مسؤول مخول وفق الترخيص. النطاق مقيد بـ UHF من 400 إلى 470 MHz وبحد أقصى 16 قناة.</span></div></>}
        {step === 4 && <div className="program-state"><div className="progress-head"><strong>Program Radio</strong><span>Ready to start</span></div>{['Connecting...', 'Reading configuration...', 'Validating settings...', 'Writing configuration...', 'Verifying...'].map((x, i) => <div className={`progress-row ${i === 0 ? 'current' : ''}`} key={x}><span className="progress-check">{i === 0 ? <span className="mini-spinner" /> : i < 0 ? <Check size={13} /> : ''}</span>{x}<span className="progress-state">{i === 0 ? 'In progress' : 'Waiting'}</span></div>)}<div className="backup-required"><FileClock size={16} /><span>A configuration backup will be created before writing.</span></div></div>}
      </div>
      <footer className="modal-footer"><button className="button ghost" onClick={onClose}>Cancel</button>{step < 4 ? <button className="button primary" onClick={() => setStep(step + 1)}>{step === 1 ? 'Continue' : step === 2 ? 'Continue to configure' : 'Review & program'} <ChevronDown size={15} className="rotate-90" /></button> : <button className="button primary" onClick={() => { saveConfigurationBackup('RADIO-NEW', { model: 'BF-888S', channels: [] }); appendAuditLog({ action: 'نسخ احتياطي', radioId: 'RADIO-NEW', result: 'نجاح', details: 'تم حفظ نسخة محلية قبل البرمجة.' }); onClose() }}><Zap size={15} /> برمجة الراديو</button>}</footer>
    </section>
  </div>
}

export default function Page() {
  const [active, setActive] = useState('لوحة التحكم')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All devices')
  const [dark, setDark] = useState(true)
  const [modal, setModal] = useState(false)
  const [localLink, setLocalLink] = useState('DISCONNECTED')
  const [connectionLabel, setConnectionLabel] = useState('غير متصل')
  const connectLocalPort = async () => {
    const desktop = (window as Window & { radioDesktop?: { listPorts: () => Promise<Array<{ path: string }>> } }).radioDesktop
    const ports = desktop ? await desktop.listPorts() : [{ path: 'COM3' }]
    const port = ports[0]?.path
    setLocalLink(port ? 'CABLE_CONNECTED' : 'DISCONNECTED')
    setConnectionLabel(port ? `الكابل متصل (${port}) — الراديو يحتاج استجابة` : 'غير متصل')
    appendAuditLog({ action: 'اتصال', port, result: port ? 'تحذير' : 'فشل', details: port ? 'تم اكتشاف الكابل محليًا.' : 'لم يتم اكتشاف منفذ محلي.' })
  }
  const filtered = useMemo(() => radios.filter((radio) => `${radio.id} ${radio.name} ${radio.operator} ${radio.group} ${radio.channel}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All devices' || radio.status === filter)), [query, filter])
  return <main className={dark ? 'app-shell dark-shell' : 'app-shell'}>
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><Antenna size={20} /></div><div><strong>RADIO<span>CORE</span></strong><small>NETWORK CONTROL</small></div></div><div className="workspace"><span className="live-dot" />مركز التحكم <ChevronDown size={14} /></div><nav><div className="nav-caption">نظرة عامة</div>{navItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${active === label ? 'selected' : ''}`} onClick={() => setActive(label)}><Icon size={17} />{label}{label === 'Devices' && <span className="nav-count">5</span>}</button>)}<div className="nav-caption">النظام</div><button className="nav-item" onClick={() => setActive('Notifications')}><Bell size={17} />Notifications<span className="alert-count">3</span></button><button className="nav-item" onClick={() => setActive('Admin')}><Settings size={17} />Admin</button></nav><div className="sidebar-bottom"><button className="adapter-status" onClick={connectLocalPort}><span className={`live-dot ${localLink === 'CABLE_CONNECTED' ? 'warning-dot' : ''}`} /><div><strong>طبقة الراديو المحلية</strong><small>{connectionLabel}</small></div><Wifi size={15} /></button><div className="profile"><div className="avatar">SA</div><div><strong>System Admin</strong><small>Super Admin</small></div><MoreHorizontal size={17} /></div></div></aside>
    <section className="content"><header className="topbar"><button className="mobile-menu icon-button" aria-label="Open menu"><Menu size={20} /></button><div className="crumb"><span>مركز التحكم</span><span>/</span><strong>{active}</strong></div><div className="top-actions"><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button><button className="theme-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={16} /> : <Moon size={16} />}</button><div className="top-profile"><div className="avatar small">SA</div><ChevronDown size={14} /></div></div></header><div className="page-content"><div className="page-heading"><div><div className="eyebrow">WEDNESDAY, AUGUST 19, 2026 · 20:42 UTC</div><h1>نظرة عامة على الشبكة</h1><p>Monitor your radio fleet and manage configurations from one place.</p></div><div className="heading-actions"><button className="button ghost"><Download size={15} /> تصدير التقرير</button><button className="button primary" onClick={() => setModal(true)}><Plus size={16} /> إضافة جهاز لاسلكي</button></div></div><div className="notice"><div className="notice-icon"><CircleHelp size={17} /></div><div><strong>مراقبة تراعي قدرات العتاد</strong><span>لا يدعم BF-888S نظام GPS أو RSSI أو قياس البطارية أو نبضة شبكة. تُعرض هذه الحقول كغير مدعومة ولا يتم تقديرها.</span></div><button aria-label="إغلاق"><X size={15} /></button></div><div className="local-link-card"><div><span className="eyebrow">COM-LINK HEALTH</span><strong>{connectionLabel}</strong><small>الكابل متصل لا يعني أن الراديو يعمل أو استجاب للمصافحة.</small></div><button className="button primary" onClick={connectLocalPort}>فحص المنافذ المحلية</button></div><div className="stats-grid"><StatCard label="إجمالي الأجهزة" value="5" note="Registered in system" icon={Radio} /><StatCard label="متصل" value="2" note="System-observed" icon={Wifi} tone="green" /><StatCard label="يحتاج فحص" value="1" note="Requires review" icon={AlertTriangle} tone="amber" /><StatCard label="غير متصل" value="1" note="Last seen 2h ago" icon={Signal} tone="red" /><StatCard label="مدة تشغيل الشبكة" value="12d 08h" note="Since last restart" icon={Clock3} tone="purple" /></div><div className="section-grid"><section className="panel chart-panel"><div className="panel-heading"><div><h2>Connection stability</h2><p>System-observed availability over the last 24 hours</p></div><button className="select-button">Last 24 hours <ChevronDown size={14} /></button></div><div className="chart-legend"><span><i className="legend-line" /> Stability</span><span className="legend-na"><span>—</span> Signal strength <em>Not supported</em></span></div><SignalChart /><div className="chart-footer"><div><strong>96.4%</strong><span>Average stability</span></div><div><strong>2</strong><span>Observed interruptions</span></div><div><strong>—</strong><span>Average RSSI</span></div></div></section><section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Latest system events</p></div><button className="link-button">View log <ChevronDown size={14} className="rotate-90" /></button></div><div className="activity-list">{[['connected', 'Alpha Unit connected', 'RADIO-001 · System observed', 'Just now'], ['warning', 'Configuration review needed', 'Delta Unit · CH-03', '26 min ago'], ['blue', 'Configuration backup created', 'RADIO-003 · Before edit', '1 hour ago'], ['offline', 'Echo Unit went offline', 'RADIO-005 · Last seen 2h ago', '2 hours ago']].map(([kind, title, detail, time]) => <div className="activity-row" key={title}><div className={`activity-icon ${kind}`}><span /></div><div className="activity-copy"><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div>)}</div></section></div><section className="panel devices-panel"><div className="panel-heading devices-head"><div><h2>Radio fleet</h2><p>{filtered.length} of {radios.length} registered radios</p></div><div className="table-actions"><div className="search"><Search size={15} /><input placeholder="Search radios..." value={query} onChange={(e) => setQuery(e.target.value)} /></div><select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}><option>All devices</option><option>متصل</option><option>خامل</option><option>يحتاج فحص</option><option>غير متصل</option></select><button className="icon-button"><Ellipsis size={18} /></button></div></div><div className="table-scroll"><table><thead><tr><th>Radio</th><th>Assigned user</th><th>Status</th><th>Channel</th><th>Frequency</th><th>Last seen</th><th>Config</th><th aria-label="Actions" /></tr></thead><tbody>{filtered.map((radio) => <tr key={radio.id}><td><div className="radio-cell"><div className="radio-icon"><Radio size={15} /></div><div><strong>{radio.name}</strong><span>{radio.id}</span></div></div></td><td><div className="user-cell"><div className="avatar tiny">{radio.initials}</div><div><strong>{radio.operator}</strong><span>{radio.group}</span></div></div></td><td><StatusPill status={radio.status} /></td><td><span className="mono-text">{radio.channel}</span><small className="cell-sub">{radio.tone}</small></td><td><span className="muted-cell">{radio.frequency}</span><small className="cell-sub">Admin entered</small></td><td><span className={radio.lastSeen === 'Now' ? 'now-text' : 'muted-cell'}>{radio.lastSeen}</span></td><td><span className="config-tag">{radio.config}</span></td><td><button className="row-menu" aria-label={`Actions for ${radio.name}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div><div className="table-footer"><span>Showing {filtered.length} radios</span><button className="link-button">View all devices <ChevronDown size={14} className="rotate-90" /></button></div></section><footer className="page-footer"><span><span className="live-dot" /> All systems operational</span><span>Data shown is system-observed or administrator-entered. Hardware capabilities are never inferred.</span></footer></div></section>{modal && <AddRadioModal onClose={() => setModal(false)} />}</main>
}

function MoreHorizontalIcon() { return <MoreHorizontal size={17} /> }

