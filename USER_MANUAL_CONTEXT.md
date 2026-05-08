# Exhaustive School Management System (SMS) Context & Operational Workflows

**INSTRUCTIONS FOR THE LLM:**
You are a master technical documentation specialist. This document contains the **absolute, complete context** for a sophisticated School Management System. Your goal is to produce an end-to-end **User Manual** that serves as the definitive reference for every role (Admin, Principal, Teacher, Student, Parent, Librarian, Finance, and HR Staff).

**Requirements**:
1.  **No Stone Unturned**: You must include every module and submodule listed below.
2.  **Explicit Navigation**: For every "How-To" or feature description, you **MUST** include the exact navigation path provided (e.g., *Navigation: Sidebar > Module > Submodule*). The AI generating the final manual must instruct users exactly where to click.
3.  **Role Navigation**: Clearly distinguish which features belong to which user role.
4.  **Premium Tone**: Maintain a professional, clear, and empowering instructional tone.

---

## 1. System Initialization & Global Governance

### 1.1 The Setup Wizard (Day 1)
*   **Navigation**: *Appears automatically on the first launch of the system before any sidebar is visible.*
*   **Institution Identity**: School branding, Logo upload (Max 2MB), Address, Website, and WhatsApp Business integration.
*   **Academic Session**: Define the primary cycle (e.g., "2023/2024").
*   **Current Term**: Set the active term (e.g., "First Term") with specific start/end dates.
*   **Regional Settings**: Localization of Timezone, Date Format, and Currency.
*   **ID Prefixing**: Define standard prefixes for **Admission Numbers** and **Staff IDs** to enable auto-generation.

### 1.2 User & Security Management
*   **User Directory**: *Navigation: Sidebar > Settings > User Management*. Create login credentials for all staff members.
*   **Roles & Permissions**: *Navigation: Sidebar > Settings > Roles & Permissions*. Fine-grained access control. Define exactly what a "Junior Teacher" can see vs. a "Senior Accountant."
*   **Audit Logs**: *Navigation: Sidebar > Audit & Reports > Activity Logs*. A global ledger tracking every modification in the system (e.g., "Who changed Student X's result?").

---

## 2. Academic & Examination Excellence

### 2.1 Institutional Structure
*   **School Sections**: *Navigation: Sidebar > Settings > School Sections*. Divide the institution (e.g., "Primary Section," "Secondary Section").
*   **Classes & Sub-Sections**: *Navigation: Sidebar > Academics > Classes / Sections*. Group students into levels (JSS1) and subgroups (JSS1A).
*   **Subject Management**: *Navigation: Sidebar > Academics > Subject Groups / Subjects*. Define all subjects and group them into logical bundles.
*   **Timetable Management**: *Navigation: Sidebar > Academics > Class Timetable / Teachers Timetable*. Create and manage master schedules.

### 2.2 Examination & CBT
*   **Assessment Structure**: *Navigation: Sidebar > Examination > Assessment Structure*. Define mark weightage (e.g., CA1: 15%, CA2: 15%, Exam: 70%).
*   **Grading Systems**: *Navigation: Sidebar > Examination > Grading System*. Set the grade boundaries (e.g., 80-100 = A1).
*   **Exam Groups**: *Navigation: Sidebar > Examination > Exam Groups*. Bundle exams for specific terms or sessions.
*   **Scoresheet Entry**: *Navigation: Sidebar > Examination > Scoresheet Entry*. Teachers enter scores per subject. Supports **Bulk Score Import** via CSV.
*   **CBT Manager**: *Navigation: Sidebar > Examination > CBT Manager*. A full suite for digital exams, question banks, and live monitoring.
*   **Non-Academic Metrics**: *Navigation: Sidebar > Examination > Psychomotor Skills / Skills & Attributes*. Log behaviors and physical/vocational skills.

---

## 3. Student Life Cycle & Admissions

### 3.1 Enrollment & Admission
*   **Manual Admission**: *Navigation: Sidebar > Student Information > Student Admission*. A massive multi-tab form capturing:
    *   **Personal**: Name, Nationality, State, Gender, DOB.
    *   **Parent/Guardian**: Sibling linking, primary guardian selection, and automated contact sync.
    *   **Academic**: Class, House, Section assignment.
    *   **Medical**: Blood group, Genotype, Allergies, and First Aid consent.
    *   **Faith/Legal**: Religious participation and legal undertakings.
    *   **Documents**: Upload birth certificates and previous transcripts.
*   **Online Admission**: *Navigation: Sidebar > Student Information > Online Admission*. A public portal where prospective parents apply, pay application fees, and upload documents for admin review.
*   **Student Categories & Houses**: *Navigation: Sidebar > Student Information > Student Categories / Student House*.

### 3.2 Daily Operations
*   **Student Directory**: *Navigation: Sidebar > Student Information > Student Directory*. Search and filter the entire student body. View 360-degree student profiles.
*   **Attendance Marking**: *Navigation: Sidebar > Student Attendance > Mark Attendance*. Mark students as Present, Absent, or Late. Triggers automated alerts to parents.
*   **Student Progression**: *Navigation: Sidebar > Academics > Promote Students*. **Bulk Promote** students to the next class at the end of a session.
*   **Student Support**: Generate **Admit Cards** (*Navigation: Sidebar > Examination > Admit Cards*), **Report Cards** (*Navigation: Sidebar > Examination > Report Card*), and track **Attendance History** (*Navigation: Sidebar > Student Attendance > Attendance History*).

