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
        系统状态加载失败：{error}
      </div>
    )
  }

  const quickLinks = [
    {
      path: '/mesas',
      title: '餐桌管理',
      desc: '管理餐桌状态，为顾客安排就坐'
    },
    {
      path: '/floorplan',
      title: '餐桌平面图',
      desc: '查看餐厅区域和餐桌使用情况'
    },
    {
      path: '/productos',
      title: '菜单管理',
      desc: '维护菜品、价格和制作工位'
    },
    {
      path: '/pedidos',
      title: '点餐订单',
      desc: '服务员为顾客创建点餐订单'
    },
    {
      path: '/cocina',
      title: '后厨任务',
      desc: '按热菜、冷菜、主食等工位处理菜品'
    },
    {
      path: '/facturas',
      title: '账单结算',
      desc: '顾客用餐结束后确认账单并付款'
    }
  ]

  return (
    <div>
      <section className="home-hero">
        <h1>人工点餐系统</h1>
        <p>面向餐厅服务员、后厨和收银流程的本地点餐管理系统</p>

        {healthStatus ? (
          <div className="alert alert-success">
            系统状态：正常运行
          </div>
        ) : (
          <div className="alert alert-info">
            正在检查系统状态...
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-header">
          <h2>核心功能</h2>
        </div>

        <div className="quick-links">
          {quickLinks.map(item => (
            <Link key={item.path} to={item.path} className="quick-link-card">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage