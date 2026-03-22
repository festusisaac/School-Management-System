const fs = require('fs');
const file = 'C:/Users/USER/Desktop/SMS/School-Management-System/frontend/src/pages/students/StudentProfile.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = \`    return (
        <div className="w-full px-4 md:px-10 pb-16 space-y-6 bg-[#F9FAFB] dark:bg-gray-950 min-h-screen font-sans">\`;

const startIdx = content.indexOf(targetStr);
const endIdx = content.indexOf('            {/* Simple Print Template */}');

if (startIdx > -1 && endIdx > -1) {
    const replacement = \`    return (
        <>
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Minimal Header Area */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 no-print">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors text-gray-500 dark:text-gray-400 group shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    </button>
                    
                    <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                        {student.studentPhoto ? (
                            <img src={getFileUrl(student.studentPhoto)} alt={student.firstName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xl font-bold text-gray-400">{student.firstName[0]}</span>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {student.firstName} {student.lastName}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 rounded text-xs font-medium border border-primary-100 dark:border-primary-900/30">
                                {student.class?.name || 'Class N/A'}
                            </span>
                            Admission: {student.admissionNo}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={\`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap \${
                                activeTab === tab.id
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                            }\`}
                        >
                            <tab.icon className={\`w-4 h-4 \${activeTab === tab.id ? 'text-white' : 'text-gray-400 dark:text-gray-500'}\`} />
                            {tab.label}
                        </button>
                    ))}
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm whitespace-nowrap ml-2"
                    >
                        <Printer className="w-4 h-4" />
                        Print
                    </button>
                    <button
                        onClick={() => navigate(\`/students/admission?id=\${student.id}&edit=true\`)}
                        className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Edit className="w-4 h-4" />
                        Edit
                    </button>
                </div>
            </div>

            {/* Core Content Area */}
            <div className="no-print">
                {activeTab === 'Profile' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Box 1: Core details */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                    <User className="w-5 h-5 mr-2 text-primary-600" />
                                    General Information
                                </h2>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: 'Full Legal Name', value: \`\${student.firstName} \${student.lastName}\` },
                                    { label: 'Date Of Admission', value: new Date(student.admissionDate).toLocaleDateString(undefined, { dateStyle: 'long' }) },
                                    { label: 'Date Of Birth', value: new Date(student.dob).toLocaleDateString(undefined, { dateStyle: 'long' }) },
                                    { label: 'Mobile Number', value: student.mobileNumber },
                                    { label: 'Personal Email', value: student.email },
                                    { label: 'Blood Group', value: student.bloodGroup },
                                    { label: 'Religion / Caste', value: \`\${student.religion || '-'} / \${student.caste || '-'}\` },
                                    { label: 'Student House', value: student.house?.houseName }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0 last:pb-0">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1 sm:mt-0 text-left sm:text-right">{item.value || '-'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Box 2: Family / Secondary Details */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-6">
                                <Users className="w-5 h-5 mr-2 text-orange-500" />
                                Family & Contacts
                            </h2>
                             <div className="space-y-4">
                                {[
                                    { label: 'Father Name / Phone', value: \`\${student.fatherName || 'N/A'} - \${student.fatherPhone || 'N/A'}\` },
                                    { label: 'Father Occupation', value: student.fatherOccupation || 'N/A' },
                                    { label: 'Mother Name / Phone', value: \`\${student.motherName || 'N/A'} - \${student.motherPhone || 'N/A'}\` },
                                    { label: 'Mother Occupation', value: student.motherOccupation || 'N/A' },
                                    { label: 'Guardian / Relation', value: \`\${student.guardianName || 'N/A'} (\${student.guardianRelation || 'N/A'})\` },
                                    { label: 'Guardian Phone', value: student.guardianPhone || 'N/A' },
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0 last:pb-0">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1 sm:mt-0 text-left sm:text-right">{item.value || '-'}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-6 mt-8">
                                <MapPin className="w-5 h-5 mr-2 text-green-500" />
                                Logistics & Address
                            </h2>
                             <div className="space-y-4">
                                {[
                                    { label: 'Current Address', value: student.currentAddress || 'N/A' },
                                    { label: 'Permanent Address', value: student.permanentAddress || 'N/A' },
                                    { label: 'Transport Route', value: student.transportRoute || 'N/A' },
                                    { label: 'Hostel Assignment', value: student.hostelName ? \`\${student.hostelName} - Room \${student.roomNumber || 'N/A'}\` : 'N/A' },
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0 last:pb-0">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">{item.value || '-'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sibling Connections - Full width inline container */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
                             <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-6">
                                <Users className="w-5 h-5 mr-2 text-blue-500" />
                                Sibling Connections
                            </h2>
                            <div className="flex flex-wrap gap-4">
                                {((student.parent?.students || []).filter((s) => s.id !== student.id)).length > 0 ? (
                                    student.parent.students.filter((s) => s.id !== student.id).map((sibling) => (
                                        <div
                                            key={sibling.id}
                                            onClick={() => {
                                                navigate(\`/students/profile/\${sibling.id}\`);
                                                showSuccess(\`Switched to \${sibling.firstName}'s Profile\`);
                                            }}
                                            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:shadow-sm cursor-pointer transition-all bg-gray-50 dark:bg-gray-800/50 w-full sm:w-auto pr-8"
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-700 overflow-hidden shrink-0 border border-gray-100 dark:border-gray-600">
                                                {sibling.studentPhoto ? (
                                                    <img src={getFileUrl(sibling.studentPhoto)} alt={sibling.firstName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                                                        {sibling.firstName[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{sibling.firstName} {sibling.lastName}</p>
                                                <p className="text-xs font-medium text-gray-500">{sibling.class?.name || 'Class N/A'}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 w-full text-center">
                                        <p className="text-sm text-gray-500 font-medium">No siblings registered under this parent/guardian.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                ) : activeTab === 'Fees' ? (
                    <FeesTab student={student} />
                ) : activeTab === 'Exam' || activeTab === 'CBSE Examination' ? (
                    <ExamTab student={student} title={activeTab} />
                ) : activeTab === 'Attendance' ? (
                    <AttendanceTab student={student} />
                ) : activeTab === 'Documents' ? (
                    <DocumentsTab student={student} />
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-16 flex flex-col items-center justify-center min-h-[400px]">
                        <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{activeTab} Record</h4>
                        <p className="text-sm text-gray-500 mt-2 text-center max-w-sm">System is currently synchronizing historical data for this module.</p>
                    </div>
                )}
            </div>
        </div>
\n`;

    content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
    
    // Also fix the export at end of file to close fragment.
    content = content.replace(
\`        </div >
    );
}\`,
\`        </div >
        </>
    );
}\`);

    fs.writeFileSync(file, content);
    console.log('Replacement successful!');
} else {
    console.log('Could not find boundaries.');
    console.log('Start index:', startIdx);
    console.log('End index:', endIdx);
}
