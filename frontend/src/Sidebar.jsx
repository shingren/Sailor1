import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true)
  const { rol } = useAuth()
  const location = useLocation()

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }

  // Update CSS custom property when sidebar state changes
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isExpanded ? '240px' : '60px'
    )
  }, [isExpanded])

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="切换侧边栏">
        ≡
      </button>

      {isExpanded && (
        <nav className="sidebar-nav">
          <Link to="/" className={`sidebar-link ${isActive('/') ? 'active' : ''}`}>
            首页
          </Link>
          <Link to="/mesas" className={`sidebar-link ${isActive('/mesas') ? 'active' : ''}`}>
            餐桌
          </Link>
          <Link to="/floorplan" className={`sidebar-link ${isActive('/floorplan') ? 'active' : ''}`}>
            餐桌平面图
          </Link>
          <Link to="/productos" className={`sidebar-link ${isActive('/productos') ? 'active' : ''}`}>
            商品
          </Link>
          <Link to="/pedidos" className={`sidebar-link ${isActive('/pedidos') ? 'active' : ''}`}>
            订单
          </Link>
          <Link to="/cocina" className={`sidebar-link ${isActive('/cocina') ? 'active' : ''}`}>
            后厨
          </Link>
          <Link to="/facturas" className={`sidebar-link ${isActive('/facturas') ? 'active' : ''}`}>
            账单
          </Link>
          <Link to="/inventario" className={`sidebar-link ${isActive('/inventario') ? 'active' : ''}`}>
            库存
          </Link>
          <Link to="/reservas" className={`sidebar-link ${isActive('/reservas') ? 'active' : ''}`}>
            预订
          </Link>
          <Link to="/reportes" className={`sidebar-link ${isActive('/reportes') ? 'active' : ''}`}>
            报表
          </Link>
          {(rol === 'ADMIN' || rol === 'CAJA') && (
            <Link to="/cierre-caja" className={`sidebar-link ${isActive('/cierre-caja') ? 'active' : ''}`}>
              收银结算
            </Link>
          )}
          {rol === 'ADMIN' && (
            <Link to="/staff" className={`sidebar-link ${isActive('/staff') ? 'active' : ''}`}>
              员工
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}

export default Sidebar
