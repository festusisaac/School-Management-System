import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from 'react-error-boundary'
import './styles/index.css'

function ErrorFallback({error, resetErrorBoundary}: any) {
  return (
    <div role="alert" className="p-8 text-red-600 flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <pre className="text-sm bg-red-50 p-4 rounded max-w-2xl overflow-auto border border-red-200">{error.message}</pre>
      <button onClick={resetErrorBoundary} className="mt-6 px-6 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition">Try again</button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
  </ErrorBoundary>
)
