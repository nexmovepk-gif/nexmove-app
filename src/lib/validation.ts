/**
 * NexMove Global Form Validation Library
 * Centralized validation helpers for strict format enforcement across all forms.
 * All functions return { valid: boolean; message: string }.
 */

export interface ValidationResult {
  valid: boolean
  message: string
}

// ── Name ─────────────────────────────────────────────────────────────────────
/** Allows letters (including Urdu-transliteration chars), spaces, hyphens, dots. */
export function validateName(value: string): ValidationResult {
  if (!value || !value.trim()) return { valid: false, message: 'This field is required.' }
  if (/\d/.test(value)) return { valid: false, message: 'Incorrect format detected: numbers are not allowed in names.' }
  if (/[^a-zA-Z\s\-'.]/.test(value)) return { valid: false, message: 'Incorrect format detected: only letters, spaces, hyphens, and dots allowed.' }
  if (value.trim().length < 2) return { valid: false, message: 'Name must be at least 2 characters.' }
  return { valid: true, message: '' }
}

// ── Email ─────────────────────────────────────────────────────────────────────
export function validateEmail(value: string): ValidationResult {
  if (!value || !value.trim()) return { valid: false, message: 'Email is required.' }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  if (!emailRegex.test(value)) return { valid: false, message: 'Incorrect format detected: enter a valid email address.' }
  return { valid: true, message: '' }
}

// ── Password ──────────────────────────────────────────────────────────────────
export function validatePassword(value: string): ValidationResult {
  if (!value) return { valid: false, message: 'Password is required.' }
  if (value.length < 8) return { valid: false, message: 'Password must be at least 8 characters.' }
  if (!/[A-Z]/.test(value)) return { valid: false, message: 'Password must include at least one uppercase letter.' }
  if (!/[0-9]/.test(value)) return { valid: false, message: 'Password must include at least one number.' }
  return { valid: true, message: '' }
}

// ── Phone ─────────────────────────────────────────────────────────────────────
/** Validates Pakistani / international phone numbers (10–15 digits, optional +/country code). */
export function validatePhone(value: string): ValidationResult {
  if (!value || !value.trim()) return { valid: false, message: 'Phone number is required.' }
  const phoneRegex = /^\+?[0-9\s\-()]{10,17}$/
  if (!phoneRegex.test(value)) return { valid: false, message: 'Incorrect format detected: enter a valid phone number (10–15 digits).' }
  if (/[a-zA-Z]/.test(value)) return { valid: false, message: 'Incorrect format detected: phone numbers cannot contain letters.' }
  return { valid: true, message: '' }
}

// ── CNIC / NICOP ──────────────────────────────────────────────────────────────
/** Validates 13-digit Pakistani CNIC format XXXXX-XXXXXXX-X or plain 13 digits. */
export function validateCNIC(value: string): ValidationResult {
  if (!value || !value.trim()) return { valid: false, message: 'CNIC / NICOP is required.' }
  const clean = value.replace(/-/g, '')
  if (!/^\d{13}$/.test(clean)) return { valid: false, message: 'Incorrect format detected: CNIC must be exactly 13 digits (e.g. 35201-1234567-1).' }
  return { valid: true, message: '' }
}

// ── Passport ──────────────────────────────────────────────────────────────────
/** Validates Pakistani or international passport formats (6–9 alphanumeric chars). */
export function validatePassport(value: string): ValidationResult {
  if (!value || !value.trim()) return { valid: false, message: 'Passport number is required.' }
  if (!/^[A-Z0-9]{6,12}$/i.test(value.trim())) return { valid: false, message: 'Incorrect format detected: enter a valid passport number (6–12 alphanumeric).' }
  return { valid: true, message: '' }
}

// ── NTN ───────────────────────────────────────────────────────────────────────
/** Validates Pakistani NTN (7 or 8 digits). */
export function validateNTN(value: string): ValidationResult {
  if (!value || !value.trim()) return { valid: false, message: 'NTN is required.' }
  const clean = value.replace(/-/g, '')
  if (!/^\d{7,8}$/.test(clean)) return { valid: false, message: 'Incorrect format detected: NTN must be 7–8 digits.' }
  return { valid: true, message: '' }
}

// ── Coordinates ───────────────────────────────────────────────────────────────
export function validateLatitude(value: string): ValidationResult {
  if (!value || !value.trim()) return { valid: false, message: 'Latitude is required.' }
  const num = parseFloat(value)
  if (isNaN(num)) return { valid: false, message: 'Incorrect format detected: latitude must be a number.' }
  if (num < -90 || num > 90) return { valid: false, message: 'Incorrect format detected: latitude must be between -90 and 90.' }
  return { valid: true, message: '' }
}

export function validateLongitude(value: string): ValidationResult {
  if (!value || !value.trim()) return { valid: false, message: 'Longitude is required.' }
  const num = parseFloat(value)
  if (isNaN(num)) return { valid: false, message: 'Incorrect format detected: longitude must be a number.' }
  if (num < -180 || num > 180) return { valid: false, message: 'Incorrect format detected: longitude must be between -180 and 180.' }
  return { valid: true, message: '' }
}

// ── Numeric Amount ────────────────────────────────────────────────────────────
export function validateNumericAmount(value: string, label = 'Amount', min = 0): ValidationResult {
  if (!value || !value.trim()) return { valid: false, message: `${label} is required.` }
  const num = parseFloat(value.replace(/,/g, ''))
  if (isNaN(num)) return { valid: false, message: `Incorrect format detected: ${label} must be a number.` }
  if (num <= min) return { valid: false, message: `${label} must be greater than ${min}.` }
  return { valid: true, message: '' }
}

// ── Investment Amount ─────────────────────────────────────────────────────────
export function validateInvestmentAmount(value: string): ValidationResult {
  if (!value || !value.trim()) return { valid: false, message: 'Investment amount is required.' }
  const num = parseFloat(value.replace(/,/g, ''))
  if (isNaN(num)) return { valid: false, message: 'Incorrect format detected: investment amount must be a number.' }
  if (num < 100000) return { valid: false, message: 'Minimum investment amount is PKR 100,000.' }
  if (num > 10_000_000_000) return { valid: false, message: 'Investment amount exceeds the maximum allowed range.' }
  return { valid: true, message: '' }
}

// ── Experience Years ──────────────────────────────────────────────────────────
export function validateExperienceYears(value: string): ValidationResult {
  if (!value || !value.trim()) return { valid: false, message: 'Experience years is required.' }
  const num = parseInt(value, 10)
  if (isNaN(num)) return { valid: false, message: 'Incorrect format detected: experience must be a number.' }
  if (num < 0 || num > 60) return { valid: false, message: 'Incorrect format detected: experience years must be between 0 and 60.' }
  return { valid: true, message: '' }
}

// ── URL / Portfolio Link ───────────────────────────────────────────────────────
export function validateURL(value: string): ValidationResult {
  if (!value || !value.trim()) return { valid: true, message: '' } // optional by default
  try {
    new URL(value)
    return { valid: true, message: '' }
  } catch {
    return { valid: false, message: 'Incorrect format detected: enter a valid URL (e.g. https://behance.net/…).' }
  }
}

// ── Required Text (generic) ────────────────────────────────────────────────────
export function validateRequired(value: string, label = 'This field'): ValidationResult {
  if (!value || !value.trim()) return { valid: false, message: `${label} is required.` }
  return { valid: true, message: '' }
}

// ── File Validation ───────────────────────────────────────────────────────────
const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
const ALLOWED_DOCUMENT_EXTS = ['pdf', 'jpg', 'jpeg', 'png', 'webp']
const ALLOWED_PORTFOLIO_EXTS = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'zip']

export interface FileValidationResult {
  valid: boolean
  message: string
}

export function validateImageFile(file: File | null, maxMB = 5): FileValidationResult {
  if (!file) return { valid: false, message: 'An image file is required.' }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
    return { valid: false, message: `Incorrect format detected: only image files (${ALLOWED_IMAGE_EXTS.join(', ')}) are allowed.` }
  }
  if (!file.type.startsWith('image/')) {
    return { valid: false, message: 'Incorrect format detected: file content is not a valid image.' }
  }
  if (file.size === 0) return { valid: false, message: 'File appears to be empty. Please upload a valid image.' }
  if (file.size > maxMB * 1024 * 1024) return { valid: false, message: `File size must be under ${maxMB}MB.` }
  return { valid: true, message: '' }
}

