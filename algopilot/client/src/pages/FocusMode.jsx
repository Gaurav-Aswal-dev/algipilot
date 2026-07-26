import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import SolveModal from '../components/SolveModal'
import {
  Play, Pause, RotateCcw, ExternalLink, Lightbulb, CheckCircle2,
  Maximize2, Minimize2, BookOpen, Flame, Sparkles, AlertCircle
} from 'lucide-react'

export default function FocusMode() {
  const [questions, setQuestions] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customLink, setCustomLink] = useState('')
  
  // Timer state
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const timerRef = useRef(null)

  // Scratchpad
  const [notes, setNotes] = useState('')
  
  // AI Hint State
  const [showHint, setShowHint] = useState(false)
  const [hintLevel, setHintLevel] = useState(1)
  const [hintContent, setHintContent] = useState('')
  const [loadingHint, setLoadingHint] = useState(false)
  
  // Solve Modal
  const [showSolveModal, setShowSolveModal] = useState(false)

  // Fullscreen state
  const [isZenMode, setIsZenMode] = useState(false)

  useEffect(() => {
    // Load available questions for easy selector
    api.get('/questions?limit=20')
      .then(({ data }) => {
        setQuestions(data.questions || [])
        if (data.questions?.[0]) setSelectedQuestion(data.questions[0])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isActive])

  const toggleTimer = () => setIsActive(!isActive)
  const resetTimer = () => {
    setIsActive(false)
    setSeconds(0)
  }

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const getAIHint = async () => {
    const title = selectedQuestion?.title || customTitle || 'Practice Problem'
    setLoadingHint(true)
    try {
      const { data } = await api.post('/ai/hint', {
        questionTitle: title,
        platform: selectedQuestion?.platform || 'Codeforces',
        hintLevel
      })
      setHintContent(data.hint)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch AI hint')
    } finally {
      setLoadingHint(false)
    }
  }

  const handleFinishSolve = () => {
    setIsActive(false)
    setShowSolveModal(true)
  }

  const currentProblem = selectedQuestion || {
    title: customTitle || 'Custom Practice Problem',
    link: customLink || '#',
    platform: 'Other',
    rating: 0,
    difficulty: 'Medium'
  }

  return (
    <div className={`space-y-6 max-w-5xl mx-auto transition-all ${isZenMode ? 'fixed inset-0 z-50 bg-gray-950 p-6 overflow-y-auto max-w-none' : ''}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Focus Mode</h1>
            <span className="badge-violet text-xs flex items-center gap-1">
              <Flame size={12} className="text-orange-400" /> Zen Environment
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-0.5">Eliminate distractions, track time & boost problem-solving focus</p>
        </div>
        <button
          onClick={() => setIsZenMode(!isZenMode)}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          {isZenMode ? <><Minimize2 size={16} /> Exit Zen</> : <><Maximize2 size={16} /> Enter Zen</>}
        </button>
      </div>

      {/* Main Focus Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Timer & Problem info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Selector Card */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <BookOpen size={18} className="text-violet-400" /> Current Problem
              </h3>
              {currentProblem.link && currentProblem.link !== '#' && (
                <a
                  href={currentProblem.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
                >
                  <ExternalLink size={13} /> Open Problem
                </a>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Select Saved Problem</label>
                <select
                  className="input text-sm py-2"
                  value={selectedQuestion?._id || ''}
                  onChange={(e) => {
                    const found = questions.find((q) => q._id === e.target.value)
                    setSelectedQuestion(found || null)
                  }}
                >
                  {questions.map((q) => (
                    <option key={q._id} value={q._id}>
                      {q.title} ({q.platform} - {q.rating}⭐)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Or Enter Custom Title</label>
                <input
                  type="text"
                  className="input text-sm py-2"
                  placeholder="e.g. 3Sum or Watermelon"
                  value={customTitle}
                  onChange={(e) => {
                    setCustomTitle(e.target.value)
                    setSelectedQuestion(null)
                  }}
                />
              </div>
            </div>

            {selectedQuestion && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="badge-blue">{selectedQuestion.platform}</span>
                {selectedQuestion.rating > 0 && <span className="badge-yellow">⭐ {selectedQuestion.rating}</span>}
                <span className="badge-violet">{selectedQuestion.difficulty}</span>
                {selectedQuestion.topics?.map((t) => (
                  <span key={t} className="badge bg-gray-800 text-gray-300 border border-gray-700">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Stopwatch Timer Card */}
          <div className="card text-center py-10 space-y-6 bg-gradient-to-b from-gray-900 via-gray-900 to-violet-950/20 border-violet-900/30">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Elapsed Time</p>
            <div className="text-6xl font-extrabold tracking-tight text-white font-mono">
              {formatTime(seconds)}
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleTimer}
                className={`py-3 px-8 rounded-2xl font-bold flex items-center gap-2 text-lg shadow-lg transition-all ${
                  isActive
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40'
                    : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/40'
                }`}
              >
                {isActive ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Start Focus</>}
              </button>

              <button
                onClick={resetTimer}
                className="btn-secondary py-3 px-5 rounded-2xl text-gray-400 hover:text-white"
                title="Reset Timer"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            <button
              onClick={handleFinishSolve}
              className="btn-primary bg-emerald-600 hover:bg-emerald-500 py-3 px-8 rounded-xl font-semibold text-white flex items-center gap-2 mx-auto"
            >
              <CheckCircle2 size={18} /> Mark Solved & Log Solution
            </button>
          </div>

          {/* Scratchpad */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-white text-sm">Focus Scratchpad (Observations & Ideas)</h3>
            <textarea
              className="input font-mono text-sm resize-none"
              rows={4}
              placeholder="Jot down key observations, constraints, dynamic programming states, or edge cases here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Right 1 Col: AI Assistance Panel */}
        <div className="space-y-6">
          <div className="card space-y-4 border-yellow-500/20 bg-gray-900/80">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-yellow-400" /> AI Focus Assistant
              </h3>
              <span className="text-xs text-yellow-400/80 bg-yellow-500/10 px-2 py-0.5 rounded">Smart Hints</span>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Stuck? Get progressive AI hints without spoiling the full algorithm.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Hint Detail Level (1-5)</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setHintLevel(lvl)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        hintLevel === lvl
                          ? 'bg-yellow-500 border-yellow-400 text-gray-950'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={getAIHint}
                disabled={loadingHint}
                className="w-full btn-secondary py-2.5 text-sm flex items-center justify-center gap-2 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
              >
                {loadingHint ? (
                  <span className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Lightbulb size={16} /> Get Hint (Level {hintLevel})</>
                )}
              </button>

              {hintContent && (
                <div className="p-3 bg-gray-950 border border-yellow-500/30 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-yellow-400">AI Hint #{hintLevel}:</p>
                  <p className="text-xs text-gray-200 leading-relaxed font-sans">{hintContent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-populated Solve Modal */}
      {showSolveModal && (
        <SolveModal
          question={currentProblem}
          onClose={() => setShowSolveModal(false)}
          onSolved={() => {
            setShowSolveModal(false)
            resetTimer()
            toast.success('Awesome work! Problem logged & Revision scheduled 🚀')
          }}
          initialTimeTaken={Math.max(1, Math.round(seconds / 60))}
          initialNotes={notes}
        />
      )}
    </div>
  )
}
