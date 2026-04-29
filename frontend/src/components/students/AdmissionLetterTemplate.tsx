import React, { forwardRef } from 'react';
import { useSystem } from '../../context/SystemContext';
import { getFileUrl } from '../../services/api';

interface AdmissionLetterProps {
    application: any;
}

const AdmissionLetterTemplate = forwardRef<HTMLDivElement, AdmissionLetterProps>(({ application }, ref) => {
    const { settings } = useSystem();
    const today = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="fixed -left-[2000px] top-0">
            <div 
                ref={ref}
                className="w-[210mm] min-h-[297mm] bg-white p-[20mm] text-gray-900 font-serif leading-relaxed relative"
                style={{ fontSize: '12pt' }}
            >
                {/* Letterhead */}
                <div className="flex flex-col items-center text-center border-b-2 border-primary-600 pb-6 mb-8">
                    {settings?.primaryLogo && (
                        <img 
                            src={getFileUrl(settings.primaryLogo)} 
                            alt="School Logo" 
                            className="h-20 w-auto mb-4"
                        />
                    )}
                    <h1 className="text-3xl font-black uppercase text-primary-700 tracking-tight">{settings?.schoolName || 'SCHOOL NAME'}</h1>
                    <p className="text-sm font-bold italic text-gray-600 mt-1">{settings?.schoolMotto || 'Excellence in Education'}</p>
                    <div className="mt-3 text-xs text-gray-500 space-y-0.5">
                        <p>{settings?.schoolAddress}</p>
                        <p>Tel: {settings?.schoolPhone} | Email: {settings?.schoolEmail}</p>
                        <p>{settings?.officialWebsite}</p>
                    </div>
                </div>

                {/* Meta Info */}
                <div className="flex justify-between items-start mb-10">
                    <div className="space-y-1">
                        <p><span className="font-bold">Our Ref:</span> {application.referenceNumber}</p>
                        <p><span className="font-bold">Date:</span> {today}</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Admission Status</p>
                            <p className="text-xl font-black text-emerald-600 uppercase">OFFER OF PROVISIONAL ADMISSION</p>
                        </div>
                    </div>
                </div>

                {/* Candidate Info */}
                <div className="mb-0">
                    <p className="font-bold">{application.firstName} {application.middleName} {application.lastName}</p>
                    <p>{application.currentAddress}</p>
                    <p>{application.guardianPhone}</p>
                </div>

                {/* Salutation */}
                <div className="mt-8">
                    <p>Dear <span className="font-bold">{application.firstName}</span>,</p>
                </div>

                {/* Body */}
                <div className="mt-6 space-y-4 text-justify">
                    <p>
                        Following your recent application and successful performance in the admission screening exercise, 
                        we are pleased to offer you provisional admission into <span className="font-black">{settings?.schoolName}</span> for the 
                        <span className="font-bold"> {settings?.activeSessionName || '2024/2025'} </span> academic session.
                    </p>
                    <p>
                        You have been admitted into <span className="font-black">{(application.preferredClass?.name || application.preferredClassName || application.preferredClassId || 'your target class').toUpperCase()}</span>.
                    </p>
                    <p>
                        This offer is subject to the following conditions:
                    </p>
                    <ul className="list-disc ml-8 space-y-2">
                        <li>Verification of all original documents provided during the online application.</li>
                        <li>Full payment of the mandatory fees as detailed in the Fee Schedule below.</li>
                        <li>Compliance with the school's rules, regulations, and code of conduct.</li>
                    </ul>

                    {/* Fee Schedule Table */}
                    {application.assignedFees && application.assignedFees.length > 0 && (
                        <div className="mt-8 border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-6 py-3 border-b-2 border-gray-100 flex items-center justify-between">
                                <h4 className="text-sm font-black uppercase tracking-widest text-gray-700">Fee Schedule ({settings?.activeSessionName || 'Current Session'})</h4>
                                <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">Provisional</span>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b border-gray-100">
                                        <th className="px-6 py-3 font-black text-gray-500 uppercase text-[10px] tracking-wider">Fee Description</th>
                                        <th className="px-6 py-3 font-black text-gray-500 uppercase text-[10px] tracking-wider text-right">Amount ({settings?.currencySymbol || '₦'})</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {application.assignedFees.map((fee: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-gray-700">{fee.name}</td>
                                            <td className="px-6 py-3 text-right font-bold text-gray-900">
                                                {parseFloat(fee.defaultAmount || fee.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-primary-50/30">
                                        <td className="px-6 py-4 font-black text-primary-900 uppercase text-xs tracking-tight">Total Payable Amount</td>
                                        <td className="px-6 py-4 text-right font-black text-primary-700 text-lg tracking-tighter">
                                            {settings?.currencySymbol || '₦'}
                                            {application.assignedFees.reduce((acc: number, curr: any) => acc + parseFloat(curr.defaultAmount || curr.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="px-6 py-2 bg-gray-50 border-t border-gray-100 italic text-[10px] text-gray-500">
                                * Detailed payment instructions and deadlines will be provided upon your first login to the Student Portal.
                            </div>
                        </div>
                    )}

                    <p>
                        Please note that the deadline for the payment of the acceptance fee is <span className="font-bold">two weeks from the date of this letter</span>. 
                        Failure to comply with this timeline may result in the forfeiture of this admission offer.
                    </p>
                    <p>
                        We congratulate you on this milestone and look forward to welcoming you to our vibrant academic community.
                    </p>
                </div>

                {/* Closing */}
                <div className="mt-16">
                    <p>Yours Faithfully,</p>
                    <div className="mt-8">
                        {settings?.principalSignature && (
                            <img 
                                src={getFileUrl(settings.principalSignature)} 
                                alt="Principal Signature" 
                                className="h-12 w-auto mb-[-8px] ml-4 object-contain"
                                style={{ mixBlendMode: 'multiply' }}
                            />
                        )}
                        <div className="h-px w-48 bg-gray-900 mb-2"></div>
                        <p className="font-bold uppercase tracking-wide">Principal</p>
                        <p className="text-xs italic text-gray-500">{settings?.schoolName}</p>
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="absolute bottom-[20mm] left-[20mm] right-[20mm] border-t pt-4 text-center">
                    <p className="text-[10px] text-gray-400 font-mono tracking-widest">
                        AUTHENTICITY VERIFICATION CODE: {application.id.split('-')[0].toUpperCase()}
                    </p>
                </div>
            </div>
        </div>
    );
});

AdmissionLetterTemplate.displayName = 'AdmissionLetterTemplate';

export default AdmissionLetterTemplate;
