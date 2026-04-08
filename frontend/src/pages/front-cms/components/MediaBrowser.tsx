import { useState, useEffect } from 'react';
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
  Info,
  Loader2,
  Upload
} from 'lucide-react';
import { useSystem } from '../../../context/SystemContext';
import { useToast } from '../../../context/ToastContext';
import cmsService, { CmsMedia } from '../../../services/cms.service';

interface MediaBrowserProps {
    onSelect?: (media: CmsMedia) => void;
    allowDelete?: boolean;
    selectionMode?: boolean;
}

const MediaBrowser = ({ onSelect, allowDelete = true, selectionMode = false }: MediaBrowserProps) => {
    const { getFullUrl } = useSystem();
    const { showToast } = useToast();
    const [media, setMedia] = useState<CmsMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedItem, setSelectedItem] = useState<CmsMedia | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchMedia();
    }, []);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const response = await cmsService.getMediaLibrary();
            setMedia(response);
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

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            await cmsService.uploadMedia(file);
            showToast('File uploaded successfully', 'success');
            fetchMedia();
        } catch (error) {
            showToast('Failed to upload file', 'error');
        } finally {
            setUploading(false);
        }
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
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Media Library
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <HardDrive size={12} />
                        Storing {media.length} files ({formatSize(totalSize)})
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <label className="flex-1 md:flex-none cursor-pointer flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm shadow-primary-100 disabled:opacity-50">
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        Upload
                        <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
                    </label>
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex gap-1 border border-gray-200 dark:border-gray-700">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Grid size={16} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <ListIcon size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Browser Column */}
                <div className="lg:col-span-8 flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Search media..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Scanning Storage...</p>
                            </div>
                        ) : filteredMedia.length > 0 ? (
                            viewMode === 'grid' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {filteredMedia.map((item) => (
                                        <button
                                            key={item.name}
                                            onClick={() => setSelectedItem(item)}
                                            className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                                selectedItem?.name === item.name ? 'border-primary-600 ring-4 ring-primary-50 dark:ring-primary-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-primary-500 shadow-sm'
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
                                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {filteredMedia.map((item) => (
                                        <button
                                            key={item.name}
                                            onClick={() => setSelectedItem(item)}
                                            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                                                selectedItem?.name === item.name ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-100' : ''
                                            }`}
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-900 overflow-hidden shrink-0">
                                                <img src={getFullUrl(item.url)} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0 flex-1 text-left">
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{item.name}</p>
                                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{formatSize(item.size)} • {new Date(item.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="p-2 text-gray-300">
                                                <ExternalLink size={14} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-30 text-center py-20 px-8">
                                <ImageIcon size={64} className="mb-4 text-gray-300" />
                                <p className="text-lg font-black uppercase tracking-widest text-gray-400">No Media Files</p>
                                <p className="text-sm text-gray-400">Try searching for something else or upload a new image.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Column */}
                <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                    {selectedItem ? (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">File Details</h3>
                                <button 
                                    onClick={() => setSelectedItem(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                                <div className="aspect-video bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 group relative shadow-inner">
                                    <img 
                                        src={getFullUrl(selectedItem.url)} 
                                        alt="" 
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 backdrop-blur-sm">
                                        <a href={getFullUrl(selectedItem.url)} target="_blank" rel="noreferrer" className="bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold shadow-xl hover:scale-105 transition-transform">
                                            Open Full View
                                        </a>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">File Name</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white break-all">{selectedItem.name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <HardDrive size={10} /> Size
                                            </p>
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatSize(selectedItem.size)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <Clock size={10} /> Uploaded
                                            </p>
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{new Date(selectedItem.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 shadow-sm">Public URL</p>
                                        <div className="flex gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <input 
                                                readOnly
                                                value={getFullUrl(selectedItem.url)}
                                                className="bg-transparent border-none text-[10px] font-mono text-gray-500 w-full focus:ring-0"
                                            />
                                            <button 
                                                onClick={() => handleCopyUrl(selectedItem.url)}
                                                className={`p-2 rounded-md transition-all active:scale-95 ${copied === selectedItem.url ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-400 hover:text-primary-600 shadow-sm border border-gray-100 dark:border-gray-700'}`}
                                            >
                                                {copied === selectedItem.url ? <Check size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {allowDelete && (
                                  <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg flex gap-3">
                                      <AlertTriangle className="text-red-500 shrink-0" size={18} />
                                      <p className="text-[10px] font-medium text-red-800 dark:text-red-300 leading-relaxed">
                                          Deleting this file will remove it from all sections where it's currently used.
                                      </p>
                                  </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2 bg-gray-50 dark:bg-gray-900/50">
                                {selectionMode && onSelect && (
                                    <button 
                                        onClick={() => onSelect(selectedItem)}
                                        className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95"
                                    >
                                        <Check size={18} />
                                        Select Image
                                    </button>
                                )}
                                {allowDelete && (
                                  <button 
                                      onClick={() => handleDelete(selectedItem.name)}
                                      className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 py-2 rounded-lg text-xs font-bold transition-all"
                                  >
                                      <Trash2 size={14} />
                                      Delete Permanently
                                  </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 p-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <Info size={32} className="text-gray-300" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-400">Select an item</p>
                                <p className="text-sm text-gray-400">Choose a file to view details or select it.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaBrowser;
