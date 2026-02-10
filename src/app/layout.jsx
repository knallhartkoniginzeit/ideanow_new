import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/lib/authContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: '!deanow - AI-Powered Problem Solving Platform',
    description: 'Connect with real-world challenges, refine your ideas with AI, and build innovative solutions.',
    keywords: ['problem solving', 'innovation', 'AI', 'startup ideas', 'research problems'],
    authors: [{ name: '!deanow Team' }],
    openGraph: {
        title: '!deanow - AI-Powered Problem Solving Platform',
        description: 'Connect with real-world challenges and build innovative solutions.',
        type: 'website',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <AuthProvider>
                    <div className="min-h-screen flex flex-col">
                        <Navbar />
                        <main className="flex-1">
                            {children}
                        </main>
                        <footer className="border-t border-border py-8">
                            <div className="container mx-auto px-4">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-gradient">!deanow</span>
                                    </div>

                                </div>
                            </div>
                        </footer>
                    </div>
                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            className: 'bg-card text-foreground border border-border',
                            duration: 4000,
                        }}
                    />
                </AuthProvider>
            </body>
        </html>
    );
}
