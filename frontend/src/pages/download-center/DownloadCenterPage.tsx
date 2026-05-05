import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  Download,
  Edit2,
  ExternalLink,
  FileArchive,
  FileImage,
  FileMusic,
  FileSpreadsheet,
  FileText,
  FileType,
  GraduationCap,
  Link as LinkIcon,
  Plus,
  Search,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import api, { getFileUrl } from '../../services/api';
import downloadCenterService, { DownloadResource, DownloadResourceType } from '../../services/downloadCenter.service';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../context/ToastContext';

const resourceTabs: Array<{ label: string; value: 'all' | DownloadResourceType; icon: any }> = [
  { label: 'All Resources', value: 'all', icon: BookOpen },
  { label: 'Educational Materials', value: 'material', icon: FileText },
  { label: 'Syllabi', value: 'syllabus', icon: GraduationCap },
  { label: 'Video Tutorials', value: 'video', icon: Video },
  { label: 'Academic Program', value: 'academic_program', icon: CalendarDays },
];

const resourceTypeLabels: Record<DownloadResourceType, string> = {
  material: 'Educational Material',
  syllabus: 'Syllabus',
  video: 'Video Tutorial',
  academic_program: 'Academic Program',
  other: 'Other',
};

function getYoutubeEmbedUrl(url?: string) {
  if (!url) return '';
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function formatFileSize(size?: number) {
  if (!size) return '';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(path?: string) {
  return path?.split('?')[0].split('.').pop()?.toLowerCase() || '';
}

function getFileName(resource: DownloadResource) {
  const fromPath = resource.fileUrl?.split('?')[0].split('/').pop();
  if (fromPath) return fromPath;
  const safeTitle = resource.title.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'resource';
  const extension = getFileExtension(resource.fileUrl);
  return extension ? `${safeTitle}.${extension}` : safeTitle;
}

function getStaticFileUrl(resource: DownloadResource) {
  if (!resource.fileUrl) return '';
  return getFileUrl(resource.fileUrl);
}

async function readBlobError(error: any) {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      return parsed.message || parsed.error || text;
    } catch {
      return 'Unable to read the file response from the server.';
    }
  }
  return error?.response?.data?.message || error?.message || 'Unable to download this resource.';
}

function isInlinePreviewable(resource: DownloadResource) {
  const mimeType = resource.mimeType || '';
  const extension = getFileExtension(resource.fileUrl);

  return (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('image/') ||
    mimeType.startsWith('audio/') ||
    mimeType.startsWith('text/') ||
    ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp3', 'wav', 'ogg', 'm4a', 'txt', 'csv', 'json', 'md', 'html', 'css', 'js', 'ts', 'tsx'].includes(extension)
  );
}

function getPreviewKind(resource: DownloadResource) {
  const mimeType = resource.mimeType || '';
  const extension = getFileExtension(resource.fileUrl);

  if (resource.resourceType === 'video') return 'youtube';
  if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) return 'audio';
  if (mimeType.startsWith('text/') || ['txt', 'csv', 'json', 'md', 'html', 'css', 'js', 'ts', 'tsx'].includes(extension)) return 'text';
  if (['doc', 'docx', 'rtf', 'odt'].includes(extension)) return 'document';
  if (['xls', 'xlsx', 'ods'].includes(extension)) return 'spreadsheet';
  if (['ppt', 'pptx', 'odp'].includes(extension)) return 'presentation';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'archive';
  return 'file';
}

function getPreviewIcon(kind: string) {
  if (kind === 'image') return FileImage;
  if (kind === 'audio') return FileMusic;
  if (kind === 'spreadsheet') return FileSpreadsheet;
  if (kind === 'archive') return FileArchive;
  if (kind === 'document' || kind === 'presentation') return FileType;
  return FileText;
}

