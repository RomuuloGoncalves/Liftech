import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import AppRoutes from './routes/appRoutes'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <Header />
        <main className="app-main">
          <AppRoutes />
        </main>
      </div>
    </div>
  )
}

export default App
