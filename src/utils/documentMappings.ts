/**
 * Document type and nationality mappings for booking form
 * Based on React Native implementation
 */

// Document type mapping (display name to API value)
export const documentTypeMap: Record<string, string> = {
  'Заграничный паспорт РФ': 'international_passport',
  'Внутренний паспорт РФ': 'internal_passport',
  'Загранпаспорт другого государства': 'international_passport_other',
};

// Document type reverse mapping (API value to display name)
export const documentTypeReverseMap: Record<string, string> = {
  'international_passport': 'Заграничный паспорт РФ',
  'internal_passport': 'Внутренний паспорт РФ',
  'international_passport_other': 'Загранпаспорт другого государства',
};

// Nationality mapping (display name to ID)
export const nationalityMap: Record<string, number> = {
  'Россия': 225,
  'Беларусь': 227,
  'Казахстан': 228,
};

// Nationality reverse mapping (ID to display name)
export const nationalityReverseMap: Record<number, string> = {
  225: 'Россия',
  227: 'Беларусь',
  228: 'Казахстан',
};

// Citizenship options for dropdown
export const citizenshipOptions = ['Россия', 'Беларусь', 'Казахстан'];

// Document type options for dropdown
export const documentTypeOptions = [
  'Заграничный паспорт РФ',
  'Внутренний паспорт РФ',
  'Загранпаспорт другого государства',
];

/**
 * Get placeholder text for name fields based on document type
 */
export const getNamePlaceholder = (
  field: 'name' | 'surname' | 'patronymic',
  docType: string
): string => {
  const isInternationalPassport =
    docType === 'international_passport' || docType === 'international_passport_other';
  const isInternalPassport = docType === 'internal_passport';

  if (isInternationalPassport) {
    const placeholders = {
      name: 'Имя латиницей',
      surname: 'Фамилия латиницей',
      patronymic: 'Отчество латиницей',
    };
    return placeholders[field];
  } else if (isInternalPassport) {
    const placeholders = {
      name: 'Имя кириллицей',
      surname: 'Фамилия кириллицей',
      patronymic: 'Отчество кириллицей',
    };
    return placeholders[field];
  }

  // Default to Latin
  const placeholders = {
    name: 'Имя латиницей',
    surname: 'Фамилия латиницей',
    patronymic: 'Отчество латиницей',
  };
  return placeholders[field];
};

/**
 * Get passport placeholder based on document type
 */
export const getPassportPlaceholder = (docType: string): string => {
  const isInternationalPassport =
    docType === 'international_passport' || docType === 'international_passport_other';
  const isInternalPassport = docType === 'internal_passport';

  if (isInternationalPassport) {
    return 'Серия и номер документа (9 цифр)';
  } else if (isInternalPassport) {
    return 'Серия и номер документа (10 цифр)';
  }
  return 'Серия и номер документа';
};

/**
 * Get max length for passport number based on document type
 */
export const getPassportMaxLength = (docType: string): number => {
  const isInternationalPassport =
    docType === 'international_passport' || docType === 'international_passport_other';
  const isInternalPassport = docType === 'internal_passport';

  if (isInternationalPassport) {
    return 9;
  } else if (isInternalPassport) {
    return 10;
  }
  // For other document types, allow up to 10 digits
  return 10;
};

