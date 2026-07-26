import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { RefreshCw, CheckCircle2, AlertCircle, Calendar, ExternalLink } from 'lucide-react'

const stageLabels = ['Day 1', 'Day 3', 'Day 7', 'Day 15', 'Day 30']

export default function Revision() {
  const [todayRevs, setTodayRevs] = useState([])
  const [upcomingRevs, setUpcomingRevs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(null)
  const [tab, setTab] = useState('today')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [todayRes, upcomingRes, statsRes] = await Promise.all([
        api.get('/revision/today'),
        api.get('/revision/upcoming'),
        api.get('/revision/stats'),
      ])
      setTodayRevs(todayRes.data.revisions)
      setUpcomingRevs(upcomingRes.data.revisions)
      setStats(statsRes.data.stats)
    } catch {
      toast.error('Failed to load revisions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const markComplete = async (revId) => {
    setCompleting(revId)
    try {
      await api.put(`/revision/${revId}/complete`)
      toast.success('Revision completed! ✅')
      setTodayRevs((prev) => prev.filter((r) => r._id !== revId))
      setStats((s) => s ? { ...s, completed: s.completed + 1, pending: s.pending - 1 } : s)
    } catch {
      toast.error('Failed to mark complete')
    } finally {
      setCompleting(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <RefreshCw size={24} className="text-green-400" />
          Smart Revision
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Spaced repetition: 1 → 3 → 7 → 15 → 30 days</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Completed', value: stats.completed, color: 'text-green-400' },
            { label: 'Pending', value: stats.pending, color: 'text-yellow-400' },
            { label: 'Overdue', value: stats.overdue, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center py-4">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {[
          { key: 'today', label: `Due Today (${todayRevs.length})` },
          { key: 'upcoming', label: 'Upcoming' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'today' ? (
        todayRevs.length === 0 ? (
          <div className="card text-center py-16">
            <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
            <p className="text-white font-semibold text-lg">All done for today!</p>
            <p className="text-gray-500 text-sm mt-1">No revisions pending. Keep solving to build your schedule.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayRevs.map((rev) => (
              <div key={rev._id} className="card flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge-violet text-xs">{stageLabels[rev.stage] || `Stage ${rev.stage + 1}`}</span>
                    {new Date(rev.revisionDate) < new Date() && (
                      <span className="badge-red text-xs flex items-center gap-1">
                        <AlertCircle size={10} /> Overdue
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-white">{rev.questionId?.title || 'Unknown'}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    {rev.questionId?.platform && <span className="badge-blue">{rev.questionId.platform}</span>}
                    {rev.questionId?.rating > 0 && <span className="badge-yellow">⭐ {rev.questionId.rating}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {rev.questionId?.link && (
                    <a href={rev.questionId.link} target="_blank" rel="noopener noreferrer" className="btn-secondary py-2 px-3">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => markComplete(rev._id)}
                    disabled={completing === rev._id}
                    className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                  >
                    {completing === rev._id ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><CheckCircle2 size={14} /> Done</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        upcomingRevs.length === 0 ? (
          <div className="card text-center py-16">
            <Calendar size={40} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 font-medium">No upcoming revisions</p>
            <p className="text-gray-600 text-sm mt-1">Solve questions to schedule future revisions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingRevs.map((rev) => (
              <div key={rev._id} className="card flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white">{rev.questionId?.title || 'Unknown'}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    {rev.questionId?.platform && <span className="badge-blue">{rev.questionId.platform}</span>}
                    <span className="badge-violet">{stageLabels[rev.stage]}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(rev.revisionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
