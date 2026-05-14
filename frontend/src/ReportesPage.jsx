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

  const getEstadoPedidoText = (estado) => {
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

  const getEstadoReservaText = (estado) => {
    const estadoMap = {
      RESERVADO: '已预订',
      CANCELADO: '已取消',
      CONFIRMADO: '已确认',
      PENDIENTE: '待确认',
      COMPLETADO: '已完成'
    }

    return estadoMap[estado] || estado || '-'
  }

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
        throw new Error('加载报表失败')
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
      setError('加载报表失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <h1>报表与分析</h1>
        <div className="loading">正在加载...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1>报表与分析</h1>
        <div className="alert alert-error">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <h1>报表与分析</h1>

      <div className="card">
        <div className="card-header">
          <h2>今日销售额</h2>
        </div>

        {ventasDia ? (
          <div>
            <p><strong>日期：</strong> {ventasDia.fecha}</p>
            <p><strong>销售总额：</strong> ${Number(ventasDia.totalVentas || 0).toFixed(2)}</p>
          </div>
        ) : (
          <p>暂无销售数据</p>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>按商品统计销售</h2>
        </div>

        {ventasProducto.length === 0 ? (
          <p>暂无销售数据</p>
        ) : (
          <div>
            <p className="text-muted">已售商品种类：{ventasProducto.length}</p>

            <table>
              <thead>
                <tr>
                  <th>商品 ID</th>
                  <th>商品</th>
                  <th>销售数量</th>
                </tr>
              </thead>

              <tbody>
                {ventasProducto.map(vp => (
                  <tr key={vp.productoId}>
                    <td>{vp.productoId}</td>
                    <td>{vp.productoNombre}</td>
                    <td><strong>{vp.cantidadVendida}</strong> 件</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>按状态统计订单</h2>
        </div>

        {pedidosEstado.length === 0 ? (
          <p>暂无订单数据</p>
        ) : (
          <div>
            <p className="text-muted">
              订单总数：{pedidosEstado.reduce((sum, pe) => sum + pe.cantidad, 0)}
            </p>

            <table>
              <thead>
                <tr>
                  <th>状态</th>
                  <th>数量</th>
                </tr>
              </thead>

              <tbody>
                {pedidosEstado.map(pe => (
                  <tr key={pe.estado}>
                    <td>
                      <span className={`badge ${
                        pe.estado === 'PENDIENTE' ? 'badge-yellow' :
                        pe.estado === 'PREPARACION' || pe.estado === 'EN_PREPARACION' ? 'badge-blue' :
                        pe.estado === 'LISTO' ? 'badge-green' :
                        pe.estado === 'ENTREGADO' ? 'badge-green' :
                        'badge-gray'
                      }`}>
                        {getEstadoPedidoText(pe.estado)}
                      </span>
                    </td>

                    <td><strong>{pe.cantidad}</strong> 个订单</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>今日原料消耗</h2>
        </div>

        {consumoInsumos.length === 0 ? (
          <p>今日暂无原料消耗数据</p>
        ) : (
          <div>
            <p className="text-muted">今日使用原料种类：{consumoInsumos.length}</p>

            <table>
              <thead>
                <tr>
                  <th>原料 ID</th>
                  <th>原料</th>
                  <th>消耗数量</th>
                  <th>单位</th>
                </tr>
              </thead>

              <tbody>
                {consumoInsumos.map(ci => (
                  <tr key={ci.insumoId}>
                    <td>{ci.insumoId}</td>
                    <td>{ci.insumoNombre}</td>
                    <td><strong>{Number(ci.cantidadConsumida || 0).toFixed(2)}</strong></td>
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
          <h2>今日预订</h2>
        </div>

        {reservasDia.length === 0 ? (
          <p>今日暂无预订</p>
        ) : (
          <div>
            <p className="text-muted">今日预订数量：{reservasDia.length}</p>

            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>客户</th>
                  <th>餐桌 ID</th>
                  <th>开始时间</th>
                  <th>结束时间</th>
                  <th>状态</th>
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
                        {getEstadoReservaText(r.estado)}
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