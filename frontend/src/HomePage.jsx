import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function HomePage() {
  const [healthStatus, setHealthStatus] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then(response => response.json())
      .then(data => setHealthStatus(data.status))
      .catch(err => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="alert alert-error">
        Error al cargar estado del sistema: {error}
      </div>
    )
  }

  return (
    <div>
      <div className="home-hero">
        <h1>餐饮系统</h1>
        {healthStatus && (
          <div className="alert alert-success">
            系统状态: <strong>{healthStatus}</strong>
          </div>
        )}
        {!healthStatus && <div className="loading">正在检查系统状态...</div>}
      </div>

      <div className="quick-links">
        <Link to="/mesas" className="quick-link-card">
          <h3>餐桌</h3>
          <p>管理餐桌和用餐区域</p>
        </Link>

        <Link to="/productos" className="quick-link-card">
          <h3>商品</h3>
          <p>管理商品、菜品和饮品</p>
        </Link>

        <Link to="/pedidos" className="quick-link-card">
          <h3>订单</h3>
          <p>创建和管理顾客订单</p>
        </Link>

        <Link to="/cocina" className="quick-link-card">
          <h3>后厨</h3>
          <p>查看后厨订单和制作状态</p>
        </Link>

        <Link to="/facturas" className="quick-link-card">
          <h3>账单</h3>
          <p>管理结账、付款和发票</p>
        </Link>

        <Link to="/inventario" className="quick-link-card">
          <h3>库存</h3>
          <p>管理原料、库存和配方</p>
        </Link>

        <Link to="/reservas" className="quick-link-card">
          <h3>预订</h3>
          <p>管理餐桌预约</p>
        </Link>

        <Link to="/reportes" className="quick-link-card">
          <h3>报表</h3>
          <p>查看营业分析和经营报表</p>
        </Link>
      </div>
    </div>
  )
}

export default HomePage
