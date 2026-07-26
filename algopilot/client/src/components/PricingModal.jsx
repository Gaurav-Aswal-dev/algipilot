import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  X, Star, Check, Sparkles, ShieldCheck, Zap,
  CreditCard, Smartphone, Building2, ArrowRight, QrCode
} from 'lucide-react'

export default function PricingModal({ onClose, onSuccess }) {
  const { updateUser } = useAuth()
  const [paymentMethod, setPaymentMethod] = useState('upi') // 'upi' | 'card' | 'netbanking'
  const [txnId, setTxnId] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)

  useEffect(() => {
    // Generate Payment Order & UPI QR Data
    api.post('/payment/create-order')
      .then(({ data }) => setOrder(data))
      .catch(() => {})
  }, [])

  const handleVerifyAndSubscribe = async () => {
    if (paymentMethod === 'upi' && !txnId.trim()) {
      return toast.error('Please enter the 12-digit UPI UTR / Transaction Reference ID after paying')
    }
    setLoading(true)
    try {
      const { data } = await api.post('/payment/verify-payment', {
        mode: order?.mode || paymentMethod,
        upi_transaction_id: txnId || `TXN_${Date.now()}`
      })
      updateUser(data.user)
      toast.success(data.message)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-yellow-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-yellow-950/20">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-800 bg-gradient-to-r from-yellow-950/30 via-gray-900 to-violet-950/30">
          <button onClick={onClose} className="absolute right-5 top-5 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="badge-yellow text-xs flex items-center gap-1 font-bold">
              <Star size={12} className="fill-yellow-400 text-yellow-400" /> AlgoPilot PRO
            </span>
            <span className="text-xs text-green-400 font-semibold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
              66% OFF TODAY
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-2">Subscribe to AlgoPilot PRO</h2>
          <p className="text-gray-400 text-sm mt-1">Directly credit payment to merchant UPI & unlock AI features</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Plan Price Banner */}
          <div className="card bg-gradient-to-r from-violet-950/40 via-gray-900 to-yellow-950/30 border-yellow-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-yellow-400 font-bold uppercase tracking-wider">PRO Annual Membership</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-white">₹499</span>
                <span className="text-sm text-gray-500 line-through">₹1,499</span>
                <span className="text-xs text-gray-400">/ year</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Direct merchant credit to: <strong className="text-yellow-300">{order?.upiId || 'algopilot@upi'}</strong></p>
            </div>
            <div className="shrink-0">
              <span className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 text-xs font-bold rounded-xl flex items-center gap-1">
                <Zap size={14} /> Direct Merchant Credit
              </span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Payment Gateway / Direct UPI</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'upi', label: 'Scan & Pay UPI QR', icon: QrCode },
                { id: 'gpay', label: 'GPay / PhonePe / Paytm', icon: Smartphone },
                { id: 'card', label: 'Card / NetBanking', icon: CreditCard },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    paymentMethod === id
                      ? 'bg-violet-600/20 border-violet-500 text-white font-semibold'
                      : 'bg-gray-800/40 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <Icon size={18} className="mx-auto mb-1 text-violet-400" />
                  <span className="text-xs block">{label}</span>
                </button>
              ))}
            </div>

            {/* UPI QR Display Card */}
            <div className="p-5 bg-gray-950 border border-gray-800 rounded-2xl text-center space-y-3">
              {order?.qrUrl && (
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-white rounded-2xl shadow-lg border-2 border-yellow-400">
                    <img src={order.qrUrl} alt="UPI Payment QR" className="w-44 h-44 object-contain" />
                  </div>
                  <p className="text-xs text-yellow-400 font-semibold mt-2">Scan QR with GPay / PhonePe / Paytm / BHIM</p>
                  <p className="text-xs text-gray-400 mt-0.5">UPI VPA: <span className="text-white font-mono font-bold select-all">{order.upiId}</span></p>
                </div>
              )}

              <div className="pt-2 text-left space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 block">
                  Enter UTR / Transaction Reference ID (after paying ₹499)
                </label>
                <input
                  type="text"
                  className="input py-2.5 text-sm font-mono"
                  placeholder="e.g. 329849201948 or UPI Ref No."
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 text-left pt-1">
                <ShieldCheck size={13} className="text-green-400" /> Money will be credited directly to merchant account ({order?.upiId})
              </div>
            </div>
          </div>

          {/* Subscribe Action Button */}
          <button
            onClick={handleVerifyAndSubscribe}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 via-amber-500 to-violet-600 hover:from-yellow-400 hover:to-violet-500 text-gray-950 font-extrabold py-3.5 px-6 rounded-2xl shadow-xl shadow-yellow-950/30 transition-all flex items-center justify-center gap-2 text-base"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Sparkles size={18} /> Verify Payment & Activate PRO <ArrowRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
