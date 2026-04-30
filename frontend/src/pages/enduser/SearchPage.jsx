import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import SiteLayout from '../../components/SiteLayout'
import toast from 'react-hot-toast'
import './Search.css'

const EVENT_TYPES = ['All','singer','comedy','dj','group_troup','live_band','stand_up','dance','theatre']
const FOOD_CATS  = ['All','starter','main_course','dessert','beverage','cocktail','mocktail']

const SearchPage = () => {
  const [query, setQuery]       = useState('')
  const [city, setCity]         = useState('')
  const [eventType, setEventType] = useState('All')
  const [foodCat, setFoodCat]   = useState('All')
  const [isVeg, setIsVeg]       = useState('')
  const [date, setDate]         = useState('')
  const [results, setResults]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [cities, setCities]     = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/search/cities').then(r => setCities(r.data.data)).catch(() => {})
    doSearch()
  }, [])

  const doSearch = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const p = { q: query, city, date, ...params }
      if (eventType !== 'All') p.event_type = eventType
      if (foodCat !== 'All') p.food_category = foodCat
      if (isVeg) p.is_veg = isVeg
      const { data } = await api.get('/search', { params: p })
      setResults(data.data)
    } catch { toast.error('Search failed.') }
    finally { setLoading(false) }
  }, [query, city, eventType, foodCat, isVeg, date])

  const handleSearch = e => { e.preventDefault(); doSearch() }

  const totalResults = results
    ? (results.properties?.total || 0) + (results.events?.total || 0) + (results.menu_items?.total || 0)
    : 0

  return (
    <SiteLayout>
      {/* Premium Hero Section */}
      <div className="search-hero">
        <div className="search-hero-content">
          <h1 className="search-hero-title">Discover Amazing <span className="text-gradient">Experiences</span></h1>
          <p className="search-hero-sub">Search by place, event type, or food — book in seconds</p>
          <form onSubmit={handleSearch} className="search-hero-form">
            <div className="search-hero-input">
              <span style={{ fontSize: 18 }}>🔍</span>
              <input type="text" placeholder="Search events, venues, food…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <select className="input search-city-select" value={city} onChange={e => setCity(e.target.value)}>
              <option value="">All Cities</option>
              {cities.map(c => <option key={c.city} value={c.city}>{c.city}, {c.state}</option>)}
            </select>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} style={{ maxWidth: 160 }} />
            <button type="submit" className="btn btn-primary btn-lg">Search</button>
          </form>
        </div>
      </div>

      <div className="site-container">
        {/* Filters */}
      <div className="search-filters">
        <div className="filter-section">
          <span className="filter-label">🎭 Event Type</span>
          <div className="chips-row">
            {EVENT_TYPES.map(t => (
              <button key={t} className={`chip ${eventType === t ? 'active' : ''}`} onClick={() => { setEventType(t); doSearch({ event_type: t === 'All' ? '' : t }) }}>
                {t === 'All' ? 'All' : t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-section">
          <span className="filter-label">🍽️ Food</span>
          <div className="chips-row">
            {FOOD_CATS.map(c => (
              <button key={c} className={`chip ${foodCat === c ? 'active' : ''}`} onClick={() => { setFoodCat(c); doSearch({ food_category: c === 'All' ? '' : c }) }}>
                {c === 'All' ? 'All' : c.replace('_', ' ')}
              </button>
            ))}
            <button className={`chip ${isVeg === 'true' ? 'active' : ''}`} style={{ background: isVeg === 'true' ? '#22c55e' : '' }} onClick={() => { const v = isVeg === 'true' ? '' : 'true'; setIsVeg(v); doSearch({ is_veg: v }) }}>
              🥦 Veg Only
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div className="tabs" style={{ maxWidth: 480 }}>
          {[
            { key: 'all', label: `All (${totalResults})` },
            { key: 'venues', label: `Venues (${results?.properties?.total || 0})` },
            { key: 'events', label: `Events (${results?.events?.total || 0})` },
            { key: 'food', label: `Food (${results?.menu_items?.total || 0})` },
          ].map(t => (
            <button key={t.key} className={`tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
          ))}
        </div>
        {loading && <div className="spinner" style={{ width: 24, height: 24 }} />}
      </div>

      {/* Results */}
      {loading && !results && (
        <div className="grid-auto">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 16 }} />)}</div>
      )}

      {results && (
        <>
          {/* Venues */}
          {(activeTab === 'all' || activeTab === 'venues') && results.properties?.rows?.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <div className="section-title">🏢 Venues</div>
              <div className="grid-auto">
                {results.properties.rows.map(p => (
                  <div key={p.id} className="property-card" onClick={() => navigate(`/property/${p.id}`)}>
                    {p.cover_image
                      ? <img src={p.cover_image} alt={p.name} className="property-card-img" />
                      : <div className="property-card-img-placeholder">🏢</div>}
                    <div className="property-card-body">
                      <div className="property-card-name">{p.name}</div>
                      <div className="property-card-location">📍 {p.city}, {p.state}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ color: '#f59e0b', fontSize: 13 }}>{'★'.repeat(Math.round(p.rating || 0))}{'☆'.repeat(5 - Math.round(p.rating || 0))}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({p.total_reviews})</span>
                      </div>
                      <div className="property-card-tags">
                        <span className="badge badge-primary">{p.category?.replace('_', ' ')}</span>
                        {p.tags?.slice(0,2).map(t => <span key={t} className="badge badge-muted">{t}</span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Events */}
          {(activeTab === 'all' || activeTab === 'events') && results.events?.rows?.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <div className="section-title">🎭 Events</div>
              <div className="grid-auto">
                {results.events.rows.map(ev => {
                  const avail = ev.total_capacity - ev.booked_count
                  const pct = Math.round((ev.booked_count / ev.total_capacity) * 100)
                  return (
                    <div key={ev.id} className="event-card" onClick={() => navigate(`/property/${ev.property_id}`, { state: { openEvent: ev.id } })}>
                      {ev.image ? <img src={ev.image} alt={ev.name} className="event-card-img" /> : <div className="event-card-img-placeholder">🎭</div>}
                      <div className="event-card-body">
                        <div className="flex items-center gap-2 mb-2" style={{ marginBottom: 8 }}>
                          <span className="badge badge-primary">{ev.type?.replace('_', ' ')}</span>
                          {ev.is_featured && <span className="badge badge-warning">⭐ Featured</span>}
                        </div>
                        <div className="event-card-title">{ev.name}</div>
                        {ev.performer_name && <div className="event-card-meta">🎤 {ev.performer_name}</div>}
                        <div className="event-card-meta">📅 {ev.event_date} &nbsp;🕐 {ev.start_time}</div>
                        <div className="event-card-meta">📍 {ev.property?.name}, {ev.property?.city}</div>
                        <div className="capacity-bar-wrap mt-2">
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                            <span>{avail} seats left</span><span>{pct}% booked</span>
                          </div>
                          <div className="capacity-bar-track"><div className={`capacity-bar-fill ${pct > 80 ? 'high' : pct > 50 ? 'medium' : 'low'}`} style={{ width: `${pct}%` }} /></div>
                        </div>
                        <div className="event-card-price">₹{ev.ticket_price} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>/ person</span></div>
                      </div>
                      <div className="event-card-footer">
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{avail > 0 ? `${avail} available` : '🔴 Sold Out'}</span>
                        <button className="btn btn-primary btn-sm" disabled={avail === 0}>Book Now</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Food */}
          {(activeTab === 'all' || activeTab === 'food') && results.menu_items?.rows?.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <div className="section-title">🍽️ Food & Drinks</div>
              <div className="grid-auto">
                {results.menu_items.rows.map(item => (
                  <div key={item.id} className="event-card" onClick={() => navigate(`/property/${item.property_id}`)}>
                    {item.image ? <img src={item.image} alt={item.name} className="event-card-img" /> : <div className="event-card-img-placeholder" style={{ height: 140 }}>🍽️</div>}
                    <div className="event-card-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 16 }}>{item.is_veg ? '🟢' : '🔴'}</span>
                        <span className="badge badge-muted">{item.category?.replace('_', ' ')}</span>
                      </div>
                      <div className="event-card-title">{item.name}</div>
                      {item.cuisine_type && <div className="event-card-meta">🌍 {item.cuisine_type}</div>}
                      <div className="event-card-meta">📍 {item.property?.name}, {item.property?.city}</div>
                      <div className="event-card-price">₹{item.price}</div>
                    </div>
                    <div className="event-card-footer">
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.property?.name}</span>
                      <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); navigate(`/property/${item.property_id}`) }}>View Venue</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {totalResults === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No results found</h3>
              <p>Try different search terms or remove some filters</p>
              <button className="btn btn-primary mt-3" onClick={() => { setQuery(''); setCity(''); setEventType('All'); setFoodCat('All'); doSearch({ q: '', city: '', event_type: '', food_category: '' }) }}>Clear Filters</button>
            </div>
          )}
        </>
      )}
      </div>
    </SiteLayout>
  )
}

export default SearchPage
