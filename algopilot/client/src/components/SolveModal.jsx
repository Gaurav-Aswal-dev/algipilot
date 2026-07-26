import { useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { X, Clock, Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function SolveModal({ question, onClose, onSolved, initialTimeTaken = '', initialNotes = '' }) {
  const [form, setForm] = useState({
    timeTaken: initialTimeTaken ? String(initialTimeTaken) : '',
    hintUsed: false,
    perceivedDifficulty: 'Medium',
    observation: initialNotes || '',
    mistake: '',
    correctIdea: '',
    code: '',
  })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 2-step form

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [field]: val })
  }

  const handleNextStep = () => {
    if (!form.timeTaken || Number(form.timeTaken) <= 0) {
      return toast.error('Please enter a valid time taken (in minutes)')
    }
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!form.timeTaken || Number(form.timeTaken) <= 0) return toast.error('Please enter time taken')
    setLoading(true)
    try {
      await api.post('/solved', { questionId: question._id, ...form, timeTaken: Number(form.timeTaken) })
      onSolved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark solved')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="font-bold text-white text-lg">Mark as Solved</h2>
            <p className="text-gray-400 text-sm mt-0.5 truncate max-w-xs">{question.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white ml-4">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Step indicator */}
          <div className="flex gap-2 mb-4">
            {[1, 2].map((s) => (
              <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? 'bg-violet-500' : 'bg-gray-800'}`} />
            ))}
          </div>

          {step === 1 && (
            <>
              {/* Time taken */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2 block">
                  <Clock size={14} className="text-violet-400" /> Time Taken (minutes) *
                </label>
                <input type="number" className="input" placeholder="e.g. 25" min="0" value={form.timeTaken} onChange={set('timeTaken')} />
              </div>

              {/* Perceived difficulty */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">How hard did it feel?</label>
                <div className="flex gap-2">
                  {['Easy', 'Medium', 'Hard'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm({ ...form, perceivedDifficulty: d })}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                        form.perceivedDifficulty === d
                          ? d === 'Easy' ? 'bg-green-600 border-green-500 text-white'
                            : d === 'Hard' ? 'bg-red-600 border-red-500 text-white'
                            : 'bg-yellow-600 border-yellow-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hint used */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setForm({ ...form, hintUsed: !form.hintUsed })}
                  className={`w-10 h-5 rounded-full transition-colors ${form.hintUsed ? 'bg-violet-600' : 'bg-gray-700'} relative`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${form.hintUsed ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm text-gray-300 flex items-center gap-1.5">
                  <Lightbulb size={14} className="text-yellow-400" /> Hint Used
                </span>
              </label>

              <button onClick={handleNextStep} className="btn-primary w-full py-3">
                Next: Add Notes →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2 block">
                  <CheckCircle2 size={14} className="text-green-400" /> Key Observation
                </label>
                <textarea className="input resize-none" rows={2} placeholder="What was the key insight to solve this?" value={form.observation} onChange={set('observation')} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2 block">
                  <AlertTriangle size={14} className="text-red-400" /> Mistake Made
                </label>
                <textarea className="input resize-none" rows={2} placeholder="What went wrong? What took extra time?" value={form.mistake} onChange={set('mistake')} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Correct Idea / Approach</label>
                <textarea className="input resize-none" rows={2} placeholder="Summarize the correct approach" value={form.correctIdea} onChange={set('correctIdea')} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Code Snippet (optional)</label>
                <textarea className="input resize-none font-mono text-sm" rows={3} placeholder="Paste key part of your solution..." value={form.code} onChange={set('code')} />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">
                  ← Back
                </button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 py-3">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : '✓ Save & Schedule Revision'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
