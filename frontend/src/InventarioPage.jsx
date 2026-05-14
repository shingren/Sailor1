import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Link } from 'react-router-dom'

function InventarioPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()

  const [insumos, setInsumos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [recetas, setRecetas] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newInsumo, setNewInsumo] = useState({
    nombre: '',
    unidad: '',
    stockActual: 0,
    stockMinimo: 0
  })

  const [newMovimiento, setNewMovimiento] = useState({
    insumoId: '',
    cantidad: 0,
    tipo: 'COMPRA',
    descripcion: ''
  })

  const [newReceta, setNewReceta] = useState({
    productoId: '',
    items: [{ insumoId: '', cantidadNecesaria: 0 }],
    extras: []
  })

  // 原料编辑状态
  const [editingInsumoId, setEditingInsumoId] = useState(null)
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    unidad: '',
    stockMinimo: 0
  })

  // 配方编辑状态
  const [editingRecetaId, setEditingRecetaId] = useState(null)
  const [editRecetaData, setEditRecetaData] = useState({
    items: [],
    extras: []
  })

  const getTipoMovimientoText = (tipo) => {
    const tipoMap = {
      COMPRA: '采购',
      AJUSTE: '调整',
      USO: '使用'
    }

    return tipoMap[tipo] || tipo || '-'
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [insumosRes, movimientosRes, recetasRes, productosRes] = await Promise.all([
        fetch('/api/insumos', { headers: { 'Authorization': getAuthHeader() } }),
        fetch('/api/insumos/movimientos', { headers: { 'Authorization': getAuthHeader() } }),
        fetch('/api/recetas', { headers: { 'Authorization': getAuthHeader() } }),
        fetch('/api/productos', { headers: { 'Authorization': getAuthHeader() } })
      ])

      if (!insumosRes.ok || !movimientosRes.ok || !recetasRes.ok || !productosRes.ok) {
        setError('加载数据失败')
        setLoading(false)
        return
      }

      const [insumosData, movimientosData, recetasData, productosData] = await Promise.all([
        insumosRes.json(),
        movimientosRes.json(),
        recetasRes.json(),
        productosRes.json()
      ])

      setInsumos(insumosData)
      setMovimientos(movimientosData)
      setRecetas(recetasData)
      setProductos(productosData)
    } catch (err) {
      setError('加载数据失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInsumo = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/insumos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(newInsumo)
      })

      if (!response.ok) {
        setError('创建原料失败')
        return
      }

      setNewInsumo({ nombre: '', unidad: '', stockActual: 0, stockMinimo: 0 })
      fetchData()
    } catch (err) {
      setError('创建原料失败：' + err.message)
    }
  }

  const handleEditInsumo = (insumo) => {
    setEditingInsumoId(insumo.id)
    setEditFormData({
      nombre: insumo.nombre,
      unidad: insumo.unidad,
      stockMinimo: insumo.stockMinimo
    })
  }

  const handleCancelEdit = () => {
    setEditingInsumoId(null)
    setEditFormData({ nombre: '', unidad: '', stockMinimo: 0 })
  }

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveEdit = async (insumoId) => {
    setError('')
    try {
      const response = await fetch(`/api/insumos/${insumoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(editFormData)
      })

      if (!response.ok) {
        setError('更新原料失败')
        return
      }

      setEditingInsumoId(null)
      setEditFormData({ nombre: '', unidad: '', stockMinimo: 0 })
      fetchData()
    } catch (err) {
      setError('更新原料失败：' + err.message)
    }
  }

  const handleCreateMovimiento = async (e) => {
    e.preventDefault()
    setError('')

    if (!newMovimiento.insumoId) {
      setError('请选择原料')
      return
    }

    try {
      const response = await fetch('/api/insumos/movimientos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          insumoId: parseInt(newMovimiento.insumoId),
          cantidad: parseFloat(newMovimiento.cantidad),
          tipo: newMovimiento.tipo,
          descripcion: newMovimiento.descripcion
        })
      })

      if (!response.ok) {
        setError('登记库存变动失败')
        return
      }

      setNewMovimiento({ insumoId: '', cantidad: 0, tipo: 'COMPRA', descripcion: '' })
      fetchData()
    } catch (err) {
      setError('登记库存变动失败：' + err.message)
    }
  }

  const handleCreateReceta = async (e) => {
    e.preventDefault()
    setError('')

    if (!newReceta.productoId) {
      setError('请选择商品')
      return
    }

    try {
      const response = await fetch('/api/recetas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          productoId: parseInt(newReceta.productoId),
          items: newReceta.items.map(item => ({
            insumoId: parseInt(item.insumoId),
            cantidadNecesaria: parseFloat(item.cantidadNecesaria)
          })),
          extras: newReceta.extras.map(extra => ({
            nombre: extra.nombre,
            precio: parseFloat(extra.precio),
            insumoId: parseInt(extra.insumoId),
            cantidadInsumo: parseFloat(extra.cantidadInsumo)
          }))
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        setError('创建配方失败：' + errorText)
        return
      }

      setNewReceta({ productoId: '', items: [{ insumoId: '', cantidadNecesaria: 0 }], extras: [] })
      fetchData()
    } catch (err) {
      setError('创建配方失败：' + err.message)
    }
  }

  const addRecetaItem = () => {
    setNewReceta({
      ...newReceta,
      items: [...newReceta.items, { insumoId: '', cantidadNecesaria: 0 }]
    })
  }

  const removeRecetaItem = (index) => {
    setNewReceta({
      ...newReceta,
      items: newReceta.items.filter((_, i) => i !== index)
    })
  }

  const updateRecetaItem = (index, field, value) => {
    const updated = [...newReceta.items]
    updated[index][field] = value
    setNewReceta({ ...newReceta, items: updated })
  }

  const addRecetaExtra = () => {
    setNewReceta({
      ...newReceta,
      extras: [...newReceta.extras, { nombre: '', precio: 0, insumoId: '', cantidadInsumo: 0 }]
    })
  }

  const removeRecetaExtra = (index) => {
    setNewReceta({
      ...newReceta,
      extras: newReceta.extras.filter((_, i) => i !== index)
    })
  }

  const updateRecetaExtra = (index, field, value) => {
    const updated = [...newReceta.extras]
    updated[index][field] = value
    setNewReceta({ ...newReceta, extras: updated })
  }

  // 编辑现有配方
  const handleStartEditReceta = (receta) => {
    setEditingRecetaId(receta.id)
    setEditRecetaData({
      items: receta.items.map(item => ({
        insumoId: item.insumoId,
        cantidadNecesaria: item.cantidadNecesaria
      })),
      extras: receta.extras.map(extra => ({
        nombre: extra.nombre,
        precio: extra.precio,
        insumoId: extra.insumoId,
        cantidadInsumo: extra.cantidadInsumo
      }))
    })
    setError('')
  }

  const handleCancelEditReceta = () => {
    setEditingRecetaId(null)
    setEditRecetaData({ items: [], extras: [] })
  }

  const handleSaveEditReceta = async (recetaId) => {
    setError('')

    if (editRecetaData.items.length === 0) {
      setError('配方至少需要一个原料')
      return
    }

    try {
      const response = await fetch(`/api/recetas/${recetaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          items: editRecetaData.items.map(item => ({
            insumoId: parseInt(item.insumoId),
            cantidadNecesaria: parseFloat(item.cantidadNecesaria)
          })),
          extras: editRecetaData.extras.map(extra => ({
            nombre: extra.nombre,
            precio: parseFloat(extra.precio),
            insumoId: parseInt(extra.insumoId),
            cantidadInsumo: parseFloat(extra.cantidadInsumo)
          }))
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        setError('更新配方失败：' + errorText)
        return
      }

      setEditingRecetaId(null)
      setEditRecetaData({ items: [], extras: [] })
      fetchData()
    } catch (err) {
      setError('更新配方失败：' + err.message)
    }
  }

  const addEditRecetaItem = () => {
    setEditRecetaData({
      ...editRecetaData,
      items: [...editRecetaData.items, { insumoId: '', cantidadNecesaria: 0 }]
    })
  }

  const removeEditRecetaItem = (index) => {
    setEditRecetaData({
      ...editRecetaData,
      items: editRecetaData.items.filter((_, i) => i !== index)
    })
  }

  const updateEditRecetaItem = (index, field, value) => {
    const updated = [...editRecetaData.items]
    updated[index][field] = value
    setEditRecetaData({ ...editRecetaData, items: updated })
  }

  const addEditRecetaExtra = () => {
    setEditRecetaData({
      ...editRecetaData,
      extras: [...editRecetaData.extras, { nombre: '', precio: 0, insumoId: '', cantidadInsumo: 0 }]
    })
  }

  const removeEditRecetaExtra = (index) => {
    setEditRecetaData({
      ...editRecetaData,
      extras: editRecetaData.extras.filter((_, i) => i !== index)
    })
  }

  const updateEditRecetaExtra = (index, field, value) => {
    const updated = [...editRecetaData.extras]
    updated[index][field] = value
    setEditRecetaData({ ...editRecetaData, extras: updated })
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>库存</h2>
          <p>请先登录后再查看此页面</p>
          <Link to="/login" className="btn-primary">去登录</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>库存管理</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>原料</h2>
        </div>

        <h3>创建新原料</h3>
        <form onSubmit={handleCreateInsumo}>
          <label htmlFor="insumo-nombre">
            名称：
          </label>
          <input
            id="insumo-nombre"
            type="text"
            value={newInsumo.nombre}
            onChange={(e) => setNewInsumo({ ...newInsumo, nombre: e.target.value })}
            required
          />

          <label htmlFor="insumo-unidad">
            单位：
          </label>
          <input
            id="insumo-unidad"
            type="text"
            value={newInsumo.unidad}
            onChange={(e) => setNewInsumo({ ...newInsumo, unidad: e.target.value })}
            placeholder="克、毫升、个"
            required
          />

          <label htmlFor="insumo-stock-actual">
            当前库存：
          </label>
          <input
            id="insumo-stock-actual"
            type="number"
            step="0.01"
            value={newInsumo.stockActual}
            onChange={(e) => setNewInsumo({ ...newInsumo, stockActual: parseFloat(e.target.value) })}
            required
          />

          <label htmlFor="insumo-stock-minimo">
            最低库存：
          </label>
          <input
            id="insumo-stock-minimo"
            type="number"
            step="0.01"
            value={newInsumo.stockMinimo}
            onChange={(e) => setNewInsumo({ ...newInsumo, stockMinimo: parseFloat(e.target.value) })}
            required
          />

          <button type="submit" className="btn-primary">创建原料</button>
        </form>

        <h3>现有原料</h3>
        {loading ? (
          <div className="loading">正在加载...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>名称</th>
                <th>单位</th>
                <th>当前库存</th>
                <th>最低库存</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {insumos.length === 0 ? (
                <tr>
                  <td colSpan="6">未找到原料</td>
                </tr>
              ) : (
                insumos.map(insumo => {
                  const isEditing = editingInsumoId === insumo.id
                  return (
                    <tr key={insumo.id}>
                      <td>{insumo.id}</td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.nombre}
                            onChange={(e) => handleEditChange('nombre', e.target.value)}
                            style={{ width: '100%' }}
                          />
                        ) : (
                          insumo.nombre
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.unidad}
                            onChange={(e) => handleEditChange('unidad', e.target.value)}
                            style={{ width: '100%' }}
                          />
                        ) : (
                          insumo.unidad
                        )}
                      </td>

                      <td className={insumo.stockActual < insumo.stockMinimo ? 'low-stock' : ''}>
                        {insumo.stockActual}
                        {insumo.stockActual < insumo.stockMinimo && ' ⚠️'}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.stockMinimo}
                            onChange={(e) => handleEditChange('stockMinimo', parseFloat(e.target.value))}
                            style={{ width: '100px' }}
                          />
                        ) : (
                          insumo.stockMinimo
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              onClick={() => handleSaveEdit(insumo.id)}
                              className="btn-success btn-small"
                            >
                              保存
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="btn-secondary btn-small"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditInsumo(insumo)}
                            className="btn-primary btn-small"
                          >
                            编辑
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>库存变动记录</h2>
        </div>

        <h3>登记库存变动</h3>
        <form onSubmit={handleCreateMovimiento}>
          <label htmlFor="movimiento-insumo">
            原料：
          </label>
          <select
            id="movimiento-insumo"
            value={newMovimiento.insumoId}
            onChange={(e) => setNewMovimiento({ ...newMovimiento, insumoId: e.target.value })}
            required
          >
            <option value="">-- 选择原料 --</option>
            {insumos.map(insumo => (
              <option key={insumo.id} value={insumo.id}>
                {insumo.nombre}（{insumo.unidad}）
              </option>
            ))}
          </select>

          <label htmlFor="movimiento-cantidad">
            数量：
          </label>
          <input
            id="movimiento-cantidad"
            type="number"
            step="0.01"
            value={newMovimiento.cantidad}
            onChange={(e) => setNewMovimiento({ ...newMovimiento, cantidad: parseFloat(e.target.value) })}
            required
          />

          <label htmlFor="movimiento-tipo">
            类型：
          </label>
          <select
            id="movimiento-tipo"
            value={newMovimiento.tipo}
            onChange={(e) => setNewMovimiento({ ...newMovimiento, tipo: e.target.value })}
          >
            <option value="COMPRA">采购</option>
            <option value="AJUSTE">调整</option>
          </select>

          <label htmlFor="movimiento-descripcion">
            描述：
          </label>
          <input
            id="movimiento-descripcion"
            type="text"
            value={newMovimiento.descripcion}
            onChange={(e) => setNewMovimiento({ ...newMovimiento, descripcion: e.target.value })}
            placeholder="可选描述"
          />

          <button type="submit" className="btn-primary">登记变动</button>
        </form>

        <h3>最近库存变动</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>原料</th>
              <th>数量</th>
              <th>类型</th>
              <th>日期</th>
              <th>描述</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.length === 0 ? (
              <tr>
                <td colSpan="6">未找到库存变动记录</td>
              </tr>
            ) : (
              movimientos.slice().reverse().slice(0, 20).map(mov => (
                <tr key={mov.id}>
                  <td>{mov.id}</td>
                  <td>{mov.insumoNombre}</td>
                  <td style={{ color: mov.cantidad >= 0 ? 'green' : 'red', fontWeight: '500' }}>
                    {mov.cantidad}
                  </td>
                  <td>
                    <span className={`badge ${
                      mov.tipo === 'COMPRA' ? 'badge-green' :
                      mov.tipo === 'AJUSTE' ? 'badge-blue' :
                      'badge-gray'
                    }`}>
                      {getTipoMovimientoText(mov.tipo)}
                    </span>
                  </td>
                  <td>{new Date(mov.fechaHora).toLocaleString()}</td>
                  <td>{mov.descripcion}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>配方</h2>
        </div>

        <h3>创建新配方</h3>
        <form onSubmit={handleCreateReceta}>
          <label htmlFor="receta-producto">
            商品：
          </label>
          <select
            id="receta-producto"
            value={newReceta.productoId}
            onChange={(e) => setNewReceta({ ...newReceta, productoId: e.target.value })}
            required
          >
            <option value="">-- 选择商品 --</option>
            {productos.map(producto => (
              <option key={producto.id} value={producto.id}>
                {producto.nombre}
              </option>
            ))}
          </select>

          <h4>配方原料：</h4>
          {newReceta.items.map((item, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <label htmlFor={`receta-insumo-${index}`}>
                原料：
              </label>
              <select
                id={`receta-insumo-${index}`}
                value={item.insumoId}
                onChange={(e) => updateRecetaItem(index, 'insumoId', e.target.value)}
                required
              >
                <option value="">-- 选择原料 --</option>
                {insumos.map(insumo => (
                  <option key={insumo.id} value={insumo.id}>
                    {insumo.nombre}（{insumo.unidad}）
                  </option>
                ))}
              </select>

              <label htmlFor={`receta-cantidad-${index}`}>
                所需数量：
              </label>
              <input
                id={`receta-cantidad-${index}`}
                type="number"
                step="0.01"
                value={item.cantidadNecesaria}
                onChange={(e) => updateRecetaItem(index, 'cantidadNecesaria', parseFloat(e.target.value))}
                required
                style={{ width: '100px' }}
              />

              {newReceta.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRecetaItem(index)}
                  className="btn-danger btn-small"
                  style={{ marginLeft: '10px' }}
                >
                  删除
                </button>
              )}
            </div>
          ))}

          <button type="button" onClick={addRecetaItem} className="btn-secondary">
            添加原料
          </button>

          <h4 style={{ marginTop: '20px' }}>加料/附加项（可选）：</h4>
          {newReceta.extras.map((extra, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
              <label htmlFor={`extra-nombre-${index}`}>
                加料名称：
              </label>
              <input
                id={`extra-nombre-${index}`}
                type="text"
                value={extra.nombre}
                onChange={(e) => updateRecetaExtra(index, 'nombre', e.target.value)}
                placeholder="例如：加芝士、加料"
                required
                style={{ width: '200px', marginRight: '10px' }}
              />

              <label htmlFor={`extra-precio-${index}`}>
                价格：
              </label>
              <input
                id={`extra-precio-${index}`}
                type="number"
                step="0.01"
                value={extra.precio}
                onChange={(e) => updateRecetaExtra(index, 'precio', e.target.value)}
                required
                style={{ width: '100px', marginRight: '10px' }}
              />

              <label htmlFor={`extra-insumo-${index}`}>
                原料：
              </label>
              <select
                id={`extra-insumo-${index}`}
                value={extra.insumoId}
                onChange={(e) => updateRecetaExtra(index, 'insumoId', e.target.value)}
                required
                style={{ marginRight: '10px' }}
              >
                <option value="">-- 选择原料 --</option>
                {insumos.map(insumo => (
                  <option key={insumo.id} value={insumo.id}>
                    {insumo.nombre}（{insumo.unidad}）
                  </option>
                ))}
              </select>

              <label htmlFor={`extra-cantidad-${index}`}>
                原料数量：
              </label>
              <input
                id={`extra-cantidad-${index}`}
                type="number"
                step="0.01"
                value={extra.cantidadInsumo}
                onChange={(e) => updateRecetaExtra(index, 'cantidadInsumo', e.target.value)}
                required
                style={{ width: '100px', marginRight: '10px' }}
              />

              <button
                type="button"
                onClick={() => removeRecetaExtra(index)}
                className="btn-danger btn-small"
              >
                删除加料
              </button>
            </div>
          ))}

          <button type="button" onClick={addRecetaExtra} className="btn-secondary">
            添加加料
          </button>
          {' '}
          <button type="submit" className="btn-primary">
            创建配方
          </button>
        </form>

        <h3>现有配方</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>商品</th>
              <th>原料</th>
              <th>加料</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {recetas.length === 0 ? (
              <tr>
                <td colSpan="5">未找到配方</td>
              </tr>
            ) : (
              recetas.map(receta => {
                const isEditing = editingRecetaId === receta.id

                return (
                  <tr key={receta.id}>
                    <td>{receta.id}</td>
                    <td>{receta.productoNombre}</td>
                    <td>
                      {isEditing ? (
                        <div style={{ padding: '10px' }}>
                          <h5 style={{ marginTop: '0' }}>原料：</h5>
                          {editRecetaData.items.map((item, index) => (
                            <div key={index} style={{ marginBottom: '10px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f5f5f5' }}>
                              <select
                                value={item.insumoId}
                                onChange={(e) => updateEditRecetaItem(index, 'insumoId', e.target.value)}
                                required
                                style={{ marginRight: '10px' }}
                              >
                                <option value="">-- 选择原料 --</option>
                                {insumos.map(insumo => (
                                  <option key={insumo.id} value={insumo.id}>
                                    {insumo.nombre}（{insumo.unidad}）
                                  </option>
                                ))}
                              </select>

                              <input
                                type="number"
                                step="0.01"
                                value={item.cantidadNecesaria}
                                onChange={(e) => updateEditRecetaItem(index, 'cantidadNecesaria', e.target.value)}
                                required
                                style={{ width: '100px', marginRight: '10px' }}
                              />

                              {editRecetaData.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeEditRecetaItem(index)}
                                  className="btn-danger btn-small"
                                >
                                  删除
                                </button>
                              )}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={addEditRecetaItem}
                            className="btn-secondary btn-small"
                            style={{ marginTop: '5px' }}
                          >
                            添加原料
                          </button>
                        </div>
                      ) : (
                        <ul style={{ margin: '0', paddingLeft: '20px' }}>
                          {receta.items.map((item, idx) => (
                            <li key={idx}>
                              {item.insumoNombre}: {item.cantidadNecesaria}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <div style={{ padding: '10px' }}>
                          <h5 style={{ marginTop: '0' }}>加料：</h5>
                          {editRecetaData.extras.length === 0 ? (
                            <p style={{ color: '#999', fontSize: '0.9em' }}>无加料</p>
                          ) : (
                            editRecetaData.extras.map((extra, index) => (
                              <div key={index} style={{ marginBottom: '10px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                                <div style={{ marginBottom: '8px' }}>
                                  <label style={{ display: 'block', fontSize: '0.85em', marginBottom: '3px', fontWeight: '500' }}>
                                    加料名称：
                                  </label>
                                  <input
                                    type="text"
                                    value={extra.nombre}
                                    onChange={(e) => updateEditRecetaExtra(index, 'nombre', e.target.value)}
                                    placeholder="例如：加芝士"
                                    required
                                    style={{ width: '200px' }}
                                  />
                                </div>

                                <div style={{ marginBottom: '8px' }}>
                                  <label style={{ display: 'block', fontSize: '0.85em', marginBottom: '3px', fontWeight: '500' }}>
                                    价格：
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={extra.precio}
                                    onChange={(e) => updateEditRecetaExtra(index, 'precio', e.target.value)}
                                    required
                                    style={{ width: '100px' }}
                                  />
                                </div>

                                <div style={{ marginBottom: '8px' }}>
                                  <label style={{ display: 'block', fontSize: '0.85em', marginBottom: '3px', fontWeight: '500' }}>
                                    关联原料：
                                  </label>
                                  <select
                                    value={extra.insumoId}
                                    onChange={(e) => updateEditRecetaExtra(index, 'insumoId', e.target.value)}
                                    required
                                    style={{ width: '200px' }}
                                  >
                                    <option value="">-- 选择原料 --</option>
                                    {insumos.map(insumo => (
                                      <option key={insumo.id} value={insumo.id}>
                                        {insumo.nombre}（{insumo.unidad}）
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div style={{ marginBottom: '8px' }}>
                                  <label style={{ display: 'block', fontSize: '0.85em', marginBottom: '3px', fontWeight: '500' }}>
                                    原料数量：
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={extra.cantidadInsumo}
                                    onChange={(e) => updateEditRecetaExtra(index, 'cantidadInsumo', e.target.value)}
                                    required
                                    style={{ width: '100px' }}
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeEditRecetaExtra(index)}
                                  className="btn-danger btn-small"
                                >
                                  删除加料
                                </button>
                              </div>
                            ))
                          )}

                          <button
                            type="button"
                            onClick={addEditRecetaExtra}
                            className="btn-secondary btn-small"
                            style={{ marginTop: '5px' }}
                          >
                            添加加料
                          </button>
                        </div>
                      ) : (
                        receta.extras && receta.extras.length > 0 ? (
                          <ul style={{ margin: '0', paddingLeft: '20px' }}>
                            {receta.extras.map((extra, idx) => (
                              <li key={idx}>
                                <strong>{extra.nombre}</strong> - ${extra.precio.toFixed(2)}<br />
                                <small>（{extra.insumoNombre}: {extra.cantidadInsumo}）</small>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span style={{ color: '#999' }}>无加料</span>
                        )
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                          <button
                            onClick={() => handleSaveEditReceta(receta.id)}
                            className="btn-success btn-small"
                          >
                            保存
                          </button>
                          <button
                            onClick={handleCancelEditReceta}
                            className="btn-secondary btn-small"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditReceta(receta)}
                          className="btn-primary btn-small"
                        >
                          编辑
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default InventarioPage