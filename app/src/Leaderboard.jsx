// src/Leaderboard.jsx

import React, { useState, useEffect } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

export default function Leaderboard() {
  const [leaders, setLeaders]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    const auth = window.firebaseAuth;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError('You must be signed in to view the leaderboard')
        setLoading(false)
        return
      }

      try {
        const token = await user.getIdToken()
        const res   = await fetch('/api/leaderboard', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error(`Server returned ${res.status}`)
        const data = await res.json()
        setLeaders(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })

    return unsub
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-10xl mx-auto my-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-indigo-600">
            <h1 className="text-2xl font-semibold text-white">Leaderboard</h1>
          </div>

          {/* Error / Loading */}
          <div className="px-6 py-4">
            {loading && (
              <div className="text-gray-500 italic">Loading leaderboard…</div>
            )}
            {error && !loading && (
              <div className="text-red-600 font-medium">⚠️ {error}</div>
            )}
          </div>

          {/* Table */}
          {!loading && !error && (
            <div className="overflow-x-auto px-6 pb-6">
              <table className="w-full table-auto divide-y divide-gray-200">
                <thead className="bg-indigo-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">
                      Total Points
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaders.map((l, i) => (
                    <tr
                      key={l.userId}
                      className="hover:bg-indigo-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-indigo-700 font-medium">{i + 1}</td>
                      <td className="px-4 py-3 text-indigo-700">{l.displayName || l.userId}</td>
                      <td className="px-4 py-3 text-indigo-700">{l.totalScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
