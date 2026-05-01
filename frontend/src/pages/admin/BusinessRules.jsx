import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const BusinessRules = () => {
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
      toast.success('Business rules updated!')
    } catch (err) { toast.error('Failed to save.') }
    finally { setSaving(false) }
  }

  if (loading) return <Layout><div className="spinner" /></Layout>

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>📜 Business Rules</h1>
            <p>Configure global system behavior and policies</p>
          </div>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="form-grid">
          <div className="input-group">
            <label>Booking Commission (%)</label>
            <input type="number" className="input" value={config.default_commission || 10} onChange={e => setConfig({...config, default_commission: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Cancellation Window (Hours)</label>
            <input type="number" className="input" value={config.cancel_window || 24} onChange={e => setConfig({...config, cancel_window: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Tax Rate (%)</label>
            <input type="number" className="input" value={config.tax_rate || 5} onChange={e => setConfig({...config, tax_rate: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Currency Symbol</label>
            <input className="input" value={config.currency || '₹'} onChange={e => setConfig({...config, currency: e.target.value})} />
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default BusinessRules
