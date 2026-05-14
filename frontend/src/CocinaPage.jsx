import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Link } from 'react-router-dom'

function CocinaPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()

  const [selectedStation, setSelectedStation] = useState('HOT')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const getEstacionText = (estacion) => {
    const estacionMap = {
      HOT: '热菜',
      COLD: '冷菜',
      PASTRY: '主食'
    }

    return estacionMap[estacion] || estacion || '热菜'
  }

  const getEstadoText = (estado) => {
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
        setError('未授权，请重新登录')
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError('加载后厨菜品失败')
        setLoading(false)
        return
      }

      const data = await response.json()
      setItems(data)
    } catch (err) {
      setError('加载菜品失败：' + err.message)
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
        setError('未授权，请重新登录')
        return
      }

      if (!response.ok) {
        setError('开始制作失败')
        return
      }

      fetchItemsByStation(selectedStation)
    } catch (err) {
      setError('开始制作失败：' + err.message)
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
        setError('未授权，请重新登录')
        return
      }

      if (!response.ok) {
        setError('标记为完成失败')
        return
      }

      fetchItemsByStation(selectedStation)
    } catch (err) {
      setError('标记完成失败：' + err.message)
    }
  }

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'badge-yellow'
      case 'PREPARACION':
      case 'EN_PREPARACION':
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
          开始制作
        </button>
      )
    }

    if (item.estado === 'PREPARACION' || item.estado === 'EN_PREPARACION') {
      return (
        <button
          onClick={() => marcarListo(item.itemId)}
          className="btn-success btn-small"
        >
          标记完成
        </button>
      )
    }

    if (item.estado === 'LISTO') {
      return (
        <span style={{ color: '#059669', fontWeight: 'bold' }}>
          等待上菜
        </span>
      )
    }

    return <span>-</span>
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>后厨</h2>
          <p>请先登录后再查看此页面</p>
          <Link to="/login" className="btn-primary">去登录</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>后厨 - 工位面板</h1>

      <p className="text-muted" style={{ fontSize: '0.9rem' }}>
        每 10 秒自动刷新一次
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>选择制作工位</h2>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['HOT', 'COLD', 'PASTRY'].map((station) => (
            <button
              key={station}
              type="button"
              onClick={() => setSelectedStation(station)}
              className={selectedStation === station ? 'btn-primary' : 'btn-secondary'}
            >
              {getEstacionText(station)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>{getEstacionText(selectedStation)}工位菜品</h2>
        </div>

        {loading ? (
          <div className="loading">正在加载...</div>
        ) : items.length === 0 ? (
          <p className="text-muted">当前工位暂无菜品</p>
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
                    <strong style={{ fontSize: '1.1rem' }}>
                      {item.productoNombre}
                    </strong>

                    <span style={{ marginLeft: '15px' }}>
                      餐桌：<strong>{item.mesaCodigo}</strong>
                    </span>

                    <span style={{ marginLeft: '15px' }}>
                      数量：<strong>{item.cantidad}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge ${getEstadoBadgeClass(item.estado)}`}>
                      {getEstadoText(item.estado)}
                    </span>

                    {renderActionButton(item)}
                  </div>
                </div>

                <div style={{ fontSize: '0.95rem', color: '#4b5563' }}>
                  <div>
                    <strong>订单 ID：</strong> {item.pedidoId}
                  </div>

                  <div>
                    <strong>制作工位：</strong> {getEstacionText(item.estacion)}
                  </div>

                  <div>
                    <strong>备注：</strong>{' '}
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
        <h3>状态流程</h3>

        <p>
          <span className="badge badge-yellow">待处理</span>
          {' → '}
          <span className="badge badge-blue">制作中</span>
          {' → '}
          <span className="badge badge-green">已完成</span>
        </p>
      </div>
    </div>
  )
}

export default CocinaPage