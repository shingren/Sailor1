import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Link, useLocation } from 'react-router-dom'

function PedidosPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()
  const location = useLocation()

  const [pedidos, setPedidos] = useState([])
  const [mesas, setMesas] = useState([])
  const [productos, setProductos] = useState([])
  const [recetas, setRecetas] = useState([])
  const [itemsListos, setItemsListos] = useState([])
  const [loadingListos, setLoadingListos] = useState(false)

  const [loading, setLoading] = useState(true)
  const [loadingMesas, setLoadingMesas] = useState(true)
  const [loadingProductos, setLoadingProductos] = useState(true)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    mesaId: '',
    observaciones: '',
    paraLlevar: false,
    items: []
  })

  const [selectedCategory, setSelectedCategory] = useState('TODOS')
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [currentQuantity, setCurrentQuantity] = useState(1)
  const [currentExtras, setCurrentExtras] = useState([])

  const getEstadoText = (estado) => {
    const estadoMap = {
      PENDIENTE: '待处理',
      PREPARACION: '制作中',
      EN_PREPARACION: '制作中',
      LISTO: '已完成',
      ENTREGADO: '已上菜',
      FACTURADO: '已结账',
      CANCELADO: '已取消'
    }

    return estadoMap[estado] || estado || '-'
  }

  const getEstacionText = (estacion) => {
    const estacionMap = {
      HOT: '热菜',
      COLD: '冷菜',
      PASTRY: '主食'
    }

    return estacionMap[estacion] || estacion || '热菜'
  }

  const getCategoryText = (category) => {
    return category === 'TODOS' ? '全部' : category
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchPedidos()
      fetchMesas()
      fetchProductos()
      fetchRecetas()
      fetchItemsListos()
    }
  }, [isAuthenticated])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const mesaId = params.get('mesaId')
    if (mesaId && mesas.length > 0) {
      setFormData(prev => ({
        ...prev,
        mesaId: mesaId
      }))
    }
  }, [location.search, mesas])

  const fetchPedidos = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/pedidos', {
        headers: { Authorization: getAuthHeader() }
      })

      if (response.status === 401) {
        setError('未授权，请重新登录')
        return
      }

      if (!response.ok) {
        setError('加载订单失败')
        return
      }

      const data = await response.json()
      setPedidos(data)
    } catch (err) {
      setError('加载订单失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchMesas = async () => {
    setLoadingMesas(true)
    try {
      const response = await fetch('/api/mesas', {
        headers: { Authorization: getAuthHeader() }
      })

      if (response.ok) {
        const data = await response.json()
        setMesas(data)
      }
    } catch (err) {
      console.error('加载餐桌失败：', err)
    } finally {
      setLoadingMesas(false)
    }
  }

  const fetchProductos = async () => {
    setLoadingProductos(true)
    try {
      const response = await fetch('/api/productos', {
        headers: { Authorization: getAuthHeader() }
      })

      if (response.ok) {
        const data = await response.json()
        setProductos(data)
      }
    } catch (err) {
      console.error('加载商品失败：', err)
    } finally {
      setLoadingProductos(false)
    }
  }

  const fetchRecetas = async () => {
    try {
      const response = await fetch('/api/recetas', {
        headers: { Authorization: getAuthHeader() }
      })

      if (response.ok) {
        const data = await response.json()
        setRecetas(data)
      }
    } catch (err) {
      console.error('加载配方失败：', err)
    }
  }

  const fetchItemsListos = async () => {
    setLoadingListos(true)
    try {
      const response = await fetch('/api/cocina/items/listos', {
        headers: { Authorization: getAuthHeader() }
      })

      if (response.ok) {
        const data = await response.json()
        setItemsListos(data)
      }
    } catch (err) {
      console.error('加载待上菜品失败：', err)
    } finally {
      setLoadingListos(false)
    }
  }

  const marcarItemEntregado = async (itemId) => {
    try {
      const response = await fetch(`/api/cocina/items/${itemId}/entregado`, {
        method: 'POST',
        headers: { Authorization: getAuthHeader() }
      })

      if (!response.ok) {
        setError('标记菜品为已上菜失败')
        return
      }

      fetchItemsListos()
      fetchPedidos()
    } catch (err) {
      setError('标记菜品为已上菜失败：' + err.message)
    }
  }

  const imprimirTicket = async (pedidoId) => {
    try {
      const response = await fetch(`/api/cocina/pedidos/${pedidoId}/tickets`, {
        headers: { Authorization: getAuthHeader() }
      })

      if (!response.ok) {
        alert('生成后厨小票失败')
        return
      }

      const tickets = await response.json()

      if (!tickets || tickets.length === 0) {
        alert('没有可打印的小票')
        return
      }

      tickets.forEach((text, index) => {
        const printWindow = window.open('', '', 'width=400,height=600')

        if (!printWindow) {
          alert('浏览器阻止了打印窗口，请允许 localhost 弹出窗口。')
          return
        }

        printWindow.document.write(`
          <html>
            <head>
              <title>后厨小票</title>
              <style>
                body {
                  font-family: monospace;
                  white-space: pre-wrap;
                  font-size: 14px;
                  padding: 10px;
                }
              </style>
            </head>
            <body>${text}</body>
          </html>
        `)

        printWindow.document.close()
        printWindow.focus()

        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500 + index * 800)
      })
    } catch (err) {
      alert('错误：' + err.message)
    }
  }

  const imprimirTicketCliente = async (pedidoId) => {
    try {
      const response = await fetch(`/api/cocina/pedidos/${pedidoId}/ticket-cliente`, {
        headers: { Authorization: getAuthHeader() }
      })

      if (!response.ok) {
        alert('生成顾客小票失败')
        return
      }

      const text = await response.text()
      const printWindow = window.open('', '', 'width=400,height=600')

      if (!printWindow) {
        alert('浏览器阻止了打印窗口，请允许 localhost 弹出窗口。')
        return
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>顾客小票</title>
            <style>
              body {
                font-family: monospace;
                white-space: pre-wrap;
                font-size: 14px;
                padding: 10px;
              }

              pre {
                font-family: monospace;
                white-space: pre-wrap;
                margin: 0;
              }
            </style>
          </head>
          <body><pre>${text}</pre></body>
        </html>
      `)

      printWindow.document.close()
      printWindow.focus()

      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 300)
    } catch (err) {
      alert('错误：' + err.message)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleParaLlevarChange = (e) => {
    setFormData(prev => ({
      ...prev,
      paraLlevar: e.target.checked
    }))
  }

  const getExtrasForProduct = (productoId) => {
    if (!productoId) return []
    const receta = recetas.find(r => r.productoId === parseInt(productoId))
    return receta?.extras || []
  }

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData(prev => ({
      ...prev,
      items: newItems
    }))
  }

  const getCategories = () => {
    const categories = [
      ...new Set(productos.filter(p => p.activo && p.categoria).map(p => p.categoria))
    ]
    return ['TODOS', ...categories]
  }

  const getFilteredProducts = () => {
    if (selectedCategory === 'TODOS') {
      return productos.filter(p => p.activo)
    }
    return productos.filter(p => p.activo && p.categoria === selectedCategory)
  }

  const handleAddToCart = () => {
    if (!selectedProductId || currentQuantity < 1) return

    const newItem = {
      productoId: selectedProductId,
      cantidad: currentQuantity,
      extras: currentExtras.map(extra => ({
        recetaExtraId: extra.recetaExtraId,
        nombre: extra.nombre,
        precio: extra.precio,
        cantidad: extra.cantidad
      }))
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))

    setSelectedProductId(null)
    setCurrentQuantity(1)
    setCurrentExtras([])
  }

  const handleExtraQuantityChange = (recetaExtraId, delta) => {
    setCurrentExtras(prev => {
      const existing = prev.find(e => e.recetaExtraId === recetaExtraId)

      if (existing) {
        const newQuantity = existing.cantidad + delta

        if (newQuantity <= 0) {
          return prev.filter(e => e.recetaExtraId !== recetaExtraId)
        }

        return prev.map(e =>
          e.recetaExtraId === recetaExtraId
            ? { ...e, cantidad: newQuantity }
            : e
        )
      }

      if (delta > 0) {
        const recetaExtra = getExtrasForProduct(selectedProductId).find(e => e.id === recetaExtraId)

        if (recetaExtra) {
          return [
            ...prev,
            {
              recetaExtraId: recetaExtra.id,
              nombre: recetaExtra.nombre,
              precio: recetaExtra.precio,
              cantidad: 1
            }
          ]
        }
      }

      return prev
    })
  }

  const calculateItemTotal = (item) => {
    const producto = productos.find(p => p.id === item.productoId)
    if (!producto) return 0

    const basePrice = producto.precio * item.cantidad
    const extrasPrice = item.extras.reduce(
      (sum, extra) => sum + extra.precio * extra.cantidad * item.cantidad,
      0
    )

    return basePrice + extrasPrice
  }

  const calculateCartTotal = () => {
    return formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  }

  const clearCart = () => {
    setFormData(prev => ({
      ...prev,
      items: []
    }))
    setSelectedProductId(null)
    setCurrentQuantity(1)
    setCurrentExtras([])
  }

  const getProductName = (productoId) => {
    const producto = productos.find(p => p.id === productoId)
    return producto?.nombre || `商品 ${productoId}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.mesaId) {
      setError('请选择餐桌')
      return
    }

    if (formData.items.length === 0) {
      setError('请至少添加一个商品到订单')
      return
    }

    const hasInvalidItems = formData.items.some(item => !item.productoId || item.cantidad < 1)

    if (hasInvalidItems) {
      setError('所有商品都必须有商品名称，并且数量不能小于 1')
      return
    }

    try {
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAuthHeader()
        },
        body: JSON.stringify({
          mesaId: parseInt(formData.mesaId),
          observaciones: formData.observaciones,
          paraLlevar: formData.paraLlevar,
          items: formData.items.map(item => ({
            productoId: parseInt(item.productoId),
            cantidad: item.cantidad,
            extras: item.extras.map(extra => ({
              recetaExtraId: extra.recetaExtraId,
              cantidad: extra.cantidad
            }))
          }))
        })
      })

      if (response.status === 401) {
        setError('未授权，请重新登录')
        return
      }

      if (!response.ok) {
        setError('创建订单失败')
        return
      }

      const data = await response.json()

      setFormData({
        mesaId: '',
        observaciones: '',
        paraLlevar: false,
        items: []
      })
      setSelectedProductId(null)
      setCurrentQuantity(1)
      setCurrentExtras([])

      fetchPedidos()
      fetchItemsListos()

      imprimirTicket(data.id)
    } catch (err) {
      setError('创建订单失败：' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>订单</h2>
          <p>请先登录后再查看此页面</p>
          <Link to="/login" className="btn-primary">去登录</Link>
        </div>
      </div>
    )
  }

  const totalPedidos = pedidos.length
  const pedidosPendientes = pedidos.filter(p => p.estado === 'PENDIENTE').length
  const pedidosEnPreparacion = pedidos.filter(
    p => p.estado === 'EN_PREPARACION' || p.estado === 'PREPARACION'
  ).length
  const pedidosListos = pedidos.filter(p => p.estado === 'LISTO').length

  return (
    <div>
      <h1>订单</h1>

      <div className="card" style={{ border: '2px solid #10b981', backgroundColor: '#ecfdf5' }}>
        <div className="card-header">
          <h2 className="card-title">待上菜品</h2>
        </div>

        {loadingListos ? (
          <div className="loading">正在加载提醒...</div>
        ) : itemsListos.length === 0 ? (
          <p>暂无待上菜品</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {itemsListos.map(item => (
              <div
                key={item.itemId}
                style={{
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div>
                    <strong>餐桌 {item.mesaCodigo}</strong> - {item.productoNombre} x{item.cantidad}

                    <div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#065f46' }}>
                      制作工位：{getEstacionText(item.estacion)} · 状态：{getEstadoText(item.estado)}
                    </div>

                    {item.observaciones && item.observaciones.trim() !== '' && (
                      <div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#4b5563' }}>
                        备注：{item.observaciones}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => marcarItemEntregado(item.itemId)}
                    className="btn-success btn-small"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    已上菜
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">订单总数</div>
          <div className="stat-value stat-value-primary">{totalPedidos}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">待处理</div>
          <div className="stat-value stat-value-warning">{pedidosPendientes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">制作中</div>
          <div className="stat-value stat-value-primary">{pedidosEnPreparacion}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已完成</div>
          <div className="stat-value stat-value-success">{pedidosListos}</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">活跃订单</h2>
        </div>

        {loading ? (
          <div className="loading">正在加载...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>餐桌</th>
                <th>状态</th>
                <th>类型</th>
                <th>时间</th>
                <th>商品数量</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 ? (
                <tr>
                  <td colSpan="7">没有找到订单</td>
                </tr>
              ) : (
                pedidos.map(pedido => (
                  <tr key={pedido.id}>
                    <td>{pedido.id}</td>
                    <td>{pedido.mesaCodigo}（ID：{pedido.mesaId}）</td>
                    <td>
                      <span className={`badge ${
                        pedido.estado === 'PENDIENTE' ? 'badge-yellow' :
                        pedido.estado === 'PREPARACION' || pedido.estado === 'EN_PREPARACION' ? 'badge-blue' :
                        pedido.estado === 'LISTO' ? 'badge-green' :
                        pedido.estado === 'ENTREGADO' ? 'badge-green' :
                        'badge-gray'
                      }`}>
                        {getEstadoText(pedido.estado)}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: pedido.paraLlevar ? '#dc2626' : '#374151' }}>
                        {pedido.paraLlevar ? '打包' : '堂食'}
                      </strong>
                    </td>
                    <td>{pedido.fechaHora ? new Date(pedido.fechaHora).toLocaleString() : '-'}</td>
                    <td>{pedido.items?.length || 0} 件商品</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => imprimirTicket(pedido.id)}
                        className="btn-secondary btn-small"
                      >
                        后厨小票
                      </button>

                      <button
                        type="button"
                        onClick={() => imprimirTicketCliente(pedido.id)}
                        className="btn-secondary btn-small"
                        style={{ marginLeft: '8px' }}
                      >
                        顾客小票
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">创建新订单 - POS</h2>
        </div>

        {loadingMesas || loadingProductos ? (
          <div className="loading">正在加载...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label htmlFor="mesaId" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  餐桌：
                </label>
                <select
                  id="mesaId"
                  name="mesaId"
                  value={formData.mesaId}
                  onChange={handleInputChange}
                  required
                  style={{ padding: '12px', fontSize: '1rem', marginTop: '5px' }}
                >
                  <option value="">-- 选择餐桌 --</option>
                  {mesas.map(mesa => (
                    <option key={mesa.id} value={mesa.id}>
                      {mesa.codigo}（容量：{mesa.capacidad}）
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="observaciones" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  备注：
                </label>
                <textarea
                  id="observaciones"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  rows="2"
                  style={{ padding: '8px', fontSize: '1rem', marginTop: '5px' }}
                  placeholder="订单特殊备注..."
                />

              <div style={{ marginTop: '12px' }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.paraLlevar}
                    onChange={handleParaLlevarChange}
                    style={{
                      width: '18px',
                      height: '18px',
                      margin: 0,
                      cursor: 'pointer'
                    }}
                  />
                  <span>打包带走</span>
                </label>
              </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '10px' }}>
                分类：
              </strong>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {getCategories().map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    style={{
                      padding: '12px 20px',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      border: selectedCategory === category ? '3px solid #059669' : '2px solid #d1d5db',
                      backgroundColor: selectedCategory === category ? '#d1fae5' : '#fff',
                      color: selectedCategory === category ? '#059669' : '#374151',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {getCategoryText(category)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '10px' }}>
                  商品：
                </strong>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '10px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    padding: '5px'
                  }}
                >
                  {getFilteredProducts().map(producto => (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => {
                        setSelectedProductId(producto.id)
                        setCurrentQuantity(1)
                        setCurrentExtras([])
                      }}
                      style={{
                        padding: '15px',
                        border: selectedProductId === producto.id ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                        backgroundColor: selectedProductId === producto.id ? '#dbeafe' : '#fff',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '5px' }}>
                        {producto.nombre}
                      </div>

                      <div style={{ color: '#059669', fontSize: '1.1rem', fontWeight: 'bold' }}>
                        ${producto.precio.toFixed(2)}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '5px' }}>
                        制作工位：{getEstacionText(producto.estacion)}
                      </div>

                      {producto.descripcion && (
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '5px' }}>
                          {producto.descripcion}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ border: '2px solid #e5e7eb', borderRadius: '8px', padding: '15px', backgroundColor: '#f9fafb' }}>
                <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '10px' }}>
                  已选商品：
                </strong>

                {selectedProductId ? (
                  <>
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                        {productos.find(p => p.id === selectedProductId)?.nombre}
                      </div>
                      <div style={{ color: '#059669', fontSize: '1.1rem', fontWeight: 'bold' }}>
                        ${productos.find(p => p.id === selectedProductId)?.precio.toFixed(2)}
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                        数量：
                      </label>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setCurrentQuantity(Math.max(1, currentQuantity - 1))}
                          style={{
                            padding: '10px 15px',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          -
                        </button>

                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>
                          {currentQuantity}
                        </div>

                        <button
                          type="button"
                          onClick={() => setCurrentQuantity(currentQuantity + 1)}
                          style={{
                            padding: '10px 15px',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {getExtrasForProduct(selectedProductId).length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                          加料：
                        </label>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {getExtrasForProduct(selectedProductId).map(recetaExtra => {
                            const currentExtra = currentExtras.find(e => e.recetaExtraId === recetaExtra.id)
                            const quantity = currentExtra?.cantidad || 0

                            return (
                              <div
                                key={recetaExtra.id}
                                style={{
                                  padding: '10px',
                                  border: quantity > 0 ? '2px solid #10b981' : '1px solid #d1d5db',
                                  backgroundColor: quantity > 0 ? '#d1fae5' : '#fff',
                                  borderRadius: '6px'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                  <span style={{ fontWeight: '600' }}>{recetaExtra.nombre}</span>
                                  <span style={{ color: '#059669', fontWeight: 'bold' }}>
                                    +${recetaExtra.precio.toFixed(2)}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleExtraQuantityChange(recetaExtra.id, -1)}
                                    style={{
                                      padding: '5px 10px',
                                      fontSize: '1rem',
                                      fontWeight: 'bold',
                                      backgroundColor: '#ef4444',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    -
                                  </button>

                                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>
                                    {quantity}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleExtraQuantityChange(recetaExtra.id, 1)}
                                    style={{
                                      padding: '5px 10px',
                                      fontSize: '1rem',
                                      fontWeight: 'bold',
                                      backgroundColor: '#10b981',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="btn-success"
                      style={{ width: '100%', padding: '12px', fontSize: '1.1rem', fontWeight: 'bold' }}
                    >
                      加入订单
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                    请选择一个商品继续
                  </div>
                )}
              </div>
            </div>

            <div style={{ border: '2px solid #3b82f6', borderRadius: '8px', padding: '15px', backgroundColor: '#eff6ff', marginBottom: '20px' }}>
              <strong style={{ fontSize: '1.2rem', display: 'block', marginBottom: '10px', color: '#1e40af' }}>
                订单摘要：
              </strong>

              <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                类型：{formData.paraLlevar ? '打包' : '堂食'}
              </div>

              {formData.items.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                  购物车为空，请添加商品继续。
                </div>
              ) : (
                <>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {formData.items.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '10px',
                          marginBottom: '10px',
                          backgroundColor: '#fff',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <div>
                            <strong>{item.cantidad}x</strong> {getProductName(item.productoId)}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 'bold', color: '#059669' }}>
                              ${calculateItemTotal(item).toFixed(2)}
                            </span>

                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="btn-danger btn-small"
                              style={{ padding: '5px 10px' }}
                            >
                              删除
                            </button>
                          </div>
                        </div>

                        {item.extras.length > 0 && (
                          <ul style={{ marginLeft: '20px', fontSize: '0.9rem', color: '#6b7280', listStyleType: 'circle' }}>
                            {item.extras.map((extra, idx) => (
                              <li key={idx}>
                                + {extra.nombre} x{extra.cantidad} (${(extra.precio * extra.cantidad * item.cantidad).toFixed(2)})
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.3rem', fontWeight: 'bold' }}>
                      <span>合计：</span>
                      <span style={{ color: '#059669' }}>${calculateCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '18px', fontSize: '1.3rem', fontWeight: 'bold' }}
                disabled={formData.items.length === 0 || !formData.mesaId}
              >
                创建订单
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="btn-secondary"
                style={{ padding: '18px', fontSize: '1.3rem', fontWeight: 'bold' }}
              >
                清空订单
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default PedidosPage