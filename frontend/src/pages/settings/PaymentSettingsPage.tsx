import React, { useState, useEffect } from 'react';
import { Save, CreditCard, ShieldCheck, Zap, ToggleLeft, ToggleRight, LayoutGrid, List, CheckCircle2, AlertCircle, Copy, Eye, EyeOff, Info } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useSystem } from '../../context/SystemContext';
import { systemService, SystemSetting } from '../../services/systemService';
import { twMerge } from 'tailwind-merge';

const PAYMENT_PROVIDERS = [
    { 
        id: 'paystack', 
        name: 'Paystack', 
        logo: 'https://paystack.com/assets/payment/img/paystack-badge-cards.png',
        color: 'text-sky-500',
        borderColor: 'border-sky-500',
        bgColor: 'bg-sky-50/50 dark:bg-sky-900/10',
        description: 'Modern online payments for Africa. Supports Cards, Bank Transfer, USSD, and Apple Pay.'
    },
    { 
        id: 'flutterwave', 
        name: 'Flutterwave', 
        logo: 'https://flutterwave.com/images/logo/logo-primary.svg',
        color: 'text-amber-500',
        borderColor: 'border-amber-500',
        bgColor: 'bg-amber-50/50 dark:bg-amber-900/10',
        description: 'Accept payments from anyone, anywhere in the world. Supports over 150 currencies.'
    },
    { 
        id: 'monnify', 
        name: 'Monnify', 
        logo: 'https://monnify.com/assets/images/monnify-logo.svg',
        color: 'text-blue-600',
        borderColor: 'border-blue-600',
        bgColor: 'bg-blue-50/50 dark:bg-blue-900/10',
        description: 'The easiest way for businesses to accept payments via Virtual Accounts and Transfer.'
    },
    { 
        id: 'remita', 
        name: 'Remita', 
        logo: 'https://www.remita.net/images/remita-logo.png',
        color: 'text-orange-600',
        borderColor: 'border-orange-600',
        bgColor: 'bg-orange-50/50 dark:bg-orange-900/10',
        description: 'Multi-channel payment platform widely used by government agencies and institutions.'
    },
    { 
        id: 'squad', 
        name: 'Squad', 
        logo: 'https://squadco.com/wp-content/uploads/2022/05/Squad-Logo.svg',
        color: 'text-pink-600',
        borderColor: 'border-pink-600',
        bgColor: 'bg-pink-50/50 dark:bg-pink-900/10',
        description: 'A complete payment tool for business growth by GTCO (GTBank).'
    },
    { 
        id: 'interswitch', 
        name: 'Interswitch', 
        logo: 'https://www.interswitchgroup.com/assets/images/interswitch_logo_color.png',
        color: 'text-blue-800',
        borderColor: 'border-blue-800',
        bgColor: 'bg-blue-50/50 dark:bg-blue-900/10',
        description: 'Secure and reliable Webpay integration for legacy and corporate payments.'
    }
];

