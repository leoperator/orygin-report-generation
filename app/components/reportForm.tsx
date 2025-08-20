'use client';

import React, { useState, FormEvent } from 'react';

// --- Main Form Component (Unstyled) ---

export default function ReportForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        website: '',
        businessDetails: '',
        targetAudience: '',
    });

    const [errors, setErrors] = useState<Partial<typeof formData>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const validateForm = (): boolean => {
        const newErrors: Partial<typeof formData> = {};
        if (!formData.name || formData.name.length < 2) newErrors.name = 'Name must be at least 2 characters.';
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address.';
        try {
            if (!formData.website) newErrors.website = 'Website URL is required.';
            else new URL(formData.website);
        } catch (_) {
            newErrors.website = 'Please enter a valid website URL.';
        }
        if (!formData.businessDetails || formData.businessDetails.length < 50) newErrors.businessDetails = 'Please provide at least 50 characters about your business.';
        if (!formData.targetAudience || formData.targetAudience.length < 20) newErrors.targetAudience = 'Please describe your target audience in at least 20 characters.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setApiError('');
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Something went wrong');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `OryginAI_Business_Report_${formData.website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err: any) {
            setApiError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Basic styling for error messages so they are visible
    const errorStyle = { color: 'red', fontSize: '14px', marginTop: '4px' };

    return (
        <div>
            <h1>Get Your Free AI Growth Report</h1>
            <p>Fill in the details below to receive a personalized analysis.</p>
            
            <form onSubmit={handleSubmit} noValidate>
                <div>
                    <label htmlFor="name">Full Name</label>
                    <input id="name" type="text" value={formData.name} onChange={handleInputChange} placeholder="Enter your full name" />
                    {errors.name && <p style={errorStyle}>{errors.name}</p>}
                </div>
                
                <div>
                    <label htmlFor="email">Business Email</label>
                    <input id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Enter your email address" />
                    {errors.email && <p style={errorStyle}>{errors.email}</p>}
                </div>
                
                <div>
                    <label htmlFor="website">Company Website</label>
                    <input id="website" type="url" value={formData.website} onChange={handleInputChange} placeholder="https://yourcompany.com" />
                    {errors.website && <p style={errorStyle}>{errors.website}</p>}
                </div>

                <div>
                    <label htmlFor="businessDetails">About Your Business</label>
                    <textarea id="businessDetails" value={formData.businessDetails} onChange={handleInputChange} rows={4} placeholder="Describe your business and goals..."></textarea>
                    {errors.businessDetails && <p style={errorStyle}>{errors.businessDetails}</p>}
                </div>

                <div>
                    <label htmlFor="targetAudience">Your Target Audience</label>
                    <textarea id="targetAudience" value={formData.targetAudience} onChange={handleInputChange} rows={2} placeholder="e.g., Small business owners..."></textarea>
                    {errors.targetAudience && <p style={errorStyle}>{errors.targetAudience}</p>}
                </div>

                <div>
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Processing...' : 'Download Free Report'}
                    </button>
                </div>

                {apiError && <p style={errorStyle}>{apiError}</p>}
            </form>
        </div>
    );
}
