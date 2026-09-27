import Sidebar from './components/layout/Sidebar'
import AppRoutes from './routes/appRoutes'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content">
        <AppRoutes />
      </main>
    </div>
  )
}

export default App
