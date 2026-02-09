'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import GoogleAuthButton from '@/components/GoogleAuthButton';
import { Mail, Lock, User, ArrowRight, Sparkles, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const roles = [
    { id: 'both', label: 'Both', desc: 'Post problems and solve others' },
    { id: 'problem_poster', label: 'Problem Poster', desc: 'Share challenges for others to solve' },
    { id: 'solver', label: 'Solver', desc: 'Find and solve interesting problems' },
];

const popularSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'Machine Learning',
    'Data Science', 'UI/UX Design', 'DevOps', 'Mobile Development', 'Blockchain',
];

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'both',
        skills: [],
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleSkill = (skill) => {
        if (formData.skills.includes(skill)) {
            setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
        } else {
            setFormData({ ...formData, skills: [...formData.skills, skill] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (step === 1) {
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            if (formData.password.length < 8) {
                setError('Password must be at least 8 characters');
                return;
            }
            setStep(2);
            return;
        }

        setLoading(true);
        try {
            await register(formData.name, formData.email, formData.password, formData.role, formData.skills);
            toast.success('Account created successfully!');
            router.push('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Decorative */}
            <div className="hidden lg:flex flex-1 bg-gradient-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col items-center justify-center text-white text-center p-12">
                    <h2 className="text-4xl font-bold mb-4">Join the Innovation Community</h2>
                    <p className="text-xl opacity-90 max-w-md">
                        Start discovering problems, refining ideas, and building solutions that matter.
                    </p>

                    {/* Steps indicator */}
                    <div className="flex gap-4 mt-12">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step > 1 ? 'bg-white text-primary' : 'border-2 border-white'}`}>
                                {step > 1 ? <Check className="w-5 h-5" /> : '1'}
                            </div>
                            <span>Account</span>
                        </div>
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'opacity-100' : 'opacity-50'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white`}>
                                2
                            </div>
                            <span>Profile</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gradient">!deanow</span>
                    </Link>

                    <h1 className="text-3xl font-bold mb-2">
                        {step === 1 ? 'Create your account' : 'Set up your profile'}
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        {step === 1 ? 'Start your journey to innovation' : 'Tell us about yourself'}
                    </p>

                    {error && (
                        <div className="flex items-center gap-2 p-4 mb-6 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {step === 1 ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="John Doe"
                                            className="input-base pl-12"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="you@example.com"
                                            className="input-base pl-12"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Min. 8 characters"
                                            className="input-base pl-12"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Repeat your password"
                                            className="input-base pl-12"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-3">I want to...</label>
                                    <div className="space-y-2">
                                        {roles.map((role) => (
                                            <label
                                                key={role.id}
                                                className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                          ${formData.role === role.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value={role.id}
                                                    checked={formData.role === role.id}
                                                    onChange={handleChange}
                                                    className="sr-only"
                                                />
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                          ${formData.role === role.id ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                                                    {formData.role === role.id && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{role.label}</div>
                                                    <div className="text-sm text-muted-foreground">{role.desc}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-3">Your Skills (optional)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {popularSkills.map((skill) => (
                                            <button
                                                key={skill}
                                                type="button"
                                                onClick={() => toggleSkill(skill)}
                                                className={`px-3 py-1.5 rounded-full text-sm transition-all
                          ${formData.skills.includes(skill)
                                                        ? 'bg-primary text-white'
                                                        : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                                            >
                                                {skill}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex gap-3">
                            {step === 2 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="btn-secondary flex-1"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {step === 1 ? 'Continue' : 'Create Account'}
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {step === 1 && (
                        <>
                            {/* Divider */}
                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-sm text-muted-foreground">OR</span>
                                <div className="flex-1 h-px bg-border" />
                            </div>

                            {/* Google Sign Up */}
                            <GoogleAuthButton
                                mode="signup"
                                onSuccess={(data) => {
                                    toast.success('Account created successfully!');
                                    router.push('/dashboard');
                                }}
                                onError={(error) => {
                                    setError(error.message || 'Google sign up failed');
                                }}
                            />
                        </>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/auth/login" className="text-primary font-medium hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