const GatewayFormGroup = ({ label, name, value, onChange, type = "text", placeholder = "", helpText = "" }: any) => {
    const [showContent, setShowContent] = useState(false);
    const isSecret = name.toLowerCase().includes('secret') || name.toLowerCase().includes('api') || name.toLowerCase().includes('key');
    const displayType = isSecret ? (showContent ? "text" : "password") : type;

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                {label}
                {isSecret && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
            </label>
            <div className="relative group">
                <input
                    type={displayType}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                />
                {isSecret && (
                    <button
                        type="button"
                        onClick={() => setShowContent(!showContent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
                    >
                        {showContent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
            {helpText && <p className="text-[11px] text-gray-500 dark:text-gray-400 pl-1">{helpText}</p>}
        </div>
    );
};

const PaymentSettingsPage = () => {
    const { showSuccess, showError, showWarning } = useToast();
    const { refreshSettings } = useSystem();
    const [settings, setSettings] = useState<SystemSetting>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedProvider, setExpandedProvider] = useState<string | null>('paystack');

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                const data = await systemService.getSettings();
                setSettings(data);
                if (data.activePaymentGateway) {
                    setExpandedProvider(data.activePaymentGateway);
                }
            } catch (error) {
                showError('Failed to load payment settings');
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await systemService.updateSettings(settings);
            showSuccess('Payment settings updated successfully');
            await refreshSettings();
        } catch (error) {
            showError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleActiveGateway = (id: string) => {
        setSettings(prev => ({ ...prev, activePaymentGateway: id }));
        setExpandedProvider(id);
        showWarning(`Remember to save changes to activate ${id.toUpperCase()}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                <p className="text-gray-500 animate-pulse font-medium">Initializing Payment Gateways...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                            <CreditCard className="w-7 h-7 text-primary-600" />
                        </div>
                        Payment Settings
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-lg">
                        Configure professional checkout experiences. Select an active gateway and provide API credentials.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="group relative flex items-center gap-3 px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                        <Save className="w-4 h-4 relative z-10" />
                    )}
                    <span className="relative z-10">{saving ? 'Saving...' : 'Deploy Changes'}</span>
                </button>
            </div>

            {/* Active Gateway Selection */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Active Payment Provider
                    </h2>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-lg">
                        Global Selection
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PAYMENT_PROVIDERS.map((provider) => {
                        const isActive = settings.activePaymentGateway === provider.id;
                        return (
                            <button
                                key={provider.id}
                                onClick={() => handleActiveGateway(provider.id)}
                                className={twMerge(
                                    "relative p-5 rounded-3xl border-2 transition-all text-left flex flex-col gap-4 overflow-hidden group",
                                    isActive 
                                        ? `${provider.borderColor} bg-white dark:bg-gray-800 shadow-xl shadow-${provider.id}-500/5` 
                                        : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 hover:border-gray-300 dark:hover:border-gray-600"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className={twMerge(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center p-2.5 transition-transform group-hover:scale-110",
                                        provider.bgColor
                                    )}>
                                        <img src={provider.logo} alt={provider.name} className="max-w-full max-h-full object-contain filter dark:brightness-110" />
                                    </div>
                                    {isActive ? (
                                        <div className="bg-emerald-500 text-white p-1 rounded-full animate-bounce-slow">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white">{provider.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                                        {provider.description}
                                    </p>
                                </div>
                                {isActive && (
                                    <div className={twMerge("absolute top-0 right-0 w-32 h-32 opacity-[0.03] -translate-y-12 translate-x-12", provider.color)}>
                                        <CreditCard className="w-full h-full" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Provider Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Provider List Sidebar */}
                <div className="lg:col-span-1 space-y-3">
                    <div className="p-1 bg-gray-100 dark:bg-gray-900/50 rounded-2xl flex items-center gap-1">
                        <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-xs font-bold text-gray-900 dark:text-white transition-all">
                            <List className="w-4 h-4" />
                            Provider Config
                        </button>
                    </div>
                    {PAYMENT_PROVIDERS.map((provider) => (
                        <button
                            key={provider.id}
                            onClick={() => setExpandedProvider(provider.id)}
                            className={twMerge(
                                "w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left group",
                                expandedProvider === provider.id
                                    ? "bg-white dark:bg-gray-800 shadow-md ring-1 ring-gray-100 dark:ring-gray-700"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-800/50"
                            )}
                        >
                            <div className={twMerge(
                                "w-10 h-10 rounded-xl p-2 flex items-center justify-center transition-all",
                                expandedProvider === provider.id ? provider.bgColor : "bg-gray-200 dark:bg-gray-700 grayscale"
                            )}>
                                <img src={provider.logo} alt={provider.name} className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="flex-1">
                                <h4 className={twMerge(
                                    "text-sm font-bold transition-all",
                                    expandedProvider === provider.id ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700"
                                )}>
                                    {provider.name}
                                </h4>
                                {settings.activePaymentGateway === provider.id && (
                                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Current Active</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Main Configuration Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden min-h-[500px]">
                        {expandedProvider ? (
                            <div className="p-8 md:p-10 space-y-10 animate-in fade-in zoom-in-95 duration-500">
                                {/* Form Header */}
                                <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-gray-100 dark:border-gray-700">
                                    <div className="w-24 h-24 rounded-3xl bg-gray-50 dark:bg-gray-900 p-5 flex items-center justify-center shadow-inner">
                                        <img src={PAYMENT_PROVIDERS.find(p => p.id === expandedProvider)?.logo} className="max-w-full max-h-full object-contain" alt="Provider" />
                                    </div>
                                    <div className="flex-1 text-center md:text-left space-y-2">
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                            {PAYMENT_PROVIDERS.find(p => p.id === expandedProvider)?.name} Configuration
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center md:justify-start gap-2">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            SSL Secured API Key Storage
                                        </p>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="grid grid-cols-1 gap-8">
                                    {expandedProvider === 'paystack' && (
                                        <>
                                            <GatewayFormGroup 
                                                label="Public Key" 
                                                name="paystackPublicKey" 
                                                value={settings.paystackPublicKey} 
                                                onChange={handleChange} 
                                                placeholder="pk_live_..."
                                                helpText="Obtain this from your Paystack Dashboard (Settings -> API Keys & Webhooks)"
                                            />
                                            <GatewayFormGroup 
                                                label="Secret Key" 
                                                name="paystackSecretKey" 
                                                value={settings.paystackSecretKey} 
                                                onChange={handleChange} 
                                                placeholder="sk_live_..."
                                                helpText="Keep this key extremely safe. Never share it externally."
                                            />
                                        </>
                                    )}

                                    {expandedProvider === 'flutterwave' && (
                                        <>
                                            <GatewayFormGroup 
                                                label="Public Key" 
                                                name="flutterwavePublicKey" 
                                                value={settings.flutterwavePublicKey} 
                                                onChange={handleChange} 
                                                placeholder="FLWPUBK-..."
                                            />
                                            <GatewayFormGroup 
                                                label="Secret Key" 
                                                name="flutterwaveSecretKey" 
                                                value={settings.flutterwaveSecretKey} 
                                                onChange={handleChange} 
                                                placeholder="FLWSECK-..."
                                            />
                                        </>
                                    )}

                                    {expandedProvider === 'monnify' && (
                                        <>
                                            <GatewayFormGroup label="API Key" name="monnifyApiKey" value={settings.monnifyApiKey} onChange={handleChange} />
                                            <GatewayFormGroup label="Secret Key" name="monnifySecretKey" value={settings.monnifySecretKey} onChange={handleChange} />
                                            <GatewayFormGroup label="Contract Code" name="monnifyContractCode" value={settings.monnifyContractCode} onChange={handleChange} />
                                        </>
                                    )}

                                    {expandedProvider === 'remita' && (
                                        <>
                                            <GatewayFormGroup label="Merchant ID" name="remitaMerchantId" value={settings.remitaMerchantId} onChange={handleChange} />
                                            <GatewayFormGroup label="Service Type ID" name="remitaServiceTypeId" value={settings.remitaServiceTypeId} onChange={handleChange} />
                                            <GatewayFormGroup label="API Key" name="remitaApiKey" value={settings.remitaApiKey} onChange={handleChange} />
                                        </>
                                    )}

                                    {expandedProvider === 'squad' && (
                                        <>
                                            <GatewayFormGroup label="Public Key" name="squadPublicKey" value={settings.squadPublicKey} onChange={handleChange} />
                                            <GatewayFormGroup label="Secret Key" name="squadSecretKey" value={settings.squadSecretKey} onChange={handleChange} />
                                        </>
                                    )}

                                    {expandedProvider === 'interswitch' && (
                                        <>
                                            <GatewayFormGroup label="Merchant Code" name="interswitchMerchantCode" value={settings.interswitchMerchantCode} onChange={handleChange} />
                                            <GatewayFormGroup label="Pay Item ID" name="interswitchPayItemId" value={settings.interswitchPayItemId} onChange={handleChange} />
                                            <GatewayFormGroup label="Secret Key (MAC Key)" name="interswitchSecretKey" value={settings.interswitchSecretKey} onChange={handleChange} />
                                        </>
                                    )}
                                </div>

                                <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-4">
                                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Environment Verification</h4>
                                        <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
                                            Ensure you are using <strong>LIVE</strong> keys for production deployments. If you swap to <strong>TEST</strong> keys, make sure to revert before processing real tuition payments.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-6">
                                <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                                    <Info className="w-10 h-10 text-gray-300" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Begin Configuration</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                        Select a provider from the sidebar to manage its unique API credentials.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSettingsPage;
