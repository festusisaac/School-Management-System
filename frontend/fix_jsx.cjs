const fs = require('fs');
const file = 'C:/Users/USER/Desktop/SMS/School-Management-System/frontend/src/pages/students/StudentProfile.tsx';
let content = fs.readFileSync(file, 'utf8');

// Undo the wrong wrapper from `if (loading)`
content = content.replace(
\`    if (loading) {
        return (
        <>
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">\`,
\`    if (loading) {
        return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">\`
);

// Add the wrapper to the main return
content = content.replace(
\`    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">\`,
\`    return (
        <>
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">\`
);

// Add the closing wrapper to the end of the print template div
content = content.replace(
\`        </div >
    );
}\`,
\`        </div >
        </>
    );
}\`
);

fs.writeFileSync(file, content);
console.log("Fixed JSX fragments.");
