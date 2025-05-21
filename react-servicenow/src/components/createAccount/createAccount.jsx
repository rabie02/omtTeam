import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ReactDOM from 'react-dom';
import { useDispatch } from "react-redux";
import { createAccount } from "../../features/auth/authActions";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Checkbox,
  Button,
  Typography,
  Select,
  Option,
  Alert,
  Tabs,
  TabsHeader,
  Tab,
  Tooltip,
} from "@material-tailwind/react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Constants for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s()-]{10,20}$/;
const MIN_NAME_LENGTH = 2;
const MIN_PASSWORD_LENGTH = 6;

// Portal component to render Leaflet controls outside the React tree
const ReactControlPortal = ({ children, container }) => {
  if (!container) return null;
  return ReactDOM.createPortal(children, container);
};

// Custom Leaflet control to hold the "Use My Location" button
const LocationControl = React.memo(({ position, onButtonClick, loading }) => {
  const map = useMap();
  const controlContainerRef = useRef(null);

  useEffect(() => {
    const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
    controlContainerRef.current = div;

    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    const CustomControl = L.Control.extend({
      options: { position },
      onAdd: () => div,
      onRemove: () => {
        if (div?.parentNode) {
          div.parentNode.removeChild(div);
        }
      }
    });

    const control = new CustomControl();
    map.addControl(control);

    return () => {
      if (map?.removeControl && control) {
        map.removeControl(control);
      }
    };
  }, [map, position]);

  return (
    <ReactControlPortal container={controlContainerRef.current}>
      <Button
        onClick={onButtonClick}
        variant="filled"
        color="blue"
        size="sm"
        className="shadow-md text-xs px-2 py-1"
        disabled={loading}
      >
        {loading ? "Getting Location..." : "Use My Location"}
      </Button>
    </ReactControlPortal>
  );
});

const LocationMarker = React.memo(({ location, setLocation, setLocationLoading, setError, setValidationErrors, markLocationAsTouched }) => {
  const map = useMap();
  
  // Initialize map events
  useMapEvents({
    async click(e) {
      setLocationLoading(true);
      setError("");
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.location;
        return newErrors;
      });

      try {
        const { lat, lng } = e.latlng;
        const response = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ message: 'Unknown error fetching address' }));
          throw new Error(`Geocoding failed: ${errorBody.message || response.statusText}`);
        }

        const addressData = await response.json();

        setLocation({
          latitude: lat,
          longitude: lng,
          address: addressData.address || '',
          city: addressData.city || '',
          state: addressData.state || '',
          country: addressData.country || '',
          postalCode: addressData.postalCode || '',
        });

        markLocationAsTouched();
        
        // Smoothly center on clicked location with zoom level 11
        map.flyTo([lat, lng], 11, {
          animate: true,
          duration: 1
        });
      } catch (err) {
        console.error("Reverse geocoding error:", err);
        const errorMessage = `Could not get address details for this location: ${err.message || 'Network error'}`;
        setError(errorMessage);
        setValidationErrors(prev => ({
          ...prev,
          location: errorMessage,
        }));
      } finally {
        setLocationLoading(false);
      }
    }
  });

  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      map.flyTo([location.latitude, location.longitude], 11, {
        animate: true,
        duration: 1
      });
    }
  }, [location?.latitude, location?.longitude, map]);

  return location?.latitude && location?.longitude ? (
    <Marker position={[location.latitude, location.longitude]} />
  ) : null;
});

