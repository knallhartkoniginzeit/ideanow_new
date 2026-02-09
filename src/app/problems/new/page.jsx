'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import toast from 'react-hot-toast';
import {
    ArrowLeft, ArrowRight, Tag, DollarSign, Calendar, AlertCircle,
    Loader2, Info, X, Plus
} from 'lucide-react';

const scaleOptions = [
    { value: 'small', label: 'Small', desc: 'Quick fix or simple feature (1-2 weeks)' },
    { value: 'medium', label: 'Medium', desc: 'Moderate complexity (2-6 weeks)' },
    { value: 'large', label: 'Large', desc: 'Significant project (1-3 months)' },
    { value: 'enterprise', label: 'Enterprise', desc: 'Major initiative (3+ months)' },
];

export default function NewProblemPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [skillInput, setSkillInput] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        scale: 'medium',
        budget: '',
        deadline: '',
        tags: [],
        requiredSkills: [],
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
            setTagInput('');
        }
    };

    const removeTag = (tag) => {
        setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    };

    const addSkill = () => {
        if (skillInput.trim() && !formData.requiredSkills.includes(skillInput.trim())) {
            setFormData({ ...formData, requiredSkills: [...formData.requiredSkills, skillInput.trim()] });
            setSkillInput('');
        }
    };

    const removeSkill = (skill) => {
        setFormData({ ...formData, requiredSkills: formData.requiredSkills.filter(s => s !== skill) });
    };

    const validateStep = () => {
        if (step === 1) {
            if (formData.title.length < 10) {
                toast.error('Title must be at least 10 characters');
                return false;
            }
            if (formData.description.length < 50) {
                toast.error('Description must be at least 50 characters');
                return false;
            }
            if (!formData.category) {
                toast.error('Please select a category');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/problems', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    budget: formData.budget ? parseFloat(formData.budget) : null,
                    deadline: formData.deadline || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.errors?.[0]?.msg || 'Failed to create problem');
            }

            toast.success('Problem posted successfully!');
            router.push(`/problems/${data.problem.id}`);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-3xl">
                {/* Header */}
                <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Post a New Problem</h1>
                    <p className="text-muted-foreground">Share your challenge with the community and find solvers</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-4 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors
                ${step >= s ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                                {s}
                            </div>
                            {s < 3 && (
                                <div className={`w-16 h-1 mx-2 rounded ${step > s ? 'bg-primary' : 'bg-secondary'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form */}
                <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

                            <div>
                                <label className="block text-sm font-medium mb-2">Problem Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="A clear, specific title for your problem"
                                    className="input-base"
                                    maxLength={500}
                                />
                                <p className="text-xs text-muted-foreground mt-1">{formData.title.length}/500 characters</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description *</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe your problem in detail. Include context, constraints, and what success looks like..."
                                    rows={8}
                                    className="input-base"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Minimum 50 characters • {formData.description.length} characters</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Category *</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="input-base"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold mb-6">Project Details</h2>

                            <div>
                                <label className="block text-sm font-medium mb-3">Project Scale *</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {scaleOptions.map((option) => (
                                        <label
                                            key={option.value}
                                            className={`p-4 rounded-lg border cursor-pointer transition-all
                        ${formData.scale === option.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                        >
                                            <input
                                                type="radio"
                                                name="scale"
                                                value={option.value}
                                                checked={formData.scale === option.value}
                                                onChange={handleChange}
                                                className="sr-only"
                                            />
                                            <div className="font-medium">{option.label}</div>
                                            <div className="text-xs text-muted-foreground">{option.desc}</div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        <DollarSign className="w-4 h-4 inline mr-1" />
                                        Budget (Optional)
                                    </label>
                                    <input
                                        type="number"
                                        name="budget"
                                        value={formData.budget}
                                        onChange={handleChange}
                                        placeholder="Enter amount in USD"
                                        className="input-base"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Deadline (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        name="deadline"
                                        value={formData.deadline}
                                        onChange={handleChange}
                                        className="input-base"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            {!formData.budget && (
                                <div className="flex items-start gap-2 p-4 bg-secondary/50 rounded-lg">
                                    <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-muted-foreground">
                                        Problems with a budget tend to receive more applications. You can add one later if needed.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold mb-6">Tags & Skills</h2>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Tag className="w-4 h-4 inline mr-1" />
                                    Tags
                                </label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        placeholder="Add a tag and press Enter"
                                        className="input-base flex-1"
                                    />
                                    <button type="button" onClick={addTag} className="btn-secondary px-4">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags.map((tag) => (
                                        <span key={tag} className="flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-sm">
                                            {tag}
                                            <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Required Skills</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                        placeholder="Add a skill and press Enter"
                                        className="input-base flex-1"
                                    />
                                    <button type="button" onClick={addSkill} className="btn-secondary px-4">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.requiredSkills.map((skill) => (
                                        <span key={skill} className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
                                            {skill}
                                            <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="mt-8 p-6 bg-secondary/30 rounded-lg border border-border">
                                <h3 className="font-semibold mb-4">Preview</h3>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-muted-foreground">Title:</span> {formData.title || '—'}</p>
                                    <p><span className="text-muted-foreground">Category:</span> {formData.category || '—'}</p>
                                    <p><span className="text-muted-foreground">Scale:</span> {formData.scale}</p>
                                    <p><span className="text-muted-foreground">Budget:</span> {formData.budget ? `$${formData.budget}` : 'Not specified'}</p>
                                    <p><span className="text-muted-foreground">Tags:</span> {formData.tags.join(', ') || 'None'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-border">
                        {step > 1 ? (
                            <button onClick={() => setStep(step - 1)} className="btn-secondary flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Previous
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 3 ? (
                            <button
                                onClick={() => validateStep() && setStep(step + 1)}
                                className="btn-primary flex items-center gap-2"
                            >
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn-primary flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                {loading ? 'Posting...' : 'Post Problem'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
