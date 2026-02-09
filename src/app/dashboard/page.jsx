'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import {
    TrendingUp, Clock, DollarSign, CheckCircle, Users, Briefcase,
    ArrowRight, Eye, MessageSquare, Loader2, Plus
} from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchStats();
        }
    }, [isAuthenticated]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users/dashboard/stats', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h1>
                        <p className="text-muted-foreground">Here's what's happening with your account</p>
                    </div>
                    <Link href="/problems/new" className="btn-primary flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Post New Problem
                    </Link>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse">
                                <div className="h-8 bg-secondary rounded w-16 mb-2" />
                                <div className="h-4 bg-secondary rounded w-24" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid md:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                icon={Briefcase}
                                label="Problems Posted"
                                value={stats?.postedProblems?.total || 0}
                                subtext={`${stats?.postedProblems?.open || 0} open`}
                                color="primary"
                            />
                            <StatCard
                                icon={CheckCircle}
                                label="Problems Solved"
                                value={stats?.postedProblems?.solved || 0}
                                subtext="completed"
                                color="accent"
                            />
                            <StatCard
                                icon={Users}
                                label="Applications Sent"
                                value={stats?.applications?.total || 0}
                                subtext={`${stats?.applications?.accepted || 0} accepted`}
                                color="purple"
                            />
                            <StatCard
                                icon={TrendingUp}
                                label="Active Projects"
                                value={stats?.activeProjects || 0}
                                subtext="in progress"
                                color="blue"
                            />
                        </div>

                        {/* Quick Actions */}
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <QuickActionCard
                                href="/problems"
                                icon={Eye}
                                title="Browse Problems"
                                description="Explore open problems and find something to solve"
                            />
                            <QuickActionCard
                                href="/chat"
                                icon={MessageSquare}
                                title="AI Refinement"
                                description="Refine your problem idea with AI assistance"
                            />
                            <QuickActionCard
                                href="/profile"
                                icon={Users}
                                title="Edit Profile"
                                description="Update your skills and preferences"
                            />
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-card rounded-xl p-6 border border-border">
                            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                            {stats?.recentActivity?.length > 0 ? (
                                <div className="space-y-4">
                                    {stats.recentActivity.map((activity, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                        ${activity.type === 'problem_posted' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                                                {activity.type === 'problem_posted' ? <Briefcase className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{activity.description}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {activity.type === 'problem_posted' ? 'Posted a problem' : 'Applied to problem'}
                                                </p>
                                            </div>
                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {new Date(activity.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No recent activity</p>
                                    <Link href="/problems" className="text-primary hover:underline">
                                        Start by browsing problems
                                    </Link>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, subtext, color }) {
    const colorClasses = {
        primary: 'bg-primary/10 text-primary',
        accent: 'bg-accent/10 text-accent',
        purple: 'bg-purple-500/10 text-purple-500',
        blue: 'bg-blue-500/10 text-blue-500',
    };

    return (
        <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-3xl font-bold mb-1">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                    {subtext && <div className="text-xs text-muted-foreground mt-1">{subtext}</div>}
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}

function QuickActionCard({ href, icon: Icon, title, description }) {
    return (
        <Link href={href} className="bg-card rounded-xl p-6 border border-border card-hover group">
            <Icon className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold mb-1 flex items-center gap-2">
                {title}
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </Link>
    );
}
