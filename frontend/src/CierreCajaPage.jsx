import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'

function CierreCajaPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [resumenDia, setResumenDia] = useState(null)

  const [formData, setFormData] = useState({
    saldoReal: '',
    saldoInicial: '0'
  })

  const [historial, setHistorial] = useState([])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchResumenDia()
    fetchHistorial()
  }, [isAuthenticated])

  const fetchResumenDia = async () => {
    setError(null)
    try {
      const saldoInicial = formData.saldoInicial || '0'
      const response = await fetch(`/api/cierre-caja/resumen-dia?saldoInicial=${saldoInicial}`, {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.status === 401 || response.status === 403) {
        setError('未授权，请以收银员或管理员身份登录')
        return
      }

      if (!response.ok) {
        setError('加载今日汇总失败')
        return
      }

      const data = await response.json()
      setResumenDia(data)
    } catch (err) {
      setError('加载今日汇总失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistorial = async () => {
    try {
      const response = await fetch('/api/cierre-caja', {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.ok) {
        const data = await response.json()
        setHistorial(data)
      }
    } catch (err) {
      console.error('加载结算历史失败：', err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    if (name === 'saldoInicial') {
      setTimeout(fetchResumenDia, 300)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.saldoReal || formData.saldoReal === '') {
      setError('请填写实际金额')
      return
    }

    try {
      const response = await fetch('/api/cierre-caja', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          saldoReal: parseFloat(formData.saldoReal),
          saldoInicial: parseFloat(formData.saldoInicial || 0)
        })
      })

      if (response.status === 401 || response.status === 403) {
        setError('未授权，请以收银员或管理员身份登录')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.message || '创建结算记录失败')
        return
      }

      setSuccess('结算登记成功！')
      setFormData({ saldoReal: '', saldoInicial: '0' })

      fetchResumenDia()
      fetchHistorial()
    } catch (err) {
      setError('创建结算记录失败：' + err.message)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>收银结算</h2>
          <p>请以收银员或管理员身份登录后再查看此页面。</p>
          <Link to="/login" className="btn-primary">去登录</Link>
        </div>
      </div>
    )
  }

  if (loading) return <div className="loading">正在加载收银结算...</div>

  return (
    <div>
      <h1>收银结算</h1>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">今日汇总</h2>
        </div>

        {resumenDia && (
          <div>
            <p><strong>日期：</strong> {formatDate(resumenDia.fecha)}</p>

            <table>
              <tbody>
                <tr>
                  <td><strong>今日销售总额：</strong></td>
                  <td>{formatCurrency(resumenDia.totalVentasDia)}</td>
                </tr>
                <tr>
                  <td><strong>现金总额：</strong></td>
                  <td>{formatCurrency(resumenDia.totalEfectivo)}</td>
                </tr>
                <tr>
                  <td><strong>银行卡总额：</strong></td>
                  <td>{formatCurrency(resumenDia.totalTarjeta)}</td>
                </tr>
                <tr>
                  <td><strong>账单数量：</strong></td>
                  <td>{resumenDia.cantidadFacturas}</td>
                </tr>
                <tr>
                  <td><strong>应收金额：</strong></td>
                  <td>{formatCurrency(resumenDia.saldoEsperado)}</td>
                </tr>
              </tbody>
            </table>

            {resumenDia.cierreExiste && (
              <div className="alert alert-warning mt-2">
                今天已经登记过结算。
              </div>
            )}
          </div>
        )}
      </div>

      {resumenDia && !resumenDia.cierreExiste && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">登记今日结算</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="saldoInicial">初始金额</label>
                <input
                  id="saldoInicial"
                  name="saldoInicial"
                  type="number"
                  step="0.01"
                  value={formData.saldoInicial}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="saldoReal">实际金额（点现金额）*</label>
                <input
                  id="saldoReal"
                  name="saldoReal"
                  type="number"
                  step="0.01"
                  value={formData.saldoReal}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {formData.saldoReal && resumenDia && (
              <div className="alert alert-info mt-2">
                <p>
                  <strong>差额：</strong>{' '}
                  {formatCurrency(parseFloat(formData.saldoReal) - resumenDia.saldoEsperado)}
                </p>
              </div>
            )}

            <button type="submit" className="btn-primary">
              登记结算
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">结算历史</h2>
        </div>

        {historial.length === 0 ? (
          <p className="text-muted">暂无结算记录</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>销售额</th>
                <th>现金</th>
                <th>银行卡</th>
                <th>账单数量</th>
                <th>应收金额</th>
                <th>实际金额</th>
                <th>差额</th>
                <th>操作员</th>
              </tr>
            </thead>

            <tbody>
              {historial.map((cierre) => (
                <tr key={cierre.id}>
                  <td>{formatDate(cierre.fecha)}</td>
                  <td>{formatCurrency(cierre.totalVentasDia)}</td>
                  <td>{formatCurrency(cierre.totalEfectivo)}</td>
                  <td>{formatCurrency(cierre.totalTarjeta)}</td>
                  <td>{cierre.cantidadFacturas}</td>
                  <td>{formatCurrency(cierre.saldoEsperado)}</td>
                  <td>{formatCurrency(cierre.saldoReal)}</td>
                  <td className={cierre.diferencia !== 0 ? (cierre.diferencia > 0 ? 'badge-green' : 'badge-red') : ''}>
                    {formatCurrency(cierre.diferencia)}
                  </td>
                  <td>{cierre.usuarioEmail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default CierreCajaPage