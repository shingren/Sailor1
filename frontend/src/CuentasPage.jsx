import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

function CuentasPage() {
  const { getAuthHeader } = useAuth()
  const [cuentas, setCuentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCuentas = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/cuentas/abiertas', {
        headers: { Authorization: getAuthHeader() }
      })

      if (!response.ok) {
        setError('Error al cargar cuentas')
        return
      }

      const data = await response.json()
      setCuentas(data)
    } catch (err) {
      setError('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCuentas()
  }, [])

  const imprimirCuenta = async (cuentaId) => {
    try {
      const response = await fetch(`/api/cuentas/${cuentaId}/ticket`, {
        headers: { Authorization: getAuthHeader() }
      })

      if (!response.ok) {
        alert('Error al generar ticket de cuenta')
        return
      }

      const text = await response.text()
      const printWindow = window.open('', '', 'width=400,height=600')

      if (!printWindow) {
        alert('El navegador bloqueó la ventana de impresión')
        return
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Cuenta</title>
            <style>
              body {
                font-family: monospace;
                font-size: 14px;
                padding: 10px;
              }
              pre {
                white-space: pre-wrap;
                font-family: monospace;
              }
            </style>
          </head>
          <body><pre>${text}</pre></body>
        </html>
      `)

      printWindow.document.close()
      printWindow.focus()

      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 300)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const pagarCuenta = async (cuentaId) => {
    const confirmar = window.confirm('¿Confirmar pago de esta cuenta?')

    if (!confirmar) return

    try {
      const response = await fetch(`/api/cuentas/${cuentaId}/pagar`, {
        method: 'POST',
        headers: { Authorization: getAuthHeader() }
      })

      if (!response.ok) {
        alert('Error al confirmar pago')
        return
      }

      alert('Cuenta pagada correctamente')
      fetchCuentas()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <div>
      <h1>Cuentas / Cobro</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Cuentas abiertas</h2>
        </div>

        {loading ? (
          <div className="loading">Cargando cuentas...</div>
        ) : cuentas.length === 0 ? (
          <p>No hay cuentas abiertas</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cuenta</th>
                <th>Mesa</th>
                <th>Estado</th>
                <th>Pedidos</th>
                <th>Pendientes</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cuentas.map(cuenta => (
                <tr key={cuenta.id}>
                  <td>#{cuenta.id}</td>
                  <td>{cuenta.mesaCodigo}</td>
                  <td>
                    <span className="badge badge-green">
                      {cuenta.estado}
                    </span>
                  </td>
                  <td>{cuenta.totalPedidos}</td>
                  <td>{cuenta.pedidosPendientes}</td>
                  <td>
                    <strong>${Number(cuenta.totalEstimado || 0).toFixed(2)}</strong>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-secondary btn-small"
                      onClick={() => imprimirCuenta(cuenta.id)}
                    >
                      🧾 Imprimir cuenta
                    </button>

                    <button
                      type="button"
                      className="btn-success btn-small"
                      style={{ marginLeft: '8px' }}
                      onClick={() => pagarCuenta(cuenta.id)}
                    >
                      💰 Confirmar pago
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default CuentasPage