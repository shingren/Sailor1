import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true)
  const location = useLocation()

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isExpanded ? '240px' : '60px'
    )
  }, [isExpanded])

  const isActive = (path) => {
    return location.pathname === path
  }

  const navItems = [
    { path: '/', label: '首页' },
    { path: '/mesas', label: '餐桌管理' },
    { path: '/floorplan', label: '餐桌平面图' },
    { path: '/productos', label: '菜单管理' },
    { path: '/pedidos', label: '点餐订单' },
    { path: '/cocina', label: '后厨任务' },
    { path: '/facturas', label: '账单结算' }
  ]

  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        ≡
      </button>

      {isExpanded && (
        <>
          <div className="sidebar-brand">
            <div className="sidebar-brand-title">人工点餐系统</div>
            <div className="sidebar-brand-subtitle">Restaurant POS</div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </aside>
  )
}

export default Sidebar