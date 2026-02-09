'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import {
    TrendingUp, Star, Filter, Search, Grid3x3, List, Heart, Bookmark,
    Eye, Users, DollarSign, Clock, Plus, ChevronDown, X, Sparkles
} from 'lucide-react';

const tabs = [
    { id: 'all', label: 'All Problems', icon: Grid3x3 },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'featured', label: 'Featured', icon: Star },
    { id: 'my-problems', label: 'My Problems', icon: Users, authRequired: true },
];

const sortOptions = [
    { value: 'created_at', label: 'Newest First' },
    { value: 'views_count', label: 'Most Viewed' },
    { value: 'applications_count', label: 'Most Applied' },
    { value: 'budget', label: 'Highest Budget' },
    { value: 'deadline', label: 'Ending Soon' },
];

const scaleOptions = ['All', 'Small', 'Medium', 'Large', 'Enterprise'];

export default function CommunityPage() {
    const { user, isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [problems, setProblems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');

    const [filters, setFilters] = useState({
        search: '',
        category: '',
        scale: 'All',
        sortBy: 'created_at',
        minBudget: '',
        maxBudget: '',
    });

    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

    useEffect(() => {
        fetchCategories();
        fetchStats();
    }, []);

    useEffect(() => {
        fetchProblems();
    }, [activeTab, filters, pagination.page]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/problems/stats');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchProblems = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: '12',
                sortBy: filters.sortBy,
            });

            if (activeTab === 'trending') params.set('trending', 'true');
            if (activeTab === 'featured') params.set('featured', 'true');
            if (activeTab === 'my-problems' && isAuthenticated) params.set('myProblems', 'true');
            if (filters.category) params.set('category', filters.category);
            if (filters.scale !== 'All') params.set('scale', filters.scale.toLowerCase());
            if (filters.search) params.set('search', filters.search);
            if (filters.minBudget) params.set('minBudget', filters.minBudget);
            if (filters.maxBudget) params.set('maxBudget', filters.maxBudget);

            const token = localStorage.getItem('token');
            const res = await fetch(`/api/problems?${params}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            const data = await res.json();

            setProblems(data.problems || []);
            setPagination(prev => ({ ...prev, ...data.pagination }));
        } catch (error) {
            console.error('Failed to fetch problems:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setFilters({ search: '', category: '', scale: 'All', sortBy: 'created_at', minBudget: '', maxBudget: '' });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const activeFiltersCount = [filters.category, filters.scale !== 'All', filters.search, filters.minBudget, filters.maxBudget].filter(Boolean).length;

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary/20 via-accent/10 to-transparent py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl font-bold mb-4 text-gradient">Community Marketplace</h1>
                        <p className="text-xl text-muted-foreground mb-8">
                            Discover real-world problems, connect with innovators, and build solutions that matter
                        </p>

                        {/* Stats */}
                        {stats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <StatCard icon={Grid3x3} label="Active Problems" value={stats.activeProblems || 0} />
                                <StatCard icon={Users} label="Active Solvers" value={stats.activeSolvers || 0} />
                                <StatCard icon={TrendingUp} label="Solutions" value={stats.totalSolutions || 0} />
                                <StatCard icon={DollarSign} label="Total Budget" value={`$${(stats.totalBudget || 0).toLocaleString()}`} />
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/problems/new" className="btn-primary flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Post a Problem
                            </Link>
                            <Link href="/chat" className="btn-secondary flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                AI Problem Refinement
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-8">
                <div className="container mx-auto px-4">
                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6 border-b border-border">
                        {tabs.map((tab) => {
                            if (tab.authRequired && !isAuthenticated) return null;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors
                    ${activeTab === tab.id
                                            ? 'border-primary text-primary font-medium'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Search & Filters Bar */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                placeholder="Search problems..."
                                className="input-base pl-12 h-12"
                            />
                        </div>

                        {/* Sort */}
                        <select
                            value={filters.sortBy}
                            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                            className="input-base h-12 w-full md:w-48"
                        >
                            {sortOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`btn-secondary h-12 flex items-center gap-2 ${showFilters ? 'bg-primary text-white' : ''}`}
                        >
                            <Filter className="w-5 h-5" />
                            Filters
                            {activeFiltersCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>

                        {/* View Mode */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-3 rounded-lg border ${viewMode === 'grid' ? 'bg-primary text-white border-primary' : 'border-border'}`}
                            >
                                <Grid3x3 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-3 rounded-lg border ${viewMode === 'list' ? 'bg-primary text-white border-primary' : 'border-border'}`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="mb-6 p-6 bg-card rounded-xl border border-border animate-fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">Advanced Filters</h3>
                                <button onClick={clearFilters} className="text-sm text-primary hover:underline">
                                    Clear All
                                </button>
                            </div>

                            <div className="grid md:grid-cols-4 gap-6">
                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Category</label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                        className="input-base"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((cat) => (
                                            <option key={cat.category_id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Scale */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Project Scale</label>
                                    <select
                                        value={filters.scale}
                                        onChange={(e) => setFilters({ ...filters, scale: e.target.value })}
                                        className="input-base"
                                    >
                                        {scaleOptions.map((scale) => (
                                            <option key={scale} value={scale}>{scale}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Min Budget */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Min Budget ($)</label>
                                    <input
                                        type="number"
                                        value={filters.minBudget}
                                        onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
                                        placeholder="0"
                                        className="input-base"
                                    />
                                </div>

                                {/* Max Budget */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Max Budget ($)</label>
                                    <input
                                        type="number"
                                        value={filters.maxBudget}
                                        onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
                                        placeholder="Any"
                                        className="input-base"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results Count */}
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-muted-foreground">
                            {loading ? 'Loading...' : `${pagination.total} problems found`}
                        </p>
                    </div>

                    {/* Problems Grid/List */}
                    {loading ? (
                        <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse">
                                    <div className="h-6 bg-secondary rounded w-3/4 mb-4" />
                                    <div className="h-4 bg-secondary rounded w-full mb-2" />
                                    <div className="h-4 bg-secondary rounded w-2/3" />
                                </div>
                            ))}
                        </div>
                    ) : problems.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-semibold mb-2">No problems found</h3>
                            <p className="text-muted-foreground mb-6">Try adjusting your filters or search terms</p>
                            <button onClick={clearFilters} className="btn-primary">
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                            {problems.map((problem) => (
                                <ProblemCard key={problem.problem_id} problem={problem} viewMode={viewMode} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-12">
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="btn-secondary py-2 px-4 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="flex items-center px-4 text-muted-foreground">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                disabled={pagination.page === pagination.totalPages}
                                className="btn-secondary py-2 px-4 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function StatCard({ icon: Icon, label, value }) {
    return (
        <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border">
            <Icon className="w-6 h-6 text-primary mb-2 mx-auto" />
            <div className="text-2xl font-bold text-center">{value}</div>
            <div className="text-xs text-muted-foreground text-center">{label}</div>
        </div>
    );
}

function ProblemCard({ problem, viewMode }) {
    const scaleColors = {
        small: 'bg-green-500/10 text-green-500',
        medium: 'bg-yellow-500/10 text-yellow-500',
        large: 'bg-orange-500/10 text-orange-500',
        enterprise: 'bg-red-500/10 text-red-500',
    };

    if (viewMode === 'list') {
        return (
            <Link href={`/problems/${problem.problem_id}`} className="block">
                <div className="bg-card rounded-xl p-6 border border-border card-hover flex items-center gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{problem.title}</h3>
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${scaleColors[problem.scale]}`}>
                                {problem.scale}
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm line-clamp-1 mb-3">{problem.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {problem.views_count}
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {problem.applications_count}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(problem.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    {problem.budget && (
                        <div className="text-right">
                            <div className="text-2xl font-bold text-accent">${problem.budget.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">{problem.currency || 'USD'}</div>
                        </div>
                    )}
                </div>
            </Link>
        );
    }

    return (
        <Link href={`/problems/${problem.problem_id}`} className="block">
            <div className="bg-card rounded-xl p-6 border border-border card-hover h-full flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold line-clamp-2 flex-1">{problem.title}</h3>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${scaleColors[problem.scale]}`}>
                        {problem.scale}
                    </span>
                </div>

                <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">{problem.description}</p>

                {problem.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {problem.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-secondary rounded-full text-xs text-muted-foreground">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {problem.budget && (
                    <div className="flex items-center gap-1 text-accent font-semibold mb-4">
                        <DollarSign className="w-4 h-4" />
                        <span>{problem.budget.toLocaleString()} {problem.currency || 'USD'}</span>
                    </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {problem.views_count}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {problem.applications_count}
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(problem.created_at).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </Link>
    );
}
