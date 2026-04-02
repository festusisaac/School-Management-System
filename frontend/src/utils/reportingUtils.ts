/**
 * Standardizes common report processing operations to avoid O(N^2) complexity.
 */

/**
 * Creates a Map lookup for an array of objects based on a key path.
 * Handles both studentId and studentid common casing issues.
 */
export const createIdLookupMap = <T>(data: T[], primaryKey: string = 'id'): Map<string, T> => {
    const lookup = new Map<string, T>();
    if (!Array.isArray(data)) return lookup;

    data.forEach((item: any) => {
        const id = item[primaryKey] || item[primaryKey.toLowerCase()];
        if (id) lookup.set(id.toString(), item);
    });
    return lookup;
};

/**
 * Creates a composite key lookup for items involving student and subject IDs.
 */
export const createStudentSubjectLookupMap = <T>(data: T[]): Map<string, T> => {
    const lookup = new Map<string, T>();
    if (!Array.isArray(data)) return lookup;

    data.forEach((item: any) => {
        const sId = item.studentId || item.studentid;
        const subjId = item.subjectId || item.subjectid;
        if (sId && subjId) {
            lookup.set(`${sId}_${subjId}`, item);
        }
    });
    return lookup;
};

/**
 * Groups an array of objects by a common key.
 */
export const groupById = <T>(data: T[], keyPath: string): Map<string, T[]> => {
    const group = new Map<string, T[]>();
    if (!Array.isArray(data)) return group;

    data.forEach((item: any) => {
        const id = item[keyPath] || item[keyPath.toLowerCase()];
        if (id) {
            if (!group.has(id.toString())) group.set(id.toString(), []);
            group.get(id.toString())!.push(item);
        }
    });
    return group;
};

/**
 * Parses term names consistently for cumulative calculations.
 */
export const identifyTerm = (termName: string = ''): 'first' | 'second' | 'third' | null => {
    const t = termName.toLowerCase();
    if (t.includes('first') || t.includes('1st')) return 'first';
    if (t.includes('second') || t.includes('2nd')) return 'second';
    if (t.includes('third') || t.includes('3rd')) return 'third';
    return null;
};
