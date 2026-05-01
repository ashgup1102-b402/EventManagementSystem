import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const WhatsappPromo = () => {
  const [entityId, setEntityId] = useState(null)
  const [qr, setQr] = useState(null)
  const [status, setStatus] = useState('NOT_LOGGED_IN')
  const [loadingSession, setLoadingSession] = useState(false)
  const [form, setForm] = useState({ message: '', recipient_type: 'all_guests', event_id: '', send_email: false, email_subject: '' })
  const [sending, setSending] = useState(false)
  const [logs, setLogs] = useState([])
  const [events, setEvents] = useState([])

  const sessionId = entityId ? `prop_${entityId}` : null

  useEffect(() => {
    api.get('/entities/my').then(r => {
      setEntityId(r.data.data.id)
      return Promise.all([
        api.get('/whatsapp/logs', { params: { property_id: r.data.data.id } }),
        api.get('/events', { params: { property_id: r.data.data.id } })
      ])
    }).then(([l, e]) => {
      setLogs(l.data.data); setEvents(e.data.data)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (!sessionId) return
    let interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/whatsapp/qr/${sessionId}`)
        if (data.data) {
          setQr(data.data.qr)
          setStatus(data.data.status)
        }
      } catch (err) { }
    }, 3000)
    return () => clearInterval(interval)
  }, [sessionId])

  const initSession = async () => {
    setLoadingSession(true)
    try {
      await api.post('/whatsapp/init-session', { session_id: sessionId })
      toast.success('Session started. Please wait for QR.')
    } catch (err) { toast.error('Failed to init session.') }
    finally { setLoadingSession(false) }
  }

  const sendPromo = async () => {
    if (!form.message) return toast.error('Message is required.')
    if (form.send_email && !form.email_subject) return toast.error('Email subject is required.')
    if (status !== 'CONNECTED' && !form.send_email) return toast.error('WhatsApp not connected.')
    
    setSending(true)
    try {
      const { data } = await api.post('/whatsapp/send-promotion', { property_id: entityId, ...form })
      toast.success(data.message)
      setTimeout(() => api.get('/whatsapp/logs').then(r => setLogs(r.data.data)), 2000)
      setForm({ message: '', recipient_type: 'all_guests', event_id: '', send_email: false, email_subject: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Send failed.') }
    finally { setSending(false) }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <Layout>
      <div className="page-header"><div><h1>💬 Promotions (WhatsApp & Email)</h1><p>Engage with your guests and drive more bookings</p></div></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>🚀 Send Promotion</h3>
            <div className="form-grid" style={{ gap: 16 }}>
              <div className="form-grid form-grid-2">
                <div className="input-group"><label>Recipients</label><select className="input" value={form.recipient_type} onChange={set('recipient_type')}><option value="all_guests">All Past Guests</option><option value="this_month">Guests from this Month</option><option value="specific_event">Guests from specific Event</option></select></div>
                {form.recipient_type === 'specific_event' && <div className="input-group"><label>Select Event</label><select className="input" value={form.event_id} onChange={set('event_id')}><option value="">Select...</option>{events.map(e => <option key={e.id} value={e.id}>{e.name} ({e.event_date})</option>)}</select></div>}
              </div>
              <div className="input-group"><label>Message Content *</label><textarea className="input" rows={5} value={form.message} onChange={set('message')} placeholder="Hello! We have a special offer for you..." /></div>
              
              <div style={{ display:'flex', gap:12, alignItems:'center', background:'var(--bg-tertiary)', padding:12, borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontWeight:600 }}><input type="checkbox" checked={form.send_email} onChange={set('send_email')} /> 📧 Also send as Email</label>
              </div>
              {form.send_email && <div className="input-group"><label>Email Subject *</label><input className="input" value={form.email_subject} onChange={set('email_subject')} placeholder="Special Offer from Venue" /></div>}
              
              <button className="btn btn-primary btn-lg mt-3" onClick={sendPromo} disabled={sending || (status !== 'CONNECTED' && !form.send_email)}>
                {sending ? 'Sending…' : '🚀 Send Blast'}
              </button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>📋 Promotion History</h3>
            {logs.length === 0 ? <p style={{ color:'var(--text-muted)' }}>No history</p> : 
            <div className="table-wrap"><table>
              <thead><tr><th>Time</th><th>Status</th><th>Recipients</th></tr></thead>
              <tbody>{logs.map(l => (
                <tr key={l.id}>
                  <td>{new Date(l.created_at).toLocaleString()}</td>
                  <td><span className={`badge ${l.status==='SUCCESS'?'badge-success':l.status==='FAILED'?'badge-danger':'badge-muted'}`}>{l.status}</span></td>
                  <td>{l.total_recipients}</td>
                </tr>
              ))}</tbody>
            </table></div>}
          </div>
        </div>

        <div className="card" style={{ position: 'sticky', top: 20 }}>
          <h3 style={{ marginBottom: 16 }}>📱 WhatsApp Connection</h3>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <span className="badge badge-muted">Status:</span>
            <span className={`badge ${status==='CONNECTED'?'badge-success':'badge-danger'}`}>{status}</span>
          </div>

          {status === 'CONNECTED' ? (
            <div className="empty-state" style={{ padding: 20, background:'var(--bg-tertiary)', borderRadius:'var(--radius-md)' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>✅</div>
              <h4 style={{ color:'var(--success)', marginBottom:4 }}>Connected</h4>
              <p style={{ fontSize:12, color:'var(--text-muted)' }}>Your WhatsApp account is linked and ready to send messages.</p>
            </div>
          ) : (
            <div style={{ background:'var(--bg-tertiary)', padding:20, borderRadius:'var(--radius-md)', textAlign:'center' }}>
              {!qr ? (
                <>
                  <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>Link your WhatsApp to send automated promos directly to guests.</p>
                  <button className="btn btn-secondary btn-block" onClick={initSession} disabled={loadingSession}>{loadingSession ? 'Initializing…' : 'Generate QR Code'}</button>
                </>
              ) : (
                <>
                  <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:12 }}>Scan with WhatsApp on your phone:</p>
                  <img src={qr} alt="QR" style={{ width:200, height:200, margin:'0 auto 12px', background:'#fff', padding:8, borderRadius:8 }} />
                  <p style={{ fontSize:11, color:'var(--text-muted)' }}>Open WhatsApp {'>'} Linked Devices {'>'} Link a Device</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
export default WhatsappPromo
