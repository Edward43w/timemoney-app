import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // 這裡會自動抓到 src/App.tsx
import { ErrorBoundary } from './ErrorBoundary'
import './index.css'    // 確保引入樣式

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)