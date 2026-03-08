import api from './api';

// Types
export interface ExamGroup {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    academicYear: string;
    term: string;
    isActive: boolean;
    isPublished: boolean;
}

export interface CreateExamGroupDto {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    academicYear: string;
    term: string;
}

// Service
export const examinationService = {
    // Exam Groups
    getExamGroups: async () => {
        return await api.get<ExamGroup[]>('/examination/setup/groups');
    },

    createExamGroup: async (data: CreateExamGroupDto) => {
        return await api.post<ExamGroup>('/examination/setup/groups', data);
    },

    updateExamGroup: async (id: string, data: Partial<CreateExamGroupDto>) => {
        return await api.patch<ExamGroup>(`/examination/setup/groups/${id}`, data);
    },

    deleteExamGroup: async (id: string) => {
        return await api.delete(`/examination/setup/groups/${id}`);
    },

    // Assessment Types
    getAssessmentTypes: async (examGroupId: string) => {
        return await api.get<AssessmentType[]>('/examination/setup/assessments', { params: { examGroupId } });
    },

    createAssessmentType: async (data: CreateAssessmentTypeDto) => {
        return await api.post<AssessmentType>('/examination/setup/assessments', data);
    },

    updateAssessmentType: async (id: string, data: Partial<CreateAssessmentTypeDto>) => {
        return await api.patch<AssessmentType>(`/examination/setup/assessments/${id}`, data);
    },

    deleteAssessmentType: async (id: string) => {
        return await api.delete(`/examination/setup/assessments/${id}`);
    },

    // Grading System
    getGradeScales: async () => {
        return await api.get<GradeScale[]>('/examination/setup/grades');
    },

    createGradeScale: async (data: CreateGradeScaleDto) => {
        return await api.post<GradeScale>('/examination/setup/grades', data);
    },

    updateGradeScale: async (id: string, data: Partial<CreateGradeScaleDto>) => {
        return await api.patch<GradeScale>(`/examination/setup/grades/${id}`, data);
    },

    deleteGradeScale: async (id: string) => {
        return await api.delete(`/examination/setup/grades/${id}`);
    },

    // Exams & Schedules
    getExams: async (examGroupId: string) => {
        return await api.get<Exam[]>('/examination/setup/exams', { params: { examGroupId } });
    },

    createExam: async (data: CreateExamDto) => {
        return await api.post<Exam>('/examination/setup/exams', data);
    },

    getSchedules: async (examGroupId: string) => {
        return await api.get<ExamSchedule[]>('/examination/setup/schedules', { params: { examGroupId } });
    },

    scheduleExam: async (data: CreateExamScheduleDto) => {
        return await api.post<ExamSchedule>('/examination/setup/schedules', data);
    },

    updateSchedule: async (id: string, data: Partial<CreateExamScheduleDto>) => {
        return await api.patch<ExamSchedule>(`/examination/setup/schedules/${id}`, data);
    },

    deleteSchedule: async (id: string) => {
        return await api.delete(`/examination/setup/schedules/${id}`);
    },

    deleteExam: async (id: string) => {
        return await api.delete(`/examination/setup/exams/${id}`);
    },

    // Admit Cards
    getAdmitCards: async (examGroupId: string) => {
        return await api.get<AdmitCard[]>('/examination/setup/admit-cards', { params: { examGroupId } });
    },

    createAdmitCard: async (data: CreateAdmitCardDto) => {
        return await api.post<AdmitCard>('/examination/setup/admit-cards', data);
    },

    updateAdmitCard: async (id: string, data: Partial<CreateAdmitCardDto>) => {
        return await api.patch<AdmitCard>(`/examination/setup/admit-cards/${id}`, data);
    },

    deleteAdmitCard: async (id: string) => {
        return await api.delete(`/examination/setup/admit-cards/${id}`);
    },

    // Score Entry
    getMarks: async (examId: string) => {
        return await api.get<ExamResult[]>(`/examination/entry/marks/${examId}`);
    },

    saveMarks: async (data: SaveMarksDto) => {
        return await api.post<ExamResult[]>('/examination/entry/marks', data);
    },

    getClassMarks: async (classId: string, examGroupId: string) => {
        return await api.get<ExamResult[]>(`/examination/entry/class-marks/${classId}/${examGroupId}`);
    },

    // Domains (Setup)
    getPsychomotorDomains: async () => {
        return await api.get<PsychomotorDomain[]>('/examination/setup/psychomotor-domains');
    },

    createPsychomotorDomain: async (name: string) => {
        return await api.post<PsychomotorDomain>('/examination/setup/psychomotor-domains', { name });
    },

    updatePsychomotorDomain: async (id: string, name: string) => {
        return await api.patch<PsychomotorDomain>(`/examination/setup/psychomotor-domains/${id}`, { name });
    },

    deletePsychomotorDomain: async (id: string) => {
        return await api.delete(`/examination/setup/psychomotor-domains/${id}`);
    },

    getAffectiveDomains: async () => {
        return await api.get<AffectiveDomain[]>('/examination/setup/affective-domains');
    },

    createAffectiveDomain: async (name: string) => {
        return await api.post<AffectiveDomain>('/examination/setup/affective-domains', { name });
    },

    updateAffectiveDomain: async (id: string, name: string) => {
        return await api.patch<AffectiveDomain>(`/examination/setup/affective-domains/${id}`, { name });
    },

    deleteAffectiveDomain: async (id: string) => {
        return await api.delete(`/examination/setup/affective-domains/${id}`);
    },

    // Skills & Psychomotor Entry
    getSkills: async (examGroupId: string) => {
        return await api.get<StudentSkill[]>('/examination/entry/skills/' + examGroupId);
    },

    saveSkills: async (data: SaveSkillsDto) => {
        return await api.post<StudentSkill[]>('/examination/entry/skills', data);
    },

    getPsychomotor: async (examGroupId: string) => {
        return await api.get<StudentPsychomotor[]>('/examination/entry/psychomotor/' + examGroupId);
    },

    savePsychomotor: async (data: SavePsychomotorDto) => {
        return await api.post<StudentPsychomotor[]>('/examination/entry/psychomotor', data);
    },

    // Processing
    processResults: async (classId: string, examGroupId: string) => {
        return await api.post('/examination/processing/process', { classId, examGroupId });
    },

    getBroadsheet: async (classId: string, examGroupId: string) => {
        return await api.get<any[]>('/examination/processing/broadsheet', {
            params: { classId, examGroupId }
        });
    },

    // Control
    getResultSummary: async (classId: string, examGroupId: string) => {
        return await api.get('/examination/control/summary', {
            params: { classId, examGroupId }
        });
    },

    approveResults: async (classId: string, examGroupId: string) => {
        return await api.post('/examination/control/approve', { classId, examGroupId });
    },

    publishResults: async (classId: string, examGroupId: string) => {
        return await api.post('/examination/control/publish', { classId, examGroupId });
    },
};

