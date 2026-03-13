'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Landmark, 
    ChevronRight, 
    CheckCircle2, 
    AlertCircle,
    Building2,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiGet, apiPost } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

export default function TransferPage() {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [wallet, setWallet] = useState<any>(null);

    const userId = useAuthStore(state => state.userId);

    // Fetch wallet for balance check
    useEffect(() => {
        const fetchWallet = async () => {
            if (!userId) return;
            try {
                const data = await apiGet<any>(`/api/wallet/${userId}`);
                setWallet(data.data);
            } catch (err) {
                console.error('Failed to fetch wallet');
            }
        };
        fetchWallet();
    }, [userId]);

    const handleTransfer = async () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;
        
        if (val > (wallet?.availableRupees || 0)) {
            alert("Insufficient balance!");
            return;
        }

        setIsLoading(true);
        try {
            await apiPost('/api/wallet/transfer', {
                amountPaisa: Math.round(val * 100),
                accountDetails: {
                    bankName: 'HDFC Bank',
                    accountNumber: '**** 4567'
                }
            });

            setIsSuccess(true);
            setTimeout(() => router.push('/dashboard'), 3000);
        } catch (error: any) {
            alert(error.message || "Transfer failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-24 h-24 bg-gold/20 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="w-12 h-12 text-gold" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight">Transfer Initiated!</h1>
                <p className="text-zinc-500 max-w-sm">
                    ₹{amount} is on its way to your HDFC bank account. 
                    It should reflect within 30 minutes.
                </p>
                <button 
                    onClick={() => router.push('/dashboard')}
                    className="text-gold font-bold uppercase tracking-widest text-sm"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Back</span>
            </button>

            <div className="space-y-2">
                <h1 className="text-4xl font-black text-white tracking-tighter">TRANSFER TO BANK</h1>
                <p className="text-zinc-500 font-medium">Move your GrabCash earnings back to your linked account.</p>
            </div>

            {/* Current Balance Card */}
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Linked Account</p>
                        <p className="font-bold text-white tracking-tight">HDFC BANK • 4567</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Available</p>
                    <p className="font-bold text-gold tracking-tight">₹{wallet?.availableRupees || 0}</p>
                </div>
            </div>

            {/* Input Form */}
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 space-y-8">
                <div className="space-y-4">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Amount to Transfer</label>
                    <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-zinc-700">₹</span>
                        <input 
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-black/40 border-2 border-zinc-800 rounded-2xl py-8 pl-14 pr-6 text-4xl font-black text-white focus:border-gold outline-none transition-all placeholder:text-zinc-800"
                        />
                    </div>
                </div>

                <div className="p-4 bg-zinc-800/30 rounded-2xl flex gap-4">
                    <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-1" />
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                        Transfers are powered by <span className="text-gold font-bold">Poonawalla Pay</span>. 
                        Verified transactions are completed instantly to linked bank accounts.
                    </p>
                </div>

                <button
                    onClick={handleTransfer}
                    disabled={isLoading || !amount || parseFloat(amount) <= 0}
                    className={cn(
                        "w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300",
                        "bg-gold text-black hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 shadow-[0_10px_30px_rgba(163,230,53,0.3)]"
                    )}
                >
                    {isLoading ? "Processing..." : "Confirm Transfer"}
                </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-zinc-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">No hidden charges apply</span>
            </div>
        </div>
    );
}
