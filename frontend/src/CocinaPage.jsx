import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Link } from 'react-router-dom'

function CocinaPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()

  const [selectedStation, setSelectedStation] = useState('HOT')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) return

    fetchItemsByStation(selectedStation)

    const interval = setInterval(() => {
      fetchItemsByStation(selectedStation)
    }, 10000)

    return () => clearInterval(interval)
  }, [isAuthenticated, selectedStation])

  const fetchItemsByStation = async (station) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/cocina/items?estacion=${station}`, {
        headers: {
          'Authorization': getAuthHeader()
        }
      })

      if (response.status === 401) {
        setError('No autorizado - por favor inicia sesión nuevamente')
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError('Error al cargar items de cocina')
        setLoading(false)
        return
      }

      const data = await response.json()
      setItems(data)
    } catch (err) {
      setError('Error al cargar items: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const iniciarItem = async (itemId) => {
    setError('')

    try {
      const response = await fetch(`/api/cocina/items/${itemId}/iniciar`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader()
        }
      })

      if (response.status === 401) {
        setError('No autorizado - por favor inicia sesión nuevamente')
        return
      }

      if (!response.ok) {
        setError('Error al iniciar preparación')
        return
      }

      fetchItemsByStation(selectedStation)
    } catch (err) {
      setError('Error al iniciar preparación: ' + err.message)
    }
  }

  const marcarListo = async (itemId) => {
    setError('')

    try {
      const response = await fetch(`/api/cocina/items/${itemId}/listo`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader()
        }
      })

      if (response.status === 401) {
        setError('No autorizado - por favor inicia sesión nuevamente')
        return
      }

      if (!response.ok) {
        setError('Error al marcar item como listo')
        return
      }

      fetchItemsByStation(selectedStation)
    } catch (err) {
      setError('Error al marcar listo: ' + err.message)
    }
  }

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'badge-yellow'
      case 'PREPARACION':
        return 'badge-blue'
      case 'LISTO':
        return 'badge-green'
      default:
        return 'badge-gray'
    }
  }

  const renderActionButton = (item) => {
    if (item.estado === 'PENDIENTE') {
      return (
        <button
          onClick={() => iniciarItem(item.itemId)}
          className="btn-primary btn-small"
        >
          Iniciar
        </button>
      )
    }

    if (item.estado === 'PREPARACION') {
      return (
        <button
          onClick={() => marcarListo(item.itemId)}
          className="btn-success btn-small"
        >
          Listo
        </button>
      )
    }

    if (item.estado === 'LISTO') {
      return <span style={{ color: '#059669', fontWeight: 'bold' }}>Esperando entrega</span>
    }

    return <span>-</span>
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Cocina</h2>
          <p>Debes iniciar sesión para ver esta página</p>
          <Link to="/login" className="btn-primary">Ir a Iniciar Sesión</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>Cocina - Panel por Estación</h1>
      <p className="text-muted" style={{ fontSize: '0.9rem' }}>
        Actualización automática cada 10 segundos
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>Seleccionar estación</h2>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['HOT', 'COLD', 'PASTRY'].map((station) => (
            <button
              key={station}
              type="button"
              onClick={() => setSelectedStation(station)}
              className={selectedStation === station ? 'btn-primary' : 'btn-secondary'}
            >
              {station}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Items de {selectedStation}</h2>
        </div>

        {loading ? (
          <div className="loading">Cargando</div>
        ) : items.length === 0 ? (
          <p className="text-muted">No hay items para esta estación</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {items.map((item) => (
              <div
                key={item.itemId}
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#f9fafb'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: '10px'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>{item.productoNombre}</strong>
                    <span style={{ marginLeft: '15px' }}>
                      Mesa: <strong>{item.mesaCodigo}</strong>
                    </span>
                    <span style={{ marginLeft: '15px' }}>
                      Cantidad: <strong>{item.cantidad}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge ${getEstadoBadgeClass(item.estado)}`}>
                      {item.estado}
                    </span>
                    {renderActionButton(item)}
                  </div>
                </div>

                <div style={{ fontSize: '0.95rem', color: '#4b5563' }}>
                  <div><strong>Pedido ID:</strong> {item.pedidoId}</div>
                  <div><strong>Estación:</strong> {item.estacion}</div>
                  <div>
                    <strong>Observaciones:</strong>{' '}
                    {item.observaciones && item.observaciones.trim() !== ''
                      ? item.observaciones
                      : '-'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Flujo de estados</h3>
        <p>
          <span className="badge badge-yellow">PENDIENTE</span>
          {' → '}
          <span className="badge badge-blue">PREPARACION</span>
          {' → '}
          <span className="badge badge-green">LISTO</span>
        </p>
      </div>
    </div>
  )
}

export default CocinaPage