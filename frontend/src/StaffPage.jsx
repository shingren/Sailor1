import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'

const ROLES = ['ADMIN', 'MESERO', 'COCINA', 'CAJA', 'INVENTARIO', 'GERENCIA']

function StaffPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Form state for creating user
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    rol: 'MESERO'
  })

  // State for role updates (indexed by usuario ID)
  const [roleUpdates, setRoleUpdates] = useState({})

  useEffect(() => {
    if (!isAuthenticated) return
    fetchUsuarios()
  }, [isAuthenticated])

  const fetchUsuarios = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/usuarios', {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.status === 401 || response.status === 403) {
        setError('Not authorized - please log in as ADMIN')
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError('Failed to fetch usuarios')
        setLoading(false)
        return
      }

      const data = await response.json()
      setUsuarios(data)

      // Initialize role updates state
      const updates = {}
      data.forEach(u => {
        updates[u.id] = u.rol
      })
      setRoleUpdates(updates)
    } catch (err) {
      setError('Error fetching usuarios: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(newUser)
      })

      if (response.status === 401 || response.status === 403) {
        setError('Not authorized - please log in as ADMIN')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(`Failed to create user: ${errorData.error || 'Unknown error'}`)
        return
      }

      setSuccess(`Usuario "${newUser.email}" created successfully!`)
      setNewUser({ email: '', password: '', rol: 'MESERO' })
      fetchUsuarios()
    } catch (err) {
      setError('Error creating user: ' + err.message)
    }
  }

  const handleUpdateRol = async (usuarioId) => {
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/usuarios/${usuarioId}/rol`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({ rol: roleUpdates[usuarioId] })
      })

      if (response.status === 401 || response.status === 403) {
        setError('Not authorized - please log in as ADMIN')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(`Failed to update rol: ${errorData.error || 'Unknown error'}`)
        return
      }

      setSuccess('Rol updated successfully!')
      fetchUsuarios()
    } catch (err) {
      setError('Error updating rol: ' + err.message)
    }
  }

  const handleDelete = async (usuarioId, email) => {
    if (!confirm(`¿Estás seguro de eliminar el usuario "${email}"?`)) {
      return
    }

    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/usuarios/${usuarioId}`, {
        method: 'DELETE',
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.status === 401 || response.status === 403) {
        setError('Not authorized - please log in as ADMIN')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(`Failed to delete user: ${errorData.error || 'Unknown error'}`)
        return
      }

      setSuccess(`Usuario "${email}" deleted successfully!`)
      fetchUsuarios()
    } catch (err) {
      setError('Error deleting user: ' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Staff Management</h2>
          <p>You must log in as ADMIN to view this page.</p>
          <Link to="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    )
  }

  if (loading) return <div className="loading">Loading staff</div>
  if (error && usuarios.length === 0) return <div className="alert alert-error">Error: {error}</div>

  return (
    <div>
      <h1>Staff Management</h1>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Section A: Create User */}
      <div className="card">
        <div className="card-header">
          <h2>Crear Nuevo Usuario</h2>
        </div>

        <form onSubmit={handleCreateUser}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="user@sailor.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter password"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="rol">Rol</label>
              <select
                id="rol"
                value={newUser.rol}
                onChange={(e) => setNewUser({ ...newUser, rol: e.target.value })}
                required
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary">Crear Usuario</button>
        </form>
      </div>

      {/* Section B: User List */}
      <div className="card">
        <div className="card-header">
          <h2>Usuarios Registrados</h2>
        </div>

        {usuarios.length === 0 ? (
          <p className="text-muted">No hay usuarios registrados</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Rol Actual</th>
                <th>Cambiar Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.id}</td>
                  <td><strong>{usuario.email}</strong></td>
                  <td>
                    <span className={`badge ${
                      usuario.rol === 'ADMIN' ? 'badge-red' :
                      usuario.rol === 'MESERO' ? 'badge-blue' :
                      usuario.rol === 'COCINA' ? 'badge-yellow' :
                      usuario.rol === 'CAJA' ? 'badge-green' :
                      usuario.rol === 'INVENTARIO' ? 'badge-purple' :
                      'badge-gray'
                    }`}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select
                        value={roleUpdates[usuario.id] || usuario.rol}
                        onChange={(e) => setRoleUpdates({ ...roleUpdates, [usuario.id]: e.target.value })}
                        style={{ flex: 1 }}
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleUpdateRol(usuario.id)}
                        className="btn-primary btn-small"
                        disabled={roleUpdates[usuario.id] === usuario.rol}
                      >
                        Actualizar
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(usuario.id, usuario.email)}
                      className="btn-danger btn-small"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default StaffPage
