import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

function ReportesPage() {
  const { getAuthHeader } = useAuth()

  const [ventasDia, setVentasDia] = useState(null)
  const [ventasProducto, setVentasProducto] = useState([])
  const [pedidosEstado, setPedidosEstado] = useState([])
  const [consumoInsumos, setConsumoInsumos] = useState([])
  const [reservasDia, setReservasDia] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReportes()
  }, [])

  const fetchReportes = async () => {
    setLoading(true)
    setError('')

    try {
      const headers = {
        'Authorization': getAuthHeader()
      }

      const [ventasDiaRes, ventasProductoRes, pedidosEstadoRes, consumoInsumosRes, reservasDiaRes] = await Promise.all([
        fetch('/api/reportes/ventas-dia', { headers }),
        fetch('/api/reportes/ventas-producto', { headers }),
        fetch('/api/reportes/pedidos-estado', { headers }),
        fetch('/api/reportes/consumo-insumos-dia', { headers }),
        fetch('/api/reportes/reservas-dia', { headers })
      ])

      if (!ventasDiaRes.ok || !ventasProductoRes.ok || !pedidosEstadoRes.ok || !consumoInsumosRes.ok || !reservasDiaRes.ok) {
        throw new Error('Failed to fetch reports')
      }

      const ventasDiaData = await ventasDiaRes.json()
      const ventasProductoData = await ventasProductoRes.json()
      const pedidosEstadoData = await pedidosEstadoRes.json()
      const consumoInsumosData = await consumoInsumosRes.json()
      const reservasDiaData = await reservasDiaRes.json()

      setVentasDia(ventasDiaData)
      setVentasProducto(ventasProductoData)
      setPedidosEstado(pedidosEstadoData)
      setConsumoInsumos(consumoInsumosData)
      setReservasDia(reservasDiaData)
    } catch (err) {
      setError('Error loading reports: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <h1>Reportes y Análisis</h1>
        <div className="loading">Loading</div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1>Reportes y Análisis</h1>
        <div className="alert alert-error">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <h1>Reportes y Análisis</h1>

      <div className="card">
        <div className="card-header">
          <h2>A. Ventas del Día</h2>
        </div>
        {ventasDia ? (
          <div>
            <p><strong>Fecha:</strong> {ventasDia.fecha}</p>
            <p><strong>Total Ventas:</strong> ${ventasDia.totalVentas.toFixed(2)}</p>
            <p className="text-muted">Total sales for today: ${ventasDia.totalVentas.toFixed(2)}</p>
          </div>
        ) : (
          <p>No sales data available</p>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>B. Ventas por Producto</h2>
        </div>
        {ventasProducto.length === 0 ? (
          <p>No sales data available</p>
        ) : (
          <div>
            <p className="text-muted">Top selling products: {ventasProducto.length} products sold</p>
            <table>
              <thead>
                <tr>
                  <th>Producto ID</th>
                  <th>Producto</th>
                  <th>Cantidad Vendida</th>
                </tr>
              </thead>
              <tbody>
                {ventasProducto.map(vp => (
                  <tr key={vp.productoId}>
                    <td>{vp.productoId}</td>
                    <td>{vp.productoNombre}</td>
                    <td><strong>{vp.cantidadVendida}</strong> items</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>C. Pedidos por Estado</h2>
        </div>
        {pedidosEstado.length === 0 ? (
          <p>No pedidos data available</p>
        ) : (
          <div>
            <p className="text-muted">Order status breakdown: {pedidosEstado.reduce((sum, pe) => sum + pe.cantidad, 0)} total orders</p>
            <table>
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {pedidosEstado.map(pe => (
                  <tr key={pe.estado}>
                    <td>
                      <span className={`badge ${
                        pe.estado === 'PENDIENTE' ? 'badge-yellow' :
                        pe.estado === 'PREPARACION' ? 'badge-blue' :
                        pe.estado === 'LISTO' ? 'badge-green' :
                        'badge-gray'
                      }`}>
                        {pe.estado}
                      </span>
                    </td>
                    <td><strong>{pe.cantidad}</strong> orders</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>D. Consumo de Insumos (Hoy)</h2>
        </div>
        {consumoInsumos.length === 0 ? (
          <p>No consumption data for today</p>
        ) : (
          <div>
            <p className="text-muted">Ingredients used today: {consumoInsumos.length} different ingredients</p>
            <table>
              <thead>
                <tr>
                  <th>Insumo ID</th>
                  <th>Insumo</th>
                  <th>Cantidad Consumida</th>
                  <th>Unidad</th>
                </tr>
              </thead>
              <tbody>
                {consumoInsumos.map(ci => (
                  <tr key={ci.insumoId}>
                    <td>{ci.insumoId}</td>
                    <td>{ci.insumoNombre}</td>
                    <td><strong>{ci.cantidadConsumida.toFixed(2)}</strong></td>
                    <td>{ci.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>E. Reservas del Día</h2>
        </div>
        {reservasDia.length === 0 ? (
          <p>No reservations for today</p>
        ) : (
          <div>
            <p className="text-muted">Today's reservations: {reservasDia.length} bookings</p>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Mesa ID</th>
                  <th>Hora Inicio</th>
                  <th>Hora Fin</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {reservasDia.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.clienteNombre}</td>
                    <td>{r.mesaId}</td>
                    <td>{r.horaInicio}</td>
                    <td>{r.horaFin}</td>
                    <td>
                      <span className={`badge ${
                        r.estado === 'RESERVADO' ? 'badge-green' :
                        r.estado === 'CANCELADO' ? 'badge-red' :
                        'badge-gray'
                      }`}>
                        {r.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportesPage
