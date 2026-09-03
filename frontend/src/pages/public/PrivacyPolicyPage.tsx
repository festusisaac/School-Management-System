import { useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { ShieldCheck, Mail, Phone } from 'lucide-react';

const PrivacyPolicyPage = () => {
    const { settings } = useSystem();
    const schoolName = settings?.schoolName || 'PHJC School';
    const schoolEmail = settings?.schoolEmail || 'school@example.com';
    const schoolPhone = settings?.schoolPhone || '';

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500">
            {/* Hero */}
            <section className="relative py-20 md:py-28 overflow-hidden">
                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900/50 -z-10"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600"></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/20 mb-8">
                        <ShieldCheck className="w-4 h-4 text-primary-600" />
                        <span className="text-xs font-bold text-primary-900 dark:text-primary-100 uppercase tracking-widest leading-none">Privacy Policy</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-heading font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                        Your Privacy Matters to Us
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mt-6">
                        This policy explains what information the {schoolName} Management System (web and mobile app) collects, why, and how it is protected.
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">Last updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </section>

            {/* Body */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">

                    <Block title="1. Who this applies to">
                        <p>
                            This policy covers the {schoolName} Management System: the web dashboard and the companion mobile app used by
                            administrators, teachers, accounting staff, students, and parents. It is an internal system for the school
                            community — accounts are created by the school, not through public sign-up.
                        </p>
                    </Block>

                    <Block title="2. Information we collect">
                        <p>We collect only what is needed to run the school's academic and administrative operations:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Account &amp; identity information:</strong> name, email address, role, and login credentials (passwords are stored as one-way hashes, never in readable form).</li>
                            <li><strong>Student records:</strong> date of birth, admission number, class/section, attendance, academic results, homework and exam data, and a profile photo where provided.</li>
                            <li><strong>Staff records:</strong> contact details, employment information, leave records, payroll and salary data, and a profile photo where provided.</li>
                            <li><strong>Financial information:</strong> fee records, payment history, and related transaction data.</li>
                            <li><strong>Parent/guardian information:</strong> name and contact details, linked to their child's record.</li>
                            <li><strong>Communications:</strong> notices, circulars, and homework/assignment content created within the system.</li>
                            <li><strong>Device information (mobile app only):</strong> a push-notification token used solely to deliver notices and alerts to your device.</li>
                        </ul>
                    </Block>

                    <Block title="3. How we use this information">
                        <p>Information is used strictly to operate the school system: managing enrollment, attendance, academic
                            records, fees, staff administration, and communicating notices to the right people. We do not use your
                            data for advertising, and we do not sell or rent personal information to anyone.</p>
                    </Block>

                    <Block title="4. When information is shared with third parties">
                        <p>We keep third-party sharing to the minimum needed to deliver the service:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Push notifications:</strong> the mobile app uses Expo's push notification service (and, on Android, Google's Firebase Cloud Messaging) to deliver notices. These services receive only a device push token and the notification content, not your account password or financial records.</li>
                            <li><strong>SMS notifications (where enabled):</strong> if the school enables SMS alerts, a recipient's phone number and the message text are passed to our SMS gateway provider solely to deliver that message.</li>
                            <li><strong>Hosting infrastructure:</strong> all data is stored on servers operated for the school; our hosting/infrastructure provider does not use your data for its own purposes.</li>
                        </ul>
                        <p className="mt-3">We do not share data with advertisers, data brokers, or analytics companies — the system does not use any advertising or analytics SDKs.</p>
                    </Block>

                    <Block title="5. How information is protected">
                        <ul className="list-disc pl-6 space-y-2">
                            <li>All traffic between the app/website and our servers is encrypted in transit (HTTPS).</li>
                            <li>Passwords are never stored in plain text — only irreversible cryptographic hashes.</li>
                            <li>Access to student, staff, and financial records is restricted by role — a teacher, for example, cannot see payroll data, and a student cannot see another student's records.</li>
                        </ul>
                    </Block>

                    <Block title="6. Data retention and deletion">
                        <p>
                            Records are retained for as long as the associated student, staff member, or parent has an active
                            relationship with the school, and afterward only as long as reasonably needed for academic or legal
                            record-keeping. To request access to, correction of, or deletion of your personal data, contact the
                            school using the details below — an account cannot be deleted by the account holder directly, since
                            records are managed by school administration.
                        </p>
                    </Block>

                    <Block title="7. Children's information">
                        <p>
                            Because this is a school system, it necessarily holds information about students who may be minors.
                            Student accounts and data are created and managed by the school on behalf of, and with the
                            authorization of, the student's parent/guardian or the institution itself — not through open
                            self-registration.
                        </p>
                    </Block>

                    <Block title="8. Changes to this policy">
                        <p>
                            If this policy changes in a meaningful way, the "Last updated" date above will change and, where
                            appropriate, we will notify staff and parents through the notice system.
                        </p>
                    </Block>

                    <Block title="9. Contact us">
                        <p>Questions about this policy or your data can be directed to:</p>
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                                <Mail size={18} className="text-primary-600" />
                                <a href={`mailto:${schoolEmail}`} className="hover:text-primary-600 transition-colors">{schoolEmail}</a>
                            </div>
                            {schoolPhone && (
                                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                                    <Phone size={18} className="text-primary-600" />
                                    <span>{schoolPhone}</span>
                                </div>
                            )}
                        </div>
                    </Block>

                </div>
            </section>
        </div>
    );
};

function Block({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h2 className="text-2xl font-heading font-black text-slate-900 dark:text-white mb-4">{title}</h2>
            <div className="text-slate-600 dark:text-slate-400 leading-relaxed">{children}</div>
        </div>
    );
}

export default PrivacyPolicyPage;
