'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, ChevronDown, TrendingUp, Clock, DollarSign, Eye, Users, X } from 'lucide-react';

const scaleOptions = ['All Scales', 'Small', 'Medium', 'Large', 'Enterprise'];
const sortOptions = [
    { value: 'created_at', label: 'Newest First' },
    { value: 'views_count', label: 'Most Viewed' },
    { value: 'applications_count', label: 'Most Applied' },
    { value: 'budget', label: 'Highest Budget' },
];

export default function ProblemsPage() {
    const [problems, setProblems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        scale: '',
        sortBy: 'created_at',
        status: 'open',
    });
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProblems();
    }, [filters, pagination.page]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchProblems = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: '12',
                status: filters.status,
                sortBy: filters.sortBy,
            });

            if (filters.category) params.set('category', filters.category);
            if (filters.scale && filters.scale !== 'All Scales') params.set('scale', filters.scale.toLowerCase());
            if (filters.search) params.set('search', filters.search);

            const res = await fetch(`/api/problems?${params}`);
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
        setFilters({ search: '', category: '', scale: '', sortBy: 'created_at', status: 'open' });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const activeFiltersCount = [filters.category, filters.scale, filters.search].filter(Boolean).length;

    return (
        <div className="min-h-screen">
            {/* Header */}
            <section className="bg-gradient-to-b from-primary/10 to-transparent py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl font-bold mb-4">Explore Problems</h1>
                        <p className="text-lg text-muted-foreground">
                            Discover real-world challenges from our community. Find problems that match your
                            skills and make an impact.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-8 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                placeholder="Search problems by title, description, or tags..."
                                className="input-base pl-12 h-14 text-lg"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`btn-secondary flex items-center gap-2 h-14 ${showFilters ? 'bg-primary text-white' : ''}`}
                        >
                            <Filter className="w-5 h-5" />
                            Filters
                            {activeFiltersCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="mt-4 p-6 bg-card rounded-xl border border-border animate-fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">Filters</h3>
                                <button onClick={clearFilters} className="text-sm text-primary hover:underline">
                                    Clear All
                                </button>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
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
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
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

                                {/* Sort */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Sort By</label>
                                    <select
                                        value={filters.sortBy}
                                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                                        className="input-base"
                                    >
                                        {sortOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Problems Grid */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    {/* Results Count */}
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-muted-foreground">
                            {loading ? 'Loading...' : `${pagination.total} problems found`}
                        </p>
                    </div>

                    {loading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse">
                                    <div className="h-6 bg-secondary rounded w-3/4 mb-4" />
                                    <div className="h-4 bg-secondary rounded w-full mb-2" />
                                    <div className="h-4 bg-secondary rounded w-2/3 mb-4" />
                                    <div className="flex gap-2 mb-4">
                                        <div className="h-6 bg-secondary rounded-full w-20" />
                                        <div className="h-6 bg-secondary rounded-full w-16" />
                                    </div>
                                    <div className="h-10 bg-secondary rounded w-full" />
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
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {problems.map((problem) => (
                                <ProblemCard key={problem.id} problem={problem} />
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

function ProblemCard({ problem }) {
    const scaleColors = {
        small: 'bg-green-500/10 text-green-500',
        medium: 'bg-yellow-500/10 text-yellow-500',
        large: 'bg-orange-500/10 text-orange-500',
        enterprise: 'bg-red-500/10 text-red-500',
    };

    return (
        <Link href={`/problems/${problem.id}`} className="block">
            <div className="bg-card rounded-xl p-6 border border-border card-hover h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold line-clamp-2 flex-1">{problem.title}</h3>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${scaleColors[problem.scale] || 'bg-secondary'}`}>
                        {problem.scale}
                    </span>
                </div>

                {/* Description */}
                <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
                    {problem.description}
                </p>

                {/* Tags */}
                {problem.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {problem.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-secondary rounded-full text-xs text-muted-foreground">
                                {tag}
                            </span>
                        ))}
                        {problem.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{problem.tags.length - 3}</span>
                        )}
                    </div>
                )}

                {/* Budget */}
                {problem.budget && (
                    <div className="flex items-center gap-1 text-accent font-semibold mb-4">
                        <DollarSign className="w-4 h-4" />
                        <span>{problem.budget.toLocaleString()} {problem.currency || 'USD'}</span>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {problem.viewsCount}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {problem.applicationsCount}
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(problem.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </Link>
    );
}
