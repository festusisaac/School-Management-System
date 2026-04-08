import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  Search, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Clock, 
  HardDrive,
  Grid,
  List as ListIcon,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useSystem } from '../../../context/SystemContext';
import { useToast } from '../../../context/ToastContext';
import cmsService, { CmsMedia } from '../../../services/cms.service';

const MediaLibrary = () => {
    const { getFullUrl } = useSystem();
    const { showToast } = useToast();
    const [media, setMedia] = useState<CmsMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedItem, setSelectedItem] = useState<CmsMedia | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        fetchMedia();
    }, []);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const response = await cmsService.getMediaLibrary();
            setMedia(response.data);
        } catch (error) {
            console.error('Failed to fetch media:', error);
            showToast('Failed to load media library', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (filename: string) => {
        if (!window.confirm('Are you sure you want to permanently delete this file? This cannot be undone and may break some sections of the website if the image is in use.')) return;
        
        try {
            await cmsService.deleteMediaFile(filename);
            setMedia(prev => prev.filter(m => m.name !== filename));
            if (selectedItem?.name === filename) setSelectedItem(null);
            showToast('File deleted successfully', 'success');
        } catch (error) {
            showToast('Failed to delete file', 'error');
        }
    };

    const handleCopyUrl = (url: string) => {
        const fullUrl = getFullUrl(url);
        navigator.clipboard.writeText(fullUrl);
        setCopied(url);
        showToast('URL copied to clipboard!', 'success');
        setTimeout(() => setCopied(null), 2000);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const filteredMedia = media.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalSize = media.reduce((acc, curr) => acc + curr.size, 0);

    return (
        <div className="flex flex-col h-[650px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Folder className="text-primary-600" size={24} />
                        Centralized Media Library
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        <HardDrive size={14} />
                        Currently storing {media.length} files ({formatSize(totalSize)}) in front-cms storage.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Grid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
                {/* Browser Column */}
                <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Search images by filename..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                                <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Scanning Storage...</p>
                            </div>
                        ) : filteredMedia.length > 0 ? (
                            viewMode === 'grid' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {filteredMedia.map((item) => (
                                        <button
                                            key={item.name}
                                            onClick={() => setSelectedItem(item)}
                                            className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                                                selectedItem?.name === item.name ? 'border-primary-600 ring-4 ring-primary-50' : 'border-slate-100 hover:border-primary-200 shadow-sm'
                                            }`}
                                        >
                                            <img 
                                                src={getFullUrl(item.url)} 
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                <p className="text-[10px] text-white truncate font-bold w-full">{item.name}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {filteredMedia.map((item) => (
                                        <button
                                            key={item.name}
                                            onClick={() => setSelectedItem(item)}
                                            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-slate-50 ${
                                                selectedItem?.name === item.name ? 'bg-primary-50 border-primary-100' : ''
                                            }`}
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                                <img src={getFullUrl(item.url)} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0 flex-1 text-left">
                                                <p className="text-sm font-bold text-slate-700 truncate">{item.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{formatSize(item.size)} • {new Date(item.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="p-2 text-slate-300">
                                                <ExternalLink size={14} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-30 text-center py-20 px-8">
                                <ImageIcon size={64} className="mb-4" />
                                <p className="text-lg font-black uppercase tracking-widest">No Media Files</p>
                                <p className="text-sm">Try searching for something else or upload images in other CMS sections.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Column */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    {selectedItem ? (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">File Details</h3>
                                <button 
                                    onClick={() => setSelectedItem(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                                <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 shadow-inner group">
                                    <img 
                                        src={getFullUrl(selectedItem.url)} 
                                        alt="" 
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform bg-black/60 backdrop-blur-sm flex justify-center">
                                        <a href={getFullUrl(selectedItem.url)} target="_blank" rel="noreferrer" className="text-white text-[10px] font-bold flex items-center gap-1">
                                            <ExternalLink size={12} /> Open Full Resolution
                                        </a>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">File Name</p>
                                        <p className="text-sm font-bold text-slate-900 break-all">{selectedItem.name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <HardDrive size={10} /> File Size
                                            </p>
                                            <p className="text-sm font-bold text-slate-700">{formatSize(selectedItem.size)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <Clock size={10} /> Uploaded
                                            </p>
                                            <p className="text-sm font-bold text-slate-700">{new Date(selectedItem.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Public URL</p>
                                        <div className="flex gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 group">
                                            <input 
                                                readOnly
                                                value={getFullUrl(selectedItem.url)}
                                                className="bg-transparent border-none text-[10px] font-mono text-slate-500 w-full focus:ring-0"
                                            />
                                            <button 
                                                onClick={() => handleCopyUrl(selectedItem.url)}
                                                className={`p-2 rounded-lg transition-all active:scale-95 ${copied === selectedItem.url ? 'bg-green-500 text-white' : 'bg-white text-slate-400 hover:text-primary-600 shadow-sm'}`}
                                            >
                                                {copied === selectedItem.url ? <Check size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                                    <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                                    <p className="text-[10px] font-medium text-amber-800 leading-relaxed">
                                        Deleting this file will break it anywhere it's used on the website. Use with caution.
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-50 space-y-3">
                                <button 
                                    onClick={() => handleDelete(selectedItem.name)}
                                    className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white py-2.5 rounded-xl text-sm font-bold transition-all"
                                >
                                    <Trash2 size={16} />
                                    Permanently Delete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 p-12 text-center space-y-4 bg-slate-50/10">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                                <Info size={40} className="text-slate-300" />
                            </div>
                            <div>
                                <p className="text-lg font-black text-slate-400 uppercase tracking-widest">Select an image</p>
                                <p className="text-sm font-medium text-slate-400">View metadata and manage file usage here.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaLibrary;
