import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const requiredFirebaseEnv = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const

const missingFirebaseEnv = requiredFirebaseEnv.filter((key) => !import.meta.env[key])
const root = ReactDOM.createRoot(document.getElementById('root')!)

if (missingFirebaseEnv.length > 0) {
  root.render(
    <React.StrictMode>
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-6">
        <div className="max-w-xl w-full border border-gray-800 bg-gray-900 p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-3">Missing Firebase config</h1>
          <p className="text-gray-300 mb-4">
            Create a <code className="text-blue-300">.env</code> file in the project root and restart the dev server.
          </p>
          <pre className="bg-gray-950 border border-gray-800 rounded p-4 text-sm overflow-auto">
            {missingFirebaseEnv.map((key) => `${key}=`).join('\n')}
          </pre>
        </div>
      </div>
    </React.StrictMode>,
  )
} else {
  const { default: App } = await import('./App')

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
