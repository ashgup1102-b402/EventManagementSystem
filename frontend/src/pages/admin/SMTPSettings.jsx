import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const SMTPSettings = () => {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/config').then(r => setConfig(r.data.data)).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.put('/config', config)
      toast.success('SMTP settings updated!')
    } catch (err) { toast.error('Failed to save.') }
    finally { setSaving(false) }
  }

  if (loading) return <Layout><div className="spinner" /></Layout>

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>📧 SMTP Settings</h1>
            <p>Configure email delivery service</p>
          </div>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="form-grid">
          <div className="input-group">
            <label>SMTP Host</label>
            <input className="input" placeholder="smtp.mailtrap.io" value={config.smtp_host || ''} onChange={e => setConfig({...config, smtp_host: e.target.value})} />
          </div>
          <div className="form-grid form-grid-2">
            <div className="input-group">
              <label>Port</label>
              <input className="input" type="number" placeholder="2525" value={config.smtp_port || ''} onChange={e => setConfig({...config, smtp_port: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Encryption</label>
              <select className="input" value={config.smtp_encryption || 'tls'} onChange={e => setConfig({...config, smtp_encryption: e.target.value})}>
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <label>SMTP Username</label>
            <input className="input" value={config.smtp_user || ''} onChange={e => setConfig({...config, smtp_user: e.target.value})} />
          </div>
          <div className="input-group">
            <label>SMTP Password</label>
            <input className="input" type="password" value={config.smtp_pass || ''} onChange={e => setConfig({...config, smtp_pass: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Sender Email (From)</label>
            <input className="input" type="email" placeholder="noreply@eventportal.com" value={config.smtp_from || ''} onChange={e => setConfig({...config, smtp_from: e.target.value})} />
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SMTPSettings
