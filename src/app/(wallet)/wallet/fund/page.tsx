'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useWalletStore } from '@/store/wallet-store';
import { ArrowLeft, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiPost } from '@/lib/api-client';

export default function FundWalletPage() {
    const router = useRouter();
    const { userId } = useAuthStore();
    const refreshAll = useWalletStore((state) => state.refreshAll);
    
    const [amount, setAmount] = useState('500');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Call test-wallet API to credit balance
            await apiPost('/api/test-wallet', {
                userId,
                amount: parseFloat(amount),
                type: 'CASHBACK',
                description: 'Demo Cashback'
            });

            setSuccess(true);
            
            // Trigger global refresh (which now includes Advisor refresh!)
            await refreshAll(userId);
            
            // Redirect back to wallet after a short delay
            setTimeout(() => {
                router.push('/wallet');
            }, 2000);
        } catch (err) {
            console.error('Failed to add demo cashback:', err);
            setError('Failed to process demo cashback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-md py-12 px-4">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Add Demo Cashback</h1>
                        <p className="text-sm text-zinc-400">Instantly credit test balance</p>
                    </div>
                </div>

                {success ? (
                    <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Success!</h2>
                        <p className="text-zinc-400 mb-6">₹{amount} has been added to your wallet.</p>
                        <p className="text-xs text-gold animate-pulse">Refreshing advisor... 🪄</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Amount (₹)
                            </label>
                            <input
                                type="number"
                                min="10"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all text-lg font-bold"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[100, 500, 1000, 2000, 5000, 10000].map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setAmount(amt.toString())}
                                    className={`py-2 rounded-xl text-sm transition-all border ${
                                        amount === amt.toString() 
                                            ? 'bg-gold border-gold text-black font-bold' 
                                            : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                    }`}
                                >
                                    ₹{amt}
                                </button>
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !amount}
                            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                                loading 
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                                    : 'bg-gold text-black hover:bg-gold-hover active:scale-[0.98]'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Add Cashback'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
