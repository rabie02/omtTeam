import { useState, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from 'react-router-dom'; // Corrected import to 'react-router-dom'
import { createAccount } from "../../features/auth/authActions";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Tabs,
  TabsHeader,
  Tab,
  Tooltip,
  Button,
  Checkbox,
  Alert
} from "@material-tailwind/react";
import AccountForm from "./AccountForm"; // Assuming this path is correct
import ContactForm from "./ContactForm"; // Assuming this path is correct
import { validateField, validateAllFields } from "./validation"; // Assuming this path is correct

// API URL from environment variables
const API_URL = import.meta.env.VITE_BACKEND_URL;

const CreateAcc = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [activeTab, setActiveTab] = useState("account");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "", // Changed from first_name, last_name
    email: "",
    mobile_phone: "",
  });

  const [contacts, setContacts] = useState([{
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    location: null,
  }]);

  const dispatch = useDispatch();

  const markFieldAsTouched = useCallback((fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  const validateCurrentField = useCallback((name, value, contactIndex = null) => {
    const context = {
      formData,
      agreed,
      location: contacts[0]?.location || null,
      contacts
    };
    const fieldErrors = validateField(name, value, context, contactIndex);

    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (Object.keys(fieldErrors).length === 0) {
        delete newErrors[name];
      } else {
        newErrors[name] = fieldErrors[name];
      }
      return newErrors;
    });
    return fieldErrors;
  }, [formData, agreed, contacts]);

  const validateAllFormFields = useCallback(() => {
    const context = {
      formData,
      agreed,
      location: contacts[0]?.location || null,
      contacts
    };
    const errors = validateAllFields(context);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, agreed, contacts]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      markFieldAsTouched(name);
      validateCurrentField(name, value);
      return newData;
    });
  }, [markFieldAsTouched, validateCurrentField]);

  const handleContactChange = useCallback((index, e) => {
    const { name, value } = e.target;
    setContacts(prevContacts => {
      const newContacts = [...prevContacts];
      newContacts[index] = { ...newContacts[index], [name]: value };
      markFieldAsTouched(`contacts[${index}].${name}`);
      validateCurrentField(`contacts[${index}].${name}`, value, index);
      return newContacts;
    });
  }, [markFieldAsTouched, validateCurrentField]);

  const handleBlur = useCallback((e, fieldName) => {
    markFieldAsTouched(fieldName);

    setTimeout(() => {
      const domValue = e.target.value;

      if (fieldName.startsWith('contacts[')) {
        const match = fieldName.match(/contacts\[(\d+)\]\.(.+)/);
        if (match) {
          const contactIndex = parseInt(match[1]);
          const fieldKey = match[2];
          handleContactChange(contactIndex, { target: { name: fieldKey, value: domValue } });
        }
      } else {
        handleChange({ target: { name: fieldName, value: domValue } });
      }
    }, 100);
  }, [markFieldAsTouched, handleChange, handleContactChange]);


  const handleAgreedChange = useCallback((e) => {
    const checked = e.target.checked;
    setAgreed(checked);
    markFieldAsTouched('agreed');
    validateCurrentField('agreed', checked);
  }, [markFieldAsTouched, validateCurrentField]);

  const getCurrentLocation = useCallback(async (contactIndex = 0) => {
    setError("");
    setLocationLoading(true);
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`contacts[${contactIndex}].location`];
      return newErrors;
    });

    if (!navigator.geolocation) {
      const errorMessage = "Geolocation is not supported by this browser.";
      setError(errorMessage);
      setValidationErrors(prev => ({
        ...prev,
        [`contacts[${contactIndex}].location`]: errorMessage,
      }));
      markFieldAsTouched(`contacts[${contactIndex}].location`);
      setLocationLoading(false);
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const response = await fetch(
        `${API_URL}/api/reverse-geocode?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Unknown error fetching address' }));
        throw new Error(`Geocoding failed: ${errorBody.message || response.statusText}`);
      }

      const addressData = await response.json();

      const newLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: addressData.address || '',
        city: addressData.city || '',
        state: addressData.state || '',
        country: addressData.country || '',
        postalCode: addressData.postalCode || '',
      };

      setContacts(prevContacts => {
        const updatedContacts = [...prevContacts];
        if (updatedContacts[contactIndex]) {
          updatedContacts[contactIndex].location = newLocation;
        } else {
          updatedContacts[contactIndex] = {
            firstName: "", lastName: "", email: "", phone: "", password: "", location: newLocation
          };
        }
        return updatedContacts;
      });

      markFieldAsTouched(`contacts[${contactIndex}].location`);
      validateCurrentField(`contacts[${contactIndex}].location`, newLocation, contactIndex);
    } catch (error) {
      let errorMessage = "Could not get your location.";
      if (error.code === error.PERMISSION_DENIED) {
        errorMessage = "Geolocation permission denied. Please enable location services in your browser settings.";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMessage = "Location information is unavailable.";
      } else if (error.code === error.TIMEOUT) {
        errorMessage = "The request to get your location timed out.";
      } else if (error.message.includes("Geocoding failed")) {
        errorMessage = `Failed to get address details: ${error.message.replace("Geocoding failed:", "").trim()}`;
      } else {
        console.error("Geolocation or Geocoding error:", error);
        errorMessage = `An unexpected error occurred while getting location: ${error.message || ''}`;
      }

      setError(errorMessage);
      setValidationErrors(prev => ({
        ...prev,
        [`contacts[${contactIndex}].location`]: errorMessage,
      }));
      markFieldAsTouched(`contacts[${contactIndex}].location`);
    } finally {
      setLocationLoading(false);
    }
  }, [API_URL, markFieldAsTouched, validateCurrentField]);


  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitted(true);
    setError("");
    setSuccess("");

    if (!validateAllFormFields()) {
      setLoading(false);
      const errorFields = Object.keys(validationErrors);
      if (errorFields.length > 0) {
        if (errorFields.some(field =>
          ['name', 'email', 'mobile_phone'].includes(field) // Updated field check
        )) {
          setActiveTab("account");
        } else if (errorFields.some(field => field.startsWith('contacts['))) {
          setActiveTab("contacts");
        }
      }
      return;
    }

    const payload = {
      ...formData,
      // formData.name now contains the full name
      contacts: contacts.map(contact => ({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        password: contact.password,
        location: contact.location ? {
          latitude: contact.location.latitude,
          longitude: contact.location.longitude,
          address: contact.location.address || '',
          city: contact.location.city || '',
          state: contact.location.state || '',
          country: contact.location.country || '',
          postalCode: contact.location.postalCode || '',
        } : null
      })),
      token: token || null
    };

    try {
      await dispatch(createAccount(payload)).unwrap();
      setSuccess("Please check your inbox for confirmation");
    } catch (err) {
      console.error("Registration failed:", err);
      let displayError = "Registration failed. Please try again.";

      if (err && typeof err === 'object') {
        if (err.message) {
          displayError = err.message;
        } else if (err.errors && typeof err.errors === 'object') {
          setValidationErrors(prev => ({
            ...prev,
            ...err.errors
          }));
          displayError = "Please fix the errors indicated below.";
        } else if (typeof err === 'string') {
          if (err === 'email_exists') {
            displayError = "This email is already registered.";
            setValidationErrors(prev => ({ ...prev, email: displayError }));
            setActiveTab("account");
          } else {
            displayError = err;
          }
        } else {
          displayError = "An unexpected error occurred during registration.";
        }
      } else if (typeof err === 'string') {
        displayError = err;
      }

      setError(displayError);
    } finally {
      setLoading(false);
    }
  }, [
    formData,
    agreed,
    contacts,
    validateAllFormFields,
    validationErrors,
    dispatch,
    token
  ]);

  const isFormValid = useMemo(() => {
    const areAccountFieldsFilled =
      formData.name.trim() !== '' && // Updated check
      formData.email.trim() !== '' &&
      formData.mobile_phone.trim() !== '' &&
      agreed;

    const areContactsValid = contacts.every(contact =>
      contact.firstName.trim() !== '' &&
      contact.lastName.trim() !== '' &&
      contact.email.trim() !== '' &&
      contact.phone.trim() !== '' &&
      contact.password.trim() !== '' &&
      contact.location !== null
    );

    return Object.keys(validationErrors).length === 0 &&
      areAccountFieldsFilled &&
      areContactsValid;
  }, [formData, agreed, contacts, validationErrors]);

  const getButtonTooltip = useMemo(() => {
    if (loading) return "Processing...";
    if (isFormValid) return "";

    const errorMessages = new Set();

    Object.values(validationErrors).forEach(msg => {
      if (typeof msg === 'string' && msg.trim() !== '') {
        errorMessages.add(msg);
      }
    });

    if (!formData.name.trim()) errorMessages.add("Name is required."); // Updated tooltip message
    if (!formData.email.trim()) errorMessages.add("Email is required.");
    if (!formData.mobile_phone.trim()) errorMessages.add("Mobile phone is required.");
    if (!agreed) errorMessages.add("Agreement to terms is required.");

    contacts.forEach((contact, index) => {
      if (!contact.firstName.trim()) errorMessages.add(`Contact ${index + 1} first name is required.`);
      if (!contact.lastName.trim()) errorMessages.add(`Contact ${index + 1} last name is required.`);
      if (!contact.email.trim()) errorMessages.add(`Contact ${index + 1} email is required.`);
      if (!contact.phone.trim()) errorMessages.add(`Contact ${index + 1} phone is required.`);
      if (!contact.password.trim()) errorMessages.add(`Contact ${index + 1} password is required.`);
      if (!contact.location) errorMessages.add(`Contact ${index + 1} location is required.`);
    });

    const uniqueErrorMessages = [...errorMessages];

    return uniqueErrorMessages.length === 0
      ? "Please fill out all required fields."
      : `Please fix the following issues: ${uniqueErrorMessages.join(", ")}`;
  }, [loading, isFormValid, validationErrors, formData, agreed, contacts]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <Card className="w-full max-w-3xl shadow-lg rounded-xl overflow-hidden">
        <CardHeader floated={false} shadow={false} className="text-center p-8 bg-gradient-to-r from-blue-600 to-blue-400">
          <Typography variant="h3" color="white" className="mb-2 font-bold">
            Create Your Account
          </Typography>
          <Typography color="white" className="font-normal text-blue-100">
            Join our platform in just a few simple steps
          </Typography>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-6 p-8">
            {error && (
              <Alert color="red" className="mb-4 text-red-800 bg-red-50 border-l-4 border-red-500">
                {error}
              </Alert>
            )}
            {success && (
              <Alert color="green" className="mb-4 text-green-800 bg-green-50 border-l-4 border-green-500">
                {success}
              </Alert>
            )}

            <div className="mb-6">
              <Tabs value={activeTab} className="overflow-visible">
                <TabsHeader className="relative z-0 bg-blue-gray-50 p-0">
                  <Tab
                    value="account"
                    onClick={() => setActiveTab("account")}
                    className={`py-3 ${activeTab === "account" ? "text-white bg-blue-500" : ""}`}
                  >
                    Account Info
                  </Tab>
                  <Tab
                    value="contacts"
                    onClick={() => setActiveTab("contacts")}
                    className={`py-3 ${activeTab === "contacts" ? "text-white bg-blue-500" : ""}`}
                  >
                    Contacts
                  </Tab>
                </TabsHeader>
              </Tabs>
            </div>

            {activeTab === "account" && (
              <AccountForm
                formData={formData}
                handleChange={handleChange}
                handleBlur={handleBlur}
                validationErrors={validationErrors}
                touchedFields={touchedFields}
                submitted={submitted}
              />
            )}

            {activeTab === "contacts" && (
              <ContactForm
                contacts={contacts}
                setContacts={setContacts}
                validationErrors={validationErrors}
                touchedFields={touchedFields}
                API_URL={API_URL}
                getCurrentLocation={getCurrentLocation}
                locationLoading={locationLoading}
                setError={setError}
                setValidationErrors={setValidationErrors}
                markFieldAsTouched={markFieldAsTouched}
                handleContactChange={handleContactChange}
                handleBlur={handleBlur}
                submitted={submitted}
              />
            )}

            {/* Agreement Checkbox with conditional error display */}
            <div className="flex items-start gap-2 mt-4">
              <Checkbox
                checked={agreed}
                onChange={handleAgreedChange}
                ripple={false}
                containerProps={{ className: "p-0" }}
                className={`hover:before:content-none ${submitted && validationErrors.agreed ? 'border-red-500' : ''}`}
                label={
                  <Typography
                    variant="small"
                    className={submitted && validationErrors.agreed ? "text-red-500 font-normal" : "font-normal text-gray-700"}
                  >
                    I agree to the terms and conditions
                  </Typography>
                }
              />
            </div>
            {/* Agreement Checkbox Error - only show if submitted AND error exists */}
            {submitted && validationErrors.agreed && (
              <Typography variant="small" color="red" className="mt-1 pl-6">
                {validationErrors.agreed}
              </Typography>
            )}

            <Tooltip
              content={getButtonTooltip}
              placement="top"
              open={!isFormValid && !loading ? undefined : false}
              className="bg-gray-800 text-white text-xs px-3 py-2 rounded-md shadow-lg z-50 max-w-xs"
            >
              <div className="w-full">
                <Button
                  type="submit"
                  color="blue"
                  disabled={!isFormValid || loading}
                  fullWidth
                  className={`relative z-10 transition-opacity ${(!isFormValid || loading) ?
                    'cursor-not-allowed opacity-60' :
                    'cursor-pointer hover:opacity-90'}`}
                >
                  {loading ? "Registering..." : "Register"}
                </Button>
              </div>
            </Tooltip>
          </CardBody>
        </form>
      </Card>
    </div>
  );
};

export default CreateAcc;
