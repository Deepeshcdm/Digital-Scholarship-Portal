// College to Officer Email Domain Mapping System
export interface CollegeMapping {
  collegeCode: string;
  collegeName: string;
  emailDomain: string;
  location: string;
  type: 'engineering' | 'arts' | 'medical' | 'management' | 'polytechnic';
}

// Comprehensive college database with their officer email domains
export const COLLEGE_MAPPINGS: CollegeMapping[] = [
  // Engineering Colleges - Tamil Nadu
  {
    collegeCode: 'SMVEC',
    collegeName: 'Sri Manakula Vinayagar Engineering College',
    emailDomain: 'smvec.ac.in',
    location: 'Puducherry',
    type: 'engineering'
  },
  {
    collegeCode: 'CEG',
    collegeName: 'College of Engineering, Guindy',
    emailDomain: 'ceg.ac.in',
    location: 'Chennai',
    type: 'engineering'
  },
  {
    collegeCode: 'MIT',
    collegeName: 'Madras Institute of Technology',
    emailDomain: 'mit.ac.in',
    location: 'Chennai',
    type: 'engineering'
  },
  {
    collegeCode: 'PSG',
    collegeName: 'PSG College of Technology',
    emailDomain: 'psg.ac.in',
    location: 'Coimbatore',
    type: 'engineering'
  },
  {
    collegeCode: 'SASTRA',
    collegeName: 'SASTRA Deemed University',
    emailDomain: 'sastra.edu',
    location: 'Thanjavur',
    type: 'engineering'
  },
  {
    collegeCode: 'VIT',
    collegeName: 'Vellore Institute of Technology',
    emailDomain: 'vit.ac.in',
    location: 'Vellore',
    type: 'engineering'
  },
  {
    collegeCode: 'SRM',
    collegeName: 'SRM Institute of Science and Technology',
    emailDomain: 'srmist.edu.in',
    location: 'Chennai',
    type: 'engineering'
  },
  {
    collegeCode: 'BITS',
    collegeName: 'Birla Institute of Technology and Science',
    emailDomain: 'bits-pilani.ac.in',
    location: 'Pilani',
    type: 'engineering'
  },

  // IITs
  {
    collegeCode: 'IITM',
    collegeName: 'Indian Institute of Technology Madras',
    emailDomain: 'iitm.ac.in',
    location: 'Chennai',
    type: 'engineering'
  },
  {
    collegeCode: 'IITD',
    collegeName: 'Indian Institute of Technology Delhi',
    emailDomain: 'iitd.ac.in',
    location: 'Delhi',
    type: 'engineering'
  },
  {
    collegeCode: 'IITB',
    collegeName: 'Indian Institute of Technology Bombay',
    emailDomain: 'iitb.ac.in',
    location: 'Mumbai',
    type: 'engineering'
  },
  {
    collegeCode: 'IITK',
    collegeName: 'Indian Institute of Technology Kanpur',
    emailDomain: 'iitk.ac.in',
    location: 'Kanpur',
    type: 'engineering'
  },

  // NITs
  {
    collegeCode: 'NITT',
    collegeName: 'National Institute of Technology Tiruchirappalli',
    emailDomain: 'nitt.edu',
    location: 'Tiruchirappalli',
    type: 'engineering'
  },
  {
    collegeCode: 'NITD',
    collegeName: 'National Institute of Technology Delhi',
    emailDomain: 'nitdelhi.ac.in',
    location: 'Delhi',
    type: 'engineering'
  },

  // Arts & Science Colleges
  {
    collegeCode: 'LUC',
    collegeName: 'Loyola College',
    emailDomain: 'loyolacollege.edu',
    location: 'Chennai',
    type: 'arts'
  },
  {
    collegeCode: 'STELLA',
    collegeName: 'Stella Maris College',
    emailDomain: 'stellamarischennai.edu.in',
    location: 'Chennai',
    type: 'arts'
  },
  {
    collegeCode: 'MCC',
    collegeName: 'Madras Christian College',
    emailDomain: 'mcc.edu.in',
    location: 'Chennai',
    type: 'arts'
  },

  // Universities
  {
    collegeCode: 'AU',
    collegeName: 'Anna University',
    emailDomain: 'annauniv.edu',
    location: 'Chennai',
    type: 'engineering'
  },
  {
    collegeCode: 'DU',
    collegeName: 'University of Delhi',
    emailDomain: 'du.ac.in',
    location: 'Delhi',
    type: 'arts'
  },
  {
    collegeCode: 'JNU',
    collegeName: 'Jawaharlal Nehru University',
    emailDomain: 'jnu.ac.in',
    location: 'Delhi',
    type: 'arts'
  },

  // Management Colleges
  {
    collegeCode: 'IIMB',
    collegeName: 'Indian Institute of Management Bangalore',
    emailDomain: 'iimb.ac.in',
    location: 'Bangalore',
    type: 'management'
  },
  {
    collegeCode: 'IIMC',
    collegeName: 'Indian Institute of Management Calcutta',
    emailDomain: 'iimcal.ac.in',
    location: 'Kolkata',
    type: 'management'
  }
];

