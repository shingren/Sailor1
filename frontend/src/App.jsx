import { Routes, Route } from 'react-router-dom'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import HomePage from './HomePage'
import MesasPage from './MesasPage'
import ProductosPage from './ProductosPage'
import PedidosPage from './PedidosPage'
import MenuGridView from './MenuGridView'
import CocinaPage from './CocinaPage'
import FacturasPage from './FacturasPage'
import InventarioPage from './InventarioPage'
import ReservasPage from './ReservasPage'
import ReportesPage from './ReportesPage'
import LoginPage from './LoginPage'
import StaffPage from './StaffPage'
import CierreCajaPage from './CierreCajaPage'
import FloorplanPage from './FloorplanPage'
import CuentasPage from './CuentasPage'

// 开发阶段：直接放行所有受保护页面
function ProtectedRoute({ children }) {
  return children
}

// 开发阶段：不依赖 useAuth，不检查登录态
function OpenLayout({ children }) {
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-title">Sailor</div>
          <div className="navbar-user">
            <span className="navbar-email">dev-admin@sailor.local</span>
          </div>
        </div>
      </nav>

      <TopBar />

      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          {children}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <OpenLayout>
            <LoginPage />
          </OpenLayout>
        }
      />

      <Route
        path="/"
        element={
          <OpenLayout>
            <HomePage />
          </OpenLayout>
        }
      />

      <Route
        path="/mesas"
        element={
          <OpenLayout>
            <ProtectedRoute>
              <MesasPage />
            </ProtectedRoute>
          </OpenLayout>
        }
      />

      <Route
        path="/floorplan"
        element={
          <OpenLayout>
            <ProtectedRoute>
              <FloorplanPage />
            </ProtectedRoute>
          </OpenLayout>
        }
      />

      <Route
        path="/productos"
        element={
          <OpenLayout>
            <ProtectedRoute>
              <ProductosPage />
            </ProtectedRoute>
          </OpenLayout>
        }
      />

      <Route
        path="/pedidos"
        element={
          <OpenLayout>
            <ProtectedRoute>
              <PedidosPage />
            </ProtectedRoute>
          </OpenLayout>
        }
      />

      <Route
        path="/menu"
        element={
          <OpenLayout>
            <ProtectedRoute>
              <MenuGridView />
            </ProtectedRoute>
          </OpenLayout>
        }
      />

      <Route
        path="/cocina"
        element={
          <OpenLayout>
            <ProtectedRoute>
              <CocinaPage />
            </ProtectedRoute>
          </OpenLayout>
        }
      />

      <Route
        path="/cuentas"
        element={
          <OpenLayout>
            <ProtectedRoute>
              <CuentasPage />
            </ProtectedRoute>
          </OpenLayout>
        }
      />

      <Route
        path="/facturas"
        element={
          <OpenLayout>
            <ProtectedRoute>
              <FacturasPage />
            </ProtectedRoute>
          </OpenLayout>
        }
      />

      <Route
        path="/inventario"
        element={
          <OpenLayout>
            <ProtectedRoute>
              <InventarioPage />
            </ProtectedRoute>
          </OpenLayout>
        }
      />

      <Route
        path="/reservas"
        element={
          <OpenLayout>
            <ProtectedRoute>
              <ReservasPage />
            </ProtectedRoute>
          </OpenLayout>
        }
      />

      <Route
        path="/reportes"
        element={
          <OpenLayout>
            <ProtectedRoute>
              <ReportesPage />
            </ProtectedRoute>
          </OpenLayout>
        }
      />

      <Route
        path="/cierre-caja"
        element={
          <OpenLayout>
            <ProtectedRoute>
              <CierreCajaPage />
            </ProtectedRoute>
          </OpenLayout>
        }
      />

      <Route
        path="/staff"
        element={
          <OpenLayout>
            <ProtectedRoute>
              <StaffPage />
            </ProtectedRoute>
          </OpenLayout>
        }
      />
    </Routes>
  )
}

export default App