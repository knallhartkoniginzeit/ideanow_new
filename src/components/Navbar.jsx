'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import {
    Menu, X, Search, MessageSquare, PlusCircle, User, LogOut, ChevronDown,
    Sparkles, TrendingUp, Bell, Users
} from 'lucide-react';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center
                          group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-300">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gradient">!deanow</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/problems" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                            <TrendingUp className="w-4 h-4" />
                            <span>Explore</span>
                        </Link>
                        <Link href="/community" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium">
                            <Users className="w-4 h-4" />
                            <span>Community</span>
                        </Link>
                        <Link href="/chat" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                            <MessageSquare className="w-4 h-4" />
                            <span>AI Chat</span>
                        </Link>
                    </div>

                    {/* Search Bar */}
                    <div className="hidden lg:flex flex-1 max-w-md mx-6">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search problems, skills, categories..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary/50 border border-transparent
                         text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50
                         focus:bg-card transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                {/* Post Problem Button */}
                                <Link href="/problems/new" className="hidden md:flex btn-primary py-2 px-4 text-sm">
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    Post Problem
                                </Link>

                                {/* Notifications */}
                                <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                                    <Bell className="w-5 h-5 text-muted-foreground" />
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
                                </button>

                                {/* User Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {userMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                                            <div className="absolute right-0 mt-2 w-56 py-2 bg-card rounded-xl border border-border shadow-xl z-50 animate-fade-in">
                                                <div className="px-4 py-2 border-b border-border">
                                                    <p className="font-medium truncate">{user?.name}</p>
                                                    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                                                </div>
                                                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors"
                                                    onClick={() => setUserMenuOpen(false)}>
                                                    <TrendingUp className="w-4 h-4" />
                                                    <span>Dashboard</span>
                                                </Link>
                                                <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors"
                                                    onClick={() => setUserMenuOpen(false)}>
                                                    <User className="w-4 h-4" />
                                                    <span>Profile</span>
                                                </Link>
                                                <hr className="my-2 border-border" />
                                                <button
                                                    onClick={() => { logout(); setUserMenuOpen(false); }}
                                                    className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-destructive hover:bg-destructive/10 transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span>Sign Out</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/login" className="hidden md:block text-muted-foreground hover:text-foreground transition-colors">
                                    Sign In
                                </Link>
                                <Link href="/auth/register" className="btn-primary py-2 px-4 text-sm">
                                    Get Started
                                </Link>
                            </>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-border animate-fade-in">
                        <div className="flex flex-col gap-2">
                            <Link href="/problems" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                                onClick={() => setMobileMenuOpen(false)}>
                                <TrendingUp className="w-5 h-5" />
                                <span>Explore Problems</span>
                            </Link>
                            <Link href="/community" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors font-medium"
                                onClick={() => setMobileMenuOpen(false)}>
                                <Users className="w-5 h-5" />
                                <span>Community</span>
                            </Link>
                            <Link href="/chat" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                                onClick={() => setMobileMenuOpen(false)}>
                                <MessageSquare className="w-5 h-5" />
                                <span>AI Chat</span>
                            </Link>
                            {isAuthenticated && (
                                <Link href="/problems/new" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}>
                                    <PlusCircle className="w-5 h-5" />
                                    <span>Post Problem</span>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
