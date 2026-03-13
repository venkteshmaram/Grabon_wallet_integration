import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, Shield, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
    const features = [
        {
            icon: Wallet,
            title: 'Smart Wallet',
            description: 'Manage your money with an intelligent wallet that tracks spending and maximizes savings.',
        },
        {
            icon: TrendingUp,
            title: 'Auto-Invest FDs',
            description: 'Your cashback is automatically invested in Fixed Deposits earning 7.5% interest.',
        },
        {
            icon: Shield,
            title: 'Fraud Protection',
            description: 'Advanced AI-powered fraud detection keeps your transactions secure 24/7.',
        },
        {
            icon: Sparkles,
            title: 'AI Advisor',
            description: 'Get personalized financial advice powered by Claude AI to optimize your wealth.',
        },
    ];

    const stats = [
        { value: '7.5%', label: 'FD Interest Rate' },
        { value: '₹0', label: 'Hidden Fees' },
        { value: '24/7', label: 'Fraud Monitoring' },
        { value: 'AI', label: 'Powered Insights' },
    ];

    return (
        <div className="min-h-screen bg-background">            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-black/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="flex items-center gap-2">
                                <img src="/logo.png" alt="Grabcash Logo" className="w-10 h-10 object-contain" />
                                <span className="text-2xl font-bold tracking-tight">
                                    <span className="text-gold">Grab</span>
                                    <span className="text-white">Cash</span>
                                </span>
                            </Link>
                        </div>
                        <div className="flex items-center gap-6">
                            <Link
                                href="/login"
                                className="text-sm font-semibold text-zinc-400 hover:text-gold transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link href="/login">
                                <Button size="lg" className="rounded-full px-8 bg-gold hover:bg-gold-hover text-black font-bold">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center pt-48 pb-20 overflow-hidden bg-black">
                {/* Background Hero Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/hero_branded.png" 
                        alt="Background" 
                        className="w-full h-full object-cover opacity-50 blur-[1px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black/20" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-8 animate-fade-in">
                            <Sparkles className="w-4 h-4 text-gold" />
                            <span className="text-sm font-semibold text-gold tracking-wide uppercase">Smart Wallet Intelligence</span>
                        </div>

                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] mb-8 text-white">
                            SPEND. EARN.
                            <br />
                            <span className="text-gold">GROW AUTOMATICALLY.</span>
                        </h1>

                        <p className="text-lg sm:text-xl text-zinc-400 mb-12 max-w-2xl leading-relaxed">
                            The intelligent wallet that turns every transaction into long-term wealth. 
                            Earn cashback and watch it grow in high-yield FDs automatically.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <Link href="/login" className="w-full sm:w-auto">
                                <Button size="xl" className="w-full h-16 px-10 gap-3 rounded-full bg-gold hover:bg-gold-hover text-black font-extrabold text-lg shadow-[0_0_30px_rgba(163,230,53,0.3)] transition-all hover:scale-105">
                                    Start Growing Now
                                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                            <Link href="/login" className="w-full sm:w-auto">
                                <Button size="xl" variant="outline" className="w-full h-16 px-10 rounded-full border-zinc-800 text-white hover:bg-zinc-900 font-bold text-lg">
                                    How it Works
                                </Button>
                            </Link>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap items-center gap-10 mt-20">
                            <div className="flex flex-col gap-1">
                                <span className="text-3xl font-bold text-white tracking-tight">7.5%</span>
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">FD Interest Rate</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-3xl font-bold text-white tracking-tight">Instant</span>
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cashback Credits</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-3xl font-bold text-white tracking-tight">RBI</span>
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Compliant Security</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gold/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            </section>


            {/* Stats Section */}
            <section className="border-y border-border bg-card/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-3xl sm:text-4xl font-bold text-gold mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-muted-foreground">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 lg:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Everything you need to <span className="text-gold">grow your wealth</span>
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Powerful features designed to make saving and investing effortless.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group p-6 rounded-2xl bg-card border border-border hover:border-gold/50 transition-all duration-fast hover:-translate-y-1"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gold-muted flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                                    <feature.icon className="w-6 h-6 text-gold" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 lg:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative rounded-3xl bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border border-gold-border p-8 sm:p-12 lg:p-16 text-center overflow-hidden">
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                                Ready to start your wealth journey?
                            </h2>
                            <p className="text-muted-foreground text-lg mb-8">
                                Join thousands of users who are already growing their savings with GrabCash.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/login" className="w-full sm:w-auto">
                                    <Button size="lg" className="w-full gap-2">
                                        Get Started Free
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                                <Link href="/login" className="w-full sm:w-auto">
                                    <Button size="lg" variant="outline" className="w-full">Sign In</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-zinc-900 bg-black pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-12 mb-16">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-2">
                                <img src="/logo.png" alt="Grabcash" className="w-8 h-8 object-contain" />
                                <span className="text-xl font-bold tracking-tight">
                                    <span className="text-gold">Grab</span>
                                    <span className="text-white">Cash</span>
                                </span>
                            </div>
                            <p className="text-zinc-500 max-w-xs text-sm leading-relaxed">
                                The intelligent wallet that turns your cashback into long-term wealth through high-yield automatic investments.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                            <div className="flex flex-col gap-4">
                                <span className="text-xs font-bold text-white uppercase tracking-widest">Platform</span>
                                <Link href="#" className="text-sm text-zinc-500 hover:text-gold transition-colors">Smart Wallet</Link>
                                <Link href="#" className="text-sm text-zinc-500 hover:text-gold transition-colors">FD Growth</Link>
                                <Link href="#" className="text-sm text-zinc-500 hover:text-gold transition-colors">AI Advisor</Link>
                            </div>
                            <div className="flex flex-col gap-4">
                                <span className="text-xs font-bold text-white uppercase tracking-widest">Legal</span>
                                <Link href="#" className="text-sm text-zinc-500 hover:text-gold transition-colors">Privacy</Link>
                                <Link href="#" className="text-sm text-zinc-500 hover:text-gold transition-colors">Terms</Link>
                                <Link href="#" className="text-sm text-zinc-500 hover:text-gold transition-colors">RBI Data</Link>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-zinc-600 font-medium">
                            © 2024 GrabCash. Powered by Antigravity Intelligence.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