/**
 * Find college mapping by college name (fuzzy search)
 */
export const findCollegeByName = (collegeName: string): CollegeMapping | null => {
  const normalizedInput = collegeName.toLowerCase().trim();
  
  // Direct name match
  let college = COLLEGE_MAPPINGS.find(c => 
    c.collegeName.toLowerCase() === normalizedInput
  );
  
  if (college) return college;
  
  // Code match
  college = COLLEGE_MAPPINGS.find(c => 
    c.collegeCode.toLowerCase() === normalizedInput
  );
  
  if (college) return college;
  
  // Partial name match
  college = COLLEGE_MAPPINGS.find(c => 
    c.collegeName.toLowerCase().includes(normalizedInput) ||
    normalizedInput.includes(c.collegeName.toLowerCase())
  );
  
  if (college) return college;
  
  // Keywords match
  const keywords = normalizedInput.split(' ');
  college = COLLEGE_MAPPINGS.find(c => {
    const collegeWords = c.collegeName.toLowerCase().split(' ');
    return keywords.some(keyword => 
      collegeWords.some(word => word.includes(keyword) && keyword.length > 2)
    );
  });
  
  return college || null;
};

/**
 * Generate college officer email based on college domain
 */
export const generateCollegeOfficerEmail = (college: CollegeMapping): string => {
  // Generate typical college officer email patterns
  const patterns = [
    `scholarships@${college.emailDomain}`,
    `admissions@${college.emailDomain}`,
    `student.affairs@${college.emailDomain}`,
    `welfare@${college.emailDomain}`,
    `registrar@${college.emailDomain}`
  ];
  
  // Return the most common pattern for scholarships
  return patterns[0];
};

/**
 * Get all possible college officer email patterns for a college
 */
export const getCollegeOfficerEmails = (college: CollegeMapping): string[] => {
  return [
    `scholarships@${college.emailDomain}`,
    `admissions@${college.emailDomain}`,
    `student.affairs@${college.emailDomain}`,
    `welfare@${college.emailDomain}`,
    `registrar@${college.emailDomain}`,
    `principal@${college.emailDomain}`,
    `dean@${college.emailDomain}`
  ];
};

/**
 * Check if user email belongs to a specific college
 */
export const getUserCollege = (userEmail: string): CollegeMapping | null => {
  if (!userEmail) return null;
  
  const domain = userEmail.split('@')[1];
  if (!domain) return null;
  
  return COLLEGE_MAPPINGS.find(c => c.emailDomain === domain) || null;
};

/**
 * Get college suggestions for autocomplete
 */
export const getCollegeSuggestions = (query: string, limit: number = 10): CollegeMapping[] => {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase();
  
  return COLLEGE_MAPPINGS
    .filter(c => 
      c.collegeName.toLowerCase().includes(normalizedQuery) ||
      c.collegeCode.toLowerCase().includes(normalizedQuery) ||
      c.location.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, limit);
};

/**
 * Validate if college exists in our database
 */
export const isValidCollege = (collegeName: string): boolean => {
  return findCollegeByName(collegeName) !== null;
};