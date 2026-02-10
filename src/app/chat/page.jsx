'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import {
    Send, Sparkles, MessageSquare, Plus, Trash2, ChevronRight, Brain,
    Lightbulb, TrendingUp, ArrowRight, Loader2
} from 'lucide-react';

const suggestedPrompts = [
    "I want to solve a problem in healthcare using AI",
    "Help me find innovative ideas for sustainable packaging",
    "What are emerging problems in EdTech?",
    "I have an idea about blockchain for supply chain",
];

export default function ChatPage() {
    const { user, isAuthenticated } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSessions();
        } else {
            setSessionsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchSessions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/chat/sessions', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            setSessions(data.sessions || []);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setSessionsLoading(false);
        }
    };

    const loadSession = async (sessionId) => {
        setSidebarOpen(false);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/chat/sessions/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            setCurrentSession(data.session);
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Failed to load session:', error);
        }
    };

    const startNewChat = () => {
        setCurrentSession(null);
        setMessages([]);
        setInput('');
        setSidebarOpen(false); // Close sidebar on new chat
    };

    const togglePin = async (sessionId, isPinned, e) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/chat/sessions/${sessionId}/pin`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isPinned }),
            });

            if (res.ok) {
                // Update local state to reflect change immediately
                setSessions(prev =>
                    prev.map(s => s.id === sessionId ? { ...s, isPinned } : s)
                        .sort((a, b) => {
                            // Sort by pinned first, then by date (this is a simple client-side sort to match backend)
                            if (a.isPinned === b.isPinned) return new Date(b.updatedAt) - new Date(a.updatedAt);
                            return a.isPinned ? -1 : 1;
                        })
                );
            }
        } catch (error) {
            console.error('Failed to toggle pin:', error);
        }
    };

    const deleteSession = async (sessionId, e) => {
        e.stopPropagation();
        if (!confirm('Delete this conversation?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/chat/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setSessions(sessions.filter(s => s.id !== sessionId));
            if (currentSession?.id === sessionId) {
                startNewChat();
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    const sendMessage = async (messageText = input) => {
        if (!messageText.trim() || loading) return;

        const userMessage = { role: 'user', content: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/chat/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    message: messageText,
                    sessionId: currentSession?.id,
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            if (!currentSession) {
                setCurrentSession({ id: data.sessionId, title: messageText.substring(0, 50) });
                fetchSessions();
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response,
                refinedProblem: data.refinedProblem,
                relatedProblems: data.relatedProblems,
                suggestions: data.suggestions,
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                isError: true,
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex relative">
            {/* Mobile Sidebar Toggle */}
            {isAuthenticated && (
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden absolute top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-sm"
                >
                    <MessageSquare className="w-5 h-5" />
                </button>
            )}

            {/* Sidebar (Desktop + Mobile Drawer) */}
            {isAuthenticated && (
                <>
                    {/* Mobile Overlay */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    <aside className={`
                        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-get-started border-r border-border flex flex-col transition-transform duration-300 bg-background
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    `}>
                        <div className="p-4 flex items-center justify-between lg:justify-center">
                            <button
                                onClick={startNewChat}
                                className="flex-1 btn-primary flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                New Chat
                            </button>
                            {/* Mobile Close Button */}
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden ml-2 p-2 hover:bg-secondary rounded-lg"
                            >
                                <ChevronRight className="w-5 h-5 rotate-180" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 pt-0">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Conversations</h3>
                            {sessionsLoading ? (
                                <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {sessions.map((session) => (
                                        <div
                                            key={session.id}
                                            onClick={() => loadSession(session.id)}
                                            className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors
                      ${currentSession?.id === session.id ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'}`}
                                        >
                                            <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate flex-1 text-sm font-medium">
                                                {session.title}
                                                {session.isPinned && <span className="ml-2 text-xs text-amber-500">📌</span>}
                                            </span>
                                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                                {/* Pin Button */}
                                                <button
                                                    onClick={(e) => togglePin(session.id, !session.isPinned, e)}
                                                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                    title={session.isPinned ? "Unpin Chat" : "Pin Chat"}
                                                >
                                                    {session.isPinned ? (
                                                        <span className="text-amber-500">📍</span>
                                                    ) : (
                                                        <span className="rotate-45">📌</span>
                                                    )}
                                                </button>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => deleteSession(session.id, e)}
                                                    className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                                                    title="Delete Chat"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>
                </>
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {messages.length === 0 ? (
                    /* Welcome Screen */
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="max-w-2xl text-center">
                            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold mb-4">AI Problem Refinement</h1>
                            <p className="text-lg text-muted-foreground mb-8">
                                Share your problem idea and I'll help you refine it into a specific,
                                actionable problem statement. I'll also search our databases for related work.
                            </p>

                            {/* Suggested Prompts */}
                            <div className="grid sm:grid-cols-2 gap-3 mb-8">
                                {suggestedPrompts.map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(prompt)}
                                        className="text-left p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
                                    >
                                        <Lightbulb className="w-5 h-5 text-primary mb-2" />
                                        <p className="text-sm">{prompt}</p>
                                    </button>
                                ))}
                            </div>

                            {!isAuthenticated && (
                                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                                    <p className="text-sm">
                                        <Link href="/auth/login" className="text-primary font-medium hover:underline">
                                            Sign in
                                        </Link>{' '}
                                        to save your conversations and access all features.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Messages */
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {messages.map((message, i) => (
                            <ChatMessage key={i} message={message} />
                        ))}
                        {loading && (
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Input Area */}
                <div className="border-t border-border p-4 bg-background">
                    <div className="max-w-4xl mx-auto">
                        <div className="relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                placeholder="Describe your problem idea..."
                                rows={1}
                                className="input-base pr-14 resize-none min-h-[56px] max-h-32"
                                style={{ height: 'auto' }}
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || loading}
                                className="absolute right-2 bottom-2 p-2 rounded-lg bg-primary text-white 
                         disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                            Press Enter to send, Shift+Enter for new line
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChatMessage({ message }) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
        ${isUser ? 'bg-secondary' : 'bg-gradient-primary'}`}>
                {isUser ? (
                    <span className="text-sm font-medium">You</span>
                ) : (
                    <Sparkles className="w-5 h-5 text-white" />
                )}
            </div>

            <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : ''}`}>
                <div className={`inline-block text-left p-4 rounded-xl ${isUser ? 'bg-primary text-white' : message.isError ? 'bg-destructive/10 border border-destructive/20' : 'bg-card border border-border'
                    }`}>
                    {isUser ? (
                        <p>{message.content}</p>
                    ) : (
                        <div className="prose prose-invert max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* Refined Problem Card */}
                {message.refinedProblem && (
                    <div className="mt-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-5 h-5 text-primary" />
                            <span className="font-medium">Refined Problem Statement</span>
                        </div>
                        <p className="text-sm">{message.refinedProblem}</p>
                    </div>
                )}

                {/* Related Problems */}
                {message.relatedProblems?.length > 0 && (
                    <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-accent" />
                            <span className="font-medium text-sm">Related Problems</span>
                        </div>
                        <div className="space-y-2">
                            {message.relatedProblems.map((p, i) => (
                                <Link
                                    key={i}
                                    href={`/problems/${p.id}`}
                                    className="block p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{p.title}</span>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <span className="text-xs text-muted-foreground capitalize">Source: {p.source}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                {!isUser && !message.isError && (
                    <div className="flex gap-2 mt-3">
                        <Link href="/problems/new" className="text-xs text-primary hover:underline flex items-center gap-1">
                            Post to Community <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
