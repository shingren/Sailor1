import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

function MesasPage() {
  const [mesas, setMesas] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    codigo: '',
    capacidad: '',
    estado: 'disponible',
    locationId: ''
  })
  const [newLocationName, setNewLocationName] = useState('')
  const [createError, setCreateError] = useState(null)
  const [success, setSuccess] = useState(null)
  const { isAuthenticated, getAuthHeader } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }
    fetchMesas()
    fetchLocations()
  }, [isAuthenticated])

  const fetchMesas = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/mesas', {
        headers: {
          'Authorization': getAuthHeader()
        }
      })
      if (response.status === 401) {
        setError('未授权，请重新登录')
        return
      }
      if (!response.ok) throw new Error('加载餐桌失败')
      const data = await response.json()
      setMesas(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async () => {
    setLoadingLocations(true)
    try {
      const response = await fetch('/api/locations', {
        headers: {
          'Authorization': getAuthHeader()
        }
      })
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (err) {
      console.error('获取区域失败:', err)
    } finally {
      setLoadingLocations(false)
    }
  }

  const handleCreateLocation = async (e) => {
    e.preventDefault()
    if (!newLocationName.trim()) return

    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({ name: newLocationName })
      })

      if (response.ok) {
        setNewLocationName('')
        fetchLocations()
        setSuccess(`区域 "${newLocationName}" 创建成功!`)
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setCreateError('无法创建区域，可能已经存在')
      }
    } catch (err) {
      setCreateError('创建区域失败：' + err.message)
    }
  }

  const handleDeleteLocation = async (locationId) => {
    if (!confirm('确定要删除这个区域吗？')) return

    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': getAuthHeader()
        }
      })

      if (response.ok) {
        fetchLocations()
        setSuccess('区域删除成功！')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('删除区域失败：' + err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreateError(null)
    setSuccess(null)

    try {
      const mesaData = {
        codigo: formData.codigo,
        capacidad: parseInt(formData.capacidad),
        estado: formData.estado
      }

      // Add location if selected
      if (formData.locationId) {
        mesaData.location = { id: parseInt(formData.locationId) }
      }

      const response = await fetch('/api/mesas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(mesaData)
      })

      if (response.status === 401) {
        setCreateError('No autorizado - por favor inicia sesión nuevamente')
        return
      }
      if (!response.ok) throw new Error('创建餐桌失败')

      setSuccess(`餐桌 "${formData.codigo}" 创建成功！`)
      setFormData({ codigo: '', capacidad: '', estado: 'disponible', locationId: '' })
      fetchMesas()
    } catch (err) {
      setCreateError(err.message)
    }
  }

  const handleStatusChange = async (mesaId, newStatus) => {
    try {
      const response = await fetch(`/api/mesas/${mesaId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({ estado: newStatus })
      })

      if (response.ok) {
        fetchMesas()
      }
    } catch (err) {
      setError('更新状态失败：' + err.message)
    }
  }

  const handleLocationChange = async (mesaId, locationId) => {
    try {
      const response = await fetch(`/api/mesas/${mesaId}/location?locationId=${locationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader()
        }
      })

      if (response.ok) {
        fetchMesas()
      }
    } catch (err) {
      setError('更新区域失败：' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>需要登录</h2>
          <p>请先登录后再查看此页面。</p>
          <Link to="/login" className="btn-primary">去登录</Link>
        </div>
      </div>
    )
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (loading) return <div className="loading">正在加载餐桌...</div>
  if (error) return <div className="alert alert-error">Error: {error}</div>

  // Calculate summary statistics
  const totalMesas = mesas.length
  const mesasDisponibles = mesas.filter(m => m.estado === 'disponible').length
  const mesasOcupadas = mesas.filter(m => m.estado === 'ocupada' || m.estado === 'OCUPADA').length
  const mesasReservadas = mesas.filter(m => m.estado === 'reservada').length

  return (
    <div>
      <h1>餐桌</h1>

      {/* Summary Stats Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">餐桌总数</div>
          <div className="stat-value stat-value-primary">{totalMesas}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">空闲餐桌</div>
          <div className="stat-value stat-value-success">{mesasDisponibles}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已占用</div>
          <div className="stat-value stat-value-danger">{mesasOcupadas}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已预订</div>
          <div className="stat-value stat-value-warning">{mesasReservadas}</div>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {createError && <div className="alert alert-error">{createError}</div>}

      {/* Location Management */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">管理区域</h2>
        </div>
        <form onSubmit={handleCreateLocation} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="newLocation">创建新区域：</label>
              <input
                id="newLocation"
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="例如: 大厅, 露台, 包间"
              />
            </div>
            <button type="submit" className="btn-primary">创建区域</button>
          </div>
        </form>

        {loadingLocations ? (
          <div className="loading">正在加载区域...</div>
        ) : (
          <div>
            <strong>现有区域：</strong>
            {locations.length === 0 ? (
              <p className="text-muted">还没有创建区域</p>
            ) : (
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                {locations.map(location => (
                  <div key={location.id} style={{ padding: '8px 12px', backgroundColor: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span><strong>{location.name}</strong></span>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="btn-danger btn-small"
                      style={{ padding: '2px 8px', fontSize: '12px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Mesa */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">创建新餐桌</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="codigo">编号</label>
              <input
                id="codigo"
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                placeholder="例如:A1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="capacidad">容量</label>
              <input
                id="capacidad"
                type="number"
                name="capacidad"
                value={formData.capacidad}
                onChange={handleChange}
                placeholder="例如: 4"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="estado">状态</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
              >
                <option value="disponible">空闲</option>
                <option value="ocupada">已占用</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="locationId">区域</label>
              <select
                id="locationId"
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
              >
                <option value="">-- 选择区域 --</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary">创建餐桌</button>
        </form>
      </div>

      {/* Mesas List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">餐桌列表</h2>
        </div>

        {mesas.length === 0 ? (
          <p className="text-muted">还没有登记餐桌</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>编号</th>
                <th>容量</th>
                <th>状态</th>
                <th>区域</th>
              </tr>
            </thead>
            <tbody>
              {mesas.map((mesa) => (
                <tr key={mesa.id}>
                  <td>{mesa.id}</td>
                  <td><strong>{mesa.codigo}</strong></td>
                  <td>{mesa.capacidad} 人</td>
                  <td>
                    <select
                      value={mesa.estado}
                      onChange={(e) => handleStatusChange(mesa.id, e.target.value)}
                      className={`badge ${
                        mesa.estado === 'disponible' ? 'badge-green' :
                        mesa.estado === 'ocupada' ? 'badge-red' :
                        'badge-yellow'
                      }`}
                      style={{ border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      <option value="disponible">空闲</option>
                      <option value="ocupada">已占用</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={mesa.location?.id || ''}
                      onChange={(e) => handleLocationChange(mesa.id, e.target.value)}
                      style={{ padding: '4px 8px' }}
                    >
                      <option value="">-- 无区域 --</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default MesasPage
