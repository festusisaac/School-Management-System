export const getSubjectAbbreviation = (name: string): string => {
    if (!name) return '';
    const abbrevMap: { [key: string]: string } = {
        'english language': 'ENG',
        'english': 'ENG',
        'further mathematics': 'F.MATH',
        'mathematics': 'MATH',
        'kiswahili': 'KISW',
        'basic science & technology': 'BST',
        'basic science': 'B.SCI',
        'basic technology': 'B.TECH',
        'digital technology': 'D.TECH',
        'intermediate science': 'I.SCI',
        'integrated science': 'INT/SCI',
        'science': 'SCI',
        'social & citizen studies': 'SCS',
        'social studies': 'SST',
        'christian religious education': 'CRE',
        'c.r.s': 'CRS',
        'islamic religious education': 'IRE',
        'religious education': 'REL.E',
        'physical & health education': 'PHE',
        'physical education': 'P.E & S',
        'livestock farming': 'L.FARM',
        'agriculture': 'AGRIC',
        'home economics': 'H.ECON',
        'home science': 'H. Scie',
        'cultural & creative art': 'CCA',
        'art and craft': 'ART',
        'music': 'MUSIC',
        'business studies': 'BUS',
        'accounting': 'ACCT',
        'commerce': 'COMM',
        'economics': 'ECON',
        'marketing': 'MKT',
        'entrepreneurship': 'ENT',
        'life skills': 'L/SKILL',
        'technology': 'TECH',
        'performing arts': 'P.Arts',
        'optional language': 'Opt Lang',
        'french language': 'FRE',
        'french': 'FRE',
        'german': 'GER',
        'arabic': 'ARAB',
        'hausa language': 'HAU',
        'computer': 'COMP',
        'nigerian history': 'N.HIST',
        'history': 'HIST',
        'geography': 'GEO',
        'biology': 'BIO',
        'chemistry': 'CHEM',
        'physics': 'PHY',
        'citizenship education': 'C.ED',
        'drawing': 'DRAW',
        'technical drawing': 'T.DRAW',
        'fashion design & garment making': 'FDGM',
        'food & nutrition': 'F&N',
        'government': 'GOVT',
        'handwriting': 'HAND',
        'letters': 'LET',
        'lit. in english': 'LIT',
        'numbers': 'NUM',
        'phonetics': 'PHON',
        'rhymes': 'RHYM'
    };

    const lowerName = name.toLowerCase().trim();
    if (abbrevMap[lowerName]) return abbrevMap[lowerName];

    // Sort keys by length descending to match more specific names first
    const sortedKeys = Object.keys(abbrevMap).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        if (lowerName.includes(key)) return abbrevMap[key];
    }
    
    // If it's a short name already, return it
    if (name.length <= 6) return name.toUpperCase();
    
    return name.substring(0, 6).toUpperCase() + '.';
};
