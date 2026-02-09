'use client';

import { useState } from 'react';
import Script from 'next/script';

export default function GoogleAuthButton({ mode = 'signin', onSuccess, onError }) {
    const [loading, setLoading] = useState(false);

    const handleGoogleResponse = async (response) => {
        setLoading(true);
        try {
            // Decode JWT credential to get user info
            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            const payload = JSON.parse(jsonPayload);

            // Send to backend
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    credential: response.credential,
                    googleId: payload.sub,
                    email: payload.email,
                    name: payload.name,
                    picture: payload.picture,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Google authentication failed');
            }

            // Store tokens
            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);

            if (onSuccess) {
                onSuccess(data);
            }
        } catch (error) {
            console.error('Google auth error:', error);
            if (onError) {
                onError(error);
            }
        } finally {
            setLoading(false);
        }
    };

    const initializeGoogleSignIn = () => {
        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                callback: handleGoogleResponse,
            });

            window.google.accounts.id.renderButton(
                document.getElementById('google-signin-button'),
                {
                    theme: 'filled_black',
                    size: 'large',
                    text: mode === 'signup' ? 'signup_with' : 'signin_with',
                    width: '100%',
                }
            );
        }
    };

    return (
        <>
            <Script
                src="https://accounts.google.com/gsi/client"
                onLoad={initializeGoogleSignIn}
                strategy="afterInteractive"
            />
            <div id="google-signin-button" className={loading ? 'opacity-50 pointer-events-none' : ''} />
        </>
    );
}
