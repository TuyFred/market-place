import { useState } from 'react';
import axios from 'axios';
import { formatRwf } from '../utils/format';

type TrackedOrder = {
    id: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    created_at: string;
    status: string;
    proof_url?: string | null;
    products?: { name: string; price: number; category: string } | null;
};

export function TrackOrderPage() {
    const [orderId, setOrderId] = useState('');
    const [order, setOrder] = useState<TrackedOrder | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    const statusColors: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700 border-amber-200',
        confirmed: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        shipped: 'bg-purple-100 text-purple-700 border-purple-200',
        delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        cancelled: 'bg-red-100 text-red-700 border-red-200'
    };

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim()) return;

        setLoading(true);
        setError('');
        setOrder(null);

        try {
            // In a real app, this might be a public endpoint. 
            // For now, we'll try to fetch by ID. 
            // If the backend requires auth for this, we might need a public tracking proxy.
            const res = await axios.get<TrackedOrder>(`/api/orders/${orderId.trim()}`);
            setOrder(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Order not found. Please check your ID.');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!order || !e.target.files?.[0]) return;

        setUploading(true);
        const file = e.target.files[0];
        const fd = new FormData();
        fd.append('file', file);

        try {
            await axios.post(`/api/orders/${order.id}/proof`, fd);
            // Refresh order data
            const res = await axios.get<TrackedOrder>(`/api/orders/${order.id}`);
            setOrder(res.data);
            alert('Payment proof uploaded successfully!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Track Your Order</h1>
                <p className="text-slate-500 font-medium">Enter your Order ID to check your delivery status</p>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden mb-8">
                <form onSubmit={handleTrack} className="p-8">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            className="w-full pl-6 pr-32 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Track Now'}
                        </button>
                    </div>
                    {error && <p className="mt-3 text-center text-xs font-bold text-red-500">{error}</p>}
                </form>

                {order && (
                    <div className="border-t border-slate-50 p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border ${statusColors[order.status] || statusColors.pending} mb-3`}>
                                    {order.status}
                                </span>
                                <h3 className="text-2xl font-black text-slate-900">{order.products?.name || 'Ass Marketplace Order'}</h3>
                                <p className="text-xs text-slate-400 font-bold mt-1">Ordered on {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Total</p>
                                <p className="text-xl font-black text-slate-900">{formatRwf(order.products?.price || 0)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
                                <p className="text-sm font-bold text-slate-700">{order.customer_name}</p>
                                <p className="text-xs text-slate-500">{order.customer_phone}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Address</p>
                                <p className="text-sm font-bold text-slate-700">{order.customer_address}</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                            <h4 className="text-[11px] font-black text-slate-950 uppercase tracking-[0.2em] mb-4">Payment Verification</h4>

                            {order.proof_url ? (
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-emerald-200 shrink-0">
                                        <img src={order.proof_url} alt="Proof" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-800">Proof Uploaded</p>
                                        <p className="text-[11px] text-emerald-600 font-medium">Waiting for admin to verify your payment.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 text-center">
                                    <p className="text-sm font-bold text-amber-800 mb-3">Upload Payment Proof</p>
                                    <p className="text-[11px] text-amber-700 mb-5 leading-relaxed">
                                        Please upload a screenshot of your payment confirmation (MoMo/Bank) to confirm your order.
                                    </p>
                                    <label className="inline-block cursor-pointer px-6 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20">
                                        {uploading ? 'Uploading...' : 'Choose File'}
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={handleUploadProof}
                                            disabled={uploading}
                                            accept="image/*"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100 italic text-slate-500 text-xs">
                <p>Your Order ID can be found in the confirmation message or email sent to you after placing an order.</p>
            </div>
        </div>
    );
}
