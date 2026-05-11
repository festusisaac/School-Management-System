import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function NotFoundPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // Set page title and meta tags manually to avoid extra dependencies
        document.title = "Page Not Found | PHJC School";
        const meta = document.createElement('meta');
        meta.name = 'robots';
        meta.content = 'noindex';
        document.head.appendChild(meta);
        
        return () => {
            document.head.removeChild(meta);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
            <div className="max-w-lg w-full text-center space-y-8">
                {/* 404 Graphic */}
                <div className="relative mx-auto w-40 h-40">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse" />
                    <div className="relative w-40 h-40 bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
                        <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">404</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 rotate-12">
                        <FileQuestion size={32} className="text-white" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-3">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                        Lost in Space?
                    </h1>
                    <p className="text-gray-400 text-lg font-medium leading-relaxed max-w-md mx-auto">
                        The page you're looking for doesn't exist or has been moved to a new destination.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold text-sm uppercase tracking-widest transition-all"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                    <Link
                        to="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 rounded-2xl text-white font-bold text-sm uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-primary-600/30"
                    >
                        <Home size={18} />
                        Back to Home
                    </Link>
                </div>

                {/* Helper Text */}
                <p className="text-xs text-gray-600 font-medium pt-4">
                    If you believe this is a technical error, please contact the school administration.
                </p>
            </div>
        </div>
    );
}
