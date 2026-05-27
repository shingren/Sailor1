import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Link } from 'react-router-dom'

function FacturasPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()

  const [facturas, setFacturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [pagoForms, setPagoForms] = useState({})
  const [cuentasListasFacturar, setCuentasListasFacturar] = useState([])

  useEffect(() => {
    if (isAuthenticated) {
      fetchFacturas()
      fetchCuentasListasFacturar()
    }
  }, [isAuthenticated])

  const formatCurrency = (amount) => {
    return `${Number(amount || 0).toFixed(2)} 元`
  }

  const getEstadoText = (estado) => {
    const estadoMap = {
      PENDIENTE: '待付款',
      PAGADA: '已付款',
      PAGADO: '已付款',
      COMPLETADA: '已完成',
      CANCELADA: '已取消',
      CANCELADO: '已取消',
      ANULADA: '已作废',
      ANULADO: '已作废'
    }

    return estadoMap[estado] || estado || '-'
  }

  const getMetodoPagoText = (metodo) => {
    const metodoMap = {
      EFECTIVO: '现金',
      TARJETA: '银行卡',
      TRANSFERENCIA: '转账'
    }

    return metodoMap[metodo] || metodo || '-'
  }

  const fetchFacturas = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/facturas', {
        headers: {
          Authorization: getAuthHeader()
        }
      })

      if (!response.ok) {
        throw new Error('加载账单失败')
      }

      const data = await response.json()
      setFacturas(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchCuentasListasFacturar = async () => {
    try {
      const response = await fetch('/api/cuentas/listas-facturar', {
        headers: {
          Authorization: getAuthHeader()
        }
      })

      if (!response.ok) {
        throw new Error('加载待结账账单失败')
      }

      const data = await response.json()
      setCuentasListasFacturar(data)
    } catch (err) {
      console.error(err)
    }
  }

  const validarMesaListaParaFacturar = async (mesaId) => {
    if (!mesaId) {
      return true
    }

    const response = await fetch(`/api/pedidos/mesa/${mesaId}/lista-para-facturar`, {
      headers: {
        Authorization: getAuthHeader()
      }
    })

    if (!response.ok) {
      throw new Error('验证餐桌是否可以结账失败')
    }

    return await response.json()
  }

  const generarFacturaFromCuenta = async (cuentaId) => {
    setError('')
    setSuccessMessage('')

    const cuenta = cuentasListasFacturar.find(c => c.id === cuentaId)

    if (!cuenta) {
      setError('没有找到该账单')
      return
    }

    try {
      if (cuenta.mesaId) {
        const mesaLista = await validarMesaListaParaFacturar(cuenta.mesaId)

        if (!mesaLista) {
          setError('无法结账：还有菜品未上菜')
          fetchCuentasListasFacturar()
          return
        }
      }

      const confirmMessage =
        `确定要为餐桌 ${cuenta.mesaCodigo} 生成账单吗？\n\n` +
        `预计总额：${formatCurrency(cuenta.totalEstimado)}\n\n` +
        `此操作无法撤销。`

      if (!window.confirm(confirmMessage)) {
        return
      }

      const response = await fetch(`/api/facturas/cuenta/${cuentaId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAuthHeader()
        },
        body: JSON.stringify({
          esConsumidorFinal: true
        })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || '生成账单失败')
      }

      const data = await response.json()

      setSuccessMessage(`账单 #${data.id} 生成成功`)
      fetchFacturas()
      fetchCuentasListasFacturar()
    } catch (err) {
      setError(err.message)
    }
  }

  const registrarPago = async (facturaId) => {
    const factura = facturas.find(f => f.id === facturaId)
    const form = pagoForms[facturaId] || {}

    const monto = form.monto || factura?.saldoPendiente || factura?.total
    const metodo = form.metodo || 'EFECTIVO'
    
    if (!monto || Number(monto) <= 0) {
      setError('付款金额必须大于 0')
      return
    }

    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/pagos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAuthHeader()
        },
        body: JSON.stringify({
          facturaId: facturaId,
          monto: parseFloat(monto),
          metodo: metodo
        })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || '登记付款失败')
      }

      await response.json()

      setSuccessMessage('付款登记成功')

      setPagoForms(prev => ({
        ...prev,
        [facturaId]: {}
      }))

      fetchFacturas()
      fetchCuentasListasFacturar()

      window.dispatchEvent(new Event('dashboard-refresh'))
    } catch (err) {
      setError(err.message)
    }
  }

  const imprimirCuenta = async (cuentaId) => {
    if (!cuentaId) {
      setError('该账单没有关联的餐桌账单，无法打印就餐详单')
      return
    }

    try {
      const response = await fetch(`/api/cuentas/${cuentaId}/ticket`, {
        headers: {
          Authorization: getAuthHeader()
        }
      })

      if (!response.ok) {
        alert('生成就餐详单失败')
        return
      }

      const text = await response.text()

      const printWindow = window.open('', '', 'width=420,height=600')

      if (!printWindow) {
        alert('浏览器阻止了打印窗口，请允许弹出窗口')
        return
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>就餐详单</title>
            <style>
              body {
                font-family: monospace;
                white-space: pre-wrap;
                font-size: 15px;
                padding: 16px;
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
      }, 300)
    } catch (err) {
      alert('错误：' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>账单</h2>
          <p>请先登录后再查看此页面</p>
          <Link to="/login" className="btn-primary">去登录</Link>
        </div>
      </div>
    )
  }

  const facturasPendientes = facturas.filter(f =>
    f.estado === 'PENDIENTE'
  )

  const facturasHistoricas = facturas.filter(f =>
    f.estado !== 'PENDIENTE'
  )

  return (
    <div style={{ padding: '20px' }}>
      <h1>账单结算</h1>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '10px' }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: '10px' }}>
          {successMessage}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">待结账账单</h2>
        </div>

        {cuentasListasFacturar.length === 0 ? (
          <p className="text-muted">暂无待结账账单</p>
        ) : (
          cuentasListasFacturar.map(cuenta => (
            <div
              key={cuenta.id}
              style={{
                border: '1px solid #ccc',
                padding: '12px',
                marginBottom: '10px',
                borderRadius: '6px',
                backgroundColor: '#fff'
              }}
            >
              <div>
                <strong>餐桌 {cuenta.mesaCodigo}</strong>
              </div>

              <div>
                预计总额：{formatCurrency(cuenta.totalEstimado)}
              </div>

              {cuenta.totalPedidos !== undefined && (
                <div>
                  订单数量：{cuenta.totalPedidos}
                </div>
              )}

              {cuenta.pedidosEntregados !== undefined && (
                <div>
                  已上菜订单：{cuenta.pedidosEntregados}
                </div>
              )}

              <button
                onClick={() => generarFacturaFromCuenta(cuenta.id)}
                className="btn-primary"
                style={{ marginTop: '10px' }}
              >
                生成账单
              </button>
            </div>
          ))
        )}
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h2 className="card-title">待付款账单</h2>
        </div>

        {loading ? (
          <p>正在加载...</p>
        ) : facturasPendientes.length === 0 ? (
          <p className="text-muted">暂无待付款账单</p>
        ) : (
          facturasPendientes.map(factura => (
            <div
              key={factura.id}
              style={{
                border: '1px solid #ccc',
                padding: '12px',
                marginBottom: '10px',
                borderRadius: '6px',
                backgroundColor: '#fff'
              }}
            >
              <div>
                <strong>账单 #{factura.id}</strong> - {getEstadoText(factura.estado)}
              </div>

              <div>合计：{formatCurrency(factura.total)}</div>
              <div>未付余额：{formatCurrency(factura.saldoPendiente)}</div>

              {factura.estado === 'PENDIENTE' && (
                <div
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}
                >
                  <input
                    type="number"
                    placeholder="付款金额"
                    value={
                      pagoForms[factura.id]?.monto ??
                      Number(factura.saldoPendiente || factura.total || 0).toFixed(2)
                    }
                    onChange={(e) =>
                      setPagoForms(prev => ({
                        ...prev,
                        [factura.id]: {
                          ...prev[factura.id],
                          monto: e.target.value
                        }
                      }))
                    }
                    style={{
                      width: '160px',
                      padding: '8px'
                    }}
                  />

                  <select
                    value={pagoForms[factura.id]?.metodo || 'EFECTIVO'}
                    onChange={(e) =>
                      setPagoForms(prev => ({
                        ...prev,
                        [factura.id]: {
                          ...prev[factura.id],
                          metodo: e.target.value
                        }
                      }))
                    }
                    style={{
                      width: '160px',
                      padding: '8px'
                    }}
                  >
                    <option value="EFECTIVO">{getMetodoPagoText('EFECTIVO')}</option>
                    <option value="TARJETA">{getMetodoPagoText('TARJETA')}</option>
                    <option value="TRANSFERENCIA">{getMetodoPagoText('TRANSFERENCIA')}</option>
                  </select>

                  <button
                    onClick={() => registrarPago(factura.id)}
                    className="btn-success"
                  >
                    登记付款
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h2 className="card-title">历史账单</h2>
        </div>

        {loading ? (
          <p>正在加载...</p>
        ) : facturasHistoricas.length === 0 ? (
          <p className="text-muted">暂无历史账单</p>
        ) : (
          facturasHistoricas.map(factura => (
            <div
              key={factura.id}
              style={{
                border: '1px solid #ddd',
                padding: '12px',
                marginBottom: '10px',
                borderRadius: '6px',
                backgroundColor: '#fafafa'
              }}
            >
              <h3>账单 #{factura.id} - {getEstadoText(factura.estado)}</h3>
              <p>合计：{formatCurrency(factura.total)}</p>
              <p>未付余额：{formatCurrency(factura.saldoPendiente)}</p>

              <button
                className="btn-secondary"
                onClick={() => imprimirCuenta(factura.cuentaId)}
              >
                打印就餐详单
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default FacturasPage