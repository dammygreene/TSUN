import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import '98.css/dist/98.css'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