export function CreateAcc() {
  const [type, setType] = useState("individual");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [, setCenterMap] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({
    first_name: false,
    last_name: false,
    email: false,
    password: false,
    mobile_phone: false,
    companyName: false,
    agreed: false,
    location: false
  });

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    mobile_phone: "",
  });

  const dispatch = useDispatch();

  const markFieldAsTouched = useCallback((fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  const markLocationAsTouched = useCallback(() => {
    markFieldAsTouched('location');
  }, [markFieldAsTouched]);

  // Memoized validation functions
  const validateField = useCallback((name, value, currentFormData, currentType, currentCompanyName, currentAgreed, currentLocation) => {
    const errors = { ...validationErrors };

    switch (name) {
      case 'first_name':
        errors.first_name = !value || value.trim().length < MIN_NAME_LENGTH 
          ? "First name is required and must be at least 2 characters." 
          : undefined;
        break;
      case 'last_name':
        errors.last_name = !value || value.trim().length < MIN_NAME_LENGTH
          ? "Last name is required and must be at least 2 characters."
          : undefined;
        break;
      case 'email':
        errors.email = !value || !EMAIL_REGEX.test(value)
          ? "Please enter a valid email address."
          : undefined;
        break;
      case 'password':
        errors.password = !value || value.length < MIN_PASSWORD_LENGTH
          ? "Password is required and must be at least 6 characters."
          : undefined;
        break;
      case 'mobile_phone': {
        const phoneDigits = value?.replace(/[^\d]/g, '');
        errors.mobile_phone = !value || !PHONE_REGEX.test(value) || !phoneDigits || phoneDigits.length < 10 || phoneDigits.length > 20
          ? "Please enter a valid phone number (10-20 digits)."
          : undefined;
        break;
      }
      case 'companyName':
        errors.companyName = currentType === "company" && (!value || value.trim().length < MIN_NAME_LENGTH)
          ? "Company name is required and must be at least 2 characters."
          : undefined;
        break;
      case 'agreed':
        errors.agreed = !value
          ? "You must agree to the terms and conditions."
          : undefined;
        break;
      case 'location':
        errors.location = !currentLocation || !currentLocation.latitude || !currentLocation.longitude
          ? "Please select your location on the map."
          : undefined;
        break;
      default:
        break;
    }

    // Clean up undefined values
    Object.keys(errors).forEach(key => errors[key] === undefined && delete errors[key]);
    
    setValidationErrors(errors);
    return errors;
  }, [validationErrors]);

  const validateAllFields = useCallback(() => {
    const errors = {};
    const { first_name, last_name, email, password, mobile_phone } = formData;

    if (!first_name || first_name.trim().length < MIN_NAME_LENGTH) {
      errors.first_name = "First name is required and must be at least 2 characters.";
    }

    if (!last_name || last_name.trim().length < MIN_NAME_LENGTH) {
      errors.last_name = "Last name is required and must be at least 2 characters.";
    }

    if (!EMAIL_REGEX.test(email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      errors.password = "Password is required and must be at least 6 characters.";
    }

    const phoneDigits = mobile_phone.replace(/[^\d]/g, '');
    if (!mobile_phone || !PHONE_REGEX.test(mobile_phone) || phoneDigits.length < 10 || phoneDigits.length > 20) {
      errors.mobile_phone = "Please enter a valid phone number (10-20 digits).";
    }

    if (type === "company" && (!companyName || companyName.trim().length < MIN_NAME_LENGTH)) {
      errors.companyName = "Company name is required and must be at least 2 characters.";
    }

    if (!agreed) {
      errors.agreed = "You must agree to the terms and conditions.";
    }

    if (!location || !location.latitude || !location.longitude) {
      errors.location = "Please select your location on the map.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, type, companyName, agreed, location]);

  // Handlers
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prevData => {
      const newData = { ...prevData, [name]: value };
      validateField(name, value, newData, type, companyName, agreed, location);
      return newData;
    });
  }, [type, companyName, agreed, location, validateField]);

  const handleBlur = useCallback((fieldName) => {
    markFieldAsTouched(fieldName);
  }, [markFieldAsTouched]);

  const handleCompanyNameChange = useCallback((e) => {
    const value = e.target.value;
    setCompanyName(value);
    validateField('companyName', value, formData, type, value, agreed, location);
  }, [formData, type, agreed, location, validateField]);

  const handleAgreedChange = useCallback((e) => {
    const checked = e.target.checked;
    setAgreed(checked);
    markFieldAsTouched('agreed');
    validateField('agreed', checked, formData, type, companyName, checked, location);
  }, [formData, type, companyName, location, validateField, markFieldAsTouched]);

  const handleTypeChange = useCallback((value) => {
    setType(value);
    validateField('companyName', companyName, formData, value, companyName, agreed, location);
  }, [companyName, formData, agreed, location, validateField]);

  const getCurrentLocation = useCallback(async () => {
    setError("");
    setLocationLoading(true);
    setValidationErrors(prev => {
      const newErrors = {...prev};
      delete newErrors.location;
      return newErrors;
    });

    if (!navigator.geolocation) {
      const errorMessage = "Geolocation is not supported by this browser.";
      setError(errorMessage);
      setValidationErrors(prev => ({
        ...prev,
        location: errorMessage,
      }));
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
        `/api/reverse-geocode?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Unknown error fetching address' }));
        throw new Error(`Geocoding failed: ${errorBody.message || response.statusText}`);
      }

      const addressData = await response.json();

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: addressData.address || '',
        city: addressData.city || '',
        state: addressData.state || '',
        country: addressData.country || '',
        postalCode: addressData.postalCode || '',
      });

      markLocationAsTouched();
      setCenterMap(true);
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
        location: errorMessage,
      }));
      setLocation(null);
    } finally {
      setLocationLoading(false);
    }
  }, [markLocationAsTouched]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
  
    // Mark all fields as touched before validation
    setTouchedFields({
      first_name: true,
      last_name: true,
      email: true,
      password: true,
      mobile_phone: true,
      companyName: true,
      agreed: true,
      location: true
    });
  
    if (!validateAllFields()) {
      setLoading(false);
      const errorFields = Object.keys(validationErrors);
      if (errorFields.length > 0) {
        if (errorFields.some(field => ['first_name', 'last_name', 'email', 'mobile_phone'].includes(field))) {
          setActiveTab("personal");
        } else if (errorFields.some(field => ['password', 'companyName'].includes(field))) {
          setActiveTab("account");
        } else if (errorFields.includes('location')) {
          setActiveTab("location");
        }
      }
      return;
    }
  
    const payload = {
      ...formData,
      type,
      company_name: type === "company" ? companyName : null,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        country: location.country || '',
        postalCode: location.postalCode || '',
      },
    };
  
    try {
      await dispatch(createAccount(payload)).unwrap();
      setSuccess("please check your inbox for confirmation");
      // You can navigate here if needed
      // navigate('/some-path');
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
          const backendErrorFields = Object.keys(err.errors);
          if (backendErrorFields.length > 0) {
            if (backendErrorFields.some(field => ['first_name', 'last_name', 'email', 'mobile_phone'].includes(field))) {
              setActiveTab("personal");
            } else if (backendErrorFields.some(field => ['password', 'company_name'].includes(field))) {
              setActiveTab("account");
            } else if (backendErrorFields.includes('location')) {
              setActiveTab("location");
            }
          }
        } else if (typeof err === 'string') {
          if (err === 'email_exists') {
            displayError = "This email is already registered.";
            setValidationErrors(prev => ({...prev, email: displayError}));
            setActiveTab("personal");
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
  }, [formData, type, companyName, location, validateAllFields, validationErrors, dispatch]);

  // Helper function to determine if error should be shown
  const shouldShowError = (fieldName) => {
    return touchedFields[fieldName] && validationErrors[fieldName];
  };

  // Memoized derived values
  const isFormValid = useMemo(() => {
    const areRequiredFieldsFilled =
      formData.first_name.trim() !== '' &&
      formData.last_name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.password.trim() !== '' &&
      formData.mobile_phone.trim() !== '' &&
      agreed &&
      (type !== 'company' || companyName.trim() !== '') &&
      location?.latitude !== undefined && 
      location?.longitude !== undefined;

    return areRequiredFieldsFilled && Object.keys(validationErrors).length === 0;
  }, [formData, agreed, type, companyName, location, validationErrors]);

  const getButtonTooltip = useMemo(() => {
    if (loading) return "Processing...";
    if (isFormValid) return "";

    const errorMessages = Object.values(validationErrors);

    if (!formData.first_name.trim() && !validationErrors.first_name) errorMessages.push("First name is required.");
    if (!formData.last_name.trim() && !validationErrors.last_name) errorMessages.push("Last name is required.");
    if (!formData.email.trim() && !validationErrors.email) errorMessages.push("Email is required.");
    if (!formData.password.trim() && !validationErrors.password) errorMessages.push("Password is required.");
    if (!formData.mobile_phone.trim() && !validationErrors.mobile_phone) errorMessages.push("Mobile phone is required.");
    if (type === 'company' && !companyName.trim() && !validationErrors.companyName) errorMessages.push("Company name is required.");
    if (!agreed && !validationErrors.agreed) errorMessages.push("Agreement to terms is required.");
    if ((!location?.latitude || !location?.longitude) && !validationErrors.location) errorMessages.push("Location on Map is required.");

    const uniqueErrorMessages = [...new Set(errorMessages)];

    return uniqueErrorMessages.length === 0 
      ? "Please fill out all required fields." 
      : `Please fix the following issues: ${uniqueErrorMessages.join(", ")}`;
  }, [loading, isFormValid, validationErrors, formData, type, companyName, agreed, location]);

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
          <CardBody className="flex flex-col gap-6 p-8 tab">
            {error && <Alert 
              color="red" 
              className="mb-4 text-red-800 bg-red-50 border-l-4 border-red-500">
            {error}
            </Alert>}
            {success && <Alert 
              color="green"
              className="mb-4 text-green-800 bg-green-50 border-l-4 border-green-500">
              {success}
            </Alert>}

            <div className="mb-6">
              <Tabs value={activeTab} className="overflow-visible">
                <TabsHeader className="relative z-0 bg-blue-gray-50 p-0">
                  <Tab
                    value="personal"
                    onClick={() => setActiveTab("personal")}
                    className={`py-3 ${activeTab === "personal" ? "text-white bg-blue-500" : ""}`}
                  >
                    Personal Info
                  </Tab>
                  <Tab
                    value="account"
                    onClick={() => setActiveTab("account")}
                    className={`py-3 ${activeTab === "account" ? "text-white bg-blue-500" : ""}`}
                  >
                    Account Details
                  </Tab>
                  <Tab
                    value="location"
                    onClick={() => setActiveTab("location")}
                    className={`py-3 ${activeTab === "location" ? "text-white bg-blue-500" : ""}`}
                  >
                    Location
                  </Tab>
                </TabsHeader>
              </Tabs>
            </div>

            {activeTab === "personal" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">First Name</label>
                    <Input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      onBlur={() => handleBlur('first_name')}
                      error={shouldShowError('first_name')}
                      labelProps={{ className: "hidden" }}
                      placeholder="Enter first name"
                    />
                    {shouldShowError('first_name') && (
                      <Typography variant="small" color="red" className="mt-1">
                        {validationErrors.first_name}
                      </Typography>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Last Name</label>
                    <Input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      onBlur={() => handleBlur('last_name')}
                      error={shouldShowError('last_name')}
                      labelProps={{ className: "hidden" }}
                      placeholder="Enter last name"
                    />
                    {shouldShowError('last_name') && (
                      <Typography variant="small" color="red" className="mt-1">
                        {validationErrors.last_name}
                      </Typography>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Email</label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur('email')}
                      error={shouldShowError('email')}
                      labelProps={{ className: "hidden" }}
                      placeholder="Enter email address"
                    />
                    {shouldShowError('email') && (
                      <Typography variant="small" color="red" className="mt-1">
                        {validationErrors.email}
                      </Typography>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Mobile Phone</label>
                    <Input
                      name="mobile_phone"
                      type="tel"
                      value={formData.mobile_phone}
                      onChange={handleChange}
                      onBlur={() => handleBlur('mobile_phone')}
                      error={shouldShowError('mobile_phone')}
                      labelProps={{ className: "hidden" }}
                      placeholder="Enter mobile phone number"
                    />
                    {shouldShowError('mobile_phone') && (
                      <Typography variant="small" color="red" className="mt-1">
                        {validationErrors.mobile_phone}
                      </Typography>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Password</label>
                    <Input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur('password')}
                      error={shouldShowError('password')}
                      labelProps={{ className: "hidden" }}
                      placeholder="Enter password"
                    />
                    {shouldShowError('password') && (
                      <Typography variant="small" color="red" className="mt-1">
                        {validationErrors.password}
                      </Typography>
                    )}
                    <small className="text-gray-500">Password must be at least 6 characters</small>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Registering as</label>
                    <Select value={type} onChange={handleTypeChange} labelProps={{ className: "hidden" }}>
                      <Option value="individual">Individual</Option>
                      <Option value="company">Company</Option>
                    </Select>
                  </div>

                  {type === "company" && (
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Company Name</label>
                      <Input
                        value={companyName}
                        onChange={handleCompanyNameChange}
                        onBlur={() => handleBlur('companyName')}
                        error={shouldShowError('companyName')}
                        labelProps={{ className: "hidden" }}
                        placeholder="Enter company name"
                      />
                      {shouldShowError('companyName') && (
                        <Typography variant="small" color="red" className="mt-1">
                          {validationErrors.companyName}
                        </Typography>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "location" && (
              <div className="flex flex-col gap-4">
                <Typography variant="h6">Select your location on the map</Typography>
                <Typography variant="small" color="gray">
                  (Click on the map or use "Use My Location")
                </Typography>

                <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300">
                  <MapContainer
                    center={[35.6895, -0.6]}
                    zoom={6}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker
                      location={location}
                      setLocation={(loc) => {
                        setLocation(loc);
                        markLocationAsTouched();
                      }}
                      setLocationLoading={setLocationLoading}
                      setError={setError}
                      setValidationErrors={setValidationErrors}
                      markLocationAsTouched={markLocationAsTouched}
                    />
                    <LocationControl
                      position="topright"
                      onButtonClick={getCurrentLocation}
                      loading={locationLoading}
                    />
                  </MapContainer>
                </div>

                {shouldShowError('location') && (
                  <Typography variant="small" color="red" className="mt-1 text-center">
                    {validationErrors.location}
                  </Typography>
                )}

                {location?.latitude && location?.longitude && (
                  <div className="text-sm text-gray-600 mt-2 text-center">
                    Selected Location:
                    {location.address && <span> {location.address},</span>}
                    {location.city && <span> {location.city},</span>}
                    {location.state && <span> {location.state},</span>}
                    {location.country && <span> {location.country}</span>}
                    {location.postalCode && <span> {location.postalCode}</span>}
                    {!(location.address || location.city || location.state || location.country || location.postalCode) && (
                      <span> Latitude: {location.latitude.toFixed(4)}, Longitude: {location.longitude.toFixed(4)}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start gap-2 mt-4">
              <Checkbox
                checked={agreed}
                onChange={handleAgreedChange}
                ripple={false}
                containerProps={{ className: "p-0" }}
                className={`hover:before:content-none ${shouldShowError('agreed') ? 'border-red-500' : ''}`}
                label={
                  <Typography variant="small" className={shouldShowError('agreed') ? "text-red-500 font-normal" : "font-normal text-gray-700"}>
                    I agree to the terms and conditions
                  </Typography>
                }
              />
            </div>
            {shouldShowError('agreed') && (
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
        
        <CardFooter className="pt-0 text-center">
          <Typography variant="small" className="mt-4 flex justify-center">
            Already have an account? {" "}
            <Typography
              as="a"
              href="/login"
              variant="small"
              color="blue"
              className="ml-1 font-bold"
            >
              Sign In
            </Typography>
          </Typography>
        </CardFooter>
      </Card>
    </div>
  );
}

export default CreateAcc;