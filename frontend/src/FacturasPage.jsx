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
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0)
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
    const form = pagoForms[facturaId] || {}

    if (!form.monto || !form.metodo) {
      setError('请填写付款金额和付款方式')
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
          monto: parseFloat(form.monto),
          metodo: form.metodo
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
    } catch (err) {
      setError(err.message)
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

  return (
    <div style={{ padding: '20px' }}>
      <h1>账单</h1>

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
          <h2 className="card-title">账单记录</h2>
        </div>

        {loading ? (
          <p>正在加载...</p>
        ) : facturas.length === 0 ? (
          <p className="text-muted">暂无账单</p>
        ) : (
          facturas.map(factura => (
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
                    value={pagoForms[factura.id]?.monto || ''}
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
                    value={pagoForms[factura.id]?.metodo || ''}
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
                    <option value="">付款方式</option>
                    <option value="EFECTIVO">{getMetodoPagoText('EFECTIVO')}</option>
                    <option value="TARJETA">{getMetodoPagoText('TARJETA')}</option>
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
    </div>
  )
}

export default FacturasPage