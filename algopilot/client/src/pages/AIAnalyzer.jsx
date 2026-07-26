import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Sparkles, Brain, Lightbulb, Trophy, Lock, ChevronDown, ChevronUp } from 'lucide-react'

import PricingModal from '../components/PricingModal'

const PremiumGate = () => {
  const [showPricingModal, setShowPricingModal] = useState(false)
  return (
    <div className="card text-center py-16 border-yellow-500/30 bg-gradient-to-b from-gray-900 to-yellow-950/20">
      <Lock size={44} className="mx-auto text-yellow-400 mb-3" />
      <h2 className="text-2xl font-bold text-white mb-2">Unlock AI Guidance Tools</h2>
      <p className="text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
        AI Mentor, Performance Analyzer, Contest Review, and Level 1-5 Hints are available on the <strong>AlgoPilot PRO</strong> plan.
      </p>
      <button
        onClick={() => setShowPricingModal(true)}
        className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-gray-950 font-extrabold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-yellow-950/30 transition-all"
      >
        <Sparkles size={16} /> Upgrade to PRO (₹499/year)
      </button>

      {showPricingModal && <PricingModal onClose={() => setShowPricingModal(false)} />}
    </div>
  )
}

function ResultBox({ title, content, icon: Icon, color }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="card">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(!open)}>
        <h3 className={`font-semibold flex items-center gap-2 ${color}`}>
          <Icon size={18} /> {title}
        </h3>
        {open ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </div>
      {open && content && (
        <div className="mt-4 p-4 bg-gray-800/50 rounded-xl">
          <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">{content}</pre>
        </div>
      )}
    </div>
  )
}

