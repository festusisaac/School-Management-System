const fs = require('fs');
const file = 'C:/Users/USER/Desktop/SMS/School-Management-System/frontend/src/pages/students/StudentProfile.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = \`    return (
        <>
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">\`;

const targetStrIfNoFragment = \`    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">\`;

let startIdx = content.indexOf(targetStr);
if (startIdx === -1) {
    startIdx = content.indexOf(targetStrIfNoFragment);
}

const endIdx = content.indexOf('            {/* Simple Print Template */}');

if (startIdx > -1 && endIdx > -1) {
    const replacement = \`    return (
        <>
        <div className="w-full px-4 md:px-10 pb-16 space-y-6 bg-[#F9FAFB] dark:bg-gray-950 min-h-screen font-sans">
            {/* Professional Sticky Navigation Header */}
            <div className="sticky top-4 z-50 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 p-2 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 backdrop-blur-xl no-print transition-all">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 group"
                    >
                        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    </button>
                    <div className="h-10 w-px bg-gray-100 dark:bg-gray-800 mx-1" />
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={\`flex items-center gap-2 px-4 py-2.5 text-xs font-black transition-all rounded-xl whitespace-nowrap \${activeTab === tab.id
                                    ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10'
                                    : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                    }\`}
                            >
                                <tab.icon className={\`w-3.5 h-3.5 \${activeTab === tab.id ? 'text-orange-600' : 'text-gray-400'}\`} />
                                <span className="uppercase tracking-wider">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 outline-none no-print">
                {/* Left Column: Identity Sidebar (Fixed Width) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Primary Avatar & ID Card */}
                    <InfoCard className="p-8 flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="w-40 h-40 rounded-[2.5rem] bg-gray-50 dark:bg-gray-800 overflow-hidden ring-4 ring-gray-100 dark:ring-gray-800 shadow-xl">
                                {student.studentPhoto ? (
                                    <img src={getFileUrl(student.studentPhoto)} alt={student.firstName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-5xl font-black text-gray-200 dark:text-gray-700">
                                        {student.firstName[0]}{student.lastName?.[0]}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-900 p-2.5 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
                                <QrCodeIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-gray-900 dark:text-white font-heading mb-2">{student.firstName} {student.lastName}</h2>

                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            <span className="px-3 py-1 bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                {student.class?.name || 'Academic'}
                            </span>
                            <span className="px-3 py-1 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                {student.gender}
                            </span>
                        </div>

                        <div className="w-full space-y-4 pt-6 border-t border-gray-50 dark:border-gray-800">
                            {[
                                { label: 'Admission No', value: student.admissionNo, icon: ShieldCheck },
                                { label: 'Roll Number', value: student.rollNo, icon: GraduationCap },
                                { label: 'Category', value: student.category?.category, icon: BookOpen }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
                                        <item.icon className="w-4 h-4" />
                                        <span className="font-bold uppercase text-[10px] tracking-widest">{item.label}</span>
                                    </div>
                                    <span className="font-black text-gray-900 dark:text-gray-100">{item.value || '-'}</span>
                                </div>
                            ))}
                        </div>

                        <div className="w-full pt-8 grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate(\`/students/admission?id=\${student.id}&edit=true\`)}
                                className="flex items-center justify-center gap-2 py-3.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl text-[10px] font-black transition-all border border-gray-100 dark:border-gray-700 group"
                            >
                                <Edit className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                                <span className="uppercase tracking-widest">Edit</span>
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center gap-2 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-[10px] font-black transition-all shadow-lg hover:scale-[1.02] active:scale-95 group"
                            >
                                <Printer className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                                <span className="uppercase tracking-widest">Print</span>
                            </button>
                        </div>
                    </InfoCard>

                    {/* Siblings: Structured Header & List */}
                    <InfoCard>
                        <SectionHeader title="Sibling Connection" icon={Users} />
                        <div className="p-4 space-y-3">
                            {((student.parent?.students || []).filter((s) => s.id !== student.id)).length > 0 ? (
                                student.parent.students.filter((s) => s.id !== student.id).map((sibling) => (
                                    <div
                                        key={sibling.id}
                                        onClick={() => {
                                            navigate(\`/students/profile/\${sibling.id}\`);
                                            showSuccess(\`Switched to \${sibling.firstName}'s Profile\`);
                                        }}
                                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-800 group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 overflow-hidden ring-1 ring-gray-100 dark:ring-gray-700">
                                            {sibling.studentPhoto ? (
                                                <img src={getFileUrl(sibling.studentPhoto)} alt={sibling.firstName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-black text-gray-400 uppercase">
                                                    {sibling.firstName[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-primary-500 transition-colors uppercase font-heading">{sibling.firstName} {sibling.lastName}</p>
                                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{sibling.class?.name || 'Class N/A'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest italic">No Siblings Registered</p>
                                </div>
                            )}
                        </div>
                    </InfoCard>

                    {/* Barcode Identity */}
                    <InfoCard className="p-6 flex flex-col items-center gap-3">
                        <BarcodeIcon className="w-full h-12 text-gray-800 dark:text-gray-300 opacity-60" />
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Access Identity {student.admissionNo}</p>
                    </InfoCard>
                </div>

                {/* Right Column: Main Data Sections (Dense & Structured) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {activeTab === 'Profile' ? (
                        <>
                            {/* General Information */}
                            <InfoCard>
                                <SectionHeader title="Core Student Profile" icon={User} />
                                <div className="divide-y divide-gray-50 dark:divide-gray-800/10">
                                    <div className="grid grid-cols-1 md:grid-cols-2">
                                        {[
                                            { label: 'Full Legal Name', value: \`\${student.firstName} \${student.lastName}\` },
                                            { label: 'Date Of Admission', value: new Date(student.admissionDate).toLocaleDateString(undefined, { dateStyle: 'long' }) },
                                            { label: 'Date Of Birth', value: new Date(student.dob).toLocaleDateString(undefined, { dateStyle: 'long' }) },
                                            { label: 'Mobile Number', value: student.mobileNumber },
                                            { label: 'Personal Email', value: student.email },
                                            { label: 'Blood Group', value: student.bloodGroup },
                                            { label: 'Religion / Caste', value: \`\${student.religion || '-'} / \${student.caste || '-'}\` },
                                            { label: 'Student House', value: student.house?.houseName },
                                            { label: 'Medical Records', value: student.medicalHistory || 'No medical history reported' },
                                            { label: 'Administrative Note', value: student.note }
                                        ].map((item, i) => (
                                            <div key={i} className="flex flex-col py-4 px-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{item.label}</span>
                                                <span className="text-sm font-black text-gray-900 dark:text-gray-100">{item.value || '-'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </InfoCard>

                            {/* Parent & Guardian Info */}
                            <InfoCard>
                                <SectionHeader title="Family & Guardianship" icon={Users} />
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-[0.2em] mb-4">Paternal Details</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Father's Name</p>
                                                <p className="text-sm font-black text-gray-900 dark:text-gray-100">{student.fatherName || '-'}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Phone</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">{student.fatherPhone || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Occupation</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">{student.fatherOccupation || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-primary-600 dark:text-primary-500 uppercase tracking-[0.2em] mb-4">Maternal Details</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Mother's Name</p>
                                                <p className="text-sm font-black text-gray-900 dark:text-gray-100">{student.motherName || '-'}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Phone</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">{student.motherPhone || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Occupation</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">{student.motherOccupation || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 bg-gray-50/30 dark:bg-gray-800/20 border-t border-gray-50 dark:border-gray-800">
                                    <h4 className="text-[10px] font-black text-secondary-600 dark:text-secondary-400 uppercase tracking-[0.2em] mb-6">Secondary Guardian Info</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {[
                                            { label: 'Guardian', value: student.guardianName },
                                            { label: 'Relation', value: student.guardianRelation },
                                            { label: 'Contact', value: student.guardianPhone }
                                        ].map((item, i) => (
                                            <div key={i}>
                                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">{item.label}</p>
                                                <p className="text-sm font-black text-gray-900 dark:text-gray-100">{item.value || '-'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </InfoCard>

                            {/* Address & Logistics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InfoCard>
                                    <SectionHeader title="Residential Info" icon={MapPin} />
                                    <div className="p-6 space-y-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Current Address</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-gray-200 leading-relaxed">{student.currentAddress || 'N/A'}</p>
                                        </div>
                                        <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Permanent Address</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-gray-200 leading-relaxed">{student.permanentAddress || student.currentAddress || 'N/A'}</p>
                                        </div>
                                    </div>
                                </InfoCard>
                                <InfoCard>
                                    <SectionHeader title="School Logistics" icon={Building2} />
                                    <div className="p-6 space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            {[
                                                { label: 'Route', value: student.transportRoute },
                                                { label: 'Pickup', value: student.pickupPoint },
                                                { label: 'Vehicle', value: student.vehicleNumber },
                                                { label: 'Hostel', value: student.hostelName }
                                            ].map((item, i) => (
                                                <div key={i}>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">{item.label}</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">{item.value || 'N/A'}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Room Assignment</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-gray-100">
                                                {student.roomNumber ? \`Room \${student.roomNumber} (\${student.roomType || 'Standard'})\` : 'No Hostel Room Assigned'}
                                            </p>
                                        </div>
                                    </div>
                                </InfoCard>
                            </div>
                        </>
                    ) : activeTab === 'Fees' ? (
                        <FeesTab student={student} />
                    ) : activeTab === 'Exam' || activeTab === 'CBSE Examination' ? (
                        <ExamTab student={student} title={activeTab} />
                    ) : activeTab === 'Attendance' ? (
                        <AttendanceTab student={student} />
                    ) : activeTab === 'Documents' ? (
                        <DocumentsTab student={student} />
                    ) : (
                        <InfoCard className="flex flex-col items-center justify-center py-40 min-h-[600px]">
                            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center border border-gray-100 dark:border-gray-800 mb-6">
                                <ClipboardList className="w-10 h-10 text-orange-200/50 dark:text-orange-500/10" />
                            </div>
                            <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-widest">{activeTab} Record</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold max-w-xs text-center leading-relaxed">System is currently synchronizing historical data for this module. Please check back shortly.</p>
                        </InfoCard>
                    )}
                </div>
            </div>
\n`;
    content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
    
    fs.writeFileSync(file, content);
    console.log('Replacement successful!');
} else {
    console.log('Could not find boundaries.');
    console.log('Start index:', startIdx);
    console.log('End index:', endIdx);
}
