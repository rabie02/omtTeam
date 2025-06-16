
export const validateField = (name, value, context) => {
    const errors = {}; // Initialize an empty errors object

    // Handle top-level form fields (not part of contacts array)
    switch (name) {
        case 'name': // Updated: Validation for the single 'name' field
            if (!value || typeof value !== 'string' || value.trim().length < 2) {
                errors[name] = "Name is required and must be at least 2 characters.";
            }
            break;

        case 'email':
            if (!value || typeof value !== 'string' || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(value)) {
                errors[name] = "Please enter a valid email address.";
            }
            break;

        case 'mobile_phone': {
            const phoneDigits = value ? String(value).replace(/[^\d]/g, '') : '';
            if (!value || typeof value !== 'string' || !(/^\+?[\d\s()-]{10,20}$/).test(value) || phoneDigits.length < 10 || phoneDigits.length > 20) {
                errors[name] = "Please enter a valid phone number (10-20 digits).";
            }
            break;
        }

        case 'agreed':
            if (!value) { // 'value' here is the boolean from the checkbox
                errors[name] = "You must agree to the terms and conditions.";
            }
            break;

        case 'location': // This 'location' is likely for the main account's assumed primary contact location
            if (!value || typeof value !== 'object' || !value.latitude || !value.longitude) {
                errors[name] = "Please select a valid location.";
            }
            break;

        case 'password': // This password is not directly in formData, but might be passed for validation in some contexts
            if (!value || typeof value !== 'string' || value.length < 6) {
                errors[name] = "Password is required and must be at least 6 characters.";
            }
            break;

        default:
            // Handle fields for contacts array (e.g., 'contacts[0].firstName')
            if (name.startsWith('contacts[')) {
                const match = name.match(/contacts\[(\d+)\]\.(.+)/);
                if (match) {
                    const contactIndex = parseInt(match[1]);
                    const field = match[2]; // e.g., 'firstName', 'email', 'password', 'phone', 'location'
                    const contact = context.contacts[contactIndex];
                    const fieldValue = contact ? contact[field] : undefined; // Get the specific field's value from the contact

                    switch (field) {
                        case 'firstName':
                        case 'lastName':
                            if (!fieldValue || typeof fieldValue !== 'string' || fieldValue.trim().length < 2) {
                                errors[name] = `Contact ${contactIndex + 1} ${field.replace(/([A-Z])/g, ' $1').trim()} is required and must be at least 2 characters.`;
                            }
                            break;
                        case 'email':
                            if (!fieldValue || typeof fieldValue !== 'string' || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(fieldValue)) {
                                errors[name] = `Please enter a valid email address for contact ${contactIndex + 1}.`;
                            }
                            break;
                        case 'password':
                            if (!fieldValue || typeof fieldValue !== 'string' || fieldValue.length < 6) {
                                errors[name] = `Password for contact ${contactIndex + 1} is required and must be at least 6 characters.`;
                            }
                            break;
                        case 'phone': {
                            const phoneDigits = fieldValue ? String(fieldValue).replace(/[^\d]/g, '') : '';
                            if (!fieldValue || typeof fieldValue !== 'string' || !(/^\+?[\d\s()-]{10,20}$/).test(fieldValue) || phoneDigits.length < 10 || phoneDigits.length > 20) {
                                errors[name] = `Please enter a valid phone number (10-20 digits) for contact ${contactIndex + 1}.`;
                            }
                            break;
                        }
                        case 'location':
                            if (!fieldValue || typeof fieldValue !== 'object' || !fieldValue.latitude || !fieldValue.longitude) {
                                errors[name] = `Location is required for contact ${contactIndex + 1}. Please get their current location.`;
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
            break;
    }

    return errors; // Return the errors object (empty if valid)
};

/**
 * Validates all fields in the form data and contacts.
 * @param {object} context - An object containing the current formData, agreed state, and contacts array.
 * @returns {object} An object where keys are field names and values are error messages,
 * or an empty object if all fields are valid.
 */
export const validateAllFields = (context) => {
    let allErrors = {};
    const { formData, agreed, contacts } = context;

    // Validate main form fields
    const mainFieldsToValidate = [
        'name', // Updated from 'first_name', 'last_name'
        'email',
        'mobile_phone'
    ];

    mainFieldsToValidate.forEach(field => {
        const fieldErrors = validateField(field, formData[field], context);
        if (Object.keys(fieldErrors).length > 0) {
            allErrors = { ...allErrors, ...fieldErrors };
        }
    });

    // Validate agreement checkbox
    const agreedErrors = validateField('agreed', agreed, context);
    if (Object.keys(agreedErrors).length > 0) {
        allErrors = { ...allErrors, ...agreedErrors };
    }

    // Validate contacts
    contacts.forEach((contact, index) => {
        const contactFields = [
            'firstName', 'lastName', 'email', 'phone', 'password', 'location'
        ];

        contactFields.forEach(field => {
            const fieldName = `contacts[${index}].${field}`; // Construct the full field name
            const fieldValue = contact[field]; // Get the value for the specific contact field
            const fieldErrors = validateField(fieldName, fieldValue, context); // Pass full name and value
            if (Object.keys(fieldErrors).length > 0) {
                allErrors = { ...allErrors, ...fieldErrors };
            }
        });
    });

    return allErrors; // Returns an object containing all validation errors, or empty if valid
};