export function validateDocumentFile(file: File | null, maxMB = 10): FileValidationResult {
  if (!file) return { valid: false, message: 'A document file is required.' }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_DOCUMENT_EXTS.includes(ext)) {
    return { valid: false, message: `Incorrect format detected: only documents (${ALLOWED_DOCUMENT_EXTS.join(', ')}) are allowed.` }
  }
  if (file.size === 0) return { valid: false, message: 'File appears to be empty. Please upload a valid document.' }
  if (file.size > maxMB * 1024 * 1024) return { valid: false, message: `File size must be under ${maxMB}MB.` }
  return { valid: true, message: '' }
}

export function validatePortfolioFile(file: File | null, maxMB = 20): FileValidationResult {
  if (!file) return { valid: false, message: 'A portfolio file is required.' }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_PORTFOLIO_EXTS.includes(ext)) {
    return { valid: false, message: `Incorrect format detected: only portfolio files (${ALLOWED_PORTFOLIO_EXTS.join(', ')}) are allowed. Random files are not accepted.` }
  }
  if (file.size === 0) return { valid: false, message: 'File appears to be empty. Please upload a valid portfolio file.' }
  if (file.size > maxMB * 1024 * 1024) return { valid: false, message: `File size must be under ${maxMB}MB.` }
  return { valid: true, message: '' }
}
