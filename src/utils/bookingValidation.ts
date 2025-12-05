/**
 * Booking form validation utilities
 * Based on React Native validation logic, adapted for web
 */

export type Tourist = {
  surname: string;
  name: string;
  patronymic: string;
  birthday: string;
  gender: string | null;
  nationality_id: number | null | undefined;
  doc_type: string;
  passport_number: string | number;
  passport_expires_on: string;
  child?: boolean;
  child_age?: number;
  noPatronymic?: boolean; // Optional field to skip patronymic validation
};

export type TouristErrors = {
  surname?: string;
  name?: string;
  patronymic?: string;
  birthday?: string;
  gender?: string;
  nationality_id?: string;
  doc_type?: string;
  passport_number?: string;
  passport_expires_on?: string;
};

export type BookingFormData = {
  email: string;
  phone: string;
  tourists: Tourist[];
};

export type BookingValidationErrors = {
  email?: string;
  phone?: string;
  general?: string;
  tourists?: {
    [index: number]: TouristErrors;
  };
};

// Date format: DD.MM.YYYY (web app format)
const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;

/**
 * Helper function to check if string contains only Latin letters
 */
const isLatinOnly = (str: string): boolean => {
  return /^[A-Za-z\s\-'\.]+$/.test(str);
};

/**
 * Helper function to check if string contains only Cyrillic letters
 */
const isCyrillicOnly = (str: string): boolean => {
  return /^[А-Яа-яЁё\s\-'\.]+$/.test(str);
};

/**
 * Helper function to calculate age from birthday (DD.MM.YYYY format)
 */
const calculateAge = (birthday: string): number | null => {
  if (!dateRegex.test(birthday.trim())) return null;

  const [day, month, year] = birthday.split('.').map(Number);
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Helper function to check if date is at least 6 months in the future
 * Date format: DD.MM.YYYY
 */
const isAtLeastSixMonthsFuture = (dateStr: string): boolean => {
  if (!dateRegex.test(dateStr.trim())) return false;

  const [day, month, year] = dateStr.split('.').map(Number);
  const expirationDate = new Date(year, month - 1, day);
  expirationDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate date 6 months from today
  const sixMonthsFromToday = new Date(today);
  sixMonthsFromToday.setMonth(sixMonthsFromToday.getMonth() + 6);
  sixMonthsFromToday.setHours(0, 0, 0, 0);

  // Check if expiration date is on or after 6 months from today
  return expirationDate >= sixMonthsFromToday;
};

/**
 * Validates individual tourist fields
 */
export const validateTouristFields = (tourist: Tourist): TouristErrors => {
  const errors: TouristErrors = {};

  const isInternationalPassport =
    tourist.doc_type === 'international_passport' ||
    tourist.doc_type === 'international_passport_other';

  const isInternalPassport = tourist.doc_type === 'internal_passport';

  const isAdult = !tourist.child;

  // Validate surname
  if (!tourist.surname || typeof tourist.surname !== 'string' || tourist.surname.trim() === '') {
    errors.surname = 'Пожалуйста, заполните фамилию';
  } else {
    const surnameTrimmed = tourist.surname.trim();
    if (isInternationalPassport && !isLatinOnly(surnameTrimmed)) {
      errors.surname = 'Для заграничного паспорта используйте только латинские буквы';
    } else if (isInternalPassport && !isCyrillicOnly(surnameTrimmed)) {
      errors.surname = 'Для внутреннего паспорта используйте только кириллицу';
    }
  }

  // Validate name
  if (!tourist.name || typeof tourist.name !== 'string' || tourist.name.trim() === '') {
    errors.name = 'Пожалуйста, заполните имя';
  } else {
    const nameTrimmed = tourist.name.trim();
    if (isInternationalPassport && !isLatinOnly(nameTrimmed)) {
      errors.name = 'Для заграничного паспорта используйте только латинские буквы';
    } else if (isInternalPassport && !isCyrillicOnly(nameTrimmed)) {
      errors.name = 'Для внутреннего паспорта используйте только кириллицу';
    }
  }

  // Validate patronymic (only if noPatronymic is not true)
  if (!tourist.noPatronymic) {
    if (
      !tourist.patronymic ||
      typeof tourist.patronymic !== 'string' ||
      tourist.patronymic.trim() === ''
    ) {
      errors.patronymic = 'Пожалуйста, заполните отчество';
    } else {
      const patronymicTrimmed = tourist.patronymic.trim();
      if (isInternationalPassport && !isLatinOnly(patronymicTrimmed)) {
        errors.patronymic = 'Для заграничного паспорта используйте только латинские буквы';
      } else if (isInternalPassport && !isCyrillicOnly(patronymicTrimmed)) {
        errors.patronymic = 'Для внутреннего паспорта используйте только кириллицу';
      }
    }
  }

  // Validate birthday
  if (
    !tourist.birthday ||
    typeof tourist.birthday !== 'string' ||
    tourist.birthday.trim() === ''
  ) {
    errors.birthday = 'Пожалуйста, заполните дату рождения';
  } else if (!dateRegex.test(tourist.birthday.trim())) {
    errors.birthday = 'Введите дату в формате DD.MM.YYYY (например, 20.01.2025)';
  } else {
    // Validate age for adults (must be 18+)
    if (isAdult) {
      const age = calculateAge(tourist.birthday);
      if (age !== null && age < 18) {
        errors.birthday = 'Возраст должен быть не менее 18 лет';
      }
    }
  }

  // Validate gender
  if (!tourist.gender || tourist.gender === null || tourist.gender === '') {
    errors.gender = 'Пожалуйста, выберите пол';
  }

  // Validate nationality
  if (
    !tourist.nationality_id ||
    tourist.nationality_id === null ||
    tourist.nationality_id === undefined
  ) {
    errors.nationality_id = 'Пожалуйста, выберите гражданство';
  }

  // Validate document type
  if (
    !tourist.doc_type ||
    typeof tourist.doc_type !== 'string' ||
    tourist.doc_type.trim() === ''
  ) {
    errors.doc_type = 'Пожалуйста, выберите тип документа';
  }

  // Validate passport number based on document type
  if (!tourist.passport_number || tourist.passport_number.toString().trim() === '') {
    errors.passport_number = 'Пожалуйста, заполните серию и номер документа';
  } else {
    const passportNumberStr = tourist.passport_number.toString().replace(/\D/g, '');

    if (isInternationalPassport) {
      if (passportNumberStr.length !== 9) {
        errors.passport_number = 'Для заграничного паспорта необходимо 9 цифр';
      }
    } else if (isInternalPassport) {
      if (passportNumberStr.length !== 10) {
        errors.passport_number = 'Для внутреннего паспорта необходимо 10 цифр';
      }
    } else {
      // For other document types, allow 9 or 10 digits
      if (passportNumberStr.length !== 9 && passportNumberStr.length !== 10) {
        errors.passport_number = 'Серия и номер документа должна содержать 9 или 10 цифр';
      }
    }
  }

  // Validate passport expiration date
  if (
    !tourist.passport_expires_on ||
    typeof tourist.passport_expires_on !== 'string' ||
    tourist.passport_expires_on.trim() === ''
  ) {
    errors.passport_expires_on = 'Пожалуйста, заполните срок действия документа';
  } else if (!dateRegex.test(tourist.passport_expires_on.trim())) {
    errors.passport_expires_on = 'Введите дату в формате DD.MM.YYYY (например, 20.01.2025)';
  } else {
    // Validate that expiration date is at least 6 months in the future
    if (!isAtLeastSixMonthsFuture(tourist.passport_expires_on.trim())) {
      errors.passport_expires_on = 'Срок действия документа должен быть не менее чем через 6 месяцев';
    }
  }

  return errors;
};

/**
 * Validates email address
 */
export const validateEmail = (email: string): string | undefined => {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return 'Пожалуйста, заполните электронную почту';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Пожалуйста, введите корректный email адрес';
  }

  return undefined;
};

/**
 * Validates phone number (11 digits, starting with 7)
 */
export const validatePhone = (phone: string | number): string | undefined => {
  if (!phone || phone.toString().trim() === '') {
    return 'Пожалуйста, заполните телефон';
  }

  const phoneCleaned = phone.toString().replace(/\D/g, '');
  if (phoneCleaned.length !== 11 || !phoneCleaned.startsWith('7')) {
    return 'Пожалуйста, введите корректный номер телефона (11 цифр, начинается с 7)';
  }

  return undefined;
};

/**
 * Validates the entire booking form
 */
export const validateBookingForm = (formData: BookingFormData): BookingValidationErrors => {
  const validationErrors: BookingValidationErrors = {};

  // Validate email
  const emailError = validateEmail(formData.email);
  if (emailError) {
    validationErrors.email = emailError;
  }

  // Validate phone
  const phoneError = validatePhone(formData.phone);
  if (phoneError) {
    validationErrors.phone = phoneError;
  }

  // Validate tourists
  if (!formData.tourists || formData.tourists.length === 0) {
    validationErrors.general = 'Пожалуйста, добавьте данные туристов';
  } else {
    const touristErrors: NonNullable<BookingValidationErrors['tourists']> = {};

    for (let i = 0; i < formData.tourists.length; i++) {
      const tourist = formData.tourists[i];
      const errors = validateTouristFields(tourist);

      if (Object.keys(errors).length > 0) {
        touristErrors[i] = errors;
      }
    }

    if (Object.keys(touristErrors).length > 0) {
      validationErrors.tourists = touristErrors;
    }
  }

  return validationErrors;
};

/**
 * Checks if booking form is valid (returns boolean)
 */
export const isBookingFormValid = (formData: BookingFormData): boolean => {
  // Check email
  if (validateEmail(formData.email)) {
    return false;
  }

  // Check phone
  if (validatePhone(formData.phone)) {
    return false;
  }

  // Check tourists
  if (!formData.tourists || formData.tourists.length === 0) {
    return false;
  }

  // Use validateTouristFields for comprehensive validation
  for (let i = 0; i < formData.tourists.length; i++) {
    const tourist = formData.tourists[i];
    const errors = validateTouristFields(tourist);

    // If there are any errors, form is not valid
    if (Object.keys(errors).length > 0) {
      return false;
    }
  }

  return true;
};

