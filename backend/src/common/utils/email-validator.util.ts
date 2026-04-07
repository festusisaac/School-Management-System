/**
 * Robust Email Validation Utility
 * Validates if a string follows a standard email format.
 * This is used to differentiate between real email addresses and 
 * system identifiers like Admission Numbers (e.g. PHJCS/2026/0001).
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // RFC 5322 Official Standard Regex (Simplified but effective for most cases)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return emailRegex.test(email);
}

/**
 * Filter an array of strings down to only valid email addresses.
 */
export function filterValidEmails(emails: string | string[]): string[] {
  const emailArray = Array.isArray(emails) ? emails : [emails];
  return emailArray.filter(email => isValidEmail(email));
}
