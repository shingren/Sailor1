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
    nombre: '',
    email: '',
    password: '',
    rol: 'MESERO'
  })

  // State for role updates (indexed by usuario ID)
  const [roleUpdates, setRoleUpdates] = useState({})

  // State for editing user
  const [editingUserId, setEditingUserId] = useState(null)
  const [editForm, setEditForm] = useState({
    nombre: '',
    password: ''
  })

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
        setError('No autorizado - por favor inicia sesión como ADMIN')
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError('Error al cargar usuarios')
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
      setError('Error al cargar usuarios: ' + err.message)
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
        setError('No autorizado - por favor inicia sesión como ADMIN')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(`Error al crear usuario: ${errorData.error || 'Error desconocido'}`)
        return
      }

      setSuccess(`Usuario "${newUser.nombre}" creado exitosamente!`)
      setNewUser({ nombre: '', email: '', password: '', rol: 'MESERO' })
      fetchUsuarios()
    } catch (err) {
      setError('Error al crear usuario: ' + err.message)
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
        setError('No autorizado - por favor inicia sesión como ADMIN')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(`Error al actualizar rol: ${errorData.error || 'Error desconocido'}`)
        return
      }

      setSuccess('Rol actualizado exitosamente!')
      fetchUsuarios()
    } catch (err) {
      setError('Error al actualizar rol: ' + err.message)
    }
  }

  const handleStartEdit = (usuario) => {
    setEditingUserId(usuario.id)
    setEditForm({
      nombre: usuario.nombre,
      password: '' // Leave password empty - only fill if changing
    })
    setError(null)
    setSuccess(null)
  }

  const handleCancelEdit = () => {
    setEditingUserId(null)
    setEditForm({ nombre: '', password: '' })
  }

  const handleSaveEdit = async (usuarioId) => {
    setError(null)
    setSuccess(null)

    // Validate that at least nombre is provided
    if (!editForm.nombre || editForm.nombre.trim() === '') {
      setError('El nombre no puede estar vacío')
      return
    }

    try {
      const response = await fetch(`/api/usuarios/${usuarioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          nombre: editForm.nombre,
          password: editForm.password || undefined // Only send if provided
        })
      })

      if (response.status === 401 || response.status === 403) {
        setError('No autorizado - por favor inicia sesión como ADMIN')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(`Error al editar usuario: ${errorData.error || 'Error desconocido'}`)
        return
      }

      setSuccess('Usuario actualizado exitosamente!')
      setEditingUserId(null)
      setEditForm({ nombre: '', password: '' })
      fetchUsuarios()
    } catch (err) {
      setError('Error al editar usuario: ' + err.message)
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
        setError('No autorizado - por favor inicia sesión como ADMIN')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(`Error al eliminar usuario: ${errorData.error || 'Error desconocido'}`)
        return
      }

      setSuccess(`Usuario "${email}" eliminado exitosamente!`)
      fetchUsuarios()
    } catch (err) {
      setError('Error al eliminar usuario: ' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Gestión de Personal</h2>
          <p>Debes iniciar sesión como ADMIN para ver esta página.</p>
          <Link to="/login" className="btn-primary">Ir a Iniciar Sesión</Link>
        </div>
      </div>
    )
  }

  if (loading) return <div className="loading">Cargando personal</div>
  if (error && usuarios.length === 0) return <div className="alert alert-error">Error: {error}</div>

  return (
    <div>
      <h1>Gestión de Personal</h1>

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
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                type="text"
                value={newUser.nombre}
                onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                placeholder="Nombre completo"
                required
              />
            </div>

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
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Ingresa contraseña"
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
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol Actual</th>
                <th>Cambiar Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => {
                const isEditing = editingUserId === usuario.id

                return (
                  <tr key={usuario.id}>
                    <td>{usuario.id}</td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.nombre}
                          onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                          placeholder="Nombre"
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <strong>{usuario.nombre}</strong>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div>
                          <div style={{ marginBottom: '5px' }}>{usuario.email}</div>
                          <input
                            type="password"
                            value={editForm.password}
                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                            placeholder="Nueva contraseña (opcional)"
                            style={{ width: '100%' }}
                          />
                        </div>
                      ) : (
                        usuario.email
                      )}
                    </td>
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
                          disabled={isEditing}
                        >
                          {ROLES.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleUpdateRol(usuario.id)}
                          className="btn-primary btn-small"
                          disabled={roleUpdates[usuario.id] === usuario.rol || isEditing}
                        >
                          Actualizar
                        </button>
                      </div>
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleSaveEdit(usuario.id)}
                            className="btn-success btn-small"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="btn-secondary btn-small"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleStartEdit(usuario)}
                            className="btn-warning btn-small"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(usuario.id, usuario.email)}
                            className="btn-danger btn-small"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default StaffPage
