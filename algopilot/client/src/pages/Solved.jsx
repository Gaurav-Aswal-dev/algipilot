import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { CheckCircle2, Clock, Lightbulb, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

const diffColor = { Easy: 'badge-green', Medium: 'badge-yellow', Hard: 'badge-red' }

function SolvedCard({ entry }) {
  const [open, setOpen] = useState(false)
  const q = entry.questionId

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white">{q?.title || 'Deleted Question'}</h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {q?.platform && <span className="badge-blue">{q.platform}</span>}
                {q?.rating > 0 && <span className="badge-yellow">⭐ {q.rating}</span>}
                <span className={diffColor[entry.perceivedDifficulty] || 'badge-violet'}>
                  {entry.perceivedDifficulty}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={11} /> {entry.timeTaken} min
                </span>
                {entry.hintUsed && (
                  <span className="flex items-center gap-1 text-xs text-yellow-400">
                    <Lightbulb size={11} /> Hint used
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {new Date(entry.solvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {q?.link && (
            <a href={q.link} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-violet-400">
              <ExternalLink size={15} />
            </a>
          )}
          <button onClick={() => setOpen(!open)} className="text-gray-500 hover:text-white">
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {open && (entry.observation || entry.mistake || entry.correctIdea || entry.code) && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
          {entry.observation && (
            <div>
              <p className="text-xs font-medium text-green-400 mb-1">Key Observation</p>
              <p className="text-sm text-gray-300 bg-gray-800/50 rounded-lg p-3">{entry.observation}</p>
            </div>
          )}
          {entry.mistake && (
            <div>
              <p className="text-xs font-medium text-red-400 mb-1">Mistake Made</p>
              <p className="text-sm text-gray-300 bg-gray-800/50 rounded-lg p-3">{entry.mistake}</p>
            </div>
          )}
          {entry.correctIdea && (
            <div>
              <p className="text-xs font-medium text-blue-400 mb-1">Correct Approach</p>
              <p className="text-sm text-gray-300 bg-gray-800/50 rounded-lg p-3">{entry.correctIdea}</p>
            </div>
          )}
          {entry.code && (
            <div>
              <p className="text-xs font-medium text-violet-400 mb-1">Code</p>
              <pre className="text-xs text-gray-300 bg-gray-950 rounded-lg p-3 overflow-x-auto border border-gray-800">{entry.code}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Solved() {
  const [solved, setSolved] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchSolved = async (pg = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get('/solved', { params: { page: pg, limit: 15 } })
      setSolved(data.solved)
      setTotal(data.total)
      setPages(data.pages)
      setPage(pg)
    } catch {
      toast.error('Failed to load solved questions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSolved() }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">My Progress</h1>
        <p className="text-gray-400 text-sm mt-0.5">{total} questions solved total</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : solved.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle2 size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">No questions solved yet</p>
          <p className="text-gray-600 text-sm mt-1">Go to Questions and start solving!</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {solved.map((entry) => <SolvedCard key={entry._id} entry={entry} />)}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => fetchSolved(page - 1)} disabled={page === 1} className="btn-secondary py-2 px-3 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-400">Page {page} of {pages}</span>
              <button onClick={() => fetchSolved(page + 1)} disabled={page === pages} className="btn-secondary py-2 px-3 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
