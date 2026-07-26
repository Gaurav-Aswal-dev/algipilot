import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Shield, Plus, Database, Users, BookOpen, CheckCircle2, RefreshCw, Trash2, ExternalLink } from 'lucide-react'

const PLATFORMS = ['Codeforces', 'LeetCode', 'AtCoder', 'CodeChef', 'HackerRank', 'Other']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert']

export default function Admin() {
  const [metrics, setMetrics] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    title: '',
    platform: 'Codeforces',
    rating: '1000',
    difficulty: 'Medium',
    topics: '',
    link: '',
    contestId: '',
    problemIndex: ''
  })

  const [paymentSettings, setPaymentSettings] = useState({
    merchantUpiId: 'algopilot@upi',
    merchantName: 'AlgoPilot CP',
    proPriceINR: 499
  })
  const [savingPayment, setSavingPayment] = useState(false)

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const [overviewRes, qRes, payConfigRes] = await Promise.all([
        api.get('/stats/admin-overview'),
        api.get('/questions?limit=50'),
        api.get('/payment/config')
      ])
      setMetrics(overviewRes.data.metrics)
      setQuestions(qRes.data.questions || [])
      if (payConfigRes.data) {
        setPaymentSettings({
          merchantUpiId: payConfigRes.data.merchantUpiId || 'algopilot@upi',
          merchantName: payConfigRes.data.merchantName || 'AlgoPilot CP',
          proPriceINR: payConfigRes.data.amountINR || 499
        })
      }
    } catch (err) {
      toast.error('Failed to load admin panel data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAdminData() }, [])

  const savePaymentSettings = async (e) => {
    e.preventDefault()
    if (!paymentSettings.merchantUpiId.includes('@')) {
      return toast.error('Please enter a valid UPI handle (e.g. 9876543210@paytm or name@okaxis)')
    }
    setSavingPayment(true)
    try {
      const { data } = await api.put('/payment/settings', paymentSettings)
      toast.success(data.message)
    } catch (err) {
      toast.error('Failed to update merchant payment handle')
    } finally {
      setSavingPayment(false)
    }
  }

  const handleAddQuestion = async (e) => {
    e.preventDefault()
    if (!form.title || !form.platform || !form.link) {
      return toast.error('Title, Platform and Link are required')
    }
    setSubmitting(true)
    try {
      const topicsArr = form.topics.split(',').map(t => t.trim()).filter(Boolean)
      await api.post('/questions', {
        ...form,
        rating: Number(form.rating) || 0,
        topics: topicsArr
      })
      toast.success('New Question published successfully! 🎉')
      setForm({ title: '', platform: 'Codeforces', rating: '1000', difficulty: 'Medium', topics: '', link: '', contestId: '', problemIndex: '' })
      fetchAdminData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add question')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield size={26} className="text-violet-400" /> Admin Control Center
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage questions, analytics, and platform content</p>
        </div>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: metrics.totalUsers, icon: Users, color: 'text-blue-400' },
            { label: 'Total Solved', value: metrics.totalSolved, icon: CheckCircle2, color: 'text-green-400' },
            { label: 'Active Questions', value: metrics.totalQuestions, icon: BookOpen, color: 'text-violet-400' },
            { label: 'Scheduled Revisions', value: metrics.totalRevisions, icon: RefreshCw, color: 'text-yellow-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">{label}</span>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-extrabold text-white mt-2">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Payment Gateway Configuration Info Card */}
      <div className="card bg-gradient-to-r from-yellow-950/20 via-gray-900 to-green-950/20 border-yellow-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            💰 Configure Your Personal Payment Account (Receive Money Directly)
          </h3>
          <span className="badge-green text-xs font-bold">Direct Account Credit</span>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          Enter your personal GPay, PhonePe, Paytm, or Bank <strong>UPI ID</strong> (e.g. <code>9876543210@paytm</code> or <code>yourname@okaxis</code>). When any student scans the QR code in AlgoPilot, money will be directly credited to your account.
        </p>

        <form onSubmit={savePaymentSettings} className="grid md:grid-cols-4 gap-3 pt-1 text-xs">
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold text-yellow-400 mb-1 block">YOUR MERCHANT UPI HANDLE (pa=) *</label>
            <input
              type="text"
              className="input py-2 text-sm font-mono border-yellow-500/50"
              placeholder="e.g. 9876543210@paytm or gaurav@okicici"
              value={paymentSettings.merchantUpiId}
              onChange={(e) => setPaymentSettings({ ...paymentSettings, merchantUpiId: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 mb-1 block">MERCHANT NAME (pn=)</label>
            <input
              type="text"
              className="input py-2 text-sm"
              placeholder="AlgoPilot CP"
              value={paymentSettings.merchantName}
              onChange={(e) => setPaymentSettings({ ...paymentSettings, merchantName: e.target.value })}
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={savingPayment}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              {savingPayment ? 'Saving...' : '💾 Save UPI Handle'}
            </button>
          </div>
        </form>
      </div>

      {/* Main Grid: Add Question + Questions Table */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Add Question Form */}
        <div className="card space-y-4 lg:col-span-1">
          <h3 className="font-semibold text-white text-base flex items-center gap-2">
            <Plus size={18} className="text-violet-400" /> Publish New Question
          </h3>

          <form onSubmit={handleAddQuestion} className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Title *</label>
              <input
                type="text"
                className="input py-2 text-sm"
                placeholder="e.g. Watermelon"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Platform *</label>
                <select
                  className="input py-2 text-sm"
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                >
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Difficulty</label>
                <select
                  className="input py-2 text-sm"
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                >
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Rating (⭐)</label>
                <input
                  type="number"
                  className="input py-2 text-sm"
                  placeholder="1000"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Contest ID</label>
                <input
                  type="text"
                  className="input py-2 text-sm"
                  placeholder="e.g. 4"
                  value={form.contestId}
                  onChange={(e) => setForm({ ...form, contestId: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Link URL *</label>
              <input
                type="url"
                className="input py-2 text-sm"
                placeholder="https://codeforces.com/..."
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Topics (comma-separated)</label>
              <input
                type="text"
                className="input py-2 text-sm"
                placeholder="Greedy, Math, Implementation"
                value={form.topics}
                onChange={(e) => setForm({ ...form, topics: e.target.value })}
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 text-sm mt-2">
              {submitting ? 'Publishing...' : 'Publish Question'}
            </button>
          </form>
        </div>

        {/* Existing Questions List */}
        <div className="card space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-base flex items-center gap-2">
              <Database size={18} className="text-violet-400" /> Platform Questions ({questions.length})
            </h3>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {questions.map((q) => (
              <div key={q._id} className="p-3 bg-gray-800/40 border border-gray-800 rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{q.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge-blue text-[10px]">{q.platform}</span>
                    <span className="badge-yellow text-[10px]">⭐ {q.rating}</span>
                    <span className="badge-violet text-[10px]">{q.difficulty}</span>
                  </div>
                </div>
                <a
                  href={q.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-violet-400 text-xs flex items-center gap-1 shrink-0"
                >
                  <ExternalLink size={14} /> Link
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
