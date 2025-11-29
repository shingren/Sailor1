import { Link } from 'react-router-dom'

function NotAuthorized() {
  return (
    <div className="centered-container">
      <div className="card">
        <h2>Acceso Denegado</h2>
        <p>No tienes permiso para ver esta página.</p>
        <Link to="/" className="btn-primary">Volver al inicio</Link>
      </div>
    </div>
  )
}

export default NotAuthorized
