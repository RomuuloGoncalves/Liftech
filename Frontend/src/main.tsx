import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './config/i18n'
import App from './App.tsx'
import { ToastProvider } from './components/common/Toast'
import { ActiveBranchProvider } from './context/ActiveBranchContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ActiveBranchProvider>
          <App />
        </ActiveBranchProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
