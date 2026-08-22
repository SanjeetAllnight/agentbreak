import { useState, useEffect } from 'react'


function App() {
  const [health, setHealth] = useState<string>('checking...')

  useEffect(() => {
    fetch('http://localhost:3000/health')
      .then(res => res.json())
      .then(data => setHealth(data.status))
      .catch(() => setHealth('error'))
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-200">
      <h1 className="text-4xl font-bold mb-4 text-blue-500">AgentBreak</h1>
      <p className="text-lg text-gray-400">Adaptive AI Evaluation Platform</p>
      
      <div className="mt-8 p-6 bg-gray-900 rounded-lg shadow-lg border border-gray-800">
        <h2 className="text-xl font-semibold mb-2">System Status</h2>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Backend API:</span>
          <span className={health === 'ok' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
            {health}
          </span>
        </div>
      </div>
    </div>
  )
}

export default App
