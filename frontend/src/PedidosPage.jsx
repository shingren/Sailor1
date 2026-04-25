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
    items: []
  })

  const [selectedCategory, setSelectedCategory] = useState('TODOS')
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [currentQuantity, setCurrentQuantity] = useState(1)
  const [currentExtras, setCurrentExtras] = useState([])

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
        setError('No autorizado - por favor inicia sesión nuevamente')
        return
      }

      if (!response.ok) {
        setError('Error al cargar pedidos')
        return
      }

      const data = await response.json()
      setPedidos(data)
    } catch (err) {
      setError('Error al cargar pedidos: ' + err.message)
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
      console.error('Error al cargar mesas:', err)
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
      console.error('Error al cargar productos:', err)
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
      console.error('Error al cargar recetas:', err)
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
      console.error('Error al cargar items listos:', err)
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
        setError('Error al marcar plato como servido')
        return
      }

      fetchItemsListos()
      fetchPedidos()
    } catch (err) {
      setError('Error al marcar plato como servido: ' + err.message)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    return producto?.nombre || `Producto ${productoId}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.mesaId) {
      setError('Por favor selecciona una mesa')
      return
    }

    if (formData.items.length === 0) {
      setError('Debes agregar al menos un producto al pedido')
      return
    }

    const hasInvalidItems = formData.items.some(item => !item.productoId || item.cantidad < 1)

    if (hasInvalidItems) {
      setError('Todos los ítems deben tener un producto y cantidad >= 1')
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
        setError('No autorizado - por favor inicia sesión nuevamente')
        return
      }

      if (!response.ok) {
        setError('Error al crear pedido')
        return
      }

      setFormData({
        mesaId: '',
        observaciones: '',
        items: []
      })
      setSelectedProductId(null)
      setCurrentQuantity(1)
      setCurrentExtras([])

      fetchPedidos()
      fetchItemsListos()
    } catch (err) {
      setError('Error al crear pedido: ' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Pedidos</h2>
          <p>Debes iniciar sesión para ver esta página</p>
          <Link to="/login" className="btn-primary">Ir a Iniciar Sesión</Link>
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
      <h1>Pedidos</h1>

      <div className="card" style={{ border: '2px solid #10b981', backgroundColor: '#ecfdf5' }}>
        <div className="card-header">
          <h2 className="card-title">Platos listos para servir</h2>
        </div>

        {loadingListos ? (
          <div className="loading">Cargando avisos...</div>
        ) : itemsListos.length === 0 ? (
          <p>No hay platos listos para servir</p>
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
                    <strong>Mesa {item.mesaCodigo}</strong> - {item.productoNombre} x{item.cantidad}

                    <div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#065f46' }}>
                      Estación: {item.estacion} · Estado: {item.estado}
                    </div>

                    {item.observaciones && item.observaciones.trim() !== '' && (
                      <div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#4b5563' }}>
                        Observaciones: {item.observaciones}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => marcarItemEntregado(item.itemId)}
                    className="btn-success btn-small"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Servido
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total de Pedidos</div>
          <div className="stat-value stat-value-primary">{totalPedidos}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendientes</div>
          <div className="stat-value stat-value-warning">{pedidosPendientes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">En Preparación</div>
          <div className="stat-value stat-value-primary">{pedidosEnPreparacion}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Listos</div>
          <div className="stat-value stat-value-success">{pedidosListos}</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Pedidos Activos</h2>
        </div>

        {loading ? (
          <div className="loading">Cargando</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Mesa</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Ítems</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 ? (
                <tr>
                  <td colSpan="5">No se encontraron pedidos</td>
                </tr>
              ) : (
                pedidos.map(pedido => (
                  <tr key={pedido.id}>
                    <td>{pedido.id}</td>
                    <td>{pedido.mesaCodigo} (ID: {pedido.mesaId})</td>
                    <td>
                      <span className={`badge ${
                        pedido.estado === 'PENDIENTE' ? 'badge-yellow' :
                        pedido.estado === 'PREPARACION' ? 'badge-blue' :
                        pedido.estado === 'LISTO' ? 'badge-green' :
                        pedido.estado === 'ENTREGADO' ? 'badge-green' :
                        'badge-gray'
                      }`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td>{pedido.fechaHora ? new Date(pedido.fechaHora).toLocaleString() : '-'}</td>
                    <td>{pedido.items?.length || 0} ítems</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Crear Nuevo Pedido - POS</h2>
        </div>

        {loadingMesas || loadingProductos ? (
          <div className="loading">Cargando</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label htmlFor="mesaId" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  Mesa:
                </label>
                <select
                  id="mesaId"
                  name="mesaId"
                  value={formData.mesaId}
                  onChange={handleInputChange}
                  required
                  style={{ padding: '12px', fontSize: '1rem', marginTop: '5px' }}
                >
                  <option value="">-- Seleccionar Mesa --</option>
                  {mesas.map(mesa => (
                    <option key={mesa.id} value={mesa.id}>
                      {mesa.codigo} (Cap: {mesa.capacidad})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="observaciones" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  Observaciones:
                </label>
                <textarea
                  id="observaciones"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  rows="2"
                  style={{ padding: '8px', fontSize: '1rem', marginTop: '5px' }}
                  placeholder="Notas especiales del pedido..."
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '10px' }}>
                Categorías:
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
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '10px' }}>
                  Productos:
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
                        Station: {producto.estacion || 'HOT'}
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
                  Producto Seleccionado:
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
                        Cantidad:
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
                          Extras:
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
                      Agregar al Pedido
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                    Selecciona un producto para continuar
                  </div>
                )}
              </div>
            </div>

            <div style={{ border: '2px solid #3b82f6', borderRadius: '8px', padding: '15px', backgroundColor: '#eff6ff', marginBottom: '20px' }}>
              <strong style={{ fontSize: '1.2rem', display: 'block', marginBottom: '10px', color: '#1e40af' }}>
                Resumen del Pedido:
              </strong>

              {formData.items.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                  El carrito está vacío. Agrega productos para continuar.
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
                              Eliminar
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
                      <span>Total:</span>
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
                Crear Pedido
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="btn-secondary"
                style={{ padding: '18px', fontSize: '1.3rem', fontWeight: 'bold' }}
              >
                Limpiar Pedido
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default PedidosPage