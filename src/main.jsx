import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1a1a1a',
          color: '#ffffff',
          border: '1px solid #39ff14',
          borderRadius: '8px',
        },
        success: {
          iconTheme: {
            primary: '#39ff14',
            secondary: '#1a1a1a',
          },
        },
        error: {
          iconTheme: {
            primary: '#ff4444',
            secondary: '#1a1a1a',
          },
        },
      }}
    />
  </React.StrictMode>,
)

