import { useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate, Link } from 'react-router-dom'

function FloorplanPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  const [mesas, setMesas] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [selectedMesas, setSelectedMesas] = useState([])
  const [draggedMesa, setDraggedMesa] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 700 })

  // Canvas transform state
  const [scale, setScale] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  const TABLE_RADIUS = 30

  // Resize canvas to fit container
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const width = Math.max(containerWidth - 40, 1200) // Min 1200px
        const height = Math.max(700, Math.min(800, window.innerHeight - 400))
        setCanvasSize({ width, height })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!loading && mesas.length > 0) {
      drawCanvas()
    }
  }, [mesas, selectedLocation, scale, panOffset, selectedMesas, canvasSize])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [mesasRes, locationsRes] = await Promise.all([
        fetch('/api/mesas', { headers: { 'Authorization': getAuthHeader() } }),
        fetch('/api/locations', { headers: { 'Authorization': getAuthHeader() } })
      ])

      if (mesasRes.ok) {
        const mesasData = await mesasRes.json()
        // Initialize positions for mesas that don't have them
        const initializedMesas = mesasData.map((mesa, index) => {
          if (mesa.positionX === null || mesa.positionY === null) {
            return {
              ...mesa,
              positionX: 100 + (index % 10) * 100,
              positionY: 100 + Math.floor(index / 10) * 100
            }
          }
          return mesa
        })
        setMesas(initializedMesas)
      }

      if (locationsRes.ok) {
        const locationsData = await locationsRes.json()
        setLocations(locationsData)
        // Set first location as default if available
        if (locationsData.length > 0 && !selectedLocation) {
          setSelectedLocation(locationsData[0].id)
        }
      }
    } catch (err) {
      setError('加载数据失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getMesaStatus = (mesa) => {
    // Use mesa's estado directly
    if (mesa.estado === 'disponible') {
      return 'FREE'
    } else if (mesa.estado === 'ocupada' || mesa.estado === 'OCUPADA') {
      return 'OCCUPIED'
    } else if (mesa.estado === 'reservada') {
      return 'RESERVED'
    }
    return 'FREE'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'FREE':
        return '#10b981' // green
      case 'OCCUPIED':
        return '#ef4444' // red
      case 'RESERVED':
        return '#f59e0b' // amber
      default:
        return '#6b7280' // gray
    }
  }

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)

    // Apply transformations
    ctx.save()
    ctx.translate(panOffset.x, panOffset.y)
    ctx.scale(scale, scale)

    // Draw grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1 / scale
    for (let x = 0; x < canvasSize.width; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasSize.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvasSize.height; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvasSize.width, y)
      ctx.stroke()
    }

    // Filter mesas by selected location
    const locationMesas = selectedLocation
      ? mesas.filter(m => m.location?.id === selectedLocation)
      : mesas.filter(m => !m.location) // Show mesas without location if no location selected

    // Draw tables
    locationMesas.forEach(mesa => {
      const status = getMesaStatus(mesa)
      const color = getStatusColor(status)
      const x = mesa.positionX || 100
      const y = mesa.positionY || 100

      // Draw table circle
      ctx.beginPath()
      ctx.arc(x, y, TABLE_RADIUS, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()

      // Highlight if selected
      if (selectedMesas.includes(mesa.id)) {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 4 / scale
        ctx.stroke()
      } else {
        ctx.strokeStyle = '#1f2937'
        ctx.lineWidth = 2 / scale
        ctx.stroke()
      }

      // Draw lock indicator if locked
      if (mesa.isLocked) {
        ctx.fillStyle = '#dc2626' // red
        ctx.font = `bold ${16 / scale}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🔒', x + TABLE_RADIUS - 10, y - TABLE_RADIUS + 10)
      }

      // Draw group indicator if joined
      if (mesa.groupId) {
        ctx.fillStyle = '#3b82f6'
        ctx.beginPath()
        ctx.arc(x - TABLE_RADIUS + 10, y - TABLE_RADIUS + 10, 6, 0, 2 * Math.PI)
        ctx.fill()
      }

      // Draw table code
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${14 / scale}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(mesa.codigo, x, y)
    })

    ctx.restore()
  }

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - panOffset.x) / scale
    const y = (e.clientY - rect.top - panOffset.y) / scale
    return { x, y }
  }

  const findMesaAtPosition = (x, y) => {
    const locationMesas = selectedLocation
      ? mesas.filter(m => m.location?.id === selectedLocation)
      : mesas.filter(m => !m.location)
    return locationMesas.find(mesa => {
      const mx = mesa.positionX || 100
      const my = mesa.positionY || 100
      const distance = Math.sqrt((x - mx) ** 2 + (y - my) ** 2)
      return distance <= TABLE_RADIUS
    })
  }

  const handleCanvasMouseDown = (e) => {
    const { x, y } = getCanvasCoordinates(e)
    const mesa = findMesaAtPosition(x, y)

    if (e.shiftKey && mesa) {
      // Shift+click for multi-select
      if (selectedMesas.includes(mesa.id)) {
        setSelectedMesas(selectedMesas.filter(id => id !== mesa.id))
      } else {
        setSelectedMesas([...selectedMesas, mesa.id])
      }
    } else if (mesa) {
      // Check if mesa is locked
      if (mesa.isLocked) {
        // Can't drag locked mesa, but can select it
        setSelectedMesas([mesa.id])
      } else {
        // Start dragging
        setDraggedMesa(mesa)
        setDragOffset({
          x: x - (mesa.positionX || 100),
          y: y - (mesa.positionY || 100)
        })
        setSelectedMesas([mesa.id])
      }
    } else {
      // Start panning
      setIsPanning(true)
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
      setSelectedMesas([])
    }
  }

  const handleCanvasMouseMove = (e) => {
    if (draggedMesa) {
      const { x, y } = getCanvasCoordinates(e)
      const newX = x - dragOffset.x
      const newY = y - dragOffset.y

      setMesas(mesas.map(m =>
        m.id === draggedMesa.id
          ? { ...m, positionX: newX, positionY: newY }
          : m
      ))
      // Update draggedMesa to reflect new position
      setDraggedMesa({ ...draggedMesa, positionX: newX, positionY: newY })
    } else if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }

  const handleCanvasMouseUp = async () => {
    if (draggedMesa) {
      // Save position to backend with current draggedMesa state
      try {
        await fetch(`/api/mesas/${draggedMesa.id}/position`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': getAuthHeader()
          },
          body: JSON.stringify({
            positionX: draggedMesa.positionX,
            positionY: draggedMesa.positionY
          })
        })
      } catch (err) {
        console.error('保存位置失败：', err)
      }
      setDraggedMesa(null)
    }
    setIsPanning(false)
  }

  const handleToggleLock = async () => {
    if (selectedMesas.length !== 1) {
      alert('请选择一张餐桌进行锁定或解锁')
      return
    }

    try {
      const response = await fetch(`/api/mesas/${selectedMesas[0]}/lock`, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader()
        }
      })

      if (response.ok) {
        fetchData()
      }
    } catch (err) {
      setError('锁定或解锁餐桌失败：' + err.message)
    }
  }

  const handleJoinTables = async () => {
    if (selectedMesas.length < 2) {
      alert('请至少选择 2 张餐桌进行合并，可以使用 Shift + 点击多选')
      return
    }

    try {
      const response = await fetch('/api/mesas/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({ mesaIds: selectedMesas })
      })

      if (response.ok) {
        fetchData()
        setSelectedMesas([])
      }
    } catch (err) {
      setError('合并餐桌失败：' + err.message)
    }
  }

  const handleSplitTable = async () => {
    if (selectedMesas.length !== 1) {
      alert('请选择一张餐桌进行分离')
      return
    }

    try {
      const response = await fetch(`/api/mesas/${selectedMesas[0]}/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        }
      })

      if (response.ok) {
        fetchData()
        setSelectedMesas([])
      }
    } catch (err) {
      setError('分离餐桌失败：' + err.message)
    }
  }

  const handleOpenOrder = () => {
    if (selectedMesas.length !== 1) {
      alert('请选择一张餐桌来打开订单')
      return
    }
    // Navigate to pedidos page with mesa preselected
    navigate(`/pedidos?mesaId=${selectedMesas[0]}`)
  }

  const handleZoomToLocation = (locationId) => {
    setSelectedLocation(locationId)
    setScale(1.2)
    setPanOffset({ x: 0, y: 0 })
  }

  const handleResetView = () => {
    setScale(1)
    setPanOffset({ x: 0, y: 0 })
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>餐桌平面图</h2>
          <p>请先登录后再查看此页面</p>
          <Link to="/login" className="btn-primary">去登录</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>餐桌平面图</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Controls */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Location Selection */}
          <div>
            <label htmlFor="location-select" style={{ marginRight: '10px' }}>区域：</label>
            <select
              id="location-select"
              value={selectedLocation || ''}
              onChange={(e) => setSelectedLocation(e.target.value ? parseInt(e.target.value) : null)}
              style={{ padding: '8px' }}
            >
              <option value="">-- 无区域 --</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {/* Zoom Controls */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className="btn-secondary btn-small">
              放大
            </button>
            <button onClick={() => setScale(s => Math.max(s - 0.1, 0.5))} className="btn-secondary btn-small">
              缩小
            </button>
            <button onClick={handleResetView} className="btn-secondary btn-small">
              重置视图
            </button>
          </div>

          {/* Quick Zoom to Locations */}
          {locations.length > 0 && (
            <div style={{ display: 'flex', gap: '5px' }}>
              {locations.map(location => (
                <button
                  key={location.id}
                  onClick={() => handleZoomToLocation(location.id)}
                  className="btn-secondary btn-small"
                >
                  前往 {location.name}
                </button>
              ))}
            </div>
          )}

          {/* Table Actions */}
          <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
            <button onClick={handleJoinTables} className="btn-primary btn-small" disabled={selectedMesas.length < 2}>
              合并餐桌 ({selectedMesas.length})
            </button>
            <button onClick={handleSplitTable} className="btn-secondary btn-small" disabled={selectedMesas.length !== 1}>
              分离餐桌
            </button>
            <button
              onClick={handleToggleLock}
              className="btn-warning btn-small"
              disabled={selectedMesas.length !== 1}
              title={selectedMesas.length === 1 && mesas.find(m => m.id === selectedMesas[0])?.isLocked ? '解锁餐桌' : '锁定餐桌'}
            >
              {selectedMesas.length === 1 && mesas.find(m => m.id === selectedMesas[0])?.isLocked ? '解锁' : '锁定'}
            </button>
            <button onClick={handleOpenOrder} className="btn-success btn-small" disabled={selectedMesas.length !== 1}>
              打开订单
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <strong>状态图例：</strong>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
            <span>空闲</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
            <span>已占用</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
            <span>已预订</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '3px solid #3b82f6', backgroundColor: '#fff' }}></div>
            <span>已合并餐桌（蓝点）</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>锁定</span>
            <span>已锁定餐桌（固定位置）</span>
          </div>
        </div>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>
          <strong>Consejo:</strong> 点击并拖动可以移动餐桌。按住 Shift 并点击可以选择多个餐桌。点击空白区域并拖动可以移动平面图。已锁定的餐桌不能拖动。餐桌状态请在“餐桌”页面中管理。
        </p>
      </div>

      {/* Canvas */}
      <div className="card" ref={containerRef}>
        {loading ? (
          <div className="loading">正在加载餐桌平面图...</div>
        ) : (
          <div style={{ overflow: 'hidden', border: '2px solid #e5e7eb', borderRadius: '8px' }}>
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              style={{ cursor: draggedMesa ? 'grabbing' : isPanning ? 'grabbing' : 'grab', display: 'block' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default FloorplanPage
