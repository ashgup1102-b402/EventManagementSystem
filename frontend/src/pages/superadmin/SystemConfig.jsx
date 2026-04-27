import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const SystemConfig = () => {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    api.get('/config').then(r => { setConfig(r.data.data); setForm(r.data.data) }).catch(() => toast.error('Failed to load config.')).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.put('/config', form)
      toast.success('Configuration saved successfully!')
      setConfig(form)
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed.') }
    finally { setSaving(false) }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>

  return (
    <Layout>
      <div className="page-header"><div className="page-header-row"><div><h1>⚙️ System Configuration</h1><p>Global settings for EventPortal</p></div><button className="btn btn-primary btn-lg" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button></div></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* General */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>General Settings</h3>
          <div className="form-grid">
            <div className="input-group"><label>Site Name</label><input className="input" value={form.site_name||''} onChange={set('site_name')} /></div>
            <div className="input-group"><label>Site Tagline</label><input className="input" value={form.site_tagline||''} onChange={set('site_tagline')} /></div>
            <div className="input-group"><label>Cancellation Policy</label><textarea className="input" rows={3} value={form.cancellation_policy||''} onChange={set('cancellation_policy')} /></div>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginTop:12, padding:12, background:'rgba(239,68,68,0.1)', borderRadius:'var(--radius-md)', color:'var(--danger)', fontWeight:600 }}><input type="checkbox" checked={form.maintenance_mode} onChange={set('maintenance_mode')} /> 🚧 Enable Maintenance Mode</label>
          </div>
        </div>

        {/* Business Logic */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Business Rules</h3>
          <div className="form-grid">
            <div className="input-group"><label>Default Portal Commission (%)</label><input className="input" type="number" step="0.1" value={form.portal_default_commission_percent||''} onChange={set('portal_default_commission_percent')} /></div>
            <div className="input-group"><label>WhatsApp Mode</label><select className="input" value={form.whatsapp_mode||''} onChange={set('whatsapp_mode')}><option value="property">Option A: Property specific connection</option><option value="portal">Option B: Central Portal connection</option></select><div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{form.whatsapp_mode==='property'?'Properties manage their own WA numbers':'All messages go through Portal WA number'}</div></div>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginTop:12 }}><input type="checkbox" checked={form.payment_enabled} onChange={set('payment_enabled')} /> Enable Payment Gateway Integration (Stripe/Razorpay)</label>
            {form.payment_enabled && <div className="input-group mt-2"><label>Payment Secret Key</label><input className="input" type="password" value={form.payment_secret||''} onChange={set('payment_secret')} /></div>}
          </div>
        </div>

        {/* Email SMTP */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>SMTP / Email Settings</h3>
          <div className="form-grid form-grid-2">
            <div className="input-group"><label>SMTP Host</label><input className="input" value={form.smtp_host||''} onChange={set('smtp_host')} /></div>
            <div className="input-group"><label>SMTP Port</label><input className="input" type="number" value={form.smtp_port||''} onChange={set('smtp_port')} /></div>
            <div className="input-group"><label>SMTP User (Email)</label><input className="input" value={form.smtp_user||''} onChange={set('smtp_user')} /></div>
            <div className="input-group"><label>SMTP Password</label><input className="input" type="password" value={form.smtp_pass||''} onChange={set('smtp_pass')} /></div>
            <div className="input-group"><label>From Name</label><input className="input" value={form.from_name||''} onChange={set('from_name')} /></div>
            <div className="input-group"><label>From Email</label><input className="input" value={form.from_email||''} onChange={set('from_email')} /></div>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', gridColumn:'span 2' }}><input type="checkbox" checked={form.smtp_secure} onChange={set('smtp_secure')} /> Use SSL/TLS Secure Connection</label>
          </div>
        </div>
      </div>
    </Layout>
  )
}
export default SystemConfig
