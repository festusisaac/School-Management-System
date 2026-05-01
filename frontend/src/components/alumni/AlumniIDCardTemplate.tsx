import React from 'react';
import { getFileUrl } from '../../services/api';
import { useSystem } from '../../context/SystemContext';
import { MapPin, Phone, Mail, GraduationCap } from 'lucide-react';

interface AlumniIDCardTemplateProps {
    alumni: any;
}

export const AlumniIDCardTemplate = React.forwardRef<HTMLDivElement, AlumniIDCardTemplateProps>(({ alumni }, ref) => {
    const { settings } = useSystem();
    
    return (
        <div ref={ref} className="id-card-print-area">
            <div className="id-card-print-container">
                <div className="w-[3.375in] h-[2.125in] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg relative flex flex-col font-sans mx-auto mt-10">
                    {/* Header with School Color / Logo Area */}
                    <div className="h-16 bg-primary-600 flex items-center px-4 gap-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 z-10">
                            {settings?.primaryLogo ? (
                                <img src={getFileUrl(settings.primaryLogo)} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <GraduationCap className="w-6 h-6 text-primary-600" />
                            )}
                        </div>
                        <div className="z-10">
                            <h2 className="text-[10px] font-black text-white uppercase tracking-wider leading-tight">
                                {settings?.schoolName || 'PHJC School Azhin-Kasa'}
                            </h2>
                            <p className="text-[7px] font-bold text-primary-100 uppercase tracking-widest mt-0.5">
                                Official Alumni Identity Card
                            </p>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex p-3 gap-3">
                        {/* Photo Column */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-20 h-24 rounded-lg bg-gray-100 border-2 border-primary-50 overflow-hidden shadow-inner">
                                {alumni.student?.studentPhoto ? (
                                    <img 
                                        src={getFileUrl(alumni.student.studentPhoto)} 
                                        alt="Alumnus" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                        <GraduationCap className="w-10 h-10" />
                                    </div>
                                )}
                            </div>
                            <div className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">
                                Class of {alumni.graduationYear}
                            </div>
                        </div>

                        {/* Details Column */}
                        <div className="flex-1 space-y-2 py-1">
                            <div>
                                <p className="text-[6px] font-bold text-gray-400 uppercase tracking-widest">Full Name</p>
                                <h3 className="text-xs font-black text-gray-900 leading-tight">
                                    {alumni.student?.firstName} {alumni.student?.lastName}
                                </h3>
                            </div>

                            <div>
                                <p className="text-[6px] font-bold text-gray-400 uppercase tracking-widest">Admission Number</p>
                                <p className="text-[9px] font-black text-primary-600">
                                    {alumni.student?.admissionNo || 'N/A'}
                                </p>
                            </div>

                            <div className="space-y-1 mt-2 border-t border-gray-50 pt-2">
                                <div className="flex items-center gap-1.5 text-[7px] text-gray-600 font-bold">
                                    <MapPin className="w-2 h-2 text-primary-500" />
                                    <span className="truncate w-32">{alumni.location || 'Official Alumni'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[7px] text-gray-600 font-bold">
                                    <Phone className="w-2 h-2 text-primary-500" />
                                    <span>{alumni.phoneNumber || alumni.student?.mobileNumber || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[7px] text-gray-600 font-bold">
                                    <Mail className="w-2 h-2 text-primary-500" />
                                    <span className="truncate w-32">{alumni.email || alumni.student?.email || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="h-6 bg-gray-900 flex items-center justify-between px-4">
                        <span className="text-[6px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                            Integrity • Diligence • Service
                        </span>
                        <div className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-primary-500 rounded-full animate-pulse" />
                            <span className="text-[6px] font-black text-white uppercase tracking-tighter">
                                {alumni.id.substring(0, 8).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Print Helper CSS */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @media screen {
                        .id-card-print-area { display: none; }
                    }
                    @media print {
                        body * { visibility: hidden !important; }
                        .id-card-print-area, .id-card-print-area * { visibility: visible !important; }
                        .id-card-print-area { 
                            position: fixed !important; 
                            left: 0 !important; 
                            top: 0 !important; 
                            width: 100% !important; 
                            height: 100% !important;
                            display: block !important;
                            background: white !important;
                            z-index: 9999999 !important;
                        }
                        .id-card-print-container {
                            display: flex !important;
                            justify-content: center !important;
                            align-items: center !important;
                            height: 100vh !important;
                        }
                    }
                `}} />
            </div>
        </div>
    );
});
