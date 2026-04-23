import { ReportCardConfig, defaultReportCardConfig } from '../components/examination/ReportCardTemplate';
import { SystemSetting } from '../services/systemService';

const REPORT_CARD_CONFIG_STORAGE_KEY = 'report_card_layout_config';

const mergeConfig = (value?: Partial<ReportCardConfig> | null): ReportCardConfig => ({
    ...defaultReportCardConfig,
    ...value,
    teacherCommentTemplates: {
        ...defaultReportCardConfig.teacherCommentTemplates,
        ...(value?.teacherCommentTemplates || {})
    },
    principalCommentTemplates: {
        ...defaultReportCardConfig.principalCommentTemplates,
        ...(value?.principalCommentTemplates || {})
    },
    promotionStatusTemplates: {
        ...defaultReportCardConfig.promotionStatusTemplates,
        ...(value?.promotionStatusTemplates || {})
    }
});

export const getStoredReportCardConfig = (): ReportCardConfig => {
    if (typeof window === 'undefined') {
        return defaultReportCardConfig;
    }

    const raw = window.localStorage.getItem(REPORT_CARD_CONFIG_STORAGE_KEY);
    if (!raw) {
        return defaultReportCardConfig;
    }

    try {
        return mergeConfig(JSON.parse(raw));
    } catch {
        return defaultReportCardConfig;
    }
};

export const saveReportCardConfig = (config: ReportCardConfig) => {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(REPORT_CARD_CONFIG_STORAGE_KEY, JSON.stringify(config));
};

export const resolveReportCardConfig = (settings?: Pick<SystemSetting, 'reportCardConfig'> | null): ReportCardConfig => {
    if (settings?.reportCardConfig) {
        return mergeConfig(settings.reportCardConfig);
    }

    return getStoredReportCardConfig();
};
