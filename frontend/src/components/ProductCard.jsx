import PropTypes from 'prop-types'

function ProductCard({ product, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(product)}
      className="product-card"
      style={{
        padding: '20px',
        border: '2px solid #e5e7eb',
        backgroundColor: '#fff',
        borderRadius: '12px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minHeight: '140px',
        ':hover': {
          borderColor: '#3b82f6',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#3b82f6'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e5e7eb'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Product Name */}
      <div style={{
        fontWeight: 'bold',
        fontSize: '1.1rem',
        color: '#111827',
        lineHeight: '1.4'
      }}>
        {product.nombre}
      </div>

      {/* Category Badge (optional) */}
      {product.categoria && (
        <div style={{
          fontSize: '0.75rem',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: '600'
        }}>
          {product.categoria}
        </div>
      )}

      {/* Description (truncated) */}
      {product.descripcion && (
        <div style={{
          fontSize: '0.9rem',
          color: '#6b7280',
          lineHeight: '1.4',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          flex: 1
        }}>
          {product.descripcion}
        </div>
      )}

      {/* Price */}
      <div style={{
        color: '#059669',
        fontSize: '1.3rem',
        fontWeight: 'bold',
        marginTop: 'auto'
      }}>
        ${product.precio.toFixed(2)}
      </div>
    </button>
  )
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    nombre: PropTypes.string.isRequired,
    descripcion: PropTypes.string,
    precio: PropTypes.number.isRequired,
    categoria: PropTypes.string,
    activo: PropTypes.bool
  }).isRequired,
  onClick: PropTypes.func.isRequired
}

export default ProductCard