export interface PsychomotorDomain {
    id: string;
    name: string;
}

export interface AffectiveDomain {
    id: string;
    name: string;
}

export interface StudentSkill {
    id: string;
    studentId: string;
    domainId: string;
    rating: string;
    examGroupId: string;
}

export interface StudentPsychomotor {
    id: string;
    studentId: string;
    domainId: string;
    rating: string;
    examGroupId: string;
}

export interface SaveSkillsDto {
    examGroupId: string;
    skills: {
        studentId: string;
        domainId: string;
        rating: string;
    }[];
}

export interface SavePsychomotorDto {
    examGroupId: string;
    ratings: {
        studentId: string;
        domainId: string;
        rating: string;
    }[];
}


export interface ExamResult {
    id: string;
    examId: string;
    studentId: string;
    score: number;
    status: string; // PRESENT, ABSENT
    assessmentTypeId?: string;
}

export interface SaveMarksDto {
    examId: string;
    assessmentTypeId?: string;
    marks: {
        studentId: string;
        score: number;
        status?: string;
    }[];
}


export interface AdmitCard {
    id: string;
    templateName: string;
    sections: any[];
    config: any;
    examGroupId: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateAdmitCardDto {
    templateName: string;
    sections?: any[];
    config?: any;
    examGroupId: string;
}


export interface Exam {
    id: string;
    name: string;
    totalMarks: number;
    subjectId: string;
    classId: string;
    examGroupId: string;
}

export interface ExamSchedule {
    id: string;
    examId: string;
    date: string;
    startTime: string; // HH:mm
    endTime: string;
    venue: string;
    invigilatorName?: string;
    exam?: Exam;
}

export interface CreateExamDto {
    name: string;
    totalMarks: number;
    subjectId: string;
    classId: string;
    examGroupId: string;
}

export interface CreateExamScheduleDto {
    examId: string;
    date: string;
    startTime: string;
    endTime: string;
    venue: string;
    invigilatorName?: string;
}

export interface CreateExamAndScheduleDto {
    examGroupId: string;
    classId: string;
    subjectId: string;
    totalMarks: number;
    date: string;
    startTime: string;
    endTime: string;
    venue: string;
    invigilatorName?: string;
}

export interface GradeScale {
    id: string;
    name: string;
    grades: Grade[];
}

export interface Grade {
    name: string;
    minScore: number;
    maxScore: number;
    gpa?: number;
    remark?: string;
}

export interface CreateGradeScaleDto {
    name: string;
    grades: Grade[];
}

export interface AssessmentType {
    id: string;
    name: string;
    maxMarks: number;
    weightage?: number;
    examGroupId: string;
}

export interface CreateAssessmentTypeDto {
    name: string;
    maxMarks: number;
    weightage?: number;
    examGroupId: string;
}
