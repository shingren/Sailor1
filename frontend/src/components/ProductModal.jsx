import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

function ProductModal({ product, extras, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1)
  const [selectedExtras, setSelectedExtras] = useState([])

  // Reset state when product changes
  useEffect(() => {
    setQuantity(1)
    setSelectedExtras([])
  }, [product?.id])

  const handleExtraChange = (recetaExtra, delta) => {
    setSelectedExtras(prev => {
      const existing = prev.find(e => e.recetaExtraId === recetaExtra.id)

      if (existing) {
        const newQuantity = existing.cantidad + delta
        if (newQuantity <= 0) {
          return prev.filter(e => e.recetaExtraId !== recetaExtra.id)
        }
        return prev.map(e =>
          e.recetaExtraId === recetaExtra.id
            ? { ...e, cantidad: newQuantity }
            : e
        )
      } else if (delta > 0) {
        return [...prev, {
          recetaExtraId: recetaExtra.id,
          nombre: recetaExtra.nombre,
          precio: recetaExtra.precio,
          cantidad: 1
        }]
      }

      return prev
    })
  }

  const getExtraQuantity = (recetaExtraId) => {
    const extra = selectedExtras.find(e => e.recetaExtraId === recetaExtraId)
    return extra?.cantidad || 0
  }

  const calculateSubtotal = () => {
    const basePrice = product.precio * quantity
    const extrasPrice = selectedExtras.reduce((sum, extra) => {
      return sum + (extra.precio * extra.cantidad * quantity)
    }, 0)
    return basePrice + extrasPrice
  }

  const handleAdd = () => {
    onAddToCart({
      productoId: product.id,
      cantidad: quantity,
      extras: selectedExtras
    })
    onClose()
  }

  if (!product) return null

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '2px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '8px'
            }}>
              {product.nombre}
            </h2>
            <div style={{
              color: '#059669',
              fontSize: '1.3rem',
              fontWeight: 'bold'
            }}>
              ${product.precio.toFixed(2)}
            </div>
            {product.descripcion && (
              <p style={{
                margin: '8px 0 0 0',
                color: '#6b7280',
                fontSize: '0.95rem'
              }}>
                {product.descripcion}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '1.5rem',
              color: '#6b7280',
              lineHeight: '1',
              marginLeft: '10px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Body (scrollable) */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px'
        }}>
          {/* Quantity Selector */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '12px',
              fontSize: '1rem'
            }}>
              Cantidad:
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  padding: '12px 18px',
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  minWidth: '48px',
                  minHeight: '48px'
                }}
              >
                -
              </button>
              <div style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                minWidth: '50px',
                textAlign: 'center'
              }}>
                {quantity}
              </div>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                style={{
                  padding: '12px 18px',
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  minWidth: '48px',
                  minHeight: '48px'
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Extras Section */}
          {extras && extras.length > 0 && (
            <div>
              <label style={{
                display: 'block',
                fontWeight: 'bold',
                marginBottom: '12px',
                fontSize: '1rem'
              }}>
                Extras Disponibles:
              </label>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {extras.map(recetaExtra => {
                  const quantity = getExtraQuantity(recetaExtra.id)
                  return (
                    <div
                      key={recetaExtra.id}
                      style={{
                        padding: '15px',
                        border: quantity > 0 ? '2px solid #10b981' : '2px solid #e5e7eb',
                        backgroundColor: quantity > 0 ? '#d1fae5' : '#fff',
                        borderRadius: '10px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px'
                      }}>
                        <span style={{
                          fontWeight: '600',
                          fontSize: '1rem'
                        }}>
                          {recetaExtra.nombre}
                        </span>
                        <span style={{
                          color: '#059669',
                          fontWeight: 'bold',
                          fontSize: '1rem'
                        }}>
                          +${recetaExtra.precio.toFixed(2)}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <button
                          type="button"
                          onClick={() => handleExtraChange(recetaExtra, -1)}
                          style={{
                            padding: '8px 14px',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            minWidth: '40px',
                            minHeight: '40px'
                          }}
                        >
                          -
                        </button>
                        <div style={{
                          fontSize: '1.3rem',
                          fontWeight: 'bold',
                          minWidth: '40px',
                          textAlign: 'center'
                        }}>
                          {quantity}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleExtraChange(recetaExtra, 1)}
                          style={{
                            padding: '8px 14px',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            minWidth: '40px',
                            minHeight: '40px'
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
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px',
          borderTop: '2px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          {/* Subtotal */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}>
            <span>Subtotal:</span>
            <span style={{ color: '#059669', fontSize: '1.4rem' }}>
              ${calculateSubtotal().toFixed(2)}
            </span>
          </div>

          {/* Breakdown */}
          {selectedExtras.length > 0 && (
            <div style={{
              fontSize: '0.85rem',
              color: '#6b7280',
              marginBottom: '15px'
            }}>
              {quantity}x {product.nombre}
              {selectedExtras.map(extra => (
                <div key={extra.recetaExtraId}>
                  + {extra.cantidad}x {extra.nombre}
                </div>
              ))}
            </div>
          )}

          {/* Add Button */}
          <button
            type="button"
            onClick={handleAdd}
            className="btn-success"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              minHeight: '56px'
            }}
          >
            Agregar al Pedido
          </button>
        </div>
      </div>
    </div>
  )
}

ProductModal.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    nombre: PropTypes.string.isRequired,
    descripcion: PropTypes.string,
    precio: PropTypes.number.isRequired,
    categoria: PropTypes.string
  }),
  extras: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    nombre: PropTypes.string.isRequired,
    precio: PropTypes.number.isRequired
  })),
  onClose: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired
}

export default ProductModal
