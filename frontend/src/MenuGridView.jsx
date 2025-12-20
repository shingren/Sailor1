import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { Link, useLocation } from 'react-router-dom'
import ProductCard from './components/ProductCard'
import ProductModal from './components/ProductModal'
import OrderSummary from './components/OrderSummary'

function MenuGridView() {
  const { isAuthenticated, getAuthHeader } = useAuth()
  const location = useLocation()

  // Data states
  const [mesas, setMesas] = useState([])
  const [productos, setProductos] = useState([])
  const [recetas, setRecetas] = useState([])

  // UI states
  const [selectedMesaId, setSelectedMesaId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('TODOS')
  const [cart, setCart] = useState([])
  const [observaciones, setObservaciones] = useState('')

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false)
  const [modalProduct, setModalProduct] = useState(null)

  // Panel states
  const [showOrderPanel, setShowOrderPanel] = useState(false)

  // Loading states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  // Pre-fill mesa from query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const mesaId = params.get('mesaId')
    if (mesaId && mesas.length > 0) {
      setSelectedMesaId(mesaId)
    }
  }, [location.search, mesas])

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const [mesasRes, productosRes, recetasRes] = await Promise.all([
        fetch('/api/mesas', { headers: { 'Authorization': getAuthHeader() } }),
        fetch('/api/productos', { headers: { 'Authorization': getAuthHeader() } }),
        fetch('/api/recetas', { headers: { 'Authorization': getAuthHeader() } })
      ])

      if (mesasRes.ok) setMesas(await mesasRes.json())
      if (productosRes.ok) setProductos(await productosRes.json())
      if (recetasRes.ok) setRecetas(await recetasRes.json())
    } catch (err) {
      setError('Error al cargar datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = [...new Set(productos.filter(p => p.activo && p.categoria).map(p => p.categoria))]
    return ['TODOS', ...cats]
  }, [productos])

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    let filtered = productos.filter(p => p.activo)

    // Filter by category
    if (selectedCategory !== 'TODOS') {
      filtered = filtered.filter(p => p.categoria === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(query) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [productos, selectedCategory, searchQuery])

  // Get extras for a product
  const getExtrasForProduct = (productoId) => {
    const receta = recetas.find(r => r.productoId === productoId)
    return receta?.extras || []
  }

  // Handle product click
  const handleProductClick = (product) => {
    setModalProduct(product)
    setShowProductModal(true)
  }

  // Handle add to cart from modal
  const handleAddToCart = (item) => {
    setCart(prev => [...prev, item])
    setShowProductModal(false)
    setModalProduct(null)
  }

  // Handle remove item from cart
  const handleRemoveItem = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  // Handle clear cart
  const handleClearCart = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar el carrito?')) {
      setCart([])
    }
  }

  // Calculate total
  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const product = productos.find(p => p.id === item.productoId)
      if (!product) return sum

      const basePrice = product.precio * item.cantidad
      const extrasPrice = item.extras.reduce((extraSum, extra) => {
        return extraSum + (extra.precio * extra.cantidad * item.cantidad)
      }, 0)

      return sum + basePrice + extrasPrice
    }, 0)
  }

  // Handle create order
  const handleCreateOrder = async () => {
    setError('')
    setSuccessMessage('')

    if (!selectedMesaId) {
      setError('Por favor selecciona una mesa')
      return
    }

    if (cart.length === 0) {
      setError('El carrito está vacío. Agrega productos para continuar.')
      return
    }

    try {
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          mesaId: parseInt(selectedMesaId),
          observaciones: observaciones,
          items: cart.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            extras: item.extras.map(e => ({
              recetaExtraId: e.recetaExtraId,
              cantidad: e.cantidad
            }))
          }))
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Error al crear pedido')
      }

      setSuccessMessage('¡Pedido creado exitosamente!')
      setCart([])
      setObservaciones('')
      setShowOrderPanel(false)

      // Hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError('Error al crear pedido: ' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Menú POS</h2>
          <p>Debes iniciar sesión para ver esta página</p>
          <Link to="/login" className="btn-primary">Ir a Iniciar Sesión</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="centered-container">
        <div className="loading">Cargando menú...</div>
      </div>
    )
  }

  const selectedMesa = mesas.find(m => m.id === parseInt(selectedMesaId))
  const totalAmount = calculateTotal()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Fixed Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#fff',
        borderBottom: '2px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '15px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          {/* Mesa Selector */}
          <div style={{ flex: '0 1 200px' }}>
            <label style={{ fontSize: '0.85rem', color: '#6b7280', display: 'block', marginBottom: '5px' }}>
              Mesa:
            </label>
            <select
              value={selectedMesaId}
              onChange={(e) => setSelectedMesaId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '1rem',
                fontWeight: 'bold',
                border: '2px solid #3b82f6',
                borderRadius: '8px'
              }}
            >
              <option value="">Seleccionar...</option>
              {mesas.map(mesa => (
                <option key={mesa.id} value={mesa.id}>
                  {mesa.codigo}
                </option>
              ))}
            </select>
          </div>

          {/* Total Display */}
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Total:</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
              ${totalAmount.toFixed(2)}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ flex: '1 1 auto', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowOrderPanel(true)}
              style={{
                padding: '12px 20px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                minHeight: '48px',
                position: 'relative'
              }}
            >
              Ver Pedido
              {cart.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  {cart.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleCreateOrder}
              disabled={cart.length === 0 || !selectedMesaId}
              style={{
                padding: '12px 24px',
                backgroundColor: cart.length > 0 && selectedMesaId ? '#059669' : '#9ca3af',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: cart.length > 0 && selectedMesaId ? 'pointer' : 'not-allowed',
                minHeight: '48px'
              }}
            >
              Crear Pedido
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '15px 20px'
        }}>
          <div className="alert alert-error">{error}</div>
        </div>
      )}

      {successMessage && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '15px 20px'
        }}>
          <div className="alert alert-success">{successMessage}</div>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {/* Search Bar */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="🔍 Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '15px 20px',
              fontSize: '1.1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Category Chips */}
        <div style={{
          marginBottom: '25px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div style={{
            display: 'flex',
            gap: '10px',
            paddingBottom: '5px'
          }}>
            {categories.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  border: selectedCategory === category ? '3px solid #059669' : '2px solid #d1d5db',
                  backgroundColor: selectedCategory === category ? '#d1fae5' : '#fff',
                  color: selectedCategory === category ? '#059669' : '#374151',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  minHeight: '48px'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {filteredProducts.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '60px 20px',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔍</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                No se encontraron productos
              </div>
              <div style={{ fontSize: '1rem' }}>
                Intenta con otra búsqueda o categoría
              </div>
            </div>
          ) : (
            filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={handleProductClick}
              />
            ))
          )}
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && modalProduct && (
        <ProductModal
          product={modalProduct}
          extras={getExtrasForProduct(modalProduct.id)}
          onClose={() => {
            setShowProductModal(false)
            setModalProduct(null)
          }}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Order Panel (Side Drawer) */}
      {showOrderPanel && (
        <div
          onClick={() => setShowOrderPanel(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 200,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: '#fff',
              height: '100%',
              overflowY: 'auto',
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Panel Header */}
            <div style={{
              padding: '20px',
              borderBottom: '2px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Resumen del Pedido</h2>
              <button
                type="button"
                onClick={() => setShowOrderPanel(false)}
                style={{
                  padding: '8px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  color: '#6b7280'
                }}
              >
                ✕
              </button>
            </div>

            {/* Panel Body */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto'
            }}>
              <OrderSummary
                cart={cart}
                products={productos}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                totalAmount={totalAmount}
              />

              {/* Observaciones */}
              {cart.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}>
                    Observaciones:
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows="3"
                    placeholder="Notas especiales del pedido..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Panel Footer */}
            {cart.length > 0 && (
              <div style={{
                padding: '20px',
                borderTop: '2px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}>
                <button
                  type="button"
                  onClick={handleCreateOrder}
                  disabled={!selectedMesaId}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: selectedMesaId ? '#059669' : '#9ca3af',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: selectedMesaId ? 'pointer' : 'not-allowed',
                    minHeight: '56px'
                  }}
                >
                  Crear Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MenuGridView
