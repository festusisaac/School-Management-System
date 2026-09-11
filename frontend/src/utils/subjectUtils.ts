export const getSubjectAbbreviation = (name: string): string => {
    if (!name) return '';
    const abbrevMap: { [key: string]: string } = {
        'english': 'ENG',
        'mathematics': 'MATHS',
        'kiswahili': 'KISW',
        'science': 'SCI',
        'social studies': 'SST',
        'religious education': 'REL.E',
        'christian religious education': 'CRE',
        'islamic religious education': 'IRE',
        'physical education': 'P.E & S',
        'agriculture': 'AGRIC',
        'home science': 'H. Scie',
        'art and craft': 'ART',
        'music': 'MUSIC',
        'business studies': 'BST',
        'integrated science': 'INT/SCI',
        'life skills': 'L/SKILL',
        'technology': 'TECH',
        'performing arts': 'P.Arts',
        'optional language': 'Opt Lang',
        'french': 'FRE',
        'german': 'GER',
        'arabic': 'ARAB',
        'computer': 'COMP',
        'history': 'HIST',
        'geography': 'GEO',
        'biology': 'BIO',
        'chemistry': 'CHEM',
        'physics': 'PHY',
    };

    const lowerName = name.toLowerCase();
    for (const [key, abbrev] of Object.entries(abbrevMap)) {
        if (lowerName.includes(key)) return abbrev;
    }
    
    // If it's a short name already, return it
    if (name.length <= 6) return name.toUpperCase();
    
    return name.substring(0, 6).toUpperCase() + '.';
};