export default function DownloadCenterPage() {
  const { user, selectedChildId } = useAuthStore();
  const toast = useToast();
  const role = (user?.roleObject?.name || user?.role || 'student').toLowerCase();
  const isStaff = ['admin', 'administrator', 'super administrator', 'teacher'].includes(role) || role.includes('admin');

  const [resources, setResources] = useState<DownloadResource[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<'all' | DownloadResourceType>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DownloadResource | null>(null);
  const [preview, setPreview] = useState<DownloadResource | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    resourceType: 'material' as DownloadResourceType,
    category: '',
    externalUrl: '',
    classId: '',
    subjectId: '',
    visibility: 'students',
    status: 'published',
    isFeatured: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const selectFile = (selectedFile?: File) => {
    if (!selectedFile) {
      setFile(null);
      return;
    }

    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.flv', '.wmv'];
    const isVideo = selectedFile.type.startsWith('video/') || videoExtensions.some((ext) => selectedFile.name.toLowerCase().endsWith(ext));

    if (isVideo) {
      setFile(null);
      toast.showError('Video files are not allowed. Paste a YouTube URL under Video Tutorials instead.');
      return;
    }

    setFile(selectedFile);
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchResources();
  }, [activeType, selectedChildId]);

  useEffect(() => {
    let objectUrl = '';
    const loadPreview = async () => {
      setPreviewObjectUrl('');
      setPreviewText('');
      setPreviewLoading(false);

      if (!preview?.fileUrl || preview.resourceType === 'video' || !isInlinePreviewable(preview)) {
        return;
      }

      try {
        setPreviewLoading(true);
        const kind = getPreviewKind(preview);

        const rawBlob = await downloadCenterService.getResourceFile(preview.id);
        // Recast the blob to the correct mime type (since the backend sent it as text/plain to bypass IDM)
        const typedBlob = new Blob([rawBlob], { type: preview.mimeType || 'application/octet-stream' });
        objectUrl = URL.createObjectURL(typedBlob);
        setPreviewObjectUrl(objectUrl);
        if (kind === 'text') {
          setPreviewText(await typedBlob.text());
        }
      } catch (error) {
        setPreviewObjectUrl('');
        setPreviewText('');
        const message = await readBlobError(error);
        toast.showError(message);
      } finally {
        setPreviewLoading(false);
      }
    };

    loadPreview();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [preview]);

  const fetchLookups = async () => {
    try {
      const [classList, subjectList] = await Promise.all([api.getClasses(), api.getSubjects()]);
      setClasses(classList || []);
      setSubjects(subjectList || []);
    } catch {
      // Lookup failures should not block the page.
    }
  };

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (activeType !== 'all') params.resourceType = activeType;
      if (!isStaff && selectedChildId) params.studentId = selectedChildId;
      const data = await downloadCenterService.getResources(params);
      setResources(data || []);
    } catch (error) {
      toast.showError('Failed to load download center resources');
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = useMemo(() => {
    const term = search.toLowerCase();
    return resources.filter((item) =>
      item.title.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      item.subject?.name?.toLowerCase().includes(term) ||
      item.class?.name?.toLowerCase().includes(term)
    );
  }, [resources, search]);

  const openCreate = (resourceType: DownloadResourceType = activeType === 'all' ? 'material' : activeType) => {
    setEditing(null);
    setFile(null);
    setForm({
      title: '',
      description: '',
      resourceType,
      category: '',
      externalUrl: '',
      classId: '',
      subjectId: '',
      visibility: 'students',
      status: 'published',
      isFeatured: false,
    });
    setShowForm(true);
  };

  const openEdit = (resource: DownloadResource) => {
    setEditing(resource);
    setFile(null);
    setForm({
      title: resource.title,
      description: resource.description || '',
      resourceType: resource.resourceType,
      category: resource.category || '',
      externalUrl: resource.externalUrl || '',
      classId: resource.classId || '',
      subjectId: resource.subjectId || '',
      visibility: resource.visibility,
      status: resource.status,
      isFeatured: !!resource.isFeatured,
    });
    setShowForm(true);
  };

  const submitResource = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        data.append(key, value ? 'true' : 'false');
      } else if (value) {
        data.append(key, value);
      }
    });
    if (file) data.append('file', file);

    try {
      if (editing) {
        await downloadCenterService.updateResource(editing.id, data);
        toast.showSuccess('Resource updated');
      } else {
        await downloadCenterService.createResource(data);
        toast.showSuccess('Resource uploaded');
      }
      setShowForm(false);
      fetchResources();
    } catch {
      toast.showError('Unable to save resource');
    }
  };

  const deleteResource = async (id: string) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await downloadCenterService.deleteResource(id);
      toast.showSuccess('Resource deleted');
      fetchResources();
    } catch {
      toast.showError('Unable to delete resource');
    }
  };

  const viewResource = async (resource: DownloadResource) => {
    setPreview(resource);
    await downloadCenterService.trackView(resource.id).catch(() => undefined);
  };

  const downloadResource = async (resource: DownloadResource) => {
    await downloadCenterService.trackDownload(resource.id).catch(() => undefined);

    if (resource.fileUrl) {
      try {
        const rawBlob = await downloadCenterService.getResourceFile(resource.id);
        const typedBlob = new Blob([rawBlob], { type: resource.mimeType || 'application/octet-stream' });
        const url = window.URL.createObjectURL(typedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = getFileName(resource);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        const message = await readBlobError(error);
        toast.showError(message);
      }
      return;
    }

    if (resource.externalUrl) {
      window.open(resource.externalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const renderPreviewContent = (resource: DownloadResource) => {
    const kind = getPreviewKind(resource);
    const extension = getFileExtension(resource.fileUrl).toUpperCase() || 'FILE';
    const PreviewIcon = getPreviewIcon(kind);

    if (kind === 'youtube') {
      return (
        <div className="space-y-4">
          <iframe title={resource.title} src={getYoutubeEmbedUrl(resource.externalUrl)} className="aspect-video w-full rounded-xl border-0 bg-black" allowFullScreen />
          <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between">
            <span>YouTube videos can be watched here or opened on YouTube. Direct video download is not supported.</span>
            {resource.externalUrl && (
              <button onClick={() => window.open(resource.externalUrl, '_blank', 'noopener,noreferrer')} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">
                <ExternalLink className="h-4 w-4" />
                Open YouTube
              </button>
            )}
          </div>
        </div>
      );
    }

    if (previewLoading) {
      return (
        <div className="flex h-[55vh] items-center justify-center rounded-xl border border-gray-200 text-sm font-medium text-gray-500 dark:border-gray-700">
          Loading {extension} preview...
        </div>
      );
    }

    if (previewObjectUrl && kind === 'pdf') {
      return (
        <div className="space-y-3">
          <iframe title={resource.title} src={previewObjectUrl} className="h-[70vh] w-full rounded-xl border border-gray-200 dark:border-gray-700" />
          <div className="flex justify-end">
            <button onClick={() => downloadResource(resource)} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700">
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>
      );
    }

    if (previewObjectUrl && kind === 'image') {
      return (
        <div className="space-y-3">
          <img src={previewObjectUrl} alt={resource.title} className="max-h-[70vh] w-full rounded-xl border border-gray-200 object-contain dark:border-gray-700" />
          <div className="flex justify-end">
            <button onClick={() => downloadResource(resource)} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700">
              <Download className="h-4 w-4" />
              Download Image
            </button>
          </div>
        </div>
      );
    }

    if (previewObjectUrl && kind === 'audio') {
      return (
        <div className="rounded-xl border border-gray-200 p-8 dark:border-gray-700">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300">
              <FileMusic className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{resource.title}</p>
              <p className="text-xs text-gray-500">{extension} audio file</p>
            </div>
          </div>
          <audio src={previewObjectUrl} controls className="w-full" />
          <div className="mt-4 flex justify-end">
            <button onClick={() => downloadResource(resource)} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700">
              <Download className="h-4 w-4" />
              Download Audio
            </button>
          </div>
        </div>
      );
    }

    if (previewText && kind === 'text') {
      return (
        <div className="space-y-3">
          <pre className="max-h-[70vh] overflow-auto rounded-xl border border-gray-200 bg-gray-950 p-4 text-xs leading-6 text-gray-100 dark:border-gray-700">
            {previewText}
          </pre>
          <div className="flex justify-end">
            <button onClick={() => downloadResource(resource)} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700">
              <Download className="h-4 w-4" />
              Download Text File
            </button>
          </div>
        </div>
      );
    }

    const labels: Record<string, string> = {
      document: 'Document file',
      spreadsheet: 'Spreadsheet file',
      presentation: 'Presentation file',
      archive: 'Compressed archive',
      file: 'File',
    };

    return (
      <div className="rounded-xl border border-gray-200 p-8 text-center dark:border-gray-700">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 dark:bg-gray-900">
          <PreviewIcon className="h-8 w-8" />
        </div>
        <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white">{labels[kind] || 'File'} preview</h3>
        <p className="mx-auto mb-4 max-w-md text-sm text-gray-500">
          This {extension} file cannot be previewed directly in the browser. Download it to open it with the right application.
        </p>
        <button onClick={() => downloadResource(resource)} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700">
          <Download className="h-4 w-4" />
          Download {extension}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <Download className="h-6 w-6 text-primary-600" />
            Download Center
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isStaff ? 'Upload and publish learning resources, syllabi, videos, and academic programs.' : 'View, watch, and download school learning resources.'}
          </p>
        </div>
        {isStaff && (
          <button
            onClick={() => openCreate()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add Resource
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {resourceTabs.map(({ label, value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setActiveType(value)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${
              activeType === value
                ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-300'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, class, subject, or description..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800" />
          ))
        ) : filteredResources.length === 0 ? (
          <div className="xl:col-span-2 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-800">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No resources found</h3>
            <p className="text-sm text-gray-500">Resources will appear here once they are published.</p>
          </div>
        ) : (
          filteredResources.map((resource) => {
            const Icon = resource.resourceType === 'video' ? Video : resource.resourceType === 'academic_program' ? CalendarDays : FileText;
            return (
              <div key={resource.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                        {resourceTypeLabels[resource.resourceType]}
                      </span>
                      {resource.status !== 'published' && isStaff && (
                        <span className="rounded-lg bg-yellow-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-yellow-700">
                          {resource.status}
                        </span>
                      )}
                      {resource.isFeatured && (
                        <span className="rounded-lg bg-green-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-green-700">
                          Featured
                        </span>
                      )}
                    </div>
                    <h3 className="truncate text-base font-bold text-gray-900 dark:text-white">{resource.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{resource.description || 'No description provided.'}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {resource.class?.name && <span>{resource.class.name}</span>}
                      {resource.subject?.name && <span>{resource.subject.name}</span>}
                      {resource.fileSize && <span>{formatFileSize(resource.fileSize)}</span>}
                      {isStaff && <span>{resource.viewCount} views · {resource.downloadCount} downloads</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
                  <button onClick={() => viewResource(resource)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900">
                    {resource.resourceType === 'video' ? <Video className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                    {resource.resourceType === 'video' ? 'Watch' : 'View'}
                  </button>
                  {(resource.fileUrl || resource.externalUrl) && (
                    <button onClick={() => downloadResource(resource)} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-primary-700">
                      {resource.resourceType === 'video' ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                      {resource.resourceType === 'video' ? 'Open YouTube' : 'Download'}
                    </button>
                  )}
                  {isStaff && (
                    <>
                      <button onClick={() => openEdit(resource)} className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600" title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteResource(resource.id)} className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form onSubmit={submitResource} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editing ? 'Edit Resource' : 'Add Resource'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Title</span>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
              </label>

              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Type</span>
                <select value={form.resourceType} onChange={(e) => setForm({ ...form, resourceType: e.target.value as DownloadResourceType })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                  {Object.entries(resourceTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Category</span>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Notes, scheme, calendar..." className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
              </label>

              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Class</span>
                <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                  <option value="">All classes</option>
                  {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>

              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Subject</span>
                <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                  <option value="">General</option>
                  {subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>

              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Visibility</span>
                <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                  <option value="students">Students</option>
                  <option value="parents">Parents</option>
                  <option value="all">Students and parents</option>
                  <option value="staff">Staff</option>
                  <option value="public">Public</option>
                </select>
              </label>

              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Status</span>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              {form.resourceType === 'video' ? (
                <label className="md:col-span-2">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">YouTube URL</span>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input required value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                  </div>
                </label>
              ) : (
                <label className="md:col-span-2">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Upload File</span>
                  <input type="file" onChange={(e) => selectFile(e.target.files?.[0])} className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                  <span className="mt-1 block text-xs text-gray-500">Documents, images, audio, archives, and other files are allowed. Videos must be added with a YouTube URL.</span>
                </label>
              )}

              <label className="md:col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Description</span>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
              </label>

              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                Featured resource
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-700">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 dark:border-gray-700 dark:text-gray-300">Cancel</button>
              <button type="submit" className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-bold text-white hover:bg-primary-700">Save Resource</button>
            </div>
          </form>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
              <h2 className="truncate text-lg font-bold text-gray-900 dark:text-white">{preview.title}</h2>
              <button onClick={() => setPreview(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {renderPreviewContent(preview)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
