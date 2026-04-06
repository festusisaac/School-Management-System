import { useState, useEffect } from 'react';
import { Save, Upload, Search, Users, X, Plus, FileText, Trash2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import api, { getFileUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useSystem } from '../../context/SystemContext';


export default function StudentAdmission() {
    const navigate = useNavigate();
    const toast = useToast();
    const { settings } = useSystem();
    const [searchParams] = useSearchParams();
    const { id: routeId } = useParams();
    const id = searchParams.get('id') || routeId;
    const isEditMode = !!id;
    const [activeTab, setActiveTab] = useState('personal');
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);

    // Metadata State
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [houses, setHouses] = useState<any[]>([]);
    const [discountProfiles, setDiscountProfiles] = useState<any[]>([]);
    const [allFeeGroups, setAllFeeGroups] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        // Personal
        admissionNo: '',
        rollNo: '',
        firstName: '',
        middleName: '',
        lastName: '',
        gender: 'Male',
        dob: '',
        religion: '',
        caste: '',
        nationality: 'Nigerian',
        stateOfOrigin: '',
        genotype: '',
        medicalConditions: '',
        mobileNumber: '',
        email: '',
        admissionDate: new Date().toISOString().split('T')[0],
        studentPhoto: null as File | null,
        studentPhotoPreview: '' as string,
        // Parent
        fatherName: '',
        fatherPhone: '',
        fatherOccupation: '',
        motherName: '',
        motherPhone: '',
        motherOccupation: '',
        guardianName: '',
        guardianRelation: '',
        guardianPhone: '',
        guardianEmail: '',
        guardianAddress: '',
        emergencyContact: '',
        // Address
        currentAddress: '',
        permanentAddress: '',
        // Academic
        classId: '',
        sectionId: '',
        categoryId: '',
        houseId: '',
        // Transport
        transportRoute: '',
        vehicleNumber: '',
        pickupPoint: '',
        // Hostel
        hostelName: '',
        roomNumber: '',
        // System
        siblingId: '',
        parentId: '',
        siblingName: '',
        bloodGroup: '',
        height: '',
        weight: '',
        asOnDate: '',
        previousSchoolName: '',
        lastClassPassed: '',
        note: '',
        discountProfileId: '',
        feeGroupIds: [] as string[],
        feeExclusions: {} as Record<string, string[]>,
    });



    // Sibling Search State
    const [showSiblingSearch, setShowSiblingSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchClassId, setSearchClassId] = useState('');
    const [searchSectionId, setSearchSectionId] = useState('');
    const [siblingResults, setSiblingResults] = useState<any[]>([]);
    const [searchingSibling, setSearchingSibling] = useState(false);
    const [linkedSiblings, setLinkedSiblings] = useState<any[]>([]);

    // Documents State
    const [documents, setDocuments] = useState<any[]>([]);

    // Apply Admission Number Prefix
    useEffect(() => {
        if (!isEditMode && settings?.admissionNumberPrefix && !formData.admissionNo) {
            setFormData(prev => ({
                ...prev,
                admissionNo: settings.admissionNumberPrefix || ''
            }));
        }
    }, [settings?.admissionNumberPrefix, isEditMode]);


    // Debounced Search Logic
    useEffect(() => {
        if (!showSiblingSearch) return;

        const timer = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, searchClassId, searchSectionId, showSiblingSearch]);

    const performSearch = async () => {
        if (!searchQuery.trim() && !searchClassId && !searchSectionId) {
            setSiblingResults([]);
            return;
        }

        setSearchingSibling(true);
        try {
            const results = await api.getStudents({
                keyword: searchQuery.trim(),
                classId: searchClassId,
                sectionId: searchSectionId
            });
            setSiblingResults(results);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setSearchingSibling(false);
        }
    };

    const handleSelectSibling = (sibling: any) => {
        setFormData(prev => ({
            ...prev,
            siblingId: sibling.id,
            // Auto-fill Parent Details
            fatherName: sibling.fatherName || '',
            fatherPhone: sibling.fatherPhone || '',
            fatherOccupation: sibling.fatherOccupation || '',
            motherName: sibling.motherName || '',
            motherPhone: sibling.motherPhone || '',
            motherOccupation: sibling.motherOccupation || '',
            guardianName: sibling.guardianName || '',
            guardianRelation: sibling.guardianRelation || '',
            guardianPhone: sibling.guardianPhone || '',
            guardianEmail: sibling.guardianEmail || '',
            guardianAddress: sibling.guardianAddress || '',
            emergencyContact: sibling.emergencyContact || '',
            // Auto-fill Address
            currentAddress: sibling.currentAddress || '',
            permanentAddress: sibling.permanentAddress || '',
            // System
            parentId: sibling.parent?.id || sibling.parentId || '',
            siblingName: `${sibling.firstName} ${sibling.lastName || ''}`,
        }));
        setShowSiblingSearch(false);
        // Clear search for next time
        setSearchQuery('');
        setSearchClassId('');
        setSearchSectionId('');
        toast.showInfo(`Linked with sibling: ${sibling.firstName} ${sibling.lastName || ''}`);
    };

    const addDocument = () => {
        setDocuments(prev => [...prev, { title: '', file: null, isNew: true }]);
    };

    const removeDocument = (index: number) => {
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const handleDocumentChange = (index: number, field: string, value: any) => {
        setDocuments(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleRemoveSibling = () => {
        setFormData(prev => ({
            ...prev,
            siblingId: '',
            parentId: '',
            siblingName: '',
        }));
        setLinkedSiblings([]);
    };

    // Fetch Siblings Group whenever parentId changes
    useEffect(() => {
        if (!formData.parentId) {
            setLinkedSiblings([]);
            return;
        }

        const fetchSiblings = async () => {
            try {
                const results = await api.getStudents({ parentId: formData.parentId });
                // Filter out the current student
                setLinkedSiblings(results.filter((s: any) => s.id !== id));
            } catch (error) {
                console.error("Failed to fetch sibling group", error);
            }
        };

        fetchSiblings();
    }, [formData.parentId, id]);

    useEffect(() => {
        const fetchMetadataAndStudent = async () => {
            try {
                const [classesRes, sectionsRes, categoriesRes, housesRes, profilesRes, feeGroupsRes] = await Promise.all([
                    api.getClasses().catch(e => { console.error("Classes error", e); return []; }),
                    api.getSections().catch(e => { console.error("Sections error", e); return []; }),
                    api.getStudentCategories().catch(e => { console.error("Categories error", e); return []; }),
                    api.getStudentHouses().catch(e => { console.error("Houses error", e); return []; }),
                    api.getDiscountProfiles().catch(e => { console.error("Discounts error", e); return []; }),
                    api.getFeeGroups().catch(e => { console.error("Fee Groups error", e); return []; })
                ]);

                setClasses(classesRes || []);
                setSections(sectionsRes || []);
                setCategories(categoriesRes || []);
                setHouses(housesRes || []);
                setDiscountProfiles(profilesRes || []);
                setAllFeeGroups(feeGroupsRes || []);

                // If Edit Mode, Fetch Student Data
                if (isEditMode && id) {
                    try {
                        const student = await api.getStudentById(id);
                        // Map API response to Form Data
                        setFormData({
                            // Personal
                            admissionNo: student.admissionNo || '',
                            rollNo: student.rollNo || '',
                            firstName: student.firstName || '',
                            lastName: student.lastName || '',
                            gender: student.gender || 'Male',
                            dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
                            religion: student.religion || '',
                            caste: student.caste || '',
                            mobileNumber: student.mobileNumber || '',
                            email: student.email || '',
                            admissionDate: student.admissionDate ? new Date(student.admissionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                            studentPhoto: null,
                            studentPhotoPreview: student.studentPhoto ? getFileUrl(student.studentPhoto) : '',
                            // Parent
                            fatherName: student.fatherName || '',
                            fatherPhone: student.fatherPhone || '',
                            fatherOccupation: student.fatherOccupation || '',
                            motherName: student.motherName || '',
                            motherPhone: student.motherPhone || '',
                            motherOccupation: student.motherOccupation || '',
                            guardianName: student.guardianName || '',
                            guardianRelation: student.guardianRelation || '',
                            guardianPhone: student.guardianPhone || '',
                            guardianEmail: student.guardianEmail || '',
                            guardianAddress: student.guardianAddress || '',
                            emergencyContact: student.emergencyContact || '',
                            // Address
                            currentAddress: student.currentAddress || '',
                            permanentAddress: student.permanentAddress || '',
                            // Academic
                            classId: student.class?.id || student.classId || '',
                            sectionId: student.section?.id || student.sectionId || '',
                            categoryId: student.category?.id || student.categoryId || '',
                            houseId: student.house?.id || student.houseId || '',
                            discountProfileId: student.discountProfileId || '',
                            // Transport
                            transportRoute: student.transportRoute || '',
                            vehicleNumber: student.vehicleNumber || '',
                            pickupPoint: student.pickupPoint || '',
                            // Hostel
                            hostelName: student.hostelName || '',
                            roomNumber: student.roomNumber || '',
                            // System
                            siblingId: '',
                            parentId: student.parent?.id || student.parentId || '',
                            siblingName: '', // Hard to know which one was the "link" sibling without more metadata, but parentId is enough
                            bloodGroup: student.bloodGroup || '',
                            height: student.height || '',
                            weight: student.weight || '',
                            asOnDate: student.asOnDate ? new Date(student.asOnDate).toISOString().split('T')[0] : '',
                            previousSchool: student.previousSchool || '',
                            note: student.note || '',
                            feeGroupIds: student.feeGroupIds || [],
                            feeExclusions: student.feeExclusions || {},
                        });

                        if (student.documents) {
                            setDocuments(student.documents.map((doc: any) => ({
                                id: doc.id,
                                title: doc.title,
                                filePath: doc.filePath,
                                fileType: doc.fileType,
                                isNew: false
                            })));
                        }
                    } catch (error) {
                        console.error("Failed to fetch student details", error);
                        toast.showError("Failed to load student details");
                    }
                }
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchMetadataAndStudent();
    }, [id, isEditMode]);


    if (initialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="text-gray-500 font-medium animate-pulse">Loading student details...</p>
            </div>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: value };

            // If class changes, reset section
            if (name === 'classId' && value !== prev.classId) {
                next.sectionId = '';
            }

            return next;
        });
    };

    const handleToggleFeeGroup = (groupId: string) => {
        setFormData(prev => {
            const current = prev.feeGroupIds || [];
            const next = current.includes(groupId)
                ? current.filter(id => id !== groupId)
                : [...current, groupId];

            // If removing a group, also clear its exclusions
            const newExclusions = { ...prev.feeExclusions };
            if (current.includes(groupId)) {
                delete newExclusions[groupId];
            }

            return { ...prev, feeGroupIds: next, feeExclusions: newExclusions };
        });
    };

    const handleToggleFeeHead = (groupId: string, headId: string) => {
        setFormData(prev => {
            const currentExclusions = prev.feeExclusions?.[groupId] || [];
            const nextExclusions = currentExclusions.includes(headId)
                ? currentExclusions.filter(id => id !== headId)
                : [...currentExclusions, headId];

            return {
                ...prev,
                feeExclusions: {
                    ...prev.feeExclusions,
                    [groupId]: nextExclusions
                }
            };
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const maxSizeMb = settings?.maxFileUploadSizeMb || 2;
            if (file.size > maxSizeMb * 1024 * 1024) {
                toast.showWarning(`File size exceeds ${maxSizeMb}MB limit. Please choose a smaller file.`);
                e.target.value = '';
                return;
            }
            setFormData(prev => ({
                ...prev,
                studentPhoto: file,
                studentPhotoPreview: URL.createObjectURL(file)
            }));
        }
    };

    const handleSubmit = async () => {
        if (!formData.admissionNo || !formData.firstName || !formData.dob || !formData.classId) {
            toast.showWarning('Please fill in all required fields (Admission No, First Name, DOB, Class)');
            return;
        }

        setLoading(true);
        try {
            // Create FormData object for upload if photo exists, otherwise simple JSON
            // Ideally backend supports JSON if no file, but let's stick to JSON mostly unless file is handled.
            // Based on api.ts, createStudent handles FormData check.

            // NOTE: If backend expects JSON for everything except file, we might need a different approach,
            // but let's assume it accepts standard fields.
            // If studentPhoto is present, we MUST use FormData.

            const { studentPhotoPreview, siblingName, ...submissionData } = formData;

            // Enforce Admission Prefix
            const prefix = settings?.admissionNumberPrefix || '';
            let finalAdmissionNo = submissionData.admissionNo;
            if (prefix && !finalAdmissionNo.startsWith(prefix)) {
                finalAdmissionNo = prefix + finalAdmissionNo;
                submissionData.admissionNo = finalAdmissionNo;
            }

            // We'll use FormData if there are ANY files (photo or documents)
            const hasDocuments = documents.some(d => d.isNew && d.file);
            const hasNewPhoto = formData.studentPhoto instanceof File;
            const useFormData = hasNewPhoto || hasDocuments;

            let payload: any;
            if (useFormData) {
                payload = new FormData();
                Object.keys(submissionData).forEach(key => {
                    const value = (submissionData as any)[key];
                    if (value !== null && value !== '' && value !== undefined) {
                        payload.append(key, value);
                    }
                });

                // Add documents
                const newDocs = documents.filter(d => d.isNew && d.file);
                if (newDocs.length > 0) {
                    newDocs.forEach(doc => {
                        payload.append('documentFiles', doc.file);
                    });
                    payload.append('documentTitles', JSON.stringify(newDocs.map(d => d.title)));
                }

            } else {
                // For JSON payload
                payload = Object.fromEntries(
                    Object.entries(submissionData).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
                );

            }

            console.log('=== FRONTEND UPDATE DEBUG ===');
            console.log('Is Edit Mode:', isEditMode);
            console.log('Student ID:', id);
            console.log('Use FormData:', useFormData);
            console.log('Payload type:', payload instanceof FormData ? 'FormData' : 'JSON');
            if (!(payload instanceof FormData)) {
                console.log('JSON Payload:', payload);
            }

            if (isEditMode && id) {
                await api.updateStudent(id, payload);
                toast.showSuccess('Student updated successfully!');
                // Wait a bit for toast to be seen before redirect
                setTimeout(() => {
                    window.location.href = '/students/directory';
                }, 1000);
            } else {
                await api.createStudent(payload);
                toast.showSuccess('Student admitted successfully!');
                setTimeout(() => {
                    navigate('/students/directory');
                }, 1000);
            }
        } catch (error: any) {
            console.error("=== ADMISSION ERROR ===");
            console.error("Full error:", error);
            console.error("Error response:", error.response);
            console.error("Error message:", error.message);
            toast.showError(`Admission failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditMode ? 'Edit Student' : 'Student Admission'}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{isEditMode ? 'Update student details' : 'Admit a new student'}</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn btn-primary bg-primary-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20 disabled:opacity-50"
                >
                    <Save className="w-4 h-4" /> {loading ? 'Saving...' : (isEditMode ? 'Update Student' : 'Save Student')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Navigation for Form */}
                <div className="lg:col-span-1 space-y-2">
                    {['Personal Details', 'Parent / Guardian', 'Address Details', 'Academic Details', 'Transport Details', 'Hostel Details', 'Documents'].map((tab) => {
                        const id = tab.toLowerCase().split(' ')[0];
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={clsx(
                                    "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    activeTab === id
                                        ? "bg-white dark:bg-gray-900 text-primary-600 shadow-md border-l-4 border-primary-600"
                                        : "text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-gray-700"
                                )}
                            >
                                {tab}
                            </button>
                        )
                    })}
                    <button
                        onClick={() => setActiveTab('fee_allocation')}
                        className={clsx(
                            "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                            activeTab === 'fee_allocation'
                                ? "bg-white dark:bg-gray-900 text-primary-600 shadow-md border-l-4 border-primary-600"
                                : "text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-gray-700"
                        )}
                    >
                        Fee Allocation
                    </button>
                </div>

                {/* Form Content */}
                < div className="lg:col-span-3" >
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800/50 p-6">
                        {/* Personal Details */}
                        {activeTab === 'personal' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-gray-200 dark:border-gray-800/50 pb-3 mb-2">Personal Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Admission No *</label>
                                        <div className="flex">
                                            {settings?.admissionNumberPrefix && (
                                                <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-800/50 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-bold select-none whitespace-nowrap">
                                                    {settings.admissionNumberPrefix}
                                                </span>
                                            )}
                                            <input
                                                name="admissionNo"
                                                value={settings?.admissionNumberPrefix ? formData.admissionNo.replace(settings.admissionNumberPrefix, '') : formData.admissionNo}
                                                onChange={(e) => {
                                                    const prefix = settings?.admissionNumberPrefix || '';
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        admissionNo: prefix + e.target.value
                                                    }));
                                                }}
                                                type="text"
                                                placeholder="e.g. 001"
                                                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${settings?.admissionNumberPrefix ? 'rounded-r-lg' : 'rounded-lg'}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Roll No</label>
                                        <input name="rollNo" value={formData.rollNo} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name *</label>
                                        <input name="firstName" value={formData.firstName} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Middle Name</label>
                                        <input name="middleName" value={formData.middleName} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                                        <input name="lastName" value={formData.lastName} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender *</label>
                                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800">
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth *</label>
                                        <input name="dob" value={formData.dob} onChange={handleChange} type="date" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Religion</label>
                                        <input name="religion" value={formData.religion} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Caste</label>
                                        <input name="caste" value={formData.caste} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
                                        <input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                        <input name="email" value={formData.email} onChange={handleChange} type="email" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Admission Date *</label>
                                        <input name="admissionDate" value={formData.admissionDate} onChange={handleChange} type="date" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nationality</label>
                                        <input name="nationality" value={formData.nationality} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">State of Origin</label>
                                        <input name="stateOfOrigin" value={formData.stateOfOrigin} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Genotype</label>
                                        <select name="genotype" value={formData.genotype} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800">
                                            <option value="">Select</option>
                                            {['AA', 'AS', 'SS', 'AC'].map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Blood Group</label>
                                        <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800">
                                            <option value="">Select</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Height (cm)</label>
                                        <input name="height" value={formData.height} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Weight (kg)</label>
                                        <input name="weight" value={formData.weight} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Measurement Date</label>
                                        <input name="asOnDate" value={formData.asOnDate} onChange={handleChange} type="date" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="col-span-full">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Medical Conditions / Allergies</label>
                                        <textarea name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" rows={2} placeholder="List any medical issues or N/A" />
                                    </div>
                                    <div className="col-span-full">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
                                        <textarea name="note" value={formData.note} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" rows={2} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Student Photo</label>
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-800/50 border-dashed rounded-lg hover:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-900/50">
                                            <div className="space-y-1 text-center">
                                                {formData.studentPhotoPreview ? (
                                                    <div className="relative inline-block">
                                                        <img
                                                            src={formData.studentPhotoPreview}
                                                            alt="Preview"
                                                            className="mx-auto h-32 w-32 object-cover rounded-full border-4 border-white dark:border-gray-700 shadow-md"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setFormData(prev => ({ ...prev, studentPhoto: null, studentPhotoPreview: '' }));
                                                            }}
                                                            className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm"
                                                            title="Remove photo"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                                            <label
                                                                htmlFor="student-photo-upload"
                                                                className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                                                            >
                                                                <span>Upload a file</span>
                                                                <input id="student-photo-upload" name="studentPhoto" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                                            </label>
                                                            <p className="pl-1">or drag and drop</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF up to 2MB</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Parent Details */}
                        {activeTab === 'parent' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Parent / Guardian Details</h3>
                                        <p className="text-sm text-gray-500">Manage family and guardian information</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {formData.parentId && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                                    Linked {formData.siblingName ? `with ${formData.siblingName}` : 'family'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveSibling}
                                                    className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Remove Link"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => !formData.parentId && setShowSiblingSearch(true)}
                                            disabled={!!formData.parentId}
                                            className={clsx(
                                                "text-sm px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2",
                                                formData.parentId
                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                                    : "bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-100"
                                            )}
                                        >
                                            <Users className="w-4 h-4" />
                                            {formData.parentId ? 'Already Linked' : 'Add Sibling'}
                                        </button>
                                    </div>
                                </div>

                                {/* Linked Siblings List */}
                                {linkedSiblings.length > 0 && (
                                    <div className="p-4 bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100/50 dark:border-primary-800/50 rounded-2xl">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-3 flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5" />
                                            Other Linked Siblings ({linkedSiblings.length})
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {linkedSiblings.map(sib => (
                                                <div key={sib.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-primary-100 dark:border-gray-700 rounded-xl shadow-sm">
                                                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-[10px] font-bold text-primary-600">
                                                        {sib.firstName[0]}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                        {sib.firstName} {sib.lastName}
                                                    </span>
                                                    {sib.class && (
                                                        <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-800">
                                                            {sib.class.name}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Sibling Search Modal */}
                                {showSiblingSearch && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                                            {/* Modal Header */}
                                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                                                <div>
                                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">Search Sibling</h4>
                                                    <p className="text-sm text-gray-500">Find an existing student to link parent details</p>
                                                </div>
                                                <button onClick={() => setShowSiblingSearch(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                                    <X className="w-5 h-5 text-gray-400" />
                                                </button>
                                            </div>

                                            {/* Search & Filters */}
                                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div className="md:col-span-2 relative">
                                                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search by Name, ID, or Parent Name..."
                                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div>
                                                        <select
                                                            value={searchClassId}
                                                            onChange={(e) => setSearchClassId(e.target.value)}
                                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 transition-all outline-none text-sm"
                                                        >
                                                            <option value="">All Classes</option>
                                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <select
                                                            value={searchSectionId}
                                                            onChange={(e) => setSearchSectionId(e.target.value)}
                                                            disabled={!searchClassId}
                                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 transition-all outline-none text-sm disabled:opacity-50"
                                                        >
                                                            <option value="">All Sections</option>
                                                            {sections.filter(s => s.classId === searchClassId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Results Area */}
                                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 dark:bg-gray-900/30">
                                                {searchingSibling ? (
                                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                                                        <p className="text-gray-500 font-medium">Searching students...</p>
                                                    </div>
                                                ) : siblingResults.length > 0 ? (
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {siblingResults
                                                            .filter(s => s.id !== id) // Prevent self-linking
                                                            .map(sibling => {
                                                                const isAlreadyLinked = Boolean(formData.parentId && (sibling.parent?.id === formData.parentId || sibling.parentId === formData.parentId));

                                                                return (
                                                                    <button
                                                                        key={sibling.id}
                                                                        onClick={() => !isAlreadyLinked && handleSelectSibling(sibling)}
                                                                        disabled={isAlreadyLinked}
                                                                        className={clsx(
                                                                            "group w-full text-left p-4 border rounded-xl transition-all flex items-center gap-4",
                                                                            isAlreadyLinked
                                                                                ? "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 cursor-not-allowed opacity-75"
                                                                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md"
                                                                        )}
                                                                    >
                                                                        <div className={clsx(
                                                                            "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm transition-transform",
                                                                            isAlreadyLinked ? "bg-gray-200 dark:bg-gray-800 text-gray-400" : "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 group-hover:scale-110"
                                                                        )}>
                                                                            {sibling.firstName[0]}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center justify-between mb-0.5">
                                                                                <p className={clsx("font-bold truncate", isAlreadyLinked ? "text-gray-500" : "text-gray-900 dark:text-white")}>
                                                                                    {sibling.firstName} {sibling.lastName}
                                                                                </p>
                                                                                <div className="flex items-center gap-2">
                                                                                    {isAlreadyLinked && (
                                                                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-800/50">
                                                                                            Already Linked
                                                                                        </span>
                                                                                    )}
                                                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800">
                                                                                        {sibling.class?.name} - {sibling.section?.name}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                                                <span className="flex items-center gap-1"><span className="font-semibold text-gray-700 dark:text-gray-300">ID:</span> {sibling.admissionNo}</span>
                                                                                <span className="flex items-center gap-1"><span className="font-semibold text-gray-700 dark:text-gray-300">Father:</span> {sibling.fatherName || 'N/A'}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className={clsx(
                                                                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                                                            isAlreadyLinked ? "bg-gray-100 dark:bg-gray-800 text-gray-300" : "bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-primary-600 group-hover:text-white"
                                                                        )}>
                                                                            <Users className="w-4 h-4" />
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                ) : (searchQuery || searchClassId) ? (
                                                    <div className="text-center py-12">
                                                        <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <Search className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white">No students found</h5>
                                                        <p className="text-gray-500">Try adjusting your search terms or filters</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12">
                                                        <div className="bg-primary-50 dark:bg-primary-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <Users className="w-8 h-8 text-primary-500" />
                                                        </div>
                                                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Search Existing Students</h5>
                                                        <p className="text-gray-500 max-w-xs mx-auto">Start typing a name or select a class to find a sibling and auto-fill parent details.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Father Name</label>
                                        <input name="fatherName" value={formData.fatherName} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Father Phone</label>
                                        <input name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Father Occupation</label>
                                        <input name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mother Name</label>
                                        <input name="motherName" value={formData.motherName} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mother Phone</label>
                                        <input name="motherPhone" value={formData.motherPhone} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mother Occupation</label>
                                        <input name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="col-span-full border-t border-gray-100 dark:border-gray-700 pt-4">
                                        <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4">If Guardian is different</h4>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Guardian Name</label>
                                        <input name="guardianName" value={formData.guardianName} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Guardian Relation</label>
                                        <input name="guardianRelation" value={formData.guardianRelation} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Guardian Phone</label>
                                        <input name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="col-span-full space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Guardian Address</label>
                                        <textarea name="guardianAddress" value={formData.guardianAddress} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" rows={2} />
                                    </div>
                                    <div className="col-span-full space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Emergency Contact</label>
                                        <input name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} type="text" placeholder="Name & Phone Number" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Address Details */}
                        {activeTab === 'address' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-gray-200 dark:border-gray-800/50 pb-3 mb-2">Address Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Address</label>
                                        <textarea name="currentAddress" value={formData.currentAddress} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" rows={4} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Permanent Address</label>
                                        <textarea name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" rows={4} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Academic Details */}
                        {activeTab === 'academic' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-gray-200 dark:border-gray-800/50 pb-3 mb-2">Academic Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Class *</label>
                                        <select name="classId" value={formData.classId} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800">
                                            <option value="">Select Class</option>
                                            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Section</label>
                                        <select 
                                            name="sectionId" 
                                            value={formData.sectionId} 
                                            onChange={handleChange} 
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800"
                                        >
                                            {(() => {
                                                const filteredSections = sections.filter((s: any) => s.classId === formData.classId);
                                                if (formData.classId && filteredSections.length === 0) {
                                                    return <option value="">General / No Sections</option>;
                                                }
                                                return (
                                                    <>
                                                        <option value="">Select Section</option>
                                                        {filteredSections.map((s: any) => (
                                                            <option key={s.id} value={s.id}>{s.name}</option>
                                                        ))}
                                                    </>
                                                );
                                            })()}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                                        <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800">
                                            <option value="">Select Category</option>
                                            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.category}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">House</label>
                                        <select name="houseId" value={formData.houseId} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800">
                                            <option value="">Select House</option>
                                            {houses.map((h: any) => <option key={h.id} value={h.id}>{h.houseName}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 col-span-full">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Discount Policy</label>
                                        <select
                                            name="discountProfileId"
                                            value={formData.discountProfileId}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800 font-bold text-primary-600 dark:text-primary-400"
                                        >
                                            <option value="">None (Standard Fees)</option>
                                            {discountProfiles.map((p: any) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">Applied automated reductions will show in student ledger.</p>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Previous School Name</label>
                                        <input name="previousSchoolName" value={formData.previousSchoolName} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Class Passed</label>
                                        <input name="lastClassPassed" value={formData.lastClassPassed} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Transport Details */}
                        {activeTab === 'transport' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-gray-200 dark:border-gray-800/50 pb-3 mb-2">Transport Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Route List</label>
                                        <input name="transportRoute" value={formData.transportRoute} onChange={handleChange} type="text" placeholder="Route Name" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle Number</label>
                                        <input name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pickup Point</label>
                                        <input name="pickupPoint" value={formData.pickupPoint} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Hostel Details */}
                        {activeTab === 'hostel' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-gray-200 dark:border-gray-800/50 pb-3 mb-2">Hostel Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Hostel Name</label>
                                        <input name="hostelName" value={formData.hostelName} onChange={handleChange} type="text" placeholder="Hostel Name" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Room Number</label>
                                        <input name="roomNumber" value={formData.roomNumber} onChange={handleChange} type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800" />
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Documents */}
                        {activeTab === 'documents' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Student Documents</h3>
                                    <button
                                        type="button"
                                        onClick={addDocument}
                                        className="btn btn-secondary text-sm bg-primary-50 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add Document
                                    </button>
                                </div>

                                {documents.length === 0 ? (
                                    <div className="p-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center text-gray-500 bg-gray-50/50 dark:bg-gray-800/30">
                                        <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-sm flex items-center justify-center mb-4">
                                            <FileText className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="font-medium text-gray-900 dark:text-white">No documents added yet</p>
                                        <p className="text-sm mt-1">Upload birth certificates, transfer certificates, or other IDs.</p>
                                        <button
                                            type="button"
                                            onClick={addDocument}
                                            className="mt-6 text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" /> Click here to add your first document
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {documents.map((doc, index) => (
                                            <div key={index} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0">
                                                    <FileText className="w-5 h-5" />
                                                </div>

                                                <div className="flex-1 w-full space-y-1">
                                                    <input
                                                        type="text"
                                                        placeholder="Document Title (e.g. Birth Certificate)"
                                                        value={doc.title}
                                                        onChange={(e) => handleDocumentChange(index, 'title', e.target.value)}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 font-semibold text-gray-900 dark:text-white placeholder-gray-400"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        {doc.isNew ? (
                                                            <div className="flex items-center gap-2 w-full">
                                                                <label className="cursor-pointer text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-2 py-1 rounded border border-primary-100 dark:border-primary-800 hover:bg-primary-100 transition-colors">
                                                                    {doc.file ? 'Change file' : 'Select file'}
                                                                     <input
                                                                        type="file"
                                                                        className="hidden"
                                                                        onChange={(e) => {
                                                                            if (e.target.files && e.target.files[0]) {
                                                                                const file = e.target.files[0];
                                                                                const maxSizeMb = settings?.maxFileUploadSizeMb || 2;
                                                                                if (file.size > maxSizeMb * 1024 * 1024) {
                                                                                    toast.showWarning(`File size exceeds ${maxSizeMb}MB limit. Please choose a smaller file.`);
                                                                                    e.target.value = '';
                                                                                    return;
                                                                                }
                                                                                handleDocumentChange(index, 'file', file);
                                                                            }
                                                                        }}
                                                                    />
                                                                </label>
                                                                {doc.file && <span className="text-xs text-gray-500 truncate max-w-[200px]">{doc.file.name}</span>}
                                                                {!doc.file && <span className="text-xs text-red-400 italic">No file selected</span>}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800">
                                                                    Uploaded
                                                                </span>
                                                                <a
                                                                    href={getFileUrl(doc.filePath)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-primary-500 hover:underline flex items-center gap-1"
                                                                >
                                                                    View Document
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeDocument(index)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Fee Allocation */}
                        {activeTab === 'fee_allocation' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-gray-200 dark:border-gray-800/50 pb-3 mb-2">Fee Allocation</h3>
                                <div className="p-4 bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100/50 dark:border-primary-800/50 rounded-2xl mb-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-primary-700 dark:text-primary-400">Select Fee Groups</p>
                                            <p className="text-xs text-primary-600/70 dark:text-primary-500/70">Assigned groups will automatically generate dues for this student.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {allFeeGroups.length > 0 ? (
                                        allFeeGroups.map(group => {
                                            const isGroupSelected = (formData.feeGroupIds || []).includes(group.id);
                                            const groupExclusions = formData.feeExclusions?.[group.id] || [];

                                            return (
                                                <div
                                                    key={group.id}
                                                    className={clsx(
                                                        "flex flex-col border rounded-2xl transition-all overflow-hidden",
                                                        isGroupSelected
                                                            ? "bg-primary-50/30 dark:bg-primary-900/10 border-primary-500 shadow-sm"
                                                            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                                    )}
                                                >
                                                    <label className={clsx(
                                                        "flex items-start gap-4 p-4 cursor-pointer transition-colors",
                                                        isGroupSelected ? "bg-primary-50/50 dark:bg-primary-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                                                    )}>
                                                        <div className="mt-1">
                                                            <input
                                                                type="checkbox"
                                                                className="w-5 h-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500"
                                                                checked={isGroupSelected}
                                                                onChange={() => handleToggleFeeGroup(group.id)}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-bold text-gray-900 dark:text-white">{group.name}</span>
                                                                <span className="text-xs font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500 border border-gray-200 dark:border-gray-700">{group.session || '2024'}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{group.description || 'No description'}</p>
                                                        </div>
                                                    </label>

                                                    {isGroupSelected && group.heads && group.heads.length > 0 && (
                                                        <div className="px-4 pb-4 space-y-2 border-t border-primary-100 dark:border-primary-800/50 pt-3 bg-primary-50/20 dark:bg-primary-900/5">
                                                            <p className="text-[10px] font-bold text-primary-600/60 dark:text-primary-400/60 uppercase tracking-widest mb-2">Assign Individual Heads</p>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {group.heads.map((head: any) => {
                                                                    const isExcluded = groupExclusions.includes(head.id);
                                                                    const isMandatory = !head.isOptional;

                                                                    return (
                                                                        <label
                                                                            key={head.id}
                                                                            className={clsx(
                                                                                "flex items-center justify-between p-2 rounded-lg border transition-all",
                                                                                isExcluded
                                                                                    ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60"
                                                                                    : "bg-white dark:bg-gray-800 border-primary-200 dark:border-primary-800 shadow-sm"
                                                                            )}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                                                                                    checked={!isExcluded}
                                                                                    disabled={isMandatory}
                                                                                    onChange={() => handleToggleFeeHead(group.id, head.id)}
                                                                                />
                                                                                <div className="flex flex-col">
                                                                                    <span className={clsx("text-xs font-medium", isExcluded ? "text-gray-500 line-through" : "text-gray-700 dark:text-gray-200")}>
                                                                                        {head.name}
                                                                                    </span>
                                                                                    {isMandatory && (
                                                                                        <span className="text-[8px] text-primary-500 font-bold uppercase tracking-tighter">Mandatory</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                                                                {head.defaultAmount}
                                                                            </span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                            <p className="text-gray-500 text-sm">No fee groups found. Please create them in Fee Structure first.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
