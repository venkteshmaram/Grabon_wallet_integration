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
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-background" />
                            </div>
                            <span className="text-xl font-bold">
                                <span className="text-gold">Grab</span>
                                <span className="text-foreground">Cash</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link href="/login">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/3 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-muted border border-gold-border mb-8">
                            <Sparkles className="w-4 h-4 text-gold" />
                            <span className="text-sm font-medium text-gold">Now with AI-powered insights</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                            Your Cashback.
                            <br />
                            <span className="text-gold">Automatically Invested.</span>
                        </h1>

                        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                            GrabCash is the smart wallet that turns your everyday spending into wealth.
                            Earn cashback, auto-invest in FDs, and get AI-powered financial advice.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/login" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full gap-2">
                                    Create Free Account
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                            <Link href="/login" className="w-full sm:w-auto">
                                <Button size="lg" variant="outline" className="w-full">Sign In</Button>
                            </Link>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green" />
                                <span>256-bit Encryption</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green" />
                                <span>RBI Compliant</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green" />
                                <span>Instant Withdrawals</span>
                            </div>
                        </div>
                    </div>
                </div>
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
            <footer className="border-t border-border py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-background" />
                            </div>
                            <span className="font-bold">
                                <span className="text-gold">Grab</span>
                                <span className="text-foreground">Cash</span>
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © 2024 GrabCash. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
