// Email validation - only allow specific domains
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'proton.me',
  'protonmail.com',
  'icloud.com',
];

export const isValidEmailDomain = (email: string): boolean => {
  if (!email) return false;
  const emailLower = email.toLowerCase().trim();
  const domain = emailLower.split('@')[1];
  if (!domain) return false;
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

export const getEmailDomainError = (language: 'bn' | 'en'): string => {
  return language === 'bn'
    ? 'শুধুমাত্র Gmail, Outlook, Hotmail, Yahoo, Proton Mail, iCloud ইমেইল গ্রহণযোগ্য'
    : 'Only Gmail, Outlook, Hotmail, Yahoo, Proton Mail, iCloud emails are allowed';
};

// Phone validation - 11 digits starting with 01
export const isValidBangladeshPhone = (phone: string): boolean => {
  if (!phone) return false;
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 11 && digitsOnly.startsWith('01');
};

export const getPhoneError = (language: 'bn' | 'en'): string => {
  return language === 'bn'
    ? 'ফোন নম্বর ০১ দিয়ে শুরু এবং ১১ সংখ্যার হতে হবে'
    : 'Phone number must be 11 digits starting with 01';
};
