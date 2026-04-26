import React, { useState, useEffect } from 'react'
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
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0)
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
        throw new Error('Error al cargar facturas')
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
        throw new Error('Error al cargar cuentas')
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
      throw new Error('Error al validar si la mesa está lista para facturar')
    }

    return await response.json()
  }

  const generarFacturaFromCuenta = async (cuentaId) => {
    setError('')
    setSuccessMessage('')

    const cuenta = cuentasListasFacturar.find(c => c.id === cuentaId)

    if (!cuenta) {
      setError('No se encontró la cuenta')
      return
    }

    try {
      if (cuenta.mesaId) {
        const mesaLista = await validarMesaListaParaFacturar(cuenta.mesaId)

        if (!mesaLista) {
          setError('No se puede facturar: hay platos pendientes por servir')
          fetchCuentasListasFacturar()
          return
        }
      }

      const confirmMessage =
        `¿Confirmas generar la factura para la cuenta de Mesa ${cuenta.mesaCodigo}?\n\n` +
        `Total estimado: ${formatCurrency(cuenta.totalEstimado)}\n\n` +
        `Esta acción no se puede deshacer.`

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
        throw new Error(text || 'Error al generar factura')
      }

      const data = await response.json()

      setSuccessMessage(`Factura #${data.id} generada correctamente`)
      fetchFacturas()
      fetchCuentasListasFacturar()
    } catch (err) {
      setError(err.message)
    }
  }

  const registrarPago = async (facturaId) => {
    const form = pagoForms[facturaId] || {}

    if (!form.monto || !form.metodo) {
      setError('Completa monto y método')
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
        throw new Error(text || 'Error al registrar pago')
      }

      await response.json()

      setSuccessMessage('Pago registrado correctamente')

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
      <div>
        <h2>Debes iniciar sesión</h2>
        <Link to="/login">Ir a Login</Link>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Facturas</h1>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{ color: 'green', marginBottom: '10px' }}>
          {successMessage}
        </div>
      )}

      <h2>Cuentas listas para facturar</h2>

      {cuentasListasFacturar.length === 0 ? (
        <p>No hay cuentas listas</p>
      ) : (
        cuentasListasFacturar.map(cuenta => (
          <div
            key={cuenta.id}
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '6px'
            }}
          >
            <div>
              <strong>Mesa {cuenta.mesaCodigo}</strong>
            </div>

            <div>
              Total estimado: {formatCurrency(cuenta.totalEstimado)}
            </div>

            {cuenta.totalPedidos !== undefined && (
              <div>
                Pedidos: {cuenta.totalPedidos}
              </div>
            )}

            {cuenta.pedidosEntregados !== undefined && (
              <div>
                Pedidos entregados: {cuenta.pedidosEntregados}
              </div>
            )}

            <button
              onClick={() => generarFacturaFromCuenta(cuenta.id)}
              style={{ marginTop: '10px' }}
            >
              Generar Factura
            </button>
          </div>
        ))
      )}

      <h2 style={{ marginTop: '30px' }}>Facturas</h2>

      {loading ? (
        <p>Cargando...</p>
      ) : facturas.length === 0 ? (
        <p>No hay facturas</p>
      ) : (
        facturas.map(factura => (
          <div
            key={factura.id}
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '6px'
            }}
          >
            <div>
              <strong>Factura #{factura.id}</strong> - {factura.estado}
            </div>

            <div>Total: {formatCurrency(factura.total)}</div>
            <div>Saldo: {formatCurrency(factura.saldoPendiente)}</div>

            {factura.estado === 'PENDIENTE' && (
              <div style={{ marginTop: '10px' }}>
                <input
                  type="number"
                  placeholder="Monto"
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
                  style={{ marginRight: '6px' }}
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
                  style={{ marginRight: '6px' }}
                >
                  <option value="">Método</option>
                  <option value="EFECTIVO">EFECTIVO</option>
                  <option value="TARJETA">TARJETA</option>
                </select>

                <button onClick={() => registrarPago(factura.id)}>
                  Registrar Pago
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default FacturasPage