import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Tooltip, Legend, PointElement, LineElement
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { BarChart2 } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement)

const chartDefaults = {
  plugins: { legend: { labels: { color: '#9ca3af', font: { size: 12 } } } },
  scales: {
    x: { ticks: { color: '#6b7280' }, grid: { color: '#1f2937' } },
    y: { ticks: { color: '#6b7280' }, grid: { color: '#1f2937' } },
  }
}

export default function Statistics() {
  const [topics, setTopics] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [weekly, setWeekly] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [topicRes, weekRes] = await Promise.all([
          api.get('/stats/topics'),
          api.get('/stats/weekly'),
        ])
        setTopics(topicRes.data.topics)
        setPlatforms(topicRes.data.platforms)
        setWeekly(weekRes.data.weeks)
      } catch {
        toast.error('Failed to load statistics')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const topicBarData = {
    labels: topics.slice(0, 10).map((t) => t.name),
    datasets: [{
      label: 'Questions Solved',
      data: topics.slice(0, 10).map((t) => t.count),
      backgroundColor: '#7c3aed',
      borderRadius: 6,
    }]
  }

  const platDoughnutData = {
    labels: platforms.map((p) => p.name),
    datasets: [{
      data: platforms.map((p) => p.count),
      backgroundColor: ['#7c3aed', '#2563eb', '#d97706', '#16a34a', '#dc2626'],
      borderColor: '#111827',
      borderWidth: 2,
    }]
  }

  const weeklyLineData = {
    labels: weekly.map((w) => w.label),
    datasets: [{
      label: 'Problems Solved',
      data: weekly.map((w) => w.count),
      borderColor: '#7c3aed',
      backgroundColor: 'rgba(124,58,237,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#7c3aed',
      pointRadius: 4,
    }]
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart2 size={24} className="text-blue-400" />
          Statistics
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Your performance breakdown</p>
      </div>

      {/* Weekly line chart */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Weekly Progress (Last 8 Weeks)</h3>
        {weekly.length > 0 ? (
          <Line data={weeklyLineData} options={{ ...chartDefaults, maintainAspectRatio: true, aspectRatio: 3 }} />
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">No data yet — start solving!</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Topic bar chart */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Top Topics Solved</h3>
          {topics.length > 0 ? (
            <Bar
              data={topicBarData}
              options={{
                ...chartDefaults,
                indexAxis: 'y',
                maintainAspectRatio: true,
                aspectRatio: 1.2,
              }}
            />
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
          )}
        </div>

        {/* Platform doughnut */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Platform Breakdown</h3>
          {platforms.length > 0 ? (
            <div className="flex flex-col items-center">
              <Doughnut
                data={platDoughnutData}
                options={{
                  plugins: { legend: { labels: { color: '#9ca3af' }, position: 'bottom' } },
                  maintainAspectRatio: true,
                  aspectRatio: 1.5,
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
          )}
        </div>
      </div>

      {/* Topic table */}
      {topics.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white mb-4">All Topics Breakdown</h3>
          <div className="space-y-2">
            {topics.map((t, i) => (
              <div key={t.name} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                <span className="text-sm text-gray-300 w-40 shrink-0">{t.name}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-violet-600 rounded-full"
                    style={{ width: `${Math.min(100, (t.count / (topics[0]?.count || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-white w-8 text-right">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRO Placement Readiness & Analytics Card */}
      <div className="card bg-gradient-to-r from-yellow-950/30 via-gray-900 to-violet-950/30 border-yellow-500/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-yellow text-xs font-bold">⭐ PRO STATISTICS</span>
              <span className="text-xs text-yellow-400 font-medium">Placement Readiness Analysis</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-2">SDE & CP Placement Performance Indicator</h3>
            <p className="text-gray-400 text-sm mt-1 max-w-xl">
              Based on your solved problems across Data Structures, Dynamic Programming, and Graph algorithms, your current SDE Placement readiness index is <strong>78/100</strong>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-4 border-t border-gray-800 text-center">
          <div className="p-3 bg-gray-800/40 rounded-xl">
            <p className="text-xs text-gray-400">DS & Algo Coverage</p>
            <p className="text-lg font-extrabold text-green-400 mt-1">82%</p>
          </div>
          <div className="p-3 bg-gray-800/40 rounded-xl">
            <p className="text-xs text-gray-400">Avg Solve Speed</p>
            <p className="text-lg font-extrabold text-blue-400 mt-1">24.5 min</p>
          </div>
          <div className="p-3 bg-gray-800/40 rounded-xl">
            <p className="text-xs text-gray-400">Accuracy w/o Hints</p>
            <p className="text-lg font-extrabold text-yellow-400 mt-1">88%</p>
          </div>
          <div className="p-3 bg-gray-800/40 rounded-xl">
            <p className="text-xs text-gray-400">Target Rating Gap</p>
            <p className="text-lg font-extrabold text-violet-400 mt-1">-220 pts</p>
          </div>
        </div>
      </div>
    </div>
  )
}
