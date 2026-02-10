'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
    FileText, Clock, CheckCircle, XCircle,
    AlertCircle, ArrowLeft, ExternalLink, Loader2
} from 'lucide-react';

export default function MyApplicationsPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('submitted'); // 'submitted' or 'received'
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        fetchApplications();
    }, [isAuthenticated, activeTab]);

    const fetchApplications = async () => {
        try {
            const token = localStorage.getItem('token');
            const endpoint = activeTab === 'submitted'
                ? '/api/applications/my-applications'
                : '/api/applications/received';

            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to fetch applications');

            const data = await res.json();
            setApplications(data.applications);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (problemId, applicationId) => {
        if (!confirm('Are you sure you want to accept this application? This will reject all other applications.')) {
            return;
        }

        setProcessingId(applicationId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/problems/${problemId}/accept/${applicationId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to accept application');

            toast.success('Application accepted successfully!');
            fetchApplications(); // Refresh the list
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to accept application');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'withdrawn': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
            default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'accepted': return <CheckCircle className="w-4 h-4" />;
            case 'rejected': return <XCircle className="w-4 h-4" />;
            case 'withdrawn': return <AlertCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/problems" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Problems
                    </Link>
                    <h1 className="text-3xl font-bold mb-2">My Applications</h1>
                    <p className="text-muted-foreground">
                        Manage your problem applications and proposals
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-border">
                    <button
                        onClick={() => setActiveTab('submitted')}
                        className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'submitted'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Submitted Applications
                    </button>
                    <button
                        onClick={() => setActiveTab('received')}
                        className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'received'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Received Applications
                    </button>
                </div>

                {/* Applications List */}
                {applications.length === 0 ? (
                    <div className="bg-card rounded-xl p-12 text-center border border-border">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
                        <p className="text-muted-foreground mb-6">
                            {activeTab === 'submitted'
                                ? "You haven't applied to any problems yet."
                                : "No one has applied to your problems yet."}
                        </p>
                        <Link href="/problems" className="btn-primary inline-flex items-center gap-2">
                            Browse Problems
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {applications.map((app) => (
                            <div key={app.id} className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <Link
                                            href={`/problems/${app.problemId}`}
                                            className="text-xl font-semibold hover:text-primary transition-colors inline-flex items-center gap-2"
                                        >
                                            {app.problemTitle}
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                        {activeTab === 'received' && app.solver && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Applied by: <span className="font-medium">{app.solver.name || 'Unknown'}</span>
                                            </p>
                                        )}
                                        {activeTab === 'submitted' && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Posted by: <span className="font-medium">{app.posterName || 'Unknown'}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getStatusColor(app.status)}`}>
                                        {getStatusIcon(app.status)}
                                        <span className="text-sm font-medium capitalize">{app.status}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2">Cover Letter</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-3">{app.coverLetter}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2">Proposed Approach</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-3">{app.proposedApproach}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    {app.estimatedTime && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{app.estimatedTime}</span>
                                        </div>
                                    )}
                                    {app.proposedBudget && (
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium text-foreground">₹{app.proposedBudget.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Accept/Reject Buttons for Received Applications */}
                                {activeTab === 'received' && app.status === 'pending' && (
                                    <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                                        <button
                                            onClick={() => handleAccept(app.problemId, app.id)}
                                            disabled={processingId === app.id}
                                            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {processingId === app.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4" />
                                            )}
                                            Accept Application
                                        </button>
                                        <button
                                            onClick={() => {/* TODO: Add reject handler */ }}
                                            disabled={processingId === app.id}
                                            className="btn-secondary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Decline
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
