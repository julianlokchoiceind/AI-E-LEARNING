'use client'

import { useState } from 'react'

export default function TestAPIPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testHealth = async () => {
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      console.log('Testing health endpoint at:', baseUrl + '/health')
      
      const response = await fetch(baseUrl + '/health')
      const text = await response.text()
      console.log('Response status:', response.status)
      console.log('Response text:', text)
      
      setResult(`Health Check - Status: ${response.status}\nResponse: ${text}`)
    } catch (error) {
      console.error('Health check error:', error)
      setResult(`Error: ${error}`)
    }
    setLoading(false)
  }

  const testRegister = async () => {
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      console.log('Testing register endpoint at:', baseUrl + '/auth/register')
      
      const response = await fetch(baseUrl + '/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'testpassword123',
        }),
      })
      
      const text = await response.text()
      console.log('Response status:', response.status)
      console.log('Response text:', text)
      
      setResult(`Register Test - Status: ${response.status}\nResponse: ${text}`)
    } catch (error) {
      console.error('Register test error:', error)
      setResult(`Error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="space-y-4">
        <button
          onClick={testHealth}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Health Endpoint
        </button>
        
        <button
          onClick={testRegister}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          Test Register Endpoint
        </button>
      </div>
      
      <pre className="mt-8 p-4 bg-gray-100 rounded whitespace-pre-wrap">
        {loading ? 'Loading...' : result}
      </pre>
    </div>
  )
}