import { forwardRef } from 'react';
import { Heart, Calendar, User, ShieldCheck } from 'lucide-react';

interface Donation {
    id: string;
    donorName: string;
    donorEmail: string;
    amount: number;
    paymentReference: string;
    paymentGateway: string;
    createdAt: string;
    project?: { title: string };
}

interface DonationReportProps {
    donations: Donation[];
    stats: { totalRaised: number; donorCount: number };
    schoolInfo?: any;
}

export const DonationReportTemplate = forwardRef<HTMLDivElement, DonationReportProps>(({ donations, stats, schoolInfo }, ref) => {
    return (
        <div ref={ref} className="p-12 bg-white text-black font-sans min-h-screen w-[297mm]">
            {/* Header */}
            <div className="flex justify-between items-start border-b-4 border-primary-600 pb-8 mb-8">
                <div className="flex items-center gap-6">
                    <img 
                        src={schoolInfo?.logo || "https://placehold.co/100x100?text=LOGO"} 
                        alt="Logo" 
                        className="w-24 h-24 object-contain"
                    />
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight">{schoolInfo?.name || 'PHJC School'}</h1>
                        <p className="text-gray-600 font-medium max-w-md">{schoolInfo?.address || 'School Address'}</p>
                        <p className="text-primary-600 font-bold mt-1">Donation Impact Report</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Generated On</div>
                    <div className="text-lg font-bold">{new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-8 mb-12">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Contributions</div>
                    <div className="text-3xl font-black text-primary-600">₦{stats.totalRaised.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Donors</div>
                    <div className="text-3xl font-black text-blue-600">{stats.donorCount} Donors</div>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Report Status</div>
                    <div className="text-3xl font-black text-emerald-600">Verified</div>
                </div>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-[32px] overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-gray-500">Donor Details</th>
                            <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-gray-500">Amount</th>
                            <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-gray-500 text-center">Gateway</th>
                            <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-gray-500">Campaign</th>
                            <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-gray-500">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {donations.map((donation, idx) => (
                            <tr key={idx} className="border-b border-gray-100 last:border-0">
                                <td className="py-5 px-6">
                                    <div className="font-bold text-gray-900">{donation.donorName}</div>
                                    <div className="text-xs text-gray-500">{donation.donorEmail}</div>
                                </td>
                                <td className="py-5 px-6">
                                    <div className="font-black text-lg text-gray-900">₦{Number(donation.amount).toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{donation.paymentReference}</div>
                                </td>
                                <td className="py-5 px-6 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-gray-100 rounded text-gray-500">
                                        {donation.paymentGateway}
                                    </span>
                                </td>
                                <td className="py-5 px-6">
                                    <div className="flex items-center gap-2 text-xs font-bold text-primary-600">
                                        <Heart className="w-3 h-3" />
                                        {donation.project?.title || 'General Endowment'}
                                    </div>
                                </td>
                                <td className="py-5 px-6">
                                    <div className="flex items-center gap-2 text-xs text-gray-600 font-bold">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(donation.createdAt).toLocaleDateString()}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-12 flex justify-between items-end border-t border-gray-200 pt-8">
                <div className="max-w-md">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Certification</h4>
                    <p className="text-xs text-gray-500 leading-relaxed italic">
                        This document serves as an official record of contributions made to the PHJC School development funds. 
                        All transactions listed above have been verified via the respective payment gateways.
                    </p>
                </div>
                <div className="text-center w-48">
                    <div className="h-12 border-b-2 border-gray-900 mb-2"></div>
                    <p className="text-xs font-black uppercase tracking-widest">Administrator</p>
                    <p className="text-[10px] text-gray-400 mt-1">Official School Seal</p>
                </div>
            </div>
        </div>
    );
});

DonationReportTemplate.displayName = 'DonationReportTemplate';
