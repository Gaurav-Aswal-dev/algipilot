import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { BookMarked, Search, ChevronDown, ChevronUp, ExternalLink, Edit3, Save, X, AlertTriangle, CheckCircle2, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react'

function MistakeCard({ entry, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ observation: entry.observation, mistake: entry.mistake, correctIdea: entry.correctIdea })
  const [saving, setSaving] = useState(false)
  const q = entry.questionId

  const save = async () => {
    setSaving(true)
    try {
      await api.put(`/solved/${entry._id}`, form)
      onUpdate(entry._id, form)
      setEditing(false)
      toast.success('Notes updated!')
    } catch {
      toast.error('Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setOpen(!open)}>
          <h3 className="font-semibold text-white">{q?.title || 'Deleted Question'}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {q?.platform && <span className="badge-blue">{q.platform}</span>}
            {q?.rating > 0 && <span className="badge-yellow">⭐ {q.rating}</span>}
            {q?.topics?.slice(0, 2).map((t) => (
              <span key={t} className="badge bg-gray-800 text-gray-400 border border-gray-700">{t}</span>
            ))}
            {entry.mistake && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <AlertTriangle size={11} /> Has mistake note
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Solved: {new Date(entry.solvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
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

      {open && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
          {editing ? (
            <>
              <div>
                <label className="text-xs font-medium text-green-400 mb-1 block flex items-center gap-1">
                  <CheckCircle2 size={11} /> Key Observation
                </label>
                <textarea className="input resize-none text-sm" rows={2} value={form.observation}
                  onChange={(e) => setForm({ ...form, observation: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-red-400 mb-1 block flex items-center gap-1">
                  <AlertTriangle size={11} /> Mistake Made
                </label>
                <textarea className="input resize-none text-sm" rows={2} value={form.mistake}
                  onChange={(e) => setForm({ ...form, mistake: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-blue-400 mb-1 block">Correct Approach</label>
                <textarea className="input resize-none text-sm" rows={2} value={form.correctIdea}
                  onChange={(e) => setForm({ ...form, correctIdea: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={saving} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
                  {saving ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={13} />}
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
                  <X size={13} /> Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {entry.observation && (
                <div>
                  <p className="text-xs font-medium text-green-400 mb-1.5 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Key Observation
                  </p>
                  <p className="text-sm text-gray-300 bg-gray-800/50 rounded-lg p-3">{entry.observation}</p>
                </div>
              )}
              {entry.mistake && (
                <div>
                  <p className="text-xs font-medium text-red-400 mb-1.5 flex items-center gap-1">
                    <AlertTriangle size={11} /> Mistake Made
                  </p>
                  <p className="text-sm text-gray-300 bg-gray-800/50 rounded-lg p-3">{entry.mistake}</p>
                </div>
              )}
              {entry.correctIdea && (
                <div>
                  <p className="text-xs font-medium text-blue-400 mb-1.5 flex items-center gap-1">
                    <Lightbulb size={11} /> Correct Approach
                  </p>
                  <p className="text-sm text-gray-300 bg-gray-800/50 rounded-lg p-3">{entry.correctIdea}</p>
                </div>
              )}
              {entry.code && (
                <div>
                  <p className="text-xs font-medium text-violet-400 mb-1.5">Code</p>
                  <pre className="text-xs text-gray-300 bg-gray-950 rounded-lg p-3 overflow-x-auto border border-gray-800">{entry.code}</pre>
                </div>
              )}
              {!entry.observation && !entry.mistake && !entry.correctIdea && (
                <p className="text-gray-500 text-sm italic">No notes added for this question</p>
              )}
              <button onClick={() => setEditing(true)} className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
                <Edit3 size={13} /> Edit Notes
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function MistakeBook() {
  const [entries, setEntries] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchEntries = async (pg = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get('/solved', { params: { page: pg, limit: 15 } })
      setEntries(data.solved)
      setTotal(data.total)
      setPages(data.pages)
      setPage(pg)
    } catch {
      toast.error('Failed to load mistake book')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchEntries() }, [])

  const handleUpdate = (id, updates) => {
    setEntries((prev) => prev.map((e) => e._id === id ? { ...e, ...updates } : e))
  }

  const filtered = search
    ? entries.filter((e) => e.questionId?.title?.toLowerCase().includes(search.toLowerCase()))
    : entries

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookMarked size={24} className="text-violet-400" /> Mistake Book
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Your learning journal — observations, mistakes, and correct approaches</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          className="input pl-11"
          placeholder="Search your solved questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <BookMarked size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">
            {search ? 'No matching questions' : 'Mistake book is empty'}
          </p>
          <p className="text-gray-600 text-sm mt-1">Solve questions and add notes to build your book</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filtered.map((entry) => (
              <MistakeCard key={entry._id} entry={entry} onUpdate={handleUpdate} />
            ))}
          </div>

          {!search && pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => fetchEntries(page - 1)} disabled={page === 1} className="btn-secondary py-2 px-3 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-400">Page {page} of {pages}</span>
              <button onClick={() => fetchEntries(page + 1)} disabled={page === pages} className="btn-secondary py-2 px-3 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
