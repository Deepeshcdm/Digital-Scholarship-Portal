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

  // If acronym is too short, add vowels or significant letters
  if (baseAcronym.length < 3) {
    for (const word of words) {
      if (baseAcronym.length >= 4) break;
      for (let i = 1; i < word.length && baseAcronym.length < 4; i++) {
        const char = word.charAt(i);
        if ('aeiou'.includes(char) || word.length <= 4) {
          baseAcronym += char;
        }
      }
    }
  }

  // Determine domain suffix based on type
  let suffix = 'ac.in'; // Default for Indian institutions
  
  // Check for specific types
  if (cleanName.includes('engineering') || cleanName.includes('technology')) {
    suffix = 'ac.in';
  } else if (cleanName.includes('medical') || cleanName.includes('health')) {
    suffix = 'med.in';
  } else if (cleanName.includes('management') || cleanName.includes('business')) {
    suffix = 'edu.in';
  } else if (cleanName.includes('arts') || cleanName.includes('science')) {
    suffix = 'ac.in';
  }

  // Special cases for well-known institutions
  const specialCases: { [key: string]: string } = {
    'iit': 'iit.ac.in',
    'nit': 'nit.edu',
    'iisc': 'iisc.ac.in',
    'iim': 'iim.ac.in',
    'vit': 'vit.ac.in',
    'bits': 'bits-pilani.ac.in',
    'srm': 'srmist.edu.in'
  };

  // Check for special cases
  for (const [key, domain] of Object.entries(specialCases)) {
    if (cleanName.includes(key)) {
      return {
        domain: domain,
        officerEmail: `scholarships@${domain}`,
        confidence: 0.95,
        alternativeEmails: [
          `admissions@${domain}`,
          `student.affairs@${domain}`,
          `welfare@${domain}`,
          `registrar@${domain}`
        ]
      };
    }
  }

  // Generate final domain
  const finalDomain = `${baseAcronym}.${suffix}`;
  
  // Calculate confidence based on various factors
  let confidence = 0.7; // Base confidence
  
  if (words.length >= 3) confidence += 0.1; // Good number of words
  if (baseAcronym.length >= 4) confidence += 0.1; // Good acronym length
  if (baseAcronym.length <= 6) confidence += 0.05; // Not too long
  
  // Generate alternative email patterns
  const alternativeEmails = [
    `admissions@${finalDomain}`,
    `student.affairs@${finalDomain}`,
    `welfare@${finalDomain}`,
    `registrar@${finalDomain}`,
    `principal@${finalDomain}`,
    `dean@${finalDomain}`,
    `office@${finalDomain}`
  ];

  return {
    domain: finalDomain,
    officerEmail: `scholarships@${finalDomain}`,
    confidence: Math.min(confidence, 0.95),
    alternativeEmails
  };
};

/**
 * Enhanced college name to email mapping with smart generation
 */
export const getCollegeEmailMapping = (collegeName: string): EmailGenerationResult => {
  // First check if it's a known college
  const knownMappings: { [key: string]: EmailGenerationResult } = {
    'sri manakula vinayagar engineering college': {
      domain: 'smvec.ac.in',
      officerEmail: 'scholarships@smvec.ac.in',
      confidence: 1.0,
      alternativeEmails: [
        'admissions@smvec.ac.in',
        'student.affairs@smvec.ac.in',
        'welfare@smvec.ac.in'
      ]
    },
    'college of engineering guindy': {
      domain: 'ceg.ac.in',
      officerEmail: 'scholarships@ceg.ac.in',
      confidence: 1.0,
      alternativeEmails: [
        'admissions@ceg.ac.in',
        'dean@ceg.ac.in'
      ]
    },
    'psg college of technology': {
      domain: 'psg.ac.in',
      officerEmail: 'scholarships@psg.ac.in',
      confidence: 1.0,
      alternativeEmails: [
        'admissions@psg.ac.in',
        'student.welfare@psg.ac.in'
      ]
    },
    'vellore institute of technology': {
      domain: 'vit.ac.in',
      officerEmail: 'scholarships@vit.ac.in',
      confidence: 1.0,
      alternativeEmails: [
        'admissions@vit.ac.in',
        'student.affairs@vit.ac.in'
      ]
    }
  };

  // Check known mappings first
  const normalizedName = collegeName.toLowerCase().trim();
  if (knownMappings[normalizedName]) {
    return knownMappings[normalizedName];
  }

  // Use smart generation for unknown colleges
  return generateEmailDomain(collegeName);
};

/**
 * Validate if generated email domain looks reasonable
 */
export const validateGeneratedEmail = (domain: string): boolean => {
  const domainRegex = /^[a-z0-9]+(\.[a-z]{2,3}){1,2}$/;
  return domainRegex.test(domain) && domain.length >= 6 && domain.length <= 30;
};

/**
 * Generate multiple email options for a college
 */
export const generateEmailOptions = (collegeName: string): string[] => {
  const result = getCollegeEmailMapping(collegeName);
  return [result.officerEmail, ...result.alternativeEmails].filter(email => email);
};

/**
 * Test the email generation with examples
 */
export const testEmailGeneration = () => {
  const testCases = [
    'Sri Manakula Vinayagar Engineering College',
    'Anna University',
    'Indian Institute of Technology Madras',
    'Vellore Institute of Technology',
    'PSG College of Technology',
    'Loyola College',
    'Stella Maris College',
    'National Institute of Technology Tiruchirappalli',
    'College of Engineering Guindy',
    'Madras Institute of Technology'
  ];

  console.log('Email Generation Test Results:');
  testCases.forEach(collegeName => {
    const result = getCollegeEmailMapping(collegeName);
    console.log(`\n${collegeName}:`);
    console.log(`  Domain: ${result.domain}`);
    console.log(`  Officer Email: ${result.officerEmail}`);
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`  Alternatives: ${result.alternativeEmails.slice(0, 2).join(', ')}`);
  });
};

// Export test function for development
if (typeof window !== 'undefined') {
  (window as any).testEmailGeneration = testEmailGeneration;
}