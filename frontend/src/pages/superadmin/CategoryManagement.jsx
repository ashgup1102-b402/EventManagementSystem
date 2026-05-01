import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const CategoryManagement = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', status: 'Active' })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories')
      setCategories(res.data.data)
    } catch (err) { toast.error('Failed to fetch categories') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData)
        toast.success('Category updated')
      } else {
        await api.post('/categories', formData)
        toast.success('Category created')
      }
      setShowModal(false)
      setEditingCategory(null)
      setFormData({ name: '', description: '', status: 'Active' })
      fetchCategories()
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving category') }
  }

  const edit = (cat) => {
    setEditingCategory(cat)
    setFormData({ name: cat.name, description: cat.description || '', status: cat.status })
    setShowModal(true)
  }

  const remove = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return
    try {
      await api.delete(`/categories/${id}`)
      toast.success('Category deleted')
      fetchCategories()
    } catch (err) { toast.error('Failed to delete') }
  }

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>📂 Category Management</h1>
            <p>Manage entity types like Hotel, Resort, Singer, etc.</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditingCategory(null); setFormData({ name: '', description: '', status: 'Active' }); setShowModal(true); }}>
            + Add Category
          </button>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="card no-padding overflow-hidden">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td><strong>{cat.name}</strong></td>
                  <td>{cat.description || '-'}</td>
                  <td>
                    <span className={`badge ${cat.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {cat.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-sm btn-light" onClick={() => edit(cat)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(cat.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <h2>{editingCategory ? 'Edit Category' : 'Create Category'}</h2>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="input-group">
                <label>Name</label>
                <input className="input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Hotel, Resort, Singer" />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea className="input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe this category..." />
              </div>
              <div className="input-group">
                <label>Status</label>
                <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default CategoryManagement
