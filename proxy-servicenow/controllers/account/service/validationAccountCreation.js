// controllers/account/validationAccountCreation.js

const validateRegistrationInput = (data) => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    const phoneRegex = /^[+]?[0-9\s-()]{10,20}$/;

    // Validate 'name' (assuming frontend sends a 'name' field for the main account)
    if (!data.name?.trim() || data.name.trim().length < 2) {
        errors.name = "Full name must be at least 2 characters";
    }

    // Email validation for main account
    if (!data.email?.trim() || !emailRegex.test(data.email.trim())) {
        errors.email = "Please enter a valid email address";
    }

    // Mobile phone validation for main account
    if (!data.mobile_phone?.trim() || !phoneRegex.test(data.mobile_phone.trim())) {
        errors.mobile_phone = "Please enter a valid phone number (10-20 digits)";
    }

    // Validate 'contacts' array and each contact's fields (password and location included here)
    if (!Array.isArray(data.contacts) || data.contacts.length === 0) {
        errors.contacts = "At least one contact is required.";
    } else {
        data.contacts.forEach((contact, index) => {
            // Validate firstName for each contact
            if (!contact.firstName?.trim() || contact.firstName.trim().length < 2) {
                errors[`contacts[${index}].firstName`] = `Contact ${index + 1} first name must be at least 2 characters.`;
            }
            // Validate lastName for each contact
            if (!contact.lastName?.trim() || contact.lastName.trim().length < 2) {
                errors[`contacts[${index}].lastName`] = `Contact ${index + 1} last name must be at least 2 characters.`;
            }
            // Validate email for each contact
            if (!contact.email?.trim() || !emailRegex.test(contact.email.trim())) {
                errors[`contacts[${index}].email`] = `Please enter a valid email address for contact ${index + 1}.`;
            }
            // Validate phone for each contact
            if (!contact.phone?.trim() || !phoneRegex.test(contact.phone.trim())) {
                errors[`contacts[${index}].phone`] = `Please enter a valid phone number (10-20 digits) for contact ${index + 1}.`;
            }
            // Validate password for each contact
            if (!contact.password || contact.password.length < 6) {
                errors[`contacts[${index}].password`] = `Password for contact ${index + 1} must be at least 6 characters.`;
            }
            // Validate location for each contact
            if (!contact.location || typeof contact.location !== 'object' || !contact.location.latitude || !contact.location.longitude) {
                errors[`contacts[${index}].location`] = `Valid location coordinates are required for contact ${index + 1}.`;
            }
        });
    }
    // --- FOR DEBUGGING: Keep these console logs if you still need to verify ---
    console.log("Backend validation errors generated:", errors);
    // --- END DEBUGGING LOGS ---

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        sanitizedData: {
            ...data, // Keep all original data
            name: data.name?.trim(), // Ensure 'name' is trimmed if it exists
            email: data.email?.trim().toLowerCase(), // Ensure email is trimmed and lowercased
            mobile_phone: data.mobile_phone?.trim(), // Ensure mobile_phone is trimmed
            // Passwords and locations are sanitized/validated within the contacts array itself
            contacts: data.contacts?.map(contact => ({
                ...contact,
                firstName: contact.firstName?.trim(),
                lastName: contact.lastName?.trim(),
                email: contact.email?.trim().toLowerCase(),
                phone: contact.phone?.trim(),
            })),
            company_name: data.company_name?.trim() // Trim if it exists, otherwise undefined
        }
    };
};

module.exports = {
    validateRegistrationInput
};
