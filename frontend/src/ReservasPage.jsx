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
        setError('Failed to fetch data')
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
      setError('Error fetching data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReserva = async (e) => {
    e.preventDefault()
    setError('')

    if (!newReserva.mesaId) {
      setError('Please select a mesa')
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
        setError('Mesa ya reservada en ese horario')
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        setError('Failed to create reserva: ' + errorText)
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
      setError('Error creating reserva: ' + err.message)
    }
  }

  const handleCancelar = async (id) => {
    setError('')
    try {
      const response = await fetch(`/api/reservas/${id}/cancelar`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader()
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        setError('Failed to cancel reserva: ' + errorText)
        return
      }

      fetchData()
    } catch (err) {
      setError('Error canceling reserva: ' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Reservas</h2>
          <p>You must log in to view this page</p>
          <Link to="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>Reservas - Reservations</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>Create Reservation</h2>
        </div>

        <form onSubmit={handleCreateReserva}>
          <label htmlFor="reserva-mesa">
            Mesa:
          </label>
          <select
            id="reserva-mesa"
            value={newReserva.mesaId}
            onChange={(e) => setNewReserva({ ...newReserva, mesaId: e.target.value })}
            required
          >
            <option value="">-- Select Mesa --</option>
            {mesas.map(mesa => (
              <option key={mesa.id} value={mesa.id}>
                {mesa.codigo} (Capacidad: {mesa.capacidad})
              </option>
            ))}
          </select>
          <label htmlFor="reserva-cliente">
            Cliente Nombre:
          </label>
          <input
            id="reserva-cliente"
            type="text"
            value={newReserva.clienteNombre}
            onChange={(e) => setNewReserva({ ...newReserva, clienteNombre: e.target.value })}
            required
          />
          <label htmlFor="reserva-telefono">
            Teléfono:
          </label>
          <input
            id="reserva-telefono"
            type="text"
            value={newReserva.clienteTelefono}
            onChange={(e) => setNewReserva({ ...newReserva, clienteTelefono: e.target.value })}
          />
          <label htmlFor="reserva-fecha">
            Fecha:
          </label>
          <input
            id="reserva-fecha"
            type="date"
            value={newReserva.fecha}
            onChange={(e) => setNewReserva({ ...newReserva, fecha: e.target.value })}
            required
          />
          <label htmlFor="reserva-hora-inicio">
            Hora Inicio:
          </label>
          <input
            id="reserva-hora-inicio"
            type="time"
            value={newReserva.horaInicio}
            onChange={(e) => setNewReserva({ ...newReserva, horaInicio: e.target.value })}
            required
          />
          <label htmlFor="reserva-hora-fin">
            Hora Fin:
          </label>
          <input
            id="reserva-hora-fin"
            type="time"
            value={newReserva.horaFin}
            onChange={(e) => setNewReserva({ ...newReserva, horaFin: e.target.value })}
            required
          />
          <label htmlFor="reserva-personas">
            Personas:
          </label>
          <input
            id="reserva-personas"
            type="number"
            min="1"
            value={newReserva.cantidadPersonas}
            onChange={(e) => setNewReserva({ ...newReserva, cantidadPersonas: parseInt(e.target.value) })}
            required
          />
          <button type="submit" className="btn-primary">Create Reservation</button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>List Reservations</h2>
        </div>

        {loading ? (
          <div className="loading">Loading</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Mesa</th>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Personas</th>
                <th>Estado</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservas.length === 0 ? (
                <tr>
                  <td colSpan="9">No reservas found</td>
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
                        {reserva.estado}
                      </span>
                    </td>
                    <td>
                      {reserva.estado === 'RESERVADO' ? (
                        <button onClick={() => handleCancelar(reserva.id)} className="btn-danger btn-small">Cancelar</button>
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
