import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SnapshotProvider } from './contexts/SnapshotContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SnapshotProvider>
      <App />
    </SnapshotProvider>
  </StrictMode>,
)
