"use client"
import { useState, useEffect } from 'react'
import { MessageSquare, Camera, Users, Activity,
         TrendingUp, Clock } from 'lucide-react'

interface StatsData {
  total_chat_messages: number
  total_analyses: number
  total_community_reports: number
  activity_today: number
  top_diseases: {disease_name: string, count: number}[]
  recent_analyses: {disease_name: string, timestamp: string}[]
  recent_messages: {content: string, role: string, timestamp: string}[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    fetch(`${API}/api/stats/overview`)
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('en-BD', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    } catch { return ts }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-500 text-sm">Loading dashboard...</p>
      </div>
    </div>
  )

  const metricCards = [
    { label: "Total Chats", value: stats?.total_chat_messages || 0,
      icon: MessageSquare, color: "bg-blue-50 text-blue-600",
      border: "border-blue-100" },
    { label: "Total Analyses", value: stats?.total_analyses || 0,
      icon: Camera, color: "bg-green-50 text-green-600",
      border: "border-green-100" },
    { label: "Community Reports", value: stats?.total_community_reports || 0,
      icon: Users, color: "bg-amber-50 text-amber-600",
      border: "border-amber-100" },
    { label: "Activity Today", value: stats?.activity_today || 0,
      icon: Activity, color: "bg-purple-50 text-purple-600",
      border: "border-purple-100" },
  ]

  const topDiseases = stats?.top_diseases ?? []
  const recentAnalyses = stats?.recent_analyses ?? []
  const recentMessages = stats?.recent_messages ?? []

  const maxDiseaseCount = Math.max(
    ...(topDiseases.map(d => d.count) || [1])
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            KrishiBot system usage overview
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {metricCards.map((card) => (
            <div key={card.label}
              className={`bg-white rounded-xl border ${card.border} p-5`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon size={18}/>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-primary-600"/>
              <h2 className="font-semibold text-gray-800 text-sm">
                Top Detected Diseases
              </h2>
            </div>
            {topDiseases.length === 0 ? (
              <p className="text-sm text-gray-400">No analyses yet</p>
            ) : (
              <div className="space-y-3">
                {topDiseases.map((d, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">
                        {d.disease_name}
                      </span>
                      <span className="text-gray-500">{d.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-primary-600 h-1.5 rounded-full transition-all"
                        style={{
                          width: `${(d.count / maxDiseaseCount) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Camera size={16} className="text-green-600"/>
              <h2 className="font-semibold text-gray-800 text-sm">
                Recent Analyses
              </h2>
            </div>
            {recentAnalyses.length === 0 ? (
              <p className="text-sm text-gray-400">No analyses yet</p>
            ) : (
              <div className="space-y-2">
                {recentAnalyses.map((a, i) => (
                  <div key={i}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"/>
                      <span className="text-sm text-gray-700 font-medium">
                        {a.disease_name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatTime(a.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-blue-600"/>
            <h2 className="font-semibold text-gray-800 text-sm">
              Recent Chat Activity
            </h2>
          </div>
          {recentMessages.length === 0 ? (
            <p className="text-sm text-gray-400">No messages yet</p>
          ) : (
            <div className="space-y-2">
              {recentMessages.map((m, i) => (
                <div key={i}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0
                    ${m.role === 'user'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'}`}>
                    {m.role}
                  </span>
                  <span className="text-sm text-gray-600 flex-1 truncate">
                    {m.content || '...'}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatTime(m.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-400 py-4">
          Data refreshes on page load · All data stored locally — no cloud
        </div>

      </div>
    </div>
  )
}
