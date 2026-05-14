import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Link } from 'react-router-dom'

function ReservasPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()

  const [reservas, setReservas] = useState([])
  const [mesas, setMesas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newReserva, setNewReserva] = useState({
    mesaId: '',
    clienteNombre: '',
    clienteTelefono: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    cantidadPersonas: 1
  })

  const getEstadoText = (estado) => {
    const estadoMap = {
      RESERVADO: '已预订',
      CANCELADO: '已取消',
      CONFIRMADO: '已确认',
      PENDIENTE: '待确认',
      COMPLETADO: '已完成'
    }

    return estadoMap[estado] || estado || '-'
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const [reservasRes, mesasRes] = await Promise.all([
        fetch('/api/reservas', { headers: { 'Authorization': getAuthHeader() } }),
        fetch('/api/mesas', { headers: { 'Authorization': getAuthHeader() } })
      ])

      if (!reservasRes.ok || !mesasRes.ok) {
        setError('加载数据失败')
        setLoading(false)
        return
      }

      const [reservasData, mesasData] = await Promise.all([
        reservasRes.json(),
        mesasRes.json()
      ])

      setReservas(reservasData)
      setMesas(mesasData)
    } catch (err) {
      setError('加载数据失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReserva = async (e) => {
    e.preventDefault()
    setError('')

    if (!newReserva.mesaId) {
      setError('请选择餐桌')
      return
    }

    try {
      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          mesaId: parseInt(newReserva.mesaId),
          clienteNombre: newReserva.clienteNombre,
          clienteTelefono: newReserva.clienteTelefono,
          fecha: newReserva.fecha,
          horaInicio: newReserva.horaInicio,
          horaFin: newReserva.horaFin,
          cantidadPersonas: parseInt(newReserva.cantidadPersonas)
        })
      })

      if (response.status === 400) {
        setError('该餐桌在这个时间段已经被预订')
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        setError('创建预订失败：' + errorText)
        return
      }

      setNewReserva({
        mesaId: '',
        clienteNombre: '',
        clienteTelefono: '',
        fecha: '',
        horaInicio: '',
        horaFin: '',
        cantidadPersonas: 1
      })

      fetchData()
    } catch (err) {
      setError('创建预订失败：' + err.message)
    }
  }

  const handleCancelar = async (id) => {
    setError('')

    if (!window.confirm('确定要取消这个预订吗？')) {
      return
    }

    try {
      const response = await fetch(`/api/reservas/${id}/cancelar`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader()
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        setError('取消预订失败：' + errorText)
        return
      }

      fetchData()
    } catch (err) {
      setError('取消预订失败：' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>预订</h2>
          <p>请先登录后再查看此页面</p>
          <Link to="/login" className="btn-primary">去登录</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>预订管理</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>创建预订</h2>
        </div>

        <form onSubmit={handleCreateReserva}>
          <label htmlFor="reserva-mesa">
            餐桌：
          </label>
          <select
            id="reserva-mesa"
            value={newReserva.mesaId}
            onChange={(e) => setNewReserva({ ...newReserva, mesaId: e.target.value })}
            required
          >
            <option value="">-- 选择餐桌 --</option>
            {mesas.map(mesa => (
              <option key={mesa.id} value={mesa.id}>
                {mesa.codigo}（容量：{mesa.capacidad}）
              </option>
            ))}
          </select>

          <label htmlFor="reserva-cliente">
            客户姓名：
          </label>
          <input
            id="reserva-cliente"
            type="text"
            value={newReserva.clienteNombre}
            onChange={(e) => setNewReserva({ ...newReserva, clienteNombre: e.target.value })}
            required
          />

          <label htmlFor="reserva-telefono">
            电话：
          </label>
          <input
            id="reserva-telefono"
            type="text"
            value={newReserva.clienteTelefono}
            onChange={(e) => setNewReserva({ ...newReserva, clienteTelefono: e.target.value })}
          />

          <label htmlFor="reserva-fecha">
            日期：
          </label>
          <input
            id="reserva-fecha"
            type="date"
            value={newReserva.fecha}
            onChange={(e) => setNewReserva({ ...newReserva, fecha: e.target.value })}
            required
          />

          <label htmlFor="reserva-hora-inicio">
            开始时间：
          </label>
          <input
            id="reserva-hora-inicio"
            type="time"
            value={newReserva.horaInicio}
            onChange={(e) => setNewReserva({ ...newReserva, horaInicio: e.target.value })}
            required
          />

          <label htmlFor="reserva-hora-fin">
            结束时间：
          </label>
          <input
            id="reserva-hora-fin"
            type="time"
            value={newReserva.horaFin}
            onChange={(e) => setNewReserva({ ...newReserva, horaFin: e.target.value })}
            required
          />

          <label htmlFor="reserva-personas">
            人数：
          </label>
          <input
            id="reserva-personas"
            type="number"
            min="1"
            value={newReserva.cantidadPersonas}
            onChange={(e) => setNewReserva({ ...newReserva, cantidadPersonas: parseInt(e.target.value) })}
            required
          />

          <button type="submit" className="btn-primary">
            创建预订
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>预订列表</h2>
        </div>

        {loading ? (
          <div className="loading">正在加载...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>餐桌</th>
                <th>客户</th>
                <th>电话</th>
                <th>日期</th>
                <th>时间</th>
                <th>人数</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>

            <tbody>
              {reservas.length === 0 ? (
                <tr>
                  <td colSpan="9">未找到预订</td>
                </tr>
              ) : (
                reservas.map(reserva => (
                  <tr key={reserva.id}>
                    <td>{reserva.id}</td>
                    <td>{reserva.mesaCodigo}</td>
                    <td>{reserva.clienteNombre}</td>
                    <td>{reserva.clienteTelefono || '-'}</td>
                    <td>{reserva.fecha}</td>
                    <td>{reserva.horaInicio} - {reserva.horaFin}</td>
                    <td>{reserva.cantidadPersonas}</td>
                    <td>
                      <span className={`badge ${
                        reserva.estado === 'RESERVADO' ? 'badge-green' :
                        reserva.estado === 'CANCELADO' ? 'badge-red' :
                        'badge-gray'
                      }`}>
                        {getEstadoText(reserva.estado)}
                      </span>
                    </td>
                    <td>
                      {reserva.estado === 'RESERVADO' ? (
                        <button
                          onClick={() => handleCancelar(reserva.id)}
                          className="btn-danger btn-small"
                        >
                          取消
                        </button>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default ReservasPage