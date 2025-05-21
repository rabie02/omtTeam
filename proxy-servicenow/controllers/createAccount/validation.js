const validateRegistrationInput = (data) => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    const phoneRegex = /^[+]?[0-9\s-()]{10,20}$/;
  
    // Required field validation
    if (!data.first_name?.trim() || data.first_name.trim().length < 2) {
      errors.first_name = "First name must be at least 2 characters";
    }
    
    if (!data.last_name?.trim() || data.last_name.trim().length < 2) {
      errors.last_name = "Last name must be at least 2 characters";
    }
    
    if (!data.email?.trim() || !emailRegex.test(data.email.trim())) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!data.mobile_phone?.trim() || !phoneRegex.test(data.mobile_phone.trim())) {
      errors.mobile_phone = "Please enter a valid phone number (10-20 digits)";
    }
    
    if (!data.password || data.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    if (data.type === 'company' && (!data.company_name?.trim() || data.company_name.trim().length < 2)) {
      errors.company_name = "Company name must be at least 2 characters";
    }
    
    if (!data.location || !data.location.latitude || !data.location.longitude) {
      errors.location = "Valid location coordinates are required";
    }
  
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData: {
        ...data,
        email: data.email?.trim().toLowerCase(),
        first_name: data.first_name?.trim(),
        last_name: data.last_name?.trim(),
        mobile_phone: data.mobile_phone?.trim(),
        company_name: data.company_name?.trim()
      }
    };
  };
  
  module.exports = {
    validateRegistrationInput
  };