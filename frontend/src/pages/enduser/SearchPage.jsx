import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import SiteLayout from '../../components/SiteLayout'
import MultiSelect from '../../components/MultiSelect'
import toast from 'react-hot-toast'
import './Search.css'

const SearchPage = () => {
  const BASE_URL = 'http://localhost:5000';
  const getImgUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:5000${cleanPath}`;
  }
  const [query, setQuery]       = useState('')
  const [city, setCity]         = useState('')
  const [date, setDate]         = useState('')
  const [isVeg, setIsVeg]       = useState('')
  
  // Master Data Filters
  const [masterFilters, setMasterFilters] = useState({
    event_types: [],
    performers: [],
    menu_categories: [],
    cuisine_types: []
  })

  // Selected Filter IDs
  const [selectedEventTypes, setSelectedEventTypes]   = useState([])
  const [selectedPerformers, setSelectedPerformers]   = useState([])
  const [selectedMenuCats, setSelectedMenuCats]       = useState([])
  const [selectedCuisineTypes, setSelectedCuisineTypes] = useState([])

  const [results, setResults]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [cities, setCities]     = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch Cities and Master Filters
    api.get('/search/filters').then(r => {
      setMasterFilters({
        event_types: r.data.data.event_types,
        performers: r.data.data.performers,
        menu_categories: r.data.data.menu_categories,
        cuisine_types: r.data.data.cuisine_types
      })
      setCities(r.data.data.cities)
    }).catch(() => toast.error('Failed to load filters'))
  }, [])

  // Centralized search logic
  const doSearch = useCallback(async (currentFilters) => {
    setLoading(true)
    try {
      const p = { ...currentFilters }
      // Clean up empty filters
      if (p.is_veg === '') delete p.is_veg
      
      const { data } = await api.get('/search', { params: p })
      setResults(data.data)
    } catch { toast.error('Search failed.') }
    finally { setLoading(false) }
  }, [])

  const triggerSearch = useCallback(() => {
    doSearch({ 
      q: query, 
      city, 
      date, 
      event_type_ids: selectedEventTypes,
      performer_ids: selectedPerformers,
      menu_category_ids: selectedMenuCats,
      cuisine_type_ids: selectedCuisineTypes,
      is_veg: isVeg 
    })
  }, [query, city, date, selectedEventTypes, selectedPerformers, selectedMenuCats, selectedCuisineTypes, isVeg, doSearch])

  // Reactive Effect: Trigger search whenever filters change (with debounce for query)
  useEffect(() => {
    const timer = setTimeout(triggerSearch, 400)
    return () => clearTimeout(timer)
  }, [triggerSearch])

  const handleSearch = e => { 
    e.preventDefault()
    triggerSearch()
  }

  const totalResults = results
    ? (results.properties?.total || 0) + (results.events?.total || 0) + (results.menu_items?.total || 0)
    : 0

  const resetFilters = () => {
    setQuery('');
    setCity('');
    setDate('');
    setIsVeg('');
    setSelectedEventTypes([]);
    setSelectedPerformers([]);
    setSelectedMenuCats([]);
    setSelectedCuisineTypes([]);
  }

  return (
    <SiteLayout>
      {/* Ultra-Compact Hero Section */}
      <div className="search-hero">
        <div className="search-hero-content">
          <h1 className="search-hero-title">Discover <span className="text-gradient">Experiences</span></h1>
          <p className="search-hero-sub">Search place, event, performer or food</p>
          <form onSubmit={handleSearch} className="search-hero-form">
            <div className="search-hero-input">
              <span>🔍</span>
              <input type="text" placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <select className="input search-city-select" value={city} onChange={e => setCity(e.target.value)}>
              <option value="">All Cities</option>
              {cities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
            </select>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
        </div>
      </div>

      <div className="site-container">
        {/* Category Explorer */}
        <div className="category-explorer" style={{ marginTop: -10, marginBottom: 30, position: 'relative', zIndex: 10 }}>
           <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '10px 4px', scrollbarWidth: 'none' }}>
              {masterFilters.event_types?.filter(et => et.status === 'Active').map(et => (
                <div 
                  key={et.id} 
                  className={`category-item ${selectedEventTypes.includes(et.id) ? 'active' : ''}`}
                  onClick={() => setSelectedEventTypes(prev => prev.includes(et.id) ? prev.filter(x => x !== et.id) : [...prev, et.id])}
                  style={{ 
                    flex: '0 0 auto', textAlign: 'center', cursor: 'pointer', 
                    background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 16,
                    border: `1px solid ${selectedEventTypes.includes(et.id) ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                    boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s ease', minWidth: 100
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-tertiary)', margin: '0 auto 8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {et.image ? <img src={getImgUrl(et.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>🎭</span>}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{et.name}</div>
                </div>
              ))}
              {masterFilters.menu_categories?.filter(m => m.status === 'Active').map(m => (
                <div 
                  key={m.id} 
                  className={`category-item ${selectedMenuCats.includes(m.id) ? 'active' : ''}`}
                  onClick={() => setSelectedMenuCats(prev => prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id])}
                  style={{ 
                    flex: '0 0 auto', textAlign: 'center', cursor: 'pointer', 
                    background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 16,
                    border: `1px solid ${selectedMenuCats.includes(m.id) ? 'var(--brand-secondary)' : 'var(--border-subtle)'}`,
                    boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s ease', minWidth: 100
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-tertiary)', margin: '0 auto 8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.image ? <img src={getImgUrl(m.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>🍽️</span>}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</div>
                </div>
              ))}
           </div>
        </div>
        {/* Compact Advanced Filters */}
        <div className="search-filters">
          <div className="filter-row">
            <MultiSelect 
              options={masterFilters.event_types} 
              selected={selectedEventTypes} 
              onChange={setSelectedEventTypes} 
              placeholder="Event Types"
            />
            <MultiSelect 
              options={masterFilters.performers} 
              selected={selectedPerformers} 
              onChange={setSelectedPerformers} 
              placeholder="Performers"
            />
            <MultiSelect 
              options={masterFilters.menu_categories} 
              selected={selectedMenuCats} 
              onChange={setSelectedMenuCats} 
              placeholder="Categories"
            />
            <MultiSelect 
              options={masterFilters.cuisine_types} 
              selected={selectedCuisineTypes} 
              onChange={setSelectedCuisineTypes} 
              placeholder="Cuisines"
            />
            <button 
              className={`veg-chip-compact ${isVeg === 'true' ? 'active' : ''}`} 
              onClick={() => setIsVeg(isVeg === 'true' ? '' : 'true')}
            >
              🥦 Veg
            </button>
            <button className="text-btn clear-all-btn" onClick={resetFilters}>
              ✕ Clear All
            </button>
          </div>
        </div>

        {/* Full Width Tabs */}
        <div className="tabs-full">
          {[
            { key: 'all', label: `All (${totalResults})` },
            { key: 'venues', label: `Venues (${results?.properties?.total || 0})` },
            { key: 'events', label: `Events (${results?.events?.total || 0})` },
            { key: 'food', label: `Food (${results?.menu_items?.total || 0})` },
          ].map(t => (
            <button key={t.key} className={`tab-btn-full ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
          ))}
          {loading && <div className="spinner" style={{ width: 16, height: 16, margin: 'auto 8px' }} />}
        </div>

        {/* Results */}
        {loading && !results && (
          <div className="grid-auto">{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 240, borderRadius: 12 }} />)}</div>
        )}


        {results && (
          <>
            {/* Venues */}
            {(activeTab === 'all' || activeTab === 'venues') && results.properties?.rows?.length > 0 && (
              <section style={{ marginBottom: 36 }}>
                <div className="section-title">🏢 Venues</div>
                <div className="grid-auto">
                  {results.properties.rows.map(p => (
                    <div key={p.id} className="property-card" onClick={() => navigate(`/entity/${p.id}`)}>
                      <div className="property-card-img-wrap">
                        {p.cover_image
                          ? <img src={getImgUrl(p.cover_image)} alt={p.name} className="property-card-img" />
                          : <div className="property-card-img-placeholder">🏢</div>}
                      </div>
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
                      <div key={ev.id} className="event-card" onClick={() => navigate(`/entity/${ev.property_id}`, { state: { openEvent: ev.id } })}>
                        <div className="event-card-img-wrap">
                          {ev.image ? <img src={getImgUrl(ev.image)} alt={ev.name} className="event-card-img" /> : <div className="event-card-img-placeholder">🎭</div>}
                        </div>
                        <div className="event-card-body">
                          <div className="flex items-center gap-2 mb-2" style={{ marginBottom: 8 }}>
                            <span className="badge badge-primary">{ev.type?.replace('_', ' ')}</span>
                            {ev.is_featured && <span className="badge badge-warning">⭐ Featured</span>}
                          </div>
                          <div className="event-card-title">{ev.name}</div>
                          {ev.performer_name && <div className="event-card-meta">🎤 {ev.performer_name}</div>}
                          <div className="event-card-meta">📅 {ev.event_date} &nbsp;🕐 {ev.start_time}</div>
                          <div className="event-card-meta">📍 {ev.entity?.name}, {ev.entity?.city}</div>
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
                    <div key={item.id} className="event-card" onClick={() => navigate(`/entity/${item.property_id}`)}>
                      <div className="event-card-img-wrap">
                        {item.image ? <img src={getImgUrl(item.image)} alt={item.name} className="event-card-img" /> : <div className="event-card-img-placeholder" style={{ height: 140 }}>🍽️</div>}
                      </div>
                      <div className="event-card-body">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 16 }}>{item.is_veg ? '🟢' : '🔴'}</span>
                          <span className="badge badge-muted">{item.category?.replace('_', ' ')}</span>
                        </div>
                        <div className="event-card-title">{item.name}</div>
                        {item.cuisine_type && <div className="event-card-meta">🌍 {item.cuisine_type}</div>}
                        <div className="event-card-meta">📍 {item.entity?.name}, {item.entity?.city}</div>
                        <div className="event-card-price">₹{item.price}</div>
                      </div>
                      <div className="event-card-footer">
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.entity?.name}</span>
                        <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); navigate(`/entity/${item.property_id}`) }}>View Venue</button>
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
                <button className="btn btn-primary mt-3" onClick={resetFilters}>Clear Filters</button>
              </div>
            )}
          </>
        )}
      </div>
    </SiteLayout>
  )
}

export default SearchPage
