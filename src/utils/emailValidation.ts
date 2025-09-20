// Email domain validation for role-based registration
export interface DomainValidationResult {
  isValid: boolean;
  detectedRole?: string;
  message?: string;
}

// Define valid email domains for each role
export const EMAIL_DOMAIN_RULES = {
  student: {
    domains: [
      // Only personal email providers for students (NOT institutional domains)
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
      'yahoo.co.in', 'rediffmail.com', 'protonmail.com', 'zoho.com',
      // Student-specific subdomains (with student identifier)
      'student.', 'stu.', 'stud.', 's.'
    ],
    description: 'Students must use personal email addresses (gmail.com, yahoo.com, etc.) or student-specific domains'
  },
  college_officer: {
    domains: [
      // Educational institution staff domains
      '.edu', '.edu.in', '.ac.in', '.university', '.college',
      // Staff/faculty specific domains
      'faculty.', 'staff.', 'admin.', 'college.', 'university.',
      // Indian educational institution domains
      'iitd.ac.in', 'iitb.ac.in', 'iitk.ac.in', 'iitm.ac.in', 'iisc.ac.in',
      'du.ac.in', 'jnu.ac.in', 'bhu.ac.in', 'amu.ac.in', 'nit.ac.in',
      'vit.ac.in', 'manipal.edu', 'bits-pilani.ac.in', 'dtu.ac.in','smvec.ac.in'
    ],
    description: 'College officers must use official educational institution email addresses'
  },
  govt_officer: {
    domains: [
      // Government domains
      '.gov', '.gov.in', '.nic.in', '.net.in',
      // Central government
      'nic.in', 'gov.in', 'mhrd.gov.in', 'education.gov.in', 'ugc.ac.in',
      // State government examples
      'delhi.gov.in', 'maharashtra.gov.in', 'karnataka.gov.in', 'tamilnadu.gov.in',
      'kerala.gov.in', 'gujarat.gov.in', 'rajasthan.gov.in', 'punjab.gov.in',
      // Specific departments
      'mhrd.', 'education.', 'scholarship.', 'welfare.', 'social.',
      'tribal.', 'minority.', 'bc.', 'dept.'
    ],
    description: 'Government officers must use official government email addresses (.gov.in, .nic.in)'
  }
};

/**
 * Validates if an email domain is appropriate for the selected role
 */
export const validateEmailDomain = (email: string, selectedRole: string): DomainValidationResult => {
  if (!email || !selectedRole) {
    return {
      isValid: false,
      message: 'Email and role are required'
    };
  }

  const emailLower = email.toLowerCase();
  const domain = emailLower.split('@')[1];
  
  if (!domain) {
    return {
      isValid: false,
      message: 'Invalid email format'
    };
  }

  const roleRules = EMAIL_DOMAIN_RULES[selectedRole as keyof typeof EMAIL_DOMAIN_RULES];
  
  if (!roleRules) {
    return {
      isValid: false,
      message: 'Invalid role selected'
    };
  }

  // Check if domain matches any of the valid patterns for the role
  const isValidDomain = roleRules.domains.some(validDomain => {
    if (validDomain.startsWith('.')) {
      // Extension match (e.g., .edu, .gov.in)
      return domain.endsWith(validDomain.substring(1));
    } else if (validDomain.endsWith('.')) {
      // Prefix match (e.g., student., faculty.)
      return domain.startsWith(validDomain);
    } else {
      // Exact match or contains
      return domain === validDomain || domain.includes(validDomain);
    }
  });

  if (!isValidDomain) {
    return {
      isValid: false,
      message: `Invalid email domain for ${selectedRole}. ${roleRules.description}`
    };
  }

  return {
    isValid: true,
    detectedRole: selectedRole
  };
};

/**
 * Auto-detects the most likely role based on email domain
 */
export const detectRoleFromEmail = (email: string): DomainValidationResult => {
  if (!email) {
    return {
      isValid: false,
      message: 'Email is required'
    };
  }

  const emailLower = email.toLowerCase();
  const domain = emailLower.split('@')[1];
  
  if (!domain) {
    return {
      isValid: false,
      message: 'Invalid email format'
    };
  }

  // Check government domains first (most specific)
  if (EMAIL_DOMAIN_RULES.govt_officer.domains.some(validDomain => {
    if (validDomain.startsWith('.')) {
      return domain.endsWith(validDomain.substring(1));
    } else if (validDomain.endsWith('.')) {
      return domain.startsWith(validDomain);
    } else {
      return domain === validDomain || domain.includes(validDomain);
    }
  })) {
    return {
      isValid: true,
      detectedRole: 'govt_officer',
      message: 'Government email detected'
    };
  }

  // Check college officer domains (staff/faculty domains)
  // Must have specific indicators for staff/faculty
  if (domain.includes('faculty.') || domain.includes('staff.') || domain.includes('admin.') || 
      domain.includes('professor.') || domain.includes('teacher.') || domain.includes('lecturer.')) {
    return {
      isValid: true,
      detectedRole: 'college_officer',
      message: 'Educational institution staff email detected'
    };
  }

  // Check for institutional domains WITHOUT staff indicators - these should be students
  if (domain.endsWith('.edu') || domain.endsWith('.edu.in') || domain.endsWith('.ac.in') ||
      domain.includes('iit') || domain.includes('nit') || domain.includes('university') ||
      domain.includes('college')) {
    
    // If it has student indicators, classify as student
    if (emailLower.includes('student') || emailLower.includes('stu.') || emailLower.includes('stud.')) {
      return {
        isValid: true,
        detectedRole: 'student',
        message: 'Student email detected'
      };
    } else {
      // Institutional domain without student identifier should be college officer
      return {
        isValid: true,
        detectedRole: 'college_officer',
        message: 'Educational institution email detected'
      };
    }
  }

  // Personal email domains - default to student
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  if (personalDomains.some(personalDomain => domain === personalDomain)) {
    return {
      isValid: true,
      detectedRole: 'student',
      message: 'Personal email detected - suitable for student registration'
    };
  }

  return {
    isValid: false,
    message: 'Email domain not recognized. Please use an appropriate email address for your role.'
  };
};

/**
 * Gets example email formats for a given role
 */
export const getEmailExamples = (role: string): string[] => {
  switch (role) {
    case 'student':
      return [
        'john.doe@gmail.com',
        'student123@yahoo.com',
        'jane.smith@outlook.com'
      ];
    case 'college_officer':
      return [
        'prof.kumar@university.edu.in',
        'admin@college.ac.in',
        'faculty.sharma@iitd.ac.in'
      ];
    case 'govt_officer':
      return [
        'officer.name@education.gov.in',
        'admin@scholarship.gov.in',
        'welfare@delhi.gov.in'
      ];
    default:
      return [];
  }
};