import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
  Flame, Star, Trophy, BookOpen, Target, RefreshCw,
  TrendingUp, Zap, ChevronRight, CheckCircle2, Clock
} from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="card flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white mt-0.5">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  </div>
)

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [revisions, setRevisions] = useState([])
  const [daily, setDaily] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, revRes, dailyRes] = await Promise.allSettled([
          api.get('/stats/overview'),
          api.get('/revision/today'),
          api.get('/questions/daily'),
        ])
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.stats)
        if (revRes.status === 'fulfilled') setRevisions(revRes.value.data.revisions?.slice(0, 5) || [])
        if (dailyRes.status === 'fulfilled') setDaily(dailyRes.value.data.question)
      } catch (_) {}
      finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const progressPct = stats
    ? Math.min(100, Math.round(((stats.solvedToday || 0) / (stats.dailyGoal || 2)) * 100))
    : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {stats?.streak > 0 && (
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2">
            <Flame size={20} className="text-orange-400" />
            <div>
              <p className="text-orange-300 font-bold text-lg leading-none">{stats.streak}</p>
              <p className="text-orange-400/70 text-xs">day streak</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Star}    label="CF Rating"   value={stats?.codeforcesRating || user?.codeforcesRating || 0} color="bg-yellow-600" sub={`Highest: ${stats?.highestRating || 0}`} />
        <StatCard icon={BookOpen} label="Total Solved" value={stats?.totalSolved || 0} color="bg-violet-600" sub={`This week: ${stats?.solvedThisWeek || 0}`} />
        <StatCard icon={Trophy}  label="Longest Streak" value={`${stats?.longestStreak || 0}d`} color="bg-orange-600" sub="Personal best" />
        <StatCard icon={Target}  label="Target Rating" value={stats?.targetRating || user?.targetRating || 1400} color="bg-blue-600" sub="Your goal" />
      </div>

      {/* Daily goal + Today's challenge */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Daily goal */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Target size={18} className="text-violet-400" />
              Today's Goal
            </h3>
            <span className="text-sm text-gray-400">
              {stats?.solvedToday || 0} / {stats?.dailyGoal || 2} questions
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">{progressPct}% complete</span>
            {progressPct >= 100
              ? <span className="text-xs text-green-400 font-medium flex items-center gap-1"><CheckCircle2 size={12} /> Goal achieved!</span>
              : <span className="text-xs text-gray-500">{(stats?.dailyGoal || 2) - (stats?.solvedToday || 0)} more to go</span>
            }
          </div>
          <Link to="/questions" className="btn-primary w-full text-center block mt-4 text-sm">
            Solve Questions →
          </Link>
        </div>

        {/* Daily challenge */}
        <div className="card">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
            <Zap size={18} className="text-yellow-400" />
            Today's Challenge
          </h3>
          {daily ? (
            <div>
              <p className="font-medium text-white text-lg">{daily.title}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="badge-blue">{daily.platform}</span>
                <span className="badge-yellow">Rating: {daily.rating}</span>
                {daily.topics?.[0] && <span className="badge-violet">{daily.topics[0]}</span>}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <Clock size={12} />
                Estimated: ~25 minutes
              </div>
              <a
                href={daily.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full text-center block mt-4 text-sm"
              >
                Solve Challenge →
              </a>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">No challenge available today</p>
              <p className="text-gray-600 text-xs mt-1">Add questions via admin to see challenges</p>
            </div>
          )}
        </div>
      </div>

      {/* Revision due + weekly progress */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Revision due */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <RefreshCw size={18} className="text-green-400" />
              Revisions Due
            </h3>
            <Link to="/revision" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {revisions.length > 0 ? (
            <div className="space-y-2">
              {revisions.map((rev) => (
                <div key={rev._id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">
                      {rev.questionId?.title || 'Unknown Question'}
                    </p>
                    <p className="text-xs text-gray-500">{rev.questionId?.platform} · Stage {rev.stage + 1}/5</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2" />
              <p className="text-gray-400 text-sm font-medium">All caught up!</p>
              <p className="text-gray-600 text-xs">No revisions due today</p>
            </div>
          )}
        </div>

        {/* Weekly progress chart placeholder */}
        <div className="card">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-blue-400" />
            This Week
          </h3>
          <div className="space-y-3">
            {[
              { day: 'Mon', pct: 60 }, { day: 'Tue', pct: 80 }, { day: 'Wed', pct: 40 },
              { day: 'Thu', pct: 100 }, { day: 'Fri', pct: 20 }, { day: 'Sat', pct: 70 },
              { day: 'Sun', pct: progressPct }
            ].map(({ day, pct }) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-7">{day}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-violet-600 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-8 text-right">{pct}%</span>
              </div>
            ))}
          </div>
          <Link to="/statistics" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 mt-4">
            Full statistics <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