export default function AIAnalyzer() {
  const { user } = useAuth()
  const [tab, setTab] = useState('analyzer')
  const [analyzerResult, setAnalyzerResult] = useState('')
  const [mentorResult, setMentorResult] = useState('')
  const [hintForm, setHintForm] = useState({ questionTitle: '', platform: 'Codeforces', topic: '', rating: '', hintLevel: 1 })
  const [hintResult, setHintResult] = useState('')
  
  // Contest Review State
  const [contestForm, setContestForm] = useState({
    contestName: 'Codeforces Round #900 (Div. 2)',
    problems: [
      { label: 'Problem A', title: '', timeTaken: 10, solved: true, wrongAttempts: 0 },
      { label: 'Problem B', title: '', timeTaken: 25, solved: true, wrongAttempts: 1 },
      { label: 'Problem C', title: '', timeTaken: 45, solved: false, wrongAttempts: 3 },
    ]
  })
  const [contestResult, setContestResult] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user?.isPremium) return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Sparkles size={24} className="text-violet-400" /> AI Tools
      </h1>
      <PremiumGate />
    </div>
  )

  const runAnalyzer = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/ai/analyze')
      setAnalyzerResult(data.analysis)
      toast.success('Analysis complete!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed')
    } finally { setLoading(false) }
  }

  const runMentor = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/ai/mentor')
      setMentorResult(data.roadmap)
      toast.success('Roadmap generated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mentor failed')
    } finally { setLoading(false) }
  }

  const getHint = async () => {
    if (!hintForm.questionTitle) return toast.error('Enter question title')
    setLoading(true)
    try {
      const { data } = await api.post('/ai/hint', hintForm)
      setHintResult(data.hint)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Hint failed')
    } finally { setLoading(false) }
  }

  const runContestReview = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/ai/contest-review', contestForm)
      setContestResult(data.review)
      toast.success('Contest analysis completed!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Contest review failed')
    } finally { setLoading(false) }
  }

  const tabs = [
    { key: 'analyzer', label: 'Performance Analyzer', icon: Brain },
    { key: 'mentor', label: 'AI Mentor', icon: Trophy },
    { key: 'hint', label: 'AI Hint', icon: Lightbulb },
    { key: 'contest', label: 'Contest Analyzer', icon: Sparkles },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles size={24} className="text-violet-400" /> AI Tools
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Powered by OpenAI — Premium feature</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Analyzer */}
      {tab === 'analyzer' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Brain size={18} className="text-violet-400" /> AI Performance Analyzer
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Analyzes your solved history and gives you an overall score, strong/weak topics, and actionable recommendations.
            </p>
            <button onClick={runAnalyzer} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing...</>
                : <><Sparkles size={16} /> Analyze Me</>
              }
            </button>
          </div>
          {analyzerResult && (
            <ResultBox title="Your Analysis Report" content={analyzerResult} icon={Brain} color="text-violet-300" />
          )}
        </div>
      )}

      {/* Mentor */}
      {tab === 'mentor' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Trophy size={18} className="text-yellow-400" /> AI Mentor — Your Roadmap
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Get a personalized week-by-week plan to reach your target rating based on your current performance.
            </p>
            <button onClick={runMentor} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
                : <><Trophy size={16} /> Get My Roadmap</>
              }
            </button>
          </div>
          {mentorResult && (
            <ResultBox title="Your Personalized Roadmap" content={mentorResult} icon={Trophy} color="text-yellow-300" />
          )}
        </div>
      )}

      {/* Hint */}
      {tab === 'hint' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Lightbulb size={18} className="text-yellow-400" /> AI Hint System
            </h3>
            <p className="text-gray-400 text-sm">Progressive hints — never the full solution.</p>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Question Title *</label>
              <input className="input" placeholder="e.g. Life Without Zeroes" value={hintForm.questionTitle}
                onChange={(e) => setHintForm({ ...hintForm, questionTitle: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Platform</label>
                <input className="input" placeholder="Codeforces" value={hintForm.platform}
                  onChange={(e) => setHintForm({ ...hintForm, platform: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Topic (optional)</label>
                <input className="input" placeholder="e.g. Greedy" value={hintForm.topic}
                  onChange={(e) => setHintForm({ ...hintForm, topic: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-2 block">Hint Level: {hintForm.hintLevel}/5</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((l) => (
                  <button
                    key={l}
                    onClick={() => setHintForm({ ...hintForm, hintLevel: l })}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                      hintForm.hintLevel === l ? 'bg-violet-600 border-violet-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-1">1 = Subtle hint · 5 = Detailed approach (no code)</p>
            </div>

            <button onClick={getHint} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Getting hint...</>
                : <><Lightbulb size={16} /> Get Hint {hintForm.hintLevel}</>
              }
            </button>
          </div>

          {hintResult && (
            <ResultBox title={`Hint Level ${hintForm.hintLevel}`} content={hintResult} icon={Lightbulb} color="text-yellow-300" />
          )}
        </div>
      )}

      {/* Contest Analyzer */}
      {tab === 'contest' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-violet-400" /> Contest Performance Review
            </h3>
            <p className="text-gray-400 text-sm">Analyze time allocation, wrong attempts, and strategy after contests.</p>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Contest Name</label>
              <input
                className="input text-sm"
                value={contestForm.contestName}
                onChange={(e) => setContestForm({ ...contestForm, contestName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 block">Problems Outcome</label>
              {contestForm.problems.map((p, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-800/40 p-2.5 rounded-xl text-sm">
                  <span className="w-20 font-semibold text-white text-xs">{p.label}</span>
                  <input
                    type="text"
                    className="input py-1 px-2.5 text-xs flex-1"
                    placeholder="Problem Title"
                    value={p.title}
                    onChange={(e) => {
                      const updated = [...contestForm.problems]
                      updated[i].title = e.target.value
                      setContestForm({ ...contestForm, problems: updated })
                    }}
                  />
                  <input
                    type="number"
                    className="input py-1 px-2 text-xs w-16"
                    placeholder="Min"
                    value={p.timeTaken}
                    onChange={(e) => {
                      const updated = [...contestForm.problems]
                      updated[i].timeTaken = Number(e.target.value)
                      setContestForm({ ...contestForm, problems: updated })
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...contestForm.problems]
                      updated[i].solved = !updated[i].solved
                      setContestForm({ ...contestForm, problems: updated })
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                      p.solved ? 'bg-green-600/30 border-green-500 text-green-300' : 'bg-red-600/30 border-red-500 text-red-300'
                    }`}
                  >
                    {p.solved ? 'Solved' : 'Skipped'}
                  </button>
                </div>
              ))}
            </div>

            <button onClick={runContestReview} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Reviewing...</>
                : <><Sparkles size={16} /> Analyze Contest</>
              }
            </button>
          </div>

          {contestResult && (
            <ResultBox title="Contest Breakdown & Feedback" content={contestResult} icon={Sparkles} color="text-violet-300" />
          )}
        </div>
      )}
    </div>
  )
}
