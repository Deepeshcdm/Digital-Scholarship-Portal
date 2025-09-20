// Smart Email Domain Generation System
export interface EmailGenerationResult {
  domain: string;
  officerEmail: string;
  confidence: number;
  alternativeEmails: string[];
}

/**
 * Generates email domain from college name using first letters
 * Example: "Sri Manakula Vinayagar Engineering College" → "smvec.ac.in"
 */
export const generateEmailDomain = (collegeName: string): EmailGenerationResult => {
  if (!collegeName) {
    return {
      domain: '',
      officerEmail: '',
      confidence: 0,
      alternativeEmails: []
    };
  }

  // Clean and normalize the college name
  const cleanName = collegeName
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .trim();

  // Words to skip in acronym generation
  const skipWords = [
    'of', 'and', 'the', 'for', 'in', 'at', 'by', 'with', 'from', 'to',
    'institute', 'university', 'college', 'school', 'academy', 'centre', 'center'
  ];

  // Split into words and filter
  const words = cleanName
    .split(/\s+/)
    .filter(word => word.length > 0 && !skipWords.includes(word));

  // Generate base acronym from first letters
  let baseAcronym = '';
  for (const word of words) {
    if (baseAcronym.length < 6) { // Limit to 6 characters
      baseAcronym += word.charAt(0);
    }
  }

  // Special cases for well-known institutions
  const specialCases: { [key: string]: string } = {
    'sri manakula vinayagar': 'smvec.ac.in',
    'college engineering guindy': 'ceg.ac.in',
    'psg college technology': 'psg.ac.in',
    'vellore institute technology': 'vit.ac.in',
    'anna university': 'annauniv.edu',
    'indian institute technology': 'iit.ac.in',
    'national institute technology': 'nit.edu'
  };

  // Check for special cases
  for (const [key, domain] of Object.entries(specialCases)) {
    if (cleanName.includes(key)) {
      return {
        domain: domain,
        officerEmail: `scholarships@${domain}`,
        confidence: 1.0,
        alternativeEmails: [
          `admissions@${domain}`,
          `student.affairs@${domain}`,
          `welfare@${domain}`,
          `registrar@${domain}`
        ]
      };
    }
  }

  // Generate final domain using acronym
  const finalDomain = `${baseAcronym}.ac.in`;
  
  return {
    domain: finalDomain,
    officerEmail: `scholarships@${finalDomain}`,
    confidence: 0.85,
    alternativeEmails: [
      `admissions@${finalDomain}`,
      `student.affairs@${finalDomain}`,
      `welfare@${finalDomain}`,
      `registrar@${finalDomain}`
    ]
  };
};

/**
 * Enhanced college name to email mapping with smart generation
 */
export const getCollegeEmailMapping = (collegeName: string): EmailGenerationResult => {
  return generateEmailDomain(collegeName);
};