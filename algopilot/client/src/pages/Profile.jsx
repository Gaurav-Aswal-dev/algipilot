import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { User, Star, Flame, BookOpen, Trophy, Edit3, Save, X, Lock, Medal } from 'lucide-react'

const ACHIEVEMENTS = [
  { id: '7day', icon: '🔥', label: '7 Day Streak', desc: 'Solve at least once for 7 consecutive days' },
  { id: '30day', icon: '💪', label: '30 Day Streak', desc: '30 consecutive days' },
  { id: 'q50', icon: '📚', label: '50 Questions', desc: 'Solve 50 questions total' },
  { id: 'q100', icon: '💯', label: '100 Questions', desc: 'Solve 100 questions total' },
  { id: 'q250', icon: '🏆', label: '250 Questions', desc: 'Solve 250 questions total' },
  { id: 'greedy', icon: '🧠', label: 'Greedy Master', desc: 'Solve 20+ Greedy problems' },
  { id: 'impl', icon: '⚡', label: 'Implementation King', desc: 'Solve 30+ Implementation problems' },
  { id: 'dp', icon: '🌟', label: 'DP Wizard', desc: 'Solve 15+ Dynamic Programming problems' },
]

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [stats, setStats] = useState(null)
  const [editing, setEditing] = useState(false)
  const [changingPass, setChangingPass] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    country: user?.country || '',
    college: user?.college || '',
    codeforcesUsername: user?.codeforcesUsername || '',
    leetcodeUsername: user?.leetcodeUsername || '',
    targetRating: user?.targetRating || 1400,
    dailyGoal: user?.dailyGoal || 2,
  })
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/stats/overview')
      .then(({ data }) => setStats(data.stats))
      .catch(() => {})
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/auth/profile', form)
      updateUser(data.user)
      setEditing(false)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally { setSaving(false) }
  }

  const changePassword = async () => {
    if (!passForm.currentPassword || !passForm.newPassword) return toast.error('Fill all fields')
    if (passForm.newPassword !== passForm.confirm) return toast.error('Passwords do not match')
    if (passForm.newPassword.length < 6) return toast.error('Password too short')
    setSaving(true)
    try {
      await api.put('/auth/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      })
      setChangingPass(false)
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' })
      toast.success('Password changed successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally { setSaving(false) }
  }

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
  const setP = (f) => (e) => setPassForm({ ...passForm, [f]: e.target.value })

  const earnedIds = user?.achievements || []

  const [syncing, setSyncing] = useState(false)

  const syncCodeforces = async () => {
    setSyncing(true)
    try {
      const { data } = await api.post('/auth/sync-codeforces', { codeforcesUsername: form.codeforcesUsername || user?.codeforcesUsername })
      updateUser(data.user)
      toast.success(data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync Codeforces handle')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <User size={24} className="text-violet-400" /> Profile
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left — avatar + stats */}
        <div className="space-y-4">
          {/* Avatar card */}
          <div className="card text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-3xl font-bold text-white mx-auto overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase()
              )}
            </div>
            <h2 className="text-lg font-bold text-white mt-3">{user?.name}</h2>
            <p className="text-gray-500 text-sm">@{user?.username || 'no-username'}</p>
            {user?.isPremium && (
              <span className="inline-flex items-center gap-1 mt-2 text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-full">
                ⭐ Premium
              </span>
            )}
            {user?.college && <p className="text-gray-400 text-xs mt-2">{user.college}</p>}
            {user?.country && <p className="text-gray-500 text-xs">{user.country}</p>}

            <button
              onClick={syncCodeforces}
              disabled={syncing}
              className="mt-4 w-full btn-secondary py-2 text-xs flex items-center justify-center gap-1.5 border border-violet-500/30 text-violet-300 hover:bg-violet-600/20"
            >
              {syncing ? (
                <span className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>🔄 Sync Codeforces Rating</>
              )}
            </button>
          </div>

          {/* Quick stats */}
          <div className="card space-y-3">
            {[
              { icon: Star, label: 'CF Rating', value: stats?.codeforcesRating ?? user?.codeforcesRating ?? 0, color: 'text-yellow-400' },
              { icon: Trophy, label: 'Highest Rating', value: stats?.highestRating ?? user?.highestRating ?? 0, color: 'text-orange-400' },
              { icon: BookOpen, label: 'Total Solved', value: stats?.totalSolved ?? 0, color: 'text-violet-400' },
              { icon: Flame, label: 'Current Streak', value: `${stats?.streak ?? user?.streak ?? 0}d`, color: 'text-orange-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-400">
                  <Icon size={14} className={color} /> {label}
                </span>
                <span className="font-semibold text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — edit form */}
        <div className="md:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Profile Details</h3>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-2">
                  <Edit3 size={14} /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={saveProfile} disabled={saving} className="btn-primary py-1.5 px-3 text-sm flex items-center gap-2">
                    {saving ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-secondary py-1.5 px-3 text-sm">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { f: 'name', label: 'Full Name', placeholder: 'Rahul Kumar' },
                { f: 'username', label: 'Username', placeholder: 'rahul07' },
                { f: 'country', label: 'Country', placeholder: 'India' },
                { f: 'college', label: 'College', placeholder: 'IIT Delhi' },
                { f: 'codeforcesUsername', label: 'Codeforces Handle', placeholder: 'tourist' },
                { f: 'leetcodeUsername', label: 'LeetCode Username', placeholder: 'rahul123' },
              ].map(({ f, label, placeholder }) => (
                <div key={f}>
                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                  {editing ? (
                    <input className="input py-2 text-sm" placeholder={placeholder} value={form[f]} onChange={set(f)} />
                  ) : (
                    <p className="text-sm text-white py-2 px-3 bg-gray-800/50 rounded-xl min-h-[40px]">
                      {user?.[f] || <span className="text-gray-600">Not set</span>}
                    </p>
                  )}
                </div>
              ))}

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Target Rating</label>
                {editing ? (
                  <input type="number" className="input py-2 text-sm" value={form.targetRating} onChange={set('targetRating')} />
                ) : (
                  <p className="text-sm text-white py-2 px-3 bg-gray-800/50 rounded-xl">{user?.targetRating || 1400}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Daily Goal (questions)</label>
                {editing ? (
                  <input type="number" className="input py-2 text-sm" min="1" max="20" value={form.dailyGoal} onChange={set('dailyGoal')} />
                ) : (
                  <p className="text-sm text-white py-2 px-3 bg-gray-800/50 rounded-xl">{user?.dailyGoal || 2}</p>
                )}
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Lock size={16} className="text-gray-400" /> Change Password
              </h3>
              {!changingPass && (
                <button onClick={() => setChangingPass(true)} className="btn-secondary py-1.5 px-3 text-sm">
                  Change
                </button>
              )}
            </div>
            {changingPass && (
              <div className="space-y-3">
                <input type="password" className="input text-sm" placeholder="Current password" value={passForm.currentPassword} onChange={setP('currentPassword')} />
                <input type="password" className="input text-sm" placeholder="New password (min 6 chars)" value={passForm.newPassword} onChange={setP('newPassword')} />
                <input type="password" className="input text-sm" placeholder="Confirm new password" value={passForm.confirm} onChange={setP('confirm')} />
                <div className="flex gap-2">
                  <button onClick={changePassword} disabled={saving} className="btn-primary py-2 px-4 text-sm">
                    {saving ? '...' : 'Update Password'}
                  </button>
                  <button onClick={() => setChangingPass(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card">
        <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
          <Medal size={18} className="text-yellow-400" /> Achievements
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map(({ id, icon, label, desc }) => {
            const earned = earnedIds.includes(id)
            return (
              <div
                key={id}
                className={`p-4 rounded-xl border text-center transition-all ${
                  earned
                    ? 'bg-violet-900/20 border-violet-500/30'
                    : 'bg-gray-800/30 border-gray-800 opacity-50 grayscale'
                }`}
              >
                <div className="text-3xl mb-2">{icon}</div>
                <p className={`text-xs font-semibold ${earned ? 'text-white' : 'text-gray-500'}`}>{label}</p>
                <p className="text-xs text-gray-600 mt-1">{desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
