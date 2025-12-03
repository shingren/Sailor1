import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Link } from 'react-router-dom'

function CocinaPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()

  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) return

    fetchActivePedidos()

    const interval = setInterval(() => {
      fetchActivePedidos()
    }, 10000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const fetchActivePedidos = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/pedidos/activos', {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.status === 401) {
        setError('No autorizado - por favor inicia sesión nuevamente')
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError('Error al cargar pedidos activos')
        setLoading(false)
        return
      }

      const data = await response.json()
      setPedidos(data)
    } catch (err) {
      setError('Error fetching pedidos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    setError('')
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (response.status === 401) {
        setError('No autorizado - por favor inicia sesión nuevamente')
        return
      }

      if (!response.ok) {
        try {
          const errorData = await response.json()
          setError(`Error al cambiar estado: ${errorData.error || 'Error desconocido'}`)
        } catch {
          const errorText = await response.text()
          setError(`Error al cambiar estado: ${errorText}`)
        }
        return
      }

      fetchActivePedidos()
    } catch (err) {
      setError('Error al cambiar estado: ' + err.message)
    }
  }

  const getEstadoButton = (pedido) => {
    switch (pedido.estado) {
      case 'PENDIENTE':
        return (
          <button onClick={() => cambiarEstado(pedido.id, 'PREPARACION')} className="btn-primary btn-small">
            Pasar a Preparación
          </button>
        )
      case 'PREPARACION':
        return (
          <button onClick={() => cambiarEstado(pedido.id, 'LISTO')} className="btn-success btn-small">
            Marcar como Listo
          </button>
        )
      case 'LISTO':
        return (
          <button onClick={() => cambiarEstado(pedido.id, 'ENTREGADO')} className="btn-secondary btn-small">
            Marcar como Entregado
          </button>
        )
      case 'ENTREGADO':
        return <span>-</span>
      default:
        return <span>-</span>
    }
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
      <h1>Cocina - Panel de Operaciones</h1>
      <p className="text-muted" style={{ fontSize: '0.9rem' }}>Actualización automática cada 10 segundos</p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>Pedidos activos</h2>
        </div>
        {loading && pedidos.length === 0 ? (
          <div className="loading">Cargando</div>
        ) : pedidos.length === 0 ? (
          <p className="text-muted">No hay pedidos activos</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pedidos.map(pedido => (
              <div key={pedido.id} style={{ border: '2px solid #e5e7eb', borderRadius: '8px', padding: '15px', backgroundColor: '#f9fafb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>Pedido #{pedido.id}</strong>
                    <span style={{ marginLeft: '15px' }}>Mesa: <strong>{pedido.mesaCodigo}</strong></span>
                    <span style={{ marginLeft: '15px' }}>{new Date(pedido.fechaHora).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge ${
                      pedido.estado === 'PENDIENTE' ? 'badge-yellow' :
                      pedido.estado === 'PREPARACION' ? 'badge-blue' :
                      pedido.estado === 'LISTO' ? 'badge-green' :
                      'badge-gray'
                    }`}>
                      {pedido.estado}
                    </span>
                    {getEstadoButton(pedido)}
                  </div>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <strong>Detalles del pedido:</strong>
                  <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                    {pedido.items.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '5px' }}>
                        <strong>{item.cantidad}x</strong> {item.productoNombre || `Producto ID: ${item.productoId}`}
                      </li>
                    ))}
                  </ul>

                  {pedido.observaciones && (
                    <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#fff3cd', borderLeft: '3px solid #ffc107', borderRadius: '4px' }}>
                      <strong>Observaciones:</strong> {pedido.observaciones}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Flujo de Estados</h3>
        <p>
          <span className="badge badge-yellow">PENDIENTE</span>
          {' → '}
          <span className="badge badge-blue">PREPARACIÓN</span>
          {' → '}
          <span className="badge badge-green">LISTO</span>
          {' → '}
          <span className="badge badge-gray">ENTREGADO</span>
        </p>
      </div>
    </div>
  )
}

export default CocinaPage
