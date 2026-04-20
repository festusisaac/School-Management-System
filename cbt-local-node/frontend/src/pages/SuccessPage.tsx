import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, LogOut } from 'lucide-react';

export default function SuccessPage() {
    const navigate = useNavigate();

    useEffect(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.log('Fullscreen exit failed', err));
        }
    }, []);

    const handleExit = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
            <div className="bg-white max-w-sm w-full rounded-lg shadow-lg border border-gray-200 overflow-hidden text-center flex flex-col">
                
                <div className="bg-green-600 px-6 py-6 flex flex-col items-center justify-center text-white">
                    <CheckCircle2 className="w-12 h-12 text-green-200 mb-2" />
                    <h1 className="text-xl font-bold tracking-wide">Exam Submitted</h1>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-6 font-medium">
                        Your parameters have been successfully encrypted and saved to the local node.
                    </p>

                    <div className="bg-blue-50 border border-blue-100 rounded text-left p-3 mb-6">
                        <p className="text-blue-800 text-xs font-semibold">
                            Instruction: Do not leave your seat until the invigilator gives the final signal.
                        </p>
                    </div>

                    <button 
                        onClick={handleExit}
                        className="w-full flex items-center justify-center px-4 py-2.5 rounded text-sm font-bold text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200 transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-2" /> Finalize & Exit
                    </button>
                </div>
                
            </div>
        </div>
    );
}
