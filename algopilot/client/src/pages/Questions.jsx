import { useEffect, useState, useCallback } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Search, Filter, ExternalLink, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import SolveModal from '../components/SolveModal'

const PLATFORMS = ['', 'Codeforces', 'LeetCode', 'AtCoder', 'CodeChef', 'HackerRank']
const TOPICS = ['', 'Implementation', 'Greedy', 'Dynamic Programming', 'Graph', 'Binary Search',
  'Math', 'Bit Manipulation', 'Sorting', 'Two Pointers', 'Strings', 'Trees',
  'Recursion', 'Number Theory', 'Data Structures', 'Other']
const DIFFICULTIES = ['', 'Easy', 'Medium', 'Hard', 'Expert']

const diffColor = { Easy: 'badge-green', Medium: 'badge-yellow', Hard: 'badge-red', Expert: 'badge-violet' }
const platColor = { Codeforces: 'badge-blue', LeetCode: 'badge-yellow', AtCoder: 'badge-violet', CodeChef: 'badge-green' }

export default function Questions() {
  const [questions, setQuestions] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [solveTarget, setSolveTarget] = useState(null)

  const [filters, setFilters] = useState({
    search: '', platform: '', topic: '', difficulty: '',
    ratingMin: '', ratingMax: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters.search])

  const fetchQuestions = useCallback(async (pg = 1) => {
    setLoading(true)
    try {
      const params = { page: pg, limit: 15 }
      if (debouncedSearch) params.search = debouncedSearch
      if (filters.platform) params.platform = filters.platform
      if (filters.topic) params.topic = filters.topic
      if (filters.difficulty) params.difficulty = filters.difficulty
      if (filters.ratingMin) params.ratingMin = filters.ratingMin
      if (filters.ratingMax) params.ratingMax = filters.ratingMax

      const { data } = await api.get('/questions', { params })
      setQuestions(data.questions)
      setTotal(data.total)
      setPages(data.pages)
      setPage(pg)
    } catch (err) {
      toast.error('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [filters.platform, filters.topic, filters.difficulty, filters.ratingMin, filters.ratingMax, debouncedSearch])

  useEffect(() => { fetchQuestions(1) }, [fetchQuestions])

  const clearFilters = () => setFilters({ search: '', platform: '', topic: '', difficulty: '', ratingMin: '', ratingMax: '' })
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Question Explorer</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total} questions available</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary flex items-center gap-2 text-sm">
          <Filter size={16} />
          Filters
          {hasFilters && <span className="w-2 h-2 rounded-full bg-violet-400" />}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          className="input pl-11"
          placeholder="Search questions..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white">Filters</h3>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                <X size={12} /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Platform</label>
              <select className="input py-2 text-sm" value={filters.platform} onChange={(e) => setFilters({ ...filters, platform: e.target.value })}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p || 'All Platforms'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Topic</label>
              <select className="input py-2 text-sm" value={filters.topic} onChange={(e) => setFilters({ ...filters, topic: e.target.value })}>
                {TOPICS.map((t) => <option key={t} value={t}>{t || 'All Topics'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Difficulty</label>
              <select className="input py-2 text-sm" value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d || 'All Difficulties'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Min Rating</label>
              <input type="number" className="input py-2 text-sm" placeholder="e.g. 800" value={filters.ratingMin} onChange={(e) => setFilters({ ...filters, ratingMin: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Max Rating</label>
              <input type="number" className="input py-2 text-sm" placeholder="e.g. 1600" value={filters.ratingMax} onChange={(e) => setFilters({ ...filters, ratingMax: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {/* Questions list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 font-medium">No questions found</p>
          <p className="text-gray-600 text-sm mt-1">Try changing your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q._id} className="card hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white text-base">{q.title}</h3>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={platColor[q.platform] || 'badge-violet'}>{q.platform}</span>
                    {q.rating > 0 && <span className="badge-yellow">⭐ {q.rating}</span>}
                    <span className={diffColor[q.difficulty] || 'badge-violet'}>{q.difficulty}</span>
                    {q.topics?.slice(0, 2).map((t) => (
                      <span key={t} className="badge bg-gray-800 text-gray-300 border border-gray-700">{t}</span>
                    ))}
                    {q.topics?.length > 2 && (
                      <span className="badge bg-gray-800 text-gray-500">+{q.topics.length - 2}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={q.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center gap-1.5 text-sm py-2"
                  >
                    <ExternalLink size={14} />
                    Solve
                  </a>
                  <button
                    onClick={() => setSolveTarget(q)}
                    className="btn-primary flex items-center gap-1.5 text-sm py-2"
                  >
                    <Plus size={14} />
                    Mark Solved
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => fetchQuestions(page - 1)}
            disabled={page === 1}
            className="btn-secondary py-2 px-3 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => fetchQuestions(page + 1)}
            disabled={page === pages}
            className="btn-secondary py-2 px-3 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Solve Modal */}
      {solveTarget && (
        <SolveModal
          question={solveTarget}
          onClose={() => setSolveTarget(null)}
          onSolved={() => { setSolveTarget(null); toast.success('Marked as solved! Revision scheduled 🎯') }}
        />
      )}
    </div>
  )
}
