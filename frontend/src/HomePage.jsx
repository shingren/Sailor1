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
      <div className="quick-links">
        <Link to="/mesas" className="quick-link-card">
          <h3>餐桌管理</h3>
          <p>管理餐桌状态和用餐区域</p>
        </Link>

        <Link to="/productos" className="quick-link-card">
          <h3>菜单管理</h3>
          <p>维护菜品、价格和制作工位</p>
        </Link>

        <Link to="/pedidos" className="quick-link-card">
          <h3>点餐订单</h3>
          <p>服务员为顾客创建点餐订单</p>
        </Link>

        <Link to="/cocina" className="quick-link-card">
          <h3>后厨任务</h3>
          <p>按热菜、冷菜、主食等工位处理订单</p>
        </Link>

        <Link to="/facturas" className="quick-link-card">
          <h3>账单结算</h3>
          <p>顾客用餐结束后确认账单并付款</p>
        </Link>
      </div>
    </div>
  )
}

export default HomePage