---

## 4. Financial Management (Bursary & Accounting)

### 4.1 Fee Structure & Collection
*   **Fee Structure Definition**: *Navigation: Sidebar > Finance > Fee Structure*. Define individual fee components (e.g., "Tuition") and bundle them into **Fee Groups**. Includes **Bulk Fee Assignment** to classes.
*   **Offline Payment Recording**: *Navigation: Sidebar > Finance > Offline Fees Collection*.
    1.  Search for the student.
    2.  Allocate payments across specific fee heads.
    3.  Select Payment Method (Cash, POS, Transfer).
    4.  Generate and **Print Digital Receipts**.
*   **Debtors List & Reminders**: *Navigation: Sidebar > Finance > Debtors List / Payment Reminders*. View real-time reports of outstanding balances and send automated reminders.

### 4.2 Expenditure & Discounts
*   **Expense Manager**: *Navigation: Sidebar > Expenses > Expense Records*. Track school spending by category and vendor. Includes an approval workflow (Draft -> Pending -> Approved -> Paid).
*   **Discounts & Waivers**: *Navigation: Sidebar > Finance > Discounts*. Grant percentage or fixed-amount discounts to specific students (e.g., "Scholarship").
*   **Carry Forward**: *Navigation: Sidebar > Finance > Balance Carry-Forward*. Automatically move unpaid balances or credits from one session/term to the next.

---

## 5. Human Resources & Payroll

### 5.1 Staff Management
*   **Staff Directory**: *Navigation: Sidebar > Human Resource > Staff Directory*. Comprehensive records for Academic and Non-Academic staff.
*   **Departments**: *Navigation: Sidebar > Human Resource > Department*. Organize staff into logical units.
*   **Staff Attendance**: *Navigation: Sidebar > Human Resource > Staff Attendance*. Biometric-ready attendance marking for school employees.
*   **Leave Management**: *Navigation: Sidebar > Human Resource > Apply Leave / Approve Leave Request*. Staff apply for leaves; Admins review and approve based on leave types configured in *Leave Type*.

### 5.2 Payroll Operations
*   **Payroll Generation**: *Navigation: Sidebar > Human Resource > Payroll*.
    1.  Set Basic Salary, Allowances, and Deductions in the staff profile.
    2.  Select Month/Year in the Payroll module.
    3.  **Bulk Generate** for the entire staff list based on attendance.
    4.  Review and **Complete Payment**.
    5.  Generate professional **Payslips** (Printable/PDF).

---

## 6. Institutional Resources & Communication

### 6.1 Library Circulation
*   **Inventory Management**: *Navigation: Sidebar > Library > Books Catalog / Authors / Categories*. Manage books with unique **Barcodes (Accession Numbers)**.
*   **Circulation**: *Navigation: Sidebar > Library > Issue Book / Return Book*. Issue books to students/staff by searching for the book copy and borrower. Track penalties in *Overdue Loans*.

### 6.2 Communication & Media
*   **Send Broadcast**: *Navigation: Sidebar > Communication > Send Message*. Mass SMS or Email delivery. Use *Message Templates* for consistency.
*   **Noticeboard**: *Navigation: Sidebar > Communication > Manage Notices*. Manage digital announcements. Pin critical notices (Sticky) to the top of user dashboards. View active notices in *Noticeboard*.
*   **Download Center**: *Navigation: Sidebar > Download Center*. Upload and categorize Syllabus, Past Questions, and Study Materials.

### 6.3 Front-CMS (Public Site Management)
*   **Content Sections**: *Navigation: Sidebar > Front CMS > Hero Section / News & Events / Gallery / Testimonials / SEO & Social*. Control exactly what appears on the school's public-facing website.
*   **Donations**: *Navigation: Sidebar > Donations > Fundraising Campaigns / Contribution History*. A public-facing module for tracking contributions.
*   **Alumni**: *Navigation: Sidebar > Alumni > Alumni Directory / Alumni Events / Job Board*. Database of graduated students with career tracking and event invites.

---

## 7. Parent & Student Portal Specifics

### 7.1 Student Navigation
Students log in to a restricted dashboard with the following direct sidebar links:
*   **My Profile**: *Navigation: Sidebar > My Profile*.
*   **Finance**: *Navigation: Sidebar > Finance*. Pay fees online via Paystack/Flutterwave.
*   **Academics**: Access *Class Timetable*, *Attendance*, *Homework*, and *Download Center* directly from the sidebar.
*   **Examination**: *Navigation: Sidebar > Examination > Check Result / Admit Card*. View digital report cards.
*   **Online Classes**: *Navigation: Sidebar > Online Classes*. Join virtual Zoom/Meet sessions.

### 7.2 Parent Navigation
Parents log in with a linked account to monitor their children:
*   **Family Billing**: *Navigation: Sidebar > Family Billing*. A consolidated view of outstanding fees for all linked children, with online payment options.
*   **Child Monitoring**: Parents can view *Class Timetable*, *Attendance*, *Homework*, and *Examination* for their selected child.

---
**End of Exhaustive Context Document.**
Dear LLM, use this comprehensive architectural and operational map to build a manual that empowers every member of the school ecosystem to succeed. Every module is vital; every "How-To" must include the explicit navigation paths provided above. Use an "Enterprise Grade" instructional tone.
