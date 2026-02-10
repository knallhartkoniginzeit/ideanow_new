'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Clock, Eye, Users, DollarSign, Tag, Calendar, Star,
    Send, User, Check, X, Loader2, ExternalLink, MessageSquare
} from 'lucide-react';

export default function ProblemDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applicationForm, setApplicationForm] = useState({
        coverLetter: '',
        proposedApproach: '',
        estimatedTime: '',
        proposedBudget: '',
    });

    useEffect(() => {
        fetchProblem();
    }, [id]);

    const fetchProblem = async () => {
        if (!id || id === 'undefined' || id === 'null') return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/problems/${id}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });

            if (!res.ok) {
                if (res.status === 404) {
                    router.push('/problems');
                    return;
                }
                throw new Error('Failed to fetch problem');
            }

            const data = await res.json();
            setProblem(data);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to load problem');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        setApplying(true);
        try {
            const token = localStorage.getItem('token');

            // Log the data being sent for debugging
            console.log('Submitting application:', applicationForm);

            const res = await fetch(`/api/problems/${id}/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(applicationForm),
            });

            const data = await res.json();
            console.log('Server response:', { status: res.status, data });

            if (!res.ok) {
                // Handle validation errors
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMessages = data.errors.map(err => err.msg).join(', ');
                    throw new Error(errorMessages);
                }
                throw new Error(data.error || data.message || 'Failed to submit application');
            }

            toast.success('Application submitted successfully!');
            setShowApplyModal(false);
            setApplicationForm({
                coverLetter: '',
                proposedApproach: '',
                estimatedTime: '',
                proposedBudget: '',
            });
            fetchProblem();
        } catch (error) {
            console.error('Application submission error:', error);
            toast.error(error.message || 'Failed to submit application');
        } finally {
            setApplying(false);
        }
    };

    const scaleColors = {
        small: 'bg-green-500/10 text-green-500 border-green-500/20',
        medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        large: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        enterprise: 'bg-red-500/10 text-red-500 border-red-500/20',
    };

    const statusColors = {
        open: 'bg-green-500/10 text-green-500',
        in_progress: 'bg-blue-500/10 text-blue-500',
        under_review: 'bg-purple-500/10 text-purple-500',
        solved: 'bg-accent/10 text-accent',
        closed: 'bg-muted text-muted-foreground',
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!problem) return null;

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4">
                {/* Back Button */}
                <Link href="/problems" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Problems
                </Link>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header */}
                        <div className="bg-card rounded-xl p-6 border border-border">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[problem.status]}`}>
                                    {problem.status.replace('_', ' ')}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${scaleColors[problem.scale]}`}>
                                    {problem.scale}
                                </span>
                                <span className="px-3 py-1 rounded-full text-sm bg-secondary">
                                    {problem.category}
                                </span>
                            </div>

                            <h1 className="text-2xl md:text-3xl font-bold mb-4">{problem.title}</h1>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    {problem.viewsCount} views
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {problem.applicationsCount} applications
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Posted {new Date(problem.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-card rounded-xl p-6 border border-border">
                            <h2 className="text-lg font-semibold mb-4">Problem Description</h2>
                            <div className="prose prose-invert max-w-none">
                                <p className="whitespace-pre-wrap">{problem.description}</p>
                            </div>
                        </div>

                        {/* Required Skills */}
                        {problem.requiredSkills?.length > 0 && (
                            <div className="bg-card rounded-xl p-6 border border-border">
                                <h2 className="text-lg font-semibold mb-4">Required Skills</h2>
                                <div className="flex flex-wrap gap-2">
                                    {problem.requiredSkills.map((skill, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {problem.tags?.length > 0 && (
                            <div className="bg-card rounded-xl p-6 border border-border">
                                <h2 className="text-lg font-semibold mb-4">Tags</h2>
                                <div className="flex flex-wrap gap-2">
                                    {problem.tags.map((tag, i) => (
                                        <span key={i} className="flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-lg text-sm">
                                            <Tag className="w-3 h-3" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Budget Card */}
                        {problem.budget && (
                            <div className="bg-gradient-primary rounded-xl p-6 text-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="w-5 h-5" />
                                    <span className="text-sm opacity-90">Budget</span>
                                </div>
                                <div className="text-3xl font-bold">
                                    ${problem.budget.toLocaleString()}
                                </div>
                                <div className="text-sm opacity-75">{problem.currency || 'USD'}</div>
                            </div>
                        )}

                        {/* Apply Button */}
                        {problem.status === 'open' && !problem.isOwner && (
                            <div className="bg-card rounded-xl p-6 border border-border">
                                {problem.hasApplied ? (
                                    <div className="text-center">
                                        <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                            <Check className="w-6 h-6 text-primary" />
                                        </div>
                                        <p className="font-medium">Application Submitted</p>
                                        <p className="text-sm text-muted-foreground">You've already applied to this problem</p>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setShowApplyModal(true)}
                                            className="btn-primary w-full flex items-center justify-center gap-2"
                                        >
                                            <Send className="w-5 h-5" />
                                            Apply to Solve
                                        </button>
                                        <p className="text-xs text-muted-foreground text-center mt-3">
                                            Submit your proposal to work on this problem
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Poster Info */}
                        <div className="bg-card rounded-xl p-6 border border-border">
                            <h3 className="font-semibold mb-4">Posted by</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                                    {problem.poster.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium">{problem.poster.name}</p>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Star className="w-4 h-4 text-yellow-500" />
                                        <span>{problem.poster.rating.toFixed(1)}</span>
                                        <span>•</span>
                                        <span>{problem.poster.completedProjects} projects</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Deadline */}
                        {problem.deadline && (
                            <div className="bg-card rounded-xl p-6 border border-border">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Deadline</p>
                                        <p className="font-medium">{new Date(problem.deadline).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AI Chat CTA */}
                        <div className="bg-secondary/50 rounded-xl p-6 border border-border">
                            <MessageSquare className="w-8 h-8 text-primary mb-3" />
                            <h3 className="font-semibold mb-2">Need help refining?</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Use our AI assistant to explore similar problems and get insights.
                            </p>
                            <Link href="/chat" className="text-primary text-sm hover:underline flex items-center gap-1">
                                Start AI Chat <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Apply Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-card rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-border">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h2 className="text-xl font-bold">Apply to Solve</h2>
                            <button onClick={() => setShowApplyModal(false)} className="p-2 hover:bg-secondary rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleApply} className="p-6 space-y-5">
                            {/* Requirements Info Box */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-blue-400 mb-2">📝 Minimum Requirements</h4>
                                <ul className="text-xs text-blue-300 space-y-1">
                                    <li>• Cover Letter: <strong>50 characters minimum</strong></li>
                                    <li>• Proposed Approach: <strong>20 characters minimum</strong></li>
                                </ul>
                                <p className="text-xs text-blue-300/70 mt-2">
                                    The submit button will be enabled once you meet these requirements.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Cover Letter *
                                    <span className={`ml-2 text-xs ${applicationForm.coverLetter.length >= 50 ? 'text-green-500' : 'text-muted-foreground'}`}>
                                        ({applicationForm.coverLetter.length}/50 minimum)
                                    </span>
                                </label>
                                <textarea
                                    value={applicationForm.coverLetter}
                                    onChange={(e) => setApplicationForm({ ...applicationForm, coverLetter: e.target.value })}
                                    placeholder="Introduce yourself and explain why you're interested..."
                                    rows={4}
                                    className="input-base"
                                    required
                                />
                                {applicationForm.coverLetter.length > 0 && applicationForm.coverLetter.length < 50 && (
                                    <p className="text-xs text-red-500 mt-1">
                                        Need {50 - applicationForm.coverLetter.length} more characters
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Proposed Approach *
                                    <span className={`ml-2 text-xs ${applicationForm.proposedApproach.length >= 20 ? 'text-green-500' : 'text-muted-foreground'}`}>
                                        ({applicationForm.proposedApproach.length}/20 minimum)
                                    </span>
                                </label>
                                <textarea
                                    value={applicationForm.proposedApproach}
                                    onChange={(e) => setApplicationForm({ ...applicationForm, proposedApproach: e.target.value })}
                                    placeholder="How would you approach solving this problem?"
                                    rows={4}
                                    className="input-base"
                                    required
                                />
                                {applicationForm.proposedApproach.length > 0 && applicationForm.proposedApproach.length < 20 && (
                                    <p className="text-xs text-red-500 mt-1">
                                        Need {20 - applicationForm.proposedApproach.length} more characters
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Estimated Time</label>
                                    <input
                                        type="text"
                                        value={applicationForm.estimatedTime}
                                        onChange={(e) => setApplicationForm({ ...applicationForm, estimatedTime: e.target.value })}
                                        placeholder="e.g., 2 weeks"
                                        className="input-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Proposed Budget</label>
                                    <input
                                        type="number"
                                        value={applicationForm.proposedBudget}
                                        onChange={(e) => setApplicationForm({ ...applicationForm, proposedBudget: e.target.value })}
                                        placeholder="INR"
                                        className="input-base"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowApplyModal(false)} className="btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={applying || applicationForm.coverLetter.length < 50 || applicationForm.proposedApproach.length < 20}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {applying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    Submit Application
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
