import PropTypes from 'prop-types'

function OrderSummary({ cart, products, onRemoveItem, onClearCart, totalAmount }) {
  const getProductName = (productoId) => {
    const product = products.find(p => p.id === productoId)
    return product?.nombre || `Producto ${productoId}`
  }

  const calculateItemTotal = (item) => {
    const product = products.find(p => p.id === item.productoId)
    if (!product) return 0

    const basePrice = product.precio * item.cantidad
    const extrasPrice = item.extras.reduce((sum, extra) => {
      return sum + (extra.precio * extra.cantidad * item.cantidad)
    }, 0)

    return basePrice + extrasPrice
  }

  if (cart.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: '#9ca3af'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛒</div>
        <div style={{ fontSize: '1.1rem' }}>El carrito está vacío</div>
        <div style={{ fontSize: '0.9rem', marginTop: '5px' }}>
          Selecciona productos para agregar al pedido
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Cart Items */}
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        marginBottom: '20px'
      }}>
        {cart.map((item, index) => (
          <div
            key={index}
            style={{
              padding: '15px',
              marginBottom: '12px',
              backgroundColor: '#fff',
              borderRadius: '10px',
              border: '2px solid #e5e7eb',
              transition: 'all 0.2s'
            }}
          >
            {/* Item Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '8px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '1.05rem',
                  marginBottom: '4px'
                }}>
                  <span style={{ color: '#3b82f6' }}>{item.cantidad}x</span> {getProductName(item.productoId)}
                </div>

                {/* Extras List */}
                {item.extras && item.extras.length > 0 && (
                  <ul style={{
                    margin: '5px 0 0 20px',
                    padding: 0,
                    listStyleType: 'circle',
                    fontSize: '0.9rem',
                    color: '#6b7280'
                  }}>
                    {item.extras.map((extra, idx) => (
                      <li key={idx}>
                        + {extra.nombre} x{extra.cantidad}
                        {' '}(${(extra.precio * extra.cantidad * item.cantidad).toFixed(2)})
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Price and Remove */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginLeft: '10px'
              }}>
                <div style={{
                  fontWeight: 'bold',
                  color: '#059669',
                  fontSize: '1.1rem',
                  whiteSpace: 'nowrap'
                }}>
                  ${calculateItemTotal(item).toFixed(2)}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveItem(index)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    minWidth: '48px',
                    minHeight: '36px'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{
        padding: '20px',
        backgroundColor: '#eff6ff',
        borderRadius: '10px',
        border: '2px solid #3b82f6',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '1.4rem',
          fontWeight: 'bold'
        }}>
          <span>Total:</span>
          <span style={{ color: '#059669' }}>
            ${totalAmount.toFixed(2)}
          </span>
        </div>
        <div style={{
          marginTop: '8px',
          fontSize: '0.9rem',
          color: '#6b7280',
          textAlign: 'right'
        }}>
          {cart.length} {cart.length === 1 ? 'item' : 'items'}
        </div>
      </div>

      {/* Clear Cart Button */}
      <button
        type="button"
        onClick={onClearCart}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#6b7280',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '600',
          minHeight: '48px'
        }}
      >
        Limpiar Carrito
      </button>
    </div>
  )
}

OrderSummary.propTypes = {
  cart: PropTypes.arrayOf(PropTypes.shape({
    productoId: PropTypes.number.isRequired,
    cantidad: PropTypes.number.isRequired,
    extras: PropTypes.arrayOf(PropTypes.shape({
      recetaExtraId: PropTypes.number.isRequired,
      nombre: PropTypes.string.isRequired,
      precio: PropTypes.number.isRequired,
      cantidad: PropTypes.number.isRequired
    }))
  })).isRequired,
  products: PropTypes.array.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  onClearCart: PropTypes.func.isRequired,
  totalAmount: PropTypes.number.isRequired
}

export default OrderSummary
