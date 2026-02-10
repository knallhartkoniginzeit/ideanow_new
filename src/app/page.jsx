import Link from 'next/link';
import {
    Sparkles, ArrowRight, Brain, Globe, Users, Zap, MessageSquare,
    TrendingUp, Shield, DollarSign, Star, ChevronRight
} from 'lucide-react';

const features = [
    {
        icon: Brain,
        title: 'AI-Powered Refinement',
        description: 'Our AI helps you transform vague ideas into specific, actionable problem statements.',
        color: 'from-purple-500 to-pink-500',
    },
    {
        icon: Globe,
        title: 'Web-Scraped Insights',
        description: 'Discover emerging problems from news, research papers, and trending discussions.',
        color: 'from-blue-500 to-cyan-500',
    },
    {
        icon: Users,
        title: 'Community Marketplace',
        description: 'Connect with solvers worldwide. Post problems, find solutions, and collaborate.',
        color: 'from-green-500 to-emerald-500',
    },
];



const categories = [
    { name: 'Technology', icon: '💻', problems: 2847 },
    { name: 'Healthcare', icon: '🏥', problems: 1923 },
    { name: 'Environment', icon: '🌍', problems: 1456 },
    { name: 'Education', icon: '📚', problems: 1234 },
    { name: 'Finance', icon: '💰', problems: 987 },
    { name: 'Social Impact', icon: '🤝', problems: 856 },
];

export default function HomePage() {
    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />

                <div className="container mx-auto px-4 py-20 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">AI-Powered Problem Discovery Platform</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-slide-up">
                            Turn Ideas Into
                            <span className="block text-gradient mt-2">Niche Innovations</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            Discover real-world problems, refine them with AI, and connect with a global community
                            of problem solvers. Your next breakthrough starts here.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <Link href="/chat" className="btn-primary text-lg py-4 px-8 flex items-center justify-center gap-2 group">
                                <MessageSquare className="w-5 h-5" />
                                Start with AI
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="/problems" className="btn-outline text-lg py-4 px-8">
                                Explore Problems
                            </Link>
                        </div>


                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-secondary/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Three Powerful Modules</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            !deanow combines AI, web intelligence, and human creativity to help you discover
                            and solve meaningful problems.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, i) => (
                            <div key={i} className="group bg-card rounded-2xl p-8 border border-border card-hover">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6
                              group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">How !deanow Works</h2>
                        <p className="text-lg text-muted-foreground">From idea to innovation in four simple steps</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8 relative">
                        {/* Connection Line */}
                        <div className="hidden md:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary via-purple-500 to-accent" />

                        {[
                            { step: '01', title: 'Share Your Idea', desc: 'Enter your rough problem idea or domain of interest', icon: MessageSquare },
                            { step: '02', title: 'AI Refinement', desc: 'Our AI analyzes and helps you refine the problem statement', icon: Brain },
                            { step: '03', title: 'Discover Related', desc: 'Find similar problems from research, news, and community', icon: TrendingUp },
                            { step: '04', title: 'Take Action', desc: 'Post to community, find solvers, or start building', icon: Zap },
                        ].map((item, i) => (
                            <div key={i} className="relative text-center">
                                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xl mb-6 relative z-10">
                                    {item.step}
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-24 bg-secondary/30">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
                        <div>
                            <h2 className="text-4xl font-bold mb-2">Explore Categories</h2>
                            <p className="text-muted-foreground">Find problems in your area of expertise</p>
                        </div>
                        <Link href="/problems" className="flex items-center gap-2 text-primary hover:underline">
                            View All Categories <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {categories.map((cat, i) => (
                            <Link key={i} href={`/problems?category=${cat.name}`}
                                className="bg-card rounded-xl p-6 border border-border text-center card-hover">
                                <span className="text-4xl mb-3 block">{cat.icon}</span>
                                <h3 className="font-semibold mb-1">{cat.name}</h3>
                                <p className="text-sm text-muted-foreground">{cat.problems.toLocaleString()} problems</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl font-bold mb-6">Why Choose !deanow?</h2>
                            <div className="space-y-6">
                                {[
                                    { icon: Zap, title: 'Fast Problem Discovery', desc: 'AI-powered search across millions of data points' },
                                    { icon: Shield, title: 'Secure Transactions', desc: 'Escrow system protects both parties in paid projects' },
                                    { icon: Star, title: 'Quality Community', desc: 'Verified solvers with ratings and reviews' },
                                    { icon: DollarSign, title: 'Flexible Pricing', desc: 'From free collaborations to enterprise projects' },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <item.icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">{item.title}</h3>
                                            <p className="text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-20" />
                            <div className="relative bg-card rounded-3xl p-8 border border-border">
                                <div className="text-center mb-8">
                                    <div className="text-6xl font-bold text-gradient mb-2">95%</div>
                                    <p className="text-muted-foreground">of users find valuable problem insights within first session</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-secondary/50 rounded-xl p-4 text-center">
                                        <div className="text-2xl font-bold text-primary">2.5x</div>
                                        <p className="text-sm text-muted-foreground">Faster ideation</p>
                                    </div>
                                    <div className="bg-secondary/50 rounded-xl p-4 text-center">
                                        <div className="text-2xl font-bold text-accent">85%</div>
                                        <p className="text-sm text-muted-foreground">Success rate</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-primary opacity-90" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                <div className="container mx-auto px-4 relative z-10 text-center text-white">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Innovate?</h2>
                    <p className="text-xl opacity-90 max-w-2xl mx-auto mb-10">
                        Join thousands of problem solvers and innovators. Start discovering
                        meaningful problems today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/register"
                            className="bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg
                           hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                            Get Started Free
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/chat"
                            className="bg-white/10 border-2 border-white/30 text-white px-8 py-4 rounded-lg font-semibold text-lg
                           hover:bg-white/20 transition-colors">
                            Try AI Chat Demo
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
