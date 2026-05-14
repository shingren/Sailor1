import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'

function ProductosPage() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    precio: '',
    estacion: 'HOT',
    activo: true
  })
  const [createError, setCreateError] = useState(null)
  const [editingPrecioId, setEditingPrecioId] = useState(null)
  const [editingPrecioValue, setEditingPrecioValue] = useState('')
  const [precioError, setPrecioError] = useState(null)
  const { isAuthenticated, getAuthHeader, hasRole } = useAuth()

  const getEstacionText = (estacion) => {
    const estacionMap = {
      HOT: '热菜',
      COLD: '冷菜',
      PASTRY: '主食'
    }

    return estacionMap[estacion] || estacion || '热菜'
  }

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }
    fetchProductos()
  }, [isAuthenticated])

  const fetchProductos = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/productos', {
        headers: {
          'Authorization': getAuthHeader()
        }
      })
      if (response.status === 401) {
        setError('未授权，请重新登录')
        return
      }
      if (!response.ok) throw new Error('加载商品失败')
      const data = await response.json()
      setProductos(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreateError(null)

    try {
      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          categoria: formData.categoria || null,
          precio: parseFloat(formData.precio),
          estacion: formData.estacion,
          activo: formData.activo
        })
      })

      if (response.status === 401) {
        setCreateError('未授权，请重新登录')
        return
      }
      if (!response.ok) throw new Error('创建商品失败')

      setFormData({
        nombre: '',
        categoria: '',
        precio: '',
        estacion: 'HOT',
        activo: true
      })
      fetchProductos()
    } catch (err) {
      setCreateError(err.message)
    }
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value
    })
  }

  const handleToggleActive = async (productoId) => {
    try {
      const response = await fetch(`/api/productos/${productoId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader()
        }
      })

      if (response.ok) {
        fetchProductos()
      } else {
        setError('修改商品状态失败')
      }
    } catch (err) {
      setError('修改商品状态失败：' + err.message)
    }
  }

  const handleStartEditPrecio = (producto) => {
    setEditingPrecioId(producto.id)
    setEditingPrecioValue(producto.precio.toString())
    setPrecioError(null)
  }

  const handleCancelEditPrecio = () => {
    setEditingPrecioId(null)
    setEditingPrecioValue('')
    setPrecioError(null)
  }

  const handleSavePrecio = async (productoId) => {
    setPrecioError(null)

    const newPrecio = parseFloat(editingPrecioValue)

    if (isNaN(newPrecio) || newPrecio <= 0) {
      setPrecioError('价格必须是大于 0 的数字')
      return
    }

    try {
      const response = await fetch(`/api/productos/${productoId}/precio`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({ precio: newPrecio })
      })

      if (response.status === 401 || response.status === 403) {
        setPrecioError('没有权限修改价格')
        return
      }

      if (response.status === 400) {
        const errorData = await response.json()
        setPrecioError(errorData.error || '价格无效')
        return
      }

      if (!response.ok) {
        setPrecioError('更新价格失败')
        return
      }

      setEditingPrecioId(null)
      setEditingPrecioValue('')
      fetchProductos()
    } catch (err) {
      setPrecioError('更新价格失败：' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>商品</h2>
          <p>请先登录后再查看此页面。</p>
          <Link to="/login" className="btn-primary">去登录</Link>
        </div>
      </div>
    )
  }

  if (loading) return <div className="loading">正在加载...</div>
  if (error) return <div className="alert alert-error">{error}</div>

  return (
    <div>
      <h1>商品</h1>

      <div className="card">
        <div className="card-header">
          <h2>创建新商品</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="nombre">
              名称：
            </label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="categoria">
              分类：
            </label>
            <input
              id="categoria"
              type="text"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="precio">
              价格：
            </label>
            <input
              id="precio"
              type="number"
              step="0.01"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="estacion">
              制作工位：
            </label>
            <select
              id="estacion"
              name="estacion"
              value={formData.estacion}
              onChange={handleChange}
            >
              <option value="HOT">热菜</option>
              <option value="COLD">冷菜</option>
              <option value="PASTRY">主食</option>
            </select>
          </div>

          <button type="submit" className="btn-primary">创建商品</button>
        </form>
        {createError && <div className="alert alert-error">{createError}</div>}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>商品列表</h2>
        </div>
        {productos.length === 0 ? (
          <p>没有找到商品</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>名称</th>
                <th>分类</th>
                <th>制作工位</th>
                <th>价格</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id}>
                  <td>{producto.id}</td>
                  <td>{producto.nombre}</td>
                  <td>{producto.categoria || '-'}</td>
                  <td>{getEstacionText(producto.estacion)}</td>
                  <td>
                    {editingPrecioId === producto.id ? (
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={editingPrecioValue}
                          onChange={(e) => setEditingPrecioValue(e.target.value)}
                          style={{ width: '100px' }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSavePrecio(producto.id)}
                          className="btn-success btn-small"
                          title="保存价格"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelEditPrecio}
                          className="btn-secondary btn-small"
                          title="取消"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span>${producto.precio.toFixed(2)}</span>
                        {hasRole('ADMIN') && (
                          <button
                            onClick={() => handleStartEditPrecio(producto)}
                            className="btn-secondary btn-small"
                            title="编辑价格"
                            style={{ padding: '2px 8px', fontSize: '0.85em' }}
                          >
                            ✎
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(producto.id)}
                      className={producto.activo ? 'btn-success btn-small' : 'btn-secondary btn-small'}
                      title={producto.activo ? '停用商品' : '启用商品'}
                    >
                      {producto.activo ? '✓ 启用' : '✗ 停用'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {precioError && (
          <div className="alert alert-error" style={{ marginTop: '10px' }}>
            {precioError}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductosPage