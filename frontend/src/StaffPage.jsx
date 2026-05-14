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

  const [newUser, setNewUser] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'MESERO'
  })

  const [roleUpdates, setRoleUpdates] = useState({})

  const [editingUserId, setEditingUserId] = useState(null)
  const [editForm, setEditForm] = useState({
    nombre: '',
    password: ''
  })

  const getRoleText = (rol) => {
    const roleMap = {
      ADMIN: '管理员',
      MESERO: '服务员',
      COCINA: '后厨',
      CAJA: '收银员',
      INVENTARIO: '库存员',
      GERENCIA: '经理'
    }

    return roleMap[rol] || rol || '-'
  }

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
        setError('未授权，请以管理员身份登录')
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError('加载员工失败')
        setLoading(false)
        return
      }

      const data = await response.json()
      setUsuarios(data)

      const updates = {}
      data.forEach(u => {
        updates[u.id] = u.rol
      })
      setRoleUpdates(updates)
    } catch (err) {
      setError('加载员工失败：' + err.message)
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
        setError('未授权，请以管理员身份登录')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(`创建员工失败：${errorData.error || '未知错误'}`)
        return
      }

      setSuccess(`员工“${newUser.nombre}”创建成功！`)
      setNewUser({ nombre: '', email: '', password: '', rol: 'MESERO' })
      fetchUsuarios()
    } catch (err) {
      setError('创建员工失败：' + err.message)
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
        setError('未授权，请以管理员身份登录')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(`更新角色失败：${errorData.error || '未知错误'}`)
        return
      }

      setSuccess('角色更新成功！')
      fetchUsuarios()
    } catch (err) {
      setError('更新角色失败：' + err.message)
    }
  }

  const handleStartEdit = (usuario) => {
    setEditingUserId(usuario.id)
    setEditForm({
      nombre: usuario.nombre,
      password: ''
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

    if (!editForm.nombre || editForm.nombre.trim() === '') {
      setError('姓名不能为空')
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
          password: editForm.password || undefined
        })
      })

      if (response.status === 401 || response.status === 403) {
        setError('未授权，请以管理员身份登录')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(`编辑员工失败：${errorData.error || '未知错误'}`)
        return
      }

      setSuccess('员工信息更新成功！')
      setEditingUserId(null)
      setEditForm({ nombre: '', password: '' })
      fetchUsuarios()
    } catch (err) {
      setError('编辑员工失败：' + err.message)
    }
  }

  const handleDelete = async (usuarioId, email) => {
    if (!window.confirm(`确定要删除员工“${email}”吗？`)) {
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
        setError('未授权，请以管理员身份登录')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(`删除员工失败：${errorData.error || '未知错误'}`)
        return
      }

      setSuccess(`员工“${email}”删除成功！`)
      fetchUsuarios()
    } catch (err) {
      setError('删除员工失败：' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>员工管理</h2>
          <p>请以管理员身份登录后再查看此页面。</p>
          <Link to="/login" className="btn-primary">去登录</Link>
        </div>
      </div>
    )
  }

  if (loading) return <div className="loading">正在加载员工...</div>
  if (error && usuarios.length === 0) return <div className="alert alert-error">错误：{error}</div>

  return (
    <div>
      <h1>员工管理</h1>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>创建新员工</h2>
        </div>

        <form onSubmit={handleCreateUser}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">姓名</label>
              <input
                id="nombre"
                type="text"
                value={newUser.nombre}
                onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                placeholder="请输入姓名"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">邮箱</label>
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
              <label htmlFor="password">密码</label>
              <input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="请输入密码"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="rol">角色</label>
              <select
                id="rol"
                value={newUser.rol}
                onChange={(e) => setNewUser({ ...newUser, rol: e.target.value })}
                required
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{getRoleText(r)}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary">创建员工</button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>已注册员工</h2>
        </div>

        {usuarios.length === 0 ? (
          <p className="text-muted">暂无已注册员工</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>姓名</th>
                <th>邮箱</th>
                <th>当前角色</th>
                <th>修改角色</th>
                <th>操作</th>
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
                          placeholder="姓名"
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
                            placeholder="新密码（可选）"
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
                        {getRoleText(usuario.rol)}
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
                            <option key={r} value={r}>{getRoleText(r)}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleUpdateRol(usuario.id)}
                          className="btn-primary btn-small"
                          disabled={roleUpdates[usuario.id] === usuario.rol || isEditing}
                        >
                          更新
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
                            保存
                          </button>

                          <button
                            onClick={handleCancelEdit}
                            className="btn-secondary btn-small"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleStartEdit(usuario)}
                            className="btn-warning btn-small"
                          >
                            编辑
                          </button>

                          <button
                            onClick={() => handleDelete(usuario.id, usuario.email)}
                            className="btn-danger btn-small"
                          >
                            删除
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