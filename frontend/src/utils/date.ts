/**
 * Standardized Date Formatting Utilities
 * Forces Africa/Lagos timezone for institutional consistency
 */

const DEFAULT_TIMEZONE = 'Africa/Lagos';
const DEFAULT_LOCALE = 'en-GB'; // Use GB for DD/MM/YYYY format

/**
 * Formats a date string or object to a local date string (DD/MM/YYYY)
 */
export const formatDateLocal = (date: string | Date): string => {
    if (!date) return 'N/A';
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('en-US', {
            timeZone: DEFAULT_TIMEZONE,
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).format(d);
    } catch (e) {
        return 'Invalid Date';
    }
};

/**
 * Formats a date string or object to a local time string (HH:MM AM/PM)
 */
export const formatTimeLocal = (date: string | Date): string => {
    if (!date) return 'N/A';
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
            timeZone: DEFAULT_TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }).format(d);
    } catch (e) {
        return 'Invalid Time';
    }
};

/**
 * Full timestamp formatting
 */
export const formatTimestampLocal = (date: string | Date): string => {
    return `${formatDateLocal(date)} ${formatTimeLocal(date)}`;
};
