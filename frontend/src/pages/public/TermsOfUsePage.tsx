import { useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Scale, Mail, Phone } from 'lucide-react';

const TermsOfUsePage = () => {
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
                        <Scale className="w-4 h-4 text-primary-600" />
                        <span className="text-xs font-bold text-primary-900 dark:text-primary-100 uppercase tracking-widest leading-none">Terms of Use</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-heading font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                        Terms of Use
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mt-6">
                        These terms govern use of the {schoolName} Management System (web dashboard and mobile app) by staff,
                        students, and parents of the school.
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">Last updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </section>

            {/* Body */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">

                    <Block title="1. Acceptance of these terms">
                        <p>
                            By logging into or using the {schoolName} Management System, you agree to these Terms of Use.
                            If you do not agree with them, do not use the system, and contact the school administration with
                            any concerns.
                        </p>
                    </Block>

                    <Block title="2. Who can use this system">
                        <p>
                            Access is provided only to current staff, students, and parents/guardians of {schoolName}, through
                            accounts created and managed by the school. There is no public self-registration. The school may
                            suspend or deactivate an account at any time, including when someone leaves the school or an
                            account is no longer needed.
                        </p>
                    </Block>

                    <Block title="3. Your account">
                        <p>You are responsible for:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>Keeping your login credentials confidential and not sharing them with anyone else.</li>
                            <li>All activity that happens under your account.</li>
                            <li>Notifying the school administration promptly if you suspect unauthorized access to your account.</li>
                        </ul>
                    </Block>

                    <Block title="4. Acceptable use">
                        <p>When using the system, you agree not to:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>Access, alter, or share another person's records without authorization.</li>
                            <li>Use the system to harass, defame, or misrepresent any student, staff member, parent, or the school.</li>
                            <li>Attempt to bypass security controls, probe for vulnerabilities, or disrupt the service for others.</li>
                            <li>Upload content that is unlawful, abusive, or infringes on someone else's rights.</li>
                            <li>Use data obtained through the system (student records, contact details, financial information) for any purpose outside your school duties.</li>
                        </ul>
                    </Block>

                    <Block title="5. Academic and financial records">
                        <p>
                            Grades, attendance, fee, and payroll records displayed in the system are maintained by the school
                            and are provided for informational and administrative purposes. If you believe a record is
                            inaccurate, raise it with the relevant school office rather than relying solely on the app to
                            resolve the discrepancy.
                        </p>
                    </Block>

                    <Block title="6. Availability">
                        <p>
                            We aim to keep the system available and reliable, but it may occasionally be unavailable for
                            maintenance, updates, or reasons outside our control. The school is not liable for any loss
                            arising from temporary unavailability of the system.
                        </p>
                    </Block>

                    <Block title="7. Intellectual property">
                        <p>
                            The system's software, design, and branding belong to {schoolName} and its developers. Content you
                            submit (such as homework, applications, or profile information) remains yours, but you grant the
                            school the right to store, process, and display it as needed to operate the system.
                        </p>
                    </Block>

                    <Block title="8. Limitation of liability">
                        <p>
                            The system is provided on an "as is" basis. To the fullest extent permitted by law, {schoolName}
                            is not liable for indirect or incidental damages arising from use of, or inability to use, the
                            system. Nothing in these terms limits any liability that cannot be excluded under applicable law.
                        </p>
                    </Block>

                    <Block title="9. Changes to these terms">
                        <p>
                            We may update these terms from time to time. The "Last updated" date above will reflect the most
                            recent revision, and material changes will be communicated through the school's notice system
                            where appropriate.
                        </p>
                    </Block>

                    <Block title="10. Governing law">
                        <p>
                            These terms are governed by the laws of the Federal Republic of Nigeria.
                        </p>
                    </Block>

                    <Block title="11. Contact us">
                        <p>Questions about these terms can be directed to:</p>
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

export default TermsOfUsePage;
