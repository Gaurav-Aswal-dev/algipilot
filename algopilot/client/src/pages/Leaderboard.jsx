import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Trophy, Medal, Flame, Star, Award, BookOpen, ShieldCheck } from 'lucide-react'

export default function Leaderboard() {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [category, setCategory] = useState('solved') // 'solved' | 'rating' | 'streak'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/stats/leaderboard', { params: { category } })
        setLeaderboard(data.leaderboard || [])
      } catch (err) {
        toast.error('Failed to load leaderboard')
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [category])

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy size={26} className="text-yellow-400" /> Leaderboard
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Compete with programmers, climb ratings, and maintain streaks</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 bg-gray-900 border border-gray-800 p-1.5 rounded-2xl w-fit">
        {[
          { key: 'solved', label: 'Most Solved', icon: BookOpen },
          { key: 'rating', label: 'CF Rating', icon: Star },
          { key: 'streak', label: 'Streak Champions', icon: Flame },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              category === key
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-9 h-9 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Top 3 Podium View */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 pb-2">
              {/* 2nd Place */}
              {top3[1] && (
                <div className="card text-center relative border-gray-700 bg-gradient-to-b from-gray-900 to-gray-950 order-2 md:order-1 transform md:translate-y-4">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs font-bold px-3 py-0.5 rounded-full border border-gray-600 flex items-center gap-1">
                    <Medal size={12} className="text-gray-300" /> 2nd Place
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-400 mx-auto mt-2 flex items-center justify-center font-bold text-xl text-white">
                    {top3[1].name?.[0]?.toUpperCase()}
                  </div>
                  <h3 className="font-bold text-white mt-3 truncate">{top3[1].name}</h3>
                  <p className="text-xs text-gray-400">@{top3[1].username || 'coder'}</p>
                  <div className="mt-3 py-2 bg-gray-800/50 rounded-xl space-y-0.5">
                    <p className="text-lg font-extrabold text-white">
                      {category === 'rating' ? `${top3[1].codeforcesRating}⭐` : category === 'streak' ? `${top3[1].streak} 🔥` : `${top3[1].solvedCount} Solved`}
                    </p>
                    <p className="text-xs text-gray-500">{top3[1].college || 'Competitive Programmer'}</p>
                  </div>
                </div>
              )}

              {/* 1st Place (Champion) */}
              {top3[0] && (
                <div className="card text-center relative border-yellow-500/50 bg-gradient-to-b from-yellow-950/20 via-gray-900 to-gray-950 order-1 md:order-2 shadow-xl shadow-yellow-950/20">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-950 font-extrabold text-xs px-4 py-1 rounded-full border border-yellow-400 flex items-center gap-1.5 shadow-md">
                    <Trophy size={14} className="text-gray-950" /> 1st Champion
                  </div>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 border-4 border-yellow-400 mx-auto mt-2 flex items-center justify-center font-extrabold text-2xl text-gray-950 shadow-lg">
                    {top3[0].name?.[0]?.toUpperCase()}
                  </div>
                  <h3 className="font-bold text-white text-lg mt-3 truncate">{top3[0].name}</h3>
                  <p className="text-xs text-yellow-400 font-medium">@{top3[0].username || 'champion'}</p>
                  <div className="mt-3 py-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl space-y-0.5">
                    <p className="text-xl font-extrabold text-yellow-300">
                      {category === 'rating' ? `${top3[0].codeforcesRating}⭐` : category === 'streak' ? `${top3[0].streak} 🔥` : `${top3[0].solvedCount} Solved`}
                    </p>
                    <p className="text-xs text-yellow-400/80">{top3[0].college || 'Top Competitive Programmer'}</p>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div className="card text-center relative border-amber-800/40 bg-gradient-to-b from-gray-900 to-gray-950 order-3 transform md:translate-y-4">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-900 text-amber-200 text-xs font-bold px-3 py-0.5 rounded-full border border-amber-700 flex items-center gap-1">
                    <Medal size={12} className="text-amber-400" /> 3rd Place
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-amber-600 mx-auto mt-2 flex items-center justify-center font-bold text-xl text-white">
                    {top3[2].name?.[0]?.toUpperCase()}
                  </div>
                  <h3 className="font-bold text-white mt-3 truncate">{top3[2].name}</h3>
                  <p className="text-xs text-gray-400">@{top3[2].username || 'coder'}</p>
                  <div className="mt-3 py-2 bg-gray-800/50 rounded-xl space-y-0.5">
                    <p className="text-lg font-extrabold text-white">
                      {category === 'rating' ? `${top3[2].codeforcesRating}⭐` : category === 'streak' ? `${top3[2].streak} 🔥` : `${top3[2].solvedCount} Solved`}
                    </p>
                    <p className="text-xs text-gray-500">{top3[2].college || 'Competitive Programmer'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="card p-0 overflow-hidden border-gray-800">
            <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Full Rankings</h3>
              <span className="text-xs text-gray-400">{leaderboard.length} Active Programmers</span>
            </div>

            <div className="divide-y divide-gray-800/60 overflow-x-auto">
              {leaderboard.map((u, idx) => {
                const isCurrentUser = user?._id === u._id || user?.id === u._id
                return (
                  <div
                    key={u._id}
                    className={`flex items-center justify-between px-6 py-4 transition-colors ${
                      isCurrentUser ? 'bg-violet-950/40 border-l-4 border-l-violet-500' : 'hover:bg-gray-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className={`w-7 text-sm font-bold ${
                        idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-500' : 'text-gray-500'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-violet-700 flex items-center justify-center font-bold text-white shrink-0 text-sm">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                          {isCurrentUser && (
                            <span className="badge-violet text-[10px]">YOU</span>
                          )}
                          {u.isPremium && (
                            <span className="text-xs text-yellow-400">⭐</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          @{u.username || 'coder'} · {u.college || 'Competitive Programmer'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{u.solvedCount} Solved</p>
                        <p className="text-xs text-yellow-400">{u.codeforcesRating}⭐ CF Rating</p>
                      </div>
                      {u.streak > 0 && (
                        <div className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 text-xs font-bold flex items-center gap-1">
                          <Flame size={12} /> {u.streak}d
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
