import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const EntitySettings = () => {
  const [entity, setEntity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  
  // History Modal State
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const loadEntity = async () => {
    try {
      const res = await api.get('/entities/my')
      setEntity(res.data.data)
      setForm(res.data.data)
    } catch (err) {
      toast.error('Failed to load entity details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEntity()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/entities/my', form)
      toast.success('Entity settings updated successfully!')
      loadEntity()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const loadHistory = async () => {
    if (!entity) return
    setHistoryLoading(true)
    setShowHistory(true)
    try {
      const res = await api.get(`/entities/${entity.id}/history`)
      setHistory(res.data.data)
    } catch (err) {
      toast.error('Failed to load history.')
    } finally {
      setHistoryLoading(false)
    }
  }

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>
  if (!entity) return <Layout><div className="empty-state"><h3>No entity found</h3></div></Layout>

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>⚙️ Entity Settings</h1>
            <p className="text-muted">Manage your business profile and compliance details.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost" onClick={loadHistory}>📜 Change History</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 24 }}>Business Identity</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="input-group">
            <label>Entity Name (View Only)</label>
            <input className="input" value={entity.name} disabled />
          </div>
          <div className="input-group">
            <label>Entity Code (View Only)</label>
            <input className="input" value={entity.entity_code} disabled />
          </div>
          
          <div className="input-group">
            <label>Mobile Number</label>
            <input className="input" value={form.mobile_1 || ''} onChange={e => setForm({...form, mobile_1: e.target.value})} placeholder="Primary Contact" />
          </div>
          <div className="input-group">
            <label>Email ID</label>
            <input className="input" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} placeholder="Business Email" />
          </div>

          <div className="input-group">
            <label>PAN Number</label>
            <input className="input" value={form.pan_number || ''} onChange={e => setForm({...form, pan_number: e.target.value})} placeholder="10-digit PAN" />
          </div>
          <div className="input-group">
            <label>Aadhar Card Number</label>
            <input className="input" value={form.aadhar_number || ''} onChange={e => setForm({...form, aadhar_number: e.target.value})} placeholder="12-digit Aadhar" />
          </div>
          
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label>GSTIN</label>
            <input className="input" value={form.gst_number || ''} onChange={e => setForm({...form, gst_number: e.target.value})} placeholder="15-digit GST Number" />
          </div>
        </div>

        <h3 style={{ marginTop: 40, marginBottom: 24 }}>Location & Address</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label>Full Address</label>
            <textarea className="input" rows="3" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} placeholder="Building, Street, Area..." />
          </div>
          
          <div className="input-group">
            <label>Country</label>
            <input className="input" value={form.country || ''} onChange={e => setForm({...form, country: e.target.value})} />
          </div>
          <div className="input-group">
            <label>State</label>
            <input className="input" value={form.state || ''} onChange={e => setForm({...form, state: e.target.value})} />
          </div>
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label>District / City</label>
            <input className="input" value={form.city || ''} onChange={e => setForm({...form, city: e.target.value})} />
          </div>
        </div>
      </div>

      {showHistory && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: 900, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>📜 Change History - {entity.name}</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowHistory(false)}>✕ Close</button>
            </div>
            
            <div className="table-wrap" style={{ flex: 1, overflowY: 'auto' }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
              ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No changes tracked yet.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Who</th>
                      <th>When</th>
                      <th>IP</th>
                      <th>Field</th>
                      <th>Old Value</th>
                      <th>New Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i}>
                        <td>{h.user}</td>
                        <td>{new Date(h.timestamp).toLocaleString()}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{h.ip_address}</td>
                        <td><span className="badge badge-muted">{h.field}</span></td>
                        <td style={{ color: 'var(--danger)', textDecoration: 'line-through', fontSize: '13px' }}>{h.old_value}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600, fontSize: '13px' }}>{h.new_value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default EntitySettings
