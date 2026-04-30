import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#6c63ff', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#3b82f6'];

const Reports = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/admin')
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load reports.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>
  if (!data) return <Layout><div className="empty-state"><h3>Reports unavailable</h3></div></Layout>

  const { stats, top_properties } = data

  const propertyData = top_properties?.map(p => ({
    name: p.property?.name || 'Unknown',
    revenue: parseFloat(p.revenue) || 0,
    bookings: parseInt(p.bookings) || 0
  })) || []

  return (
    <Layout>
      <div className="page-header">
        <h1>📈 Reports & Analytics</h1>
        <p>Comprehensive portal performance data</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Property Revenue Comparison</h3>
          {propertyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={propertyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="#6060a0" fontSize={12} tickFormatter={(val) => val.substring(0, 10) + '...'} />
                <YAxis stroke="#6060a0" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1e1f35', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="#6c63ff" radius={[4, 4, 0, 0]} name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text-muted)' }}>No data available</p>}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Bookings Share</h3>
          {propertyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={propertyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="bookings"
                >
                  {propertyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e1f35', border: 'none', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text-muted)' }}>No data available</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' }}>
            {propertyData.map((p, i) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                <span>{p.name.substring(0, 10)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>🏆 Top Performing Properties</h3>
        {top_properties?.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Property Name</th>
                  <th>Total Bookings</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {top_properties.map((p, i) => (
                  <tr key={p.property_id}>
                    <td style={{ fontWeight: 800, color: 'var(--text-muted)' }}>#{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{p.property?.name}</td>
                    <td>{p.bookings}</td>
                    <td style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>₹{p.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p style={{ color: 'var(--text-muted)' }}>No data</p>}
      </div>
    </Layout>
  )
}

export default Reports
