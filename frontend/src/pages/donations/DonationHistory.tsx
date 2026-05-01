import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Download, Filter, User, Calendar, Heart, ShieldCheck, FileText } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { DataTable } from '../../components/ui/data-table';
import { Modal } from '../../components/ui/modal';
import { ColumnDef } from '@tanstack/react-table';
import { exportDonationProjects } from '../../utils/excelExport';
import { useSystem } from '../../context/SystemContext';
import { exportDonationHistoryPdf } from './utils/donationPdf';

interface Donation {
    id: string;
    donorName: string;
    donorEmail: string;
    amount: number;
    paymentReference: string;
    paymentGateway: string;
    createdAt: string;
    project?: { title: string };
    alumni?: { student?: { firstName: string, lastName: string } };
}

const DonationHistory = () => {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [stats, setStats] = useState({ totalRaised: 0, donorCount: 0 });
    const [loading, setLoading] = useState(true);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const { getSchoolInfo } = useSystem();
    const [schoolInfo, setSchoolInfo] = useState<any>(null);
    const [verifyData, setVerifyData] = useState({ reference: '', gateway: 'paystack' as 'paystack' | 'flutterwave' });
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        fetchData();
        setSchoolInfo(getSchoolInfo());
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [donationsData, statsData] = await Promise.all([
                api.getDonationHistory(),
                api.getAdminDonationStats()
            ]);
            setDonations(donationsData);
            setStats(statsData);
        } catch (error) {
            showError("Failed to fetch donation history");
        } finally {
            setLoading(false);
        }
    };

    const handleManualVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setVerifying(true);
            await api.verifyDonation(verifyData);
            showSuccess("Payment verified and recorded successfully!");
            setIsVerifyModalOpen(false);
            setVerifyData({ reference: '', gateway: 'paystack' });
            fetchData();
        } catch (error: any) {
            const message = error.response?.data?.message || "Verification failed. Check the reference.";
            showError(Array.isArray(message) ? message[0] : message);
        } finally {
            setVerifying(false);
        }
    };

    const columns: ColumnDef<Donation>[] = [
        {
            accessorKey: 'donorName',
            header: 'Donor Details',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                        <User className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 dark:text-white">{row.original.donorName}</div>
                        <div className="text-[10px] text-gray-500">{row.original.donorEmail}</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-black text-gray-900 dark:text-white text-base">₦{Number(row.original.amount).toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{row.original.paymentReference}</span>
                </div>
            )
        },
        {
            accessorKey: 'paymentGateway',
            header: 'Gateway',
            cell: ({ row }) => (
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded text-gray-500">
                    {row.original.paymentGateway}
                </span>
            )
        },
        {
            accessorKey: 'project',
            header: 'Campaign',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-xs font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full w-fit">
                    <Heart className="w-3 h-3" />
                    {row.original.project?.title || 'General Endowment'}
                </div>
            )
        },
        {
            accessorKey: 'createdAt',
            header: 'Date',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(row.original.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
            )
        }
    ];

    return (
        <div className="p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Donation History</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage all community contributions</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <div className="text-xs font-bold text-gray-400 uppercase">Total Impact</div>
                        <div className="text-2xl font-black text-primary-600">₦{stats.totalRaised.toLocaleString()}</div>
                    </div>
                    <div className="h-10 w-px bg-gray-200 dark:bg-gray-700 mx-2" />
                    <div className="text-right">
                        <div className="text-xs font-bold text-gray-400 uppercase">Unique Donors</div>
                        <div className="text-2xl font-black text-blue-600">{stats.donorCount}</div>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Filter by donor or reference..." className="pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-700 border-none outline-none w-72" />
                        </div>
                        <button 
                            onClick={() => setIsVerifyModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                        >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Manual Verification
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => exportDonationHistoryPdf({ donations, stats }, schoolInfo)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
                        >
                            <FileText className="w-4 h-4" />
                            Download PDF Report
                        </button>
                    </div>
                </div>
                <DataTable columns={columns} data={donations} loading={loading} />
            </div>
        </div>

            {/* Manual Verification Modal */}
            <Modal
                isOpen={isVerifyModalOpen}
                onClose={() => setIsVerifyModalOpen(false)}
                title="Manual Payment Verification"
            >
                <form onSubmit={handleManualVerify} className="p-6 space-y-4">
                    <p className="text-xs text-gray-500">
                        Enter the transaction reference from your payment gateway dashboard to manually verify and record a donation.
                    </p>
                    
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Payment Gateway</label>
                        <select 
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none text-sm font-medium"
                            value={verifyData.gateway}
                            onChange={e => setVerifyData({...verifyData, gateway: e.target.value as any})}
                        >
                            <option value="paystack">Paystack</option>
                            <option value="flutterwave">Flutterwave</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Transaction Reference</label>
                        <input 
                            required
                            type="text" 
                            placeholder="e.g. T728394857..."
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none text-sm font-medium"
                            value={verifyData.reference}
                            onChange={e => setVerifyData({...verifyData, reference: e.target.value})}
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={verifying}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {verifying ? "Verifying..." : "Confirm & Record Payment"}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default DonationHistory;
