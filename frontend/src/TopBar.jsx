import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

function TopBar() {
  const { isAuthenticated, getAuthHeader } = useAuth()
  const [kpis, setKpis] = useState(null)

  const fetchKpis = async () => {
    if (!isAuthenticated) return

    try {
      const dashboardResponse = await fetch('/api/dashboard/resumen-hoy', {
        headers: {
          Authorization: getAuthHeader()
        }
      })

      let dashboardData = {}

      if (dashboardResponse.ok) {
        dashboardData = await dashboardResponse.json()
      }

      const mesasResponse = await fetch('/api/mesas', {
        headers: {
          Authorization: getAuthHeader()
        }
      })

      let occupiedTablesCount = 0

      if (mesasResponse.ok) {
        const mesas = await mesasResponse.json()

        occupiedTablesCount = mesas.filter(mesa =>
          String(mesa.estado || '').trim().toLowerCase() === 'ocupada'
        ).length
      }

      setKpis({
        ...dashboardData,
        openTablesCount: occupiedTablesCount
      })
    } catch (err) {
      console.error('获取 KPI 数据失败:', err)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return

    fetchKpis()

    const interval = setInterval(fetchKpis, 60000)

    window.addEventListener('dashboard-refresh', fetchKpis)

    return () => {
      clearInterval(interval)
      window.removeEventListener('dashboard-refresh', fetchKpis)
    }
  }, [isAuthenticated, getAuthHeader])

  if (!isAuthenticated || !kpis) {
    return null
  }

  const formatCurrency = (amount) => {
    return `${Number(amount || 0).toFixed(2)} 元`
  }

  return (
    <div className="topbar">
      <div className="kpi-card kpi-sales">
        <div>今日销售额</div>
        <strong>{formatCurrency(kpis.todayTotalSales)}</strong>
      </div>

      <div className="kpi-card kpi-tables">
        <div>已占用餐桌</div>
        <strong>{kpis.openTablesCount}</strong>
      </div>

      <div className="kpi-card kpi-orders">
        <div>待处理订单</div>
        <strong>{kpis.pendingOrdersCount}</strong>
      </div>
    </div>
  )
}

export default TopBar