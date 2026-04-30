import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import SiteLayout from '../../components/SiteLayout'
import BookingFlow from './BookingFlow'
import toast from 'react-hot-toast'

const PropertyDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [events, setEvents] = useState([])
  const [menu, setMenu] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('events')
  const [booking, setBooking] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/properties/${id}`),
      api.get('/events', { params: { property_id: id } }),
      api.get('/menu', { params: { property_id: id } }),
      api.get('/slots', { params: { property_id: id } })
    ]).then(([p, e, m, s]) => {
      setProperty(p.data.data); setEvents(e.data.data); setMenu(m.data.data); setSlots(s.data.data)
    }).catch(() => toast.error('Failed to load property.')).finally(() => setLoading(false))
  }, [id])

  if (loading) return <SiteLayout><div className="loading-center"><div className="spinner" /></div></SiteLayout>
  if (!property) return <SiteLayout><div className="empty-state"><h3>Property not found</h3></div></SiteLayout>

  return (
    <SiteLayout>
      {booking && <BookingFlow property={property} bookingData={booking} onClose={() => setBooking(null)} onSuccess={() => { setBooking(null); navigate('/bookings') }} />}

      <div style={{ position:'relative', borderRadius:'var(--radius-xl)', overflow:'hidden', marginBottom:28, height:360 }}>
        {property.cover_image ? <img src={property.cover_image} alt={property.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} /> : <div style={{ height:'100%',background:'var(--gradient-hero)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:72 }}>🏢</div>}
        <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.8),transparent 60%)' }} />
        <div style={{ position:'absolute',bottom:24,left:28,right:28 }}>
          <span className="badge badge-primary" style={{ marginBottom:8 }}>{property.category?.replace('_',' ')}</span>
          <h1 style={{ fontSize:30,margin:'4px 0',textShadow:'0 2px 8px rgba(0,0,0,0.5)' }}>{property.name}</h1>
          <div style={{ fontSize:14,color:'rgba(255,255,255,0.8)' }}>📍 {property.address}, {property.city} &nbsp;·&nbsp; ★ {property.rating} ({property.total_reviews} reviews)</div>
        </div>
      </div>

      <div className="site-container">
        <div style={{ display:'grid',gridTemplateColumns:'1fr 300px',gap:32,alignItems:'start' }}>
        <div>
          <div className="tabs" style={{ marginBottom:20 }}>
            {[{k:'events',l:`🎭 Events (${events.length})`},{k:'menu',l:`🍽️ Menu (${menu.length})`},{k:'slots',l:`📅 Slots (${slots.length})`}].map(t=>(
              <button key={t.k} className={`tab-btn ${tab===t.k?'active':''}`} onClick={()=>setTab(t.k)}>{t.l}</button>
            ))}
          </div>

          {tab==='events' && (events.length===0 ? <div className="empty-state"><div className="empty-icon">🎭</div><h3>No events scheduled</h3></div> :
            <div className="grid-auto">{events.map(ev=>{
              const avail=ev.total_capacity-ev.booked_count, pct=Math.round((ev.booked_count/ev.total_capacity)*100)
              return <div key={ev.id} className="event-card">
                {ev.image?<img src={ev.image} alt={ev.name} className="event-card-img"/>:<div className="event-card-img-placeholder">🎭</div>}
                <div className="event-card-body">
                  <span className="badge badge-primary" style={{marginBottom:8}}>{ev.type?.replace('_',' ')}</span>
                  <div className="event-card-title">{ev.name}</div>
                  <div className="event-card-meta">📅 {ev.event_date} · {ev.start_time}</div>
                  <div className="capacity-bar-wrap" style={{margin:'8px 0'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-muted)',marginBottom:3}}><span>{avail} left</span><span>{pct}% booked</span></div>
                    <div className="capacity-bar-track"><div className={`capacity-bar-fill ${pct>80?'high':pct>50?'medium':'low'}`} style={{width:`${pct}%`}}/></div>
                  </div>
                  <div className="event-card-price">₹{ev.ticket_price}<span style={{fontSize:12,color:'var(--text-muted)',fontWeight:400}}>/person</span></div>
                </div>
                <div className="event-card-footer">
                  <button className="btn btn-primary btn-sm" disabled={avail===0} onClick={()=>setBooking({type:'event_ticket',item:ev})}>{avail===0?'Sold Out':'Book Tickets'}</button>
                </div>
              </div>
            })}</div>
          )}

          {tab==='menu' && (menu.length===0 ? <div className="empty-state"><div className="empty-icon">🍽️</div><h3>No menu items</h3></div> :
            <div style={{display:'flex',flexDirection:'column',gap:12}}>{menu.map(item=>(
              <div key={item.id} className="card" style={{display:'flex',gap:16,alignItems:'center',padding:14}}>
                <div style={{width:64,height:64,borderRadius:'var(--radius-md)',background:'var(--bg-tertiary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>{item.image?<img src={item.image} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'var(--radius-md)'}} alt={item.name}/>:'🍽️'}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                    <span>{item.is_veg?'🟢':'🔴'}</span>
                    <span style={{fontWeight:600}}>{item.name}</span>
                    <span className="badge badge-muted">{item.category?.replace('_',' ')}</span>
                  </div>
                  {item.description&&<div style={{fontSize:13,color:'var(--text-secondary)'}}>{item.description}</div>}
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontSize:18,fontWeight:700,color:'var(--brand-primary)'}}>₹{item.price}</div>
                  <div style={{fontSize:11,color:item.is_available?'var(--success)':'var(--danger)',marginTop:3}}>{item.is_available?'● Available':'● Unavailable'}</div>
                </div>
              </div>
            ))}</div>
          )}

          {tab==='slots' && (slots.length===0 ? <div className="empty-state"><div className="empty-icon">📅</div><h3>No slots available</h3></div> :
            <div style={{display:'flex',flexDirection:'column',gap:12}}>{slots.map(slot=>{
              const avail=slot.total_capacity-slot.booked_count, pct=Math.round((slot.booked_count/slot.total_capacity)*100)
              return <div key={slot.id} className="card" style={{display:'flex',alignItems:'center',gap:16}}>
                <div style={{fontSize:36}}>📅</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,marginBottom:4}}>{slot.slot_name}</div>
                  <div style={{fontSize:13,color:'var(--text-secondary)',marginBottom:6}}>📅 {slot.slot_date} · {slot.start_time}–{slot.end_time} · 👥 {slot.min_guests}–{slot.max_guests} guests</div>
                  <div className="capacity-bar-wrap">
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-muted)',marginBottom:3}}><span>{avail} seats left</span><span>{pct}% booked</span></div>
                    <div className="capacity-bar-track"><div className={`capacity-bar-fill ${pct>80?'high':pct>50?'medium':'low'}`} style={{width:`${pct}%`}}/></div>
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  {slot.price_per_head>0&&<div style={{fontSize:18,fontWeight:700,color:'var(--brand-primary)',marginBottom:8}}>₹{slot.price_per_head}<span style={{fontSize:11,fontWeight:400,color:'var(--text-muted)'}}>/head</span></div>}
                  <button className="btn btn-primary btn-sm" disabled={avail===0} onClick={()=>setBooking({type:'table_reservation',item:slot})}>{avail===0?'Full':'Reserve'}</button>
                </div>
              </div>
            })}</div>
          )}
        </div>

        <div style={{position:'sticky',top:20}}>
          <div className="card">
            <h3 style={{marginBottom:14}}>📍 Venue Info</h3>
            {[
              property.opening_time&&{icon:'🕐',label:'Hours',val:`${property.opening_time} – ${property.closing_time}`},
              property.phone&&{icon:'📞',label:'Phone',val:property.phone},
              property.email&&{icon:'✉️',label:'Email',val:property.email},
            ].filter(Boolean).map((row,i)=>(
              <div key={i} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:'1px solid var(--border-subtle)'}}>
                <span>{row.icon}</span>
                <div><div style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{row.label}</div><div style={{fontSize:14,marginTop:2}}>{row.val}</div></div>
              </div>
            ))}
            {property.amenities?.length>0&&<div style={{marginTop:14}}>
              <div style={{fontSize:12,fontWeight:600,color:'var(--text-muted)',marginBottom:8}}>AMENITIES</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{property.amenities.map(a=><span key={a} className="badge badge-muted">{a}</span>)}</div>
            </div>}
          </div>
        </div>
      </div>
      </div>
    </SiteLayout>
  )
}
export default PropertyDetail
