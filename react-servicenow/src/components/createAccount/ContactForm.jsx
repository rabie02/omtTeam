import React from "react";
import { Button, Input, Typography } from "@material-tailwind/react";
import LocationForm from "./LocationForm";

const ContactForm = ({
  contacts,
  setContacts,
  API_URL,
  getCurrentLocation,
  locationLoading,
  setError,
  setValidationErrors,
  markFieldAsTouched,
  handleContactChange,
  handleBlur, // Now expects (e, fieldName)
}) => {
  const addContact = () => {
    setContacts([...contacts, {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      location: null
    }]);
  };

  const removeContact = (index) => {
    if (contacts.length <= 1) {
      setError("At least one contact is required.");
      return;
    }
    setError("");

    const newContacts = [...contacts];
    newContacts.splice(index, 1);
    setContacts(newContacts);

    setValidationErrors(prevErrors => {
      const updatedErrors = { ...prevErrors };
      for (const key in updatedErrors) {
        if (key.startsWith(`contacts[${index}]`)) {
          delete updatedErrors[key];
        }
      }
      return updatedErrors;
    });
  };

  // shouldShowError local helper is removed, as requested.
  // The 'error' prop on Input components and Typography error messages are also removed.

  return (
    <div className="space-y-6">
      {contacts.map((contact, index) => (
        <div key={index} className="border p-4 rounded-lg shadow-sm bg-white">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h6" className="text-gray-800">Contact #{index + 1}</Typography>
            {contacts.length > 1 && (
              <Button
                variant="text"
                color="red"
                size="sm"
                onClick={() => removeContact(index)}
                className="hover:bg-red-50 hover:text-red-700"
              >
                Remove
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <Input
                name="firstName"
                value={contact.firstName}
                onChange={(e) => handleContactChange(index, e)}
                onBlur={(e) => handleBlur(e, `contacts[${index}].firstName`)} // Pass event object 'e'
                // 'error' prop removed from Input
                labelProps={{ className: "hidden" }}
                placeholder="Contact first name"
              />
              {/* Typography error message removed */}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <Input
                name="lastName"
                value={contact.lastName}
                onChange={(e) => handleContactChange(index, e)}
                onBlur={(e) => handleBlur(e, `contacts[${index}].lastName`)} // Pass event object 'e'
                // 'error' prop removed from Input
                labelProps={{ className: "hidden" }}
                placeholder="Contact last name"
              />
              {/* Typography error message removed */}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                name="email"
                value={contact.email}
                onChange={(e) => handleContactChange(index, e)}
                onBlur={(e) => handleBlur(e, `contacts[${index}].email`)} // Pass event object 'e'
                // 'error' prop removed from Input
                labelProps={{ className: "hidden" }}
                placeholder="Contact email address"
              />
              {/* Typography error message removed */}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Input
                type="password"
                name="password"
                value={contact.password}
                onChange={(e) => handleContactChange(index, e)}
                onBlur={(e) => handleBlur(e, `contacts[${index}].password`)} // Pass event object 'e'
                // 'error' prop removed from Input
                labelProps={{ className: "hidden" }}
                placeholder="Contact password"
              />
              {/* Typography error message removed */}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input
                type="tel"
                name="phone"
                value={contact.phone}
                onChange={(e) => handleContactChange(index, e)}
                onBlur={(e) => handleBlur(e, `contacts[${index}].phone`)} // Pass event object 'e'
                // 'error' prop removed from Input
                labelProps={{ className: "hidden" }}
                placeholder="Contact phone number"
              />
              {/* Typography error message removed */}
            </div>
          </div>

          <Typography variant="h6" className="mb-2 text-gray-800">Contact Location</Typography>
          <LocationForm
            location={contact.location}
            setLocation={(loc) => {
              const newContacts = [...contacts];
              newContacts[index].location = loc;
              setContacts(newContacts);
              markFieldAsTouched(`contacts[${index}].location`);
            }}
            locationLoading={locationLoading}
            setLocationLoading={() => {}}
            setError={setError}
            setValidationErrors={setValidationErrors}
            markLocationAsTouched={() => markFieldAsTouched(`contacts[${index}].location`)}
            API_URL={API_URL}
            getCurrentLocation={() => getCurrentLocation(index)}
          />
          {/* Typography error message removed */}
        </div>
      ))}

      <Button
        variant="outlined"
        color="blue"
        onClick={addContact}
        className="mt-4 border-blue-500 text-blue-500 hover:bg-blue-50"
      >
        Add Another Contact
      </Button>
    </div>
  );
};

export default ContactForm;
