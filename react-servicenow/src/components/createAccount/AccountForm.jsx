import React from "react";
import { Input, Typography } from "@material-tailwind/react";

const AccountForm = ({
  formData,
  handleChange,
  handleBlur, // Now expects (e, fieldName)
  // Removed props: validationErrors, touchedFields, submitted as they are not used for display here
}) => {
  return (
    // Adjusted grid layout to make the single Name field span both columns
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Container for the Name input, spanning both columns */}
      <div className="flex flex-col gap-4 col-span-1 md:col-span-2">
        <div>
          {/* Label changed to 'Name' */}
          <label className="text-sm text-gray-700 block mb-1">Name</label>
          <Input
            name="name" // Changed the name attribute to 'name'
            value={formData.name} // Accessing the 'name' property from formData
            onChange={handleChange}
            onBlur={(e) => handleBlur(e, 'name')} // Pass event object 'e' and field name 'name'
            labelProps={{ className: "hidden" }}
            placeholder="Enter your full name" // Updated placeholder
          />
          {/* Typography error message removed as per previous instructions */}
        </div>
      </div>

      {/* Existing Email field */}
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm text-gray-700 block mb-1">Email</label>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={(e) => handleBlur(e, 'email')}
            labelProps={{ className: "hidden" }}
            placeholder="Enter email address"
          />
          {/* Typography error message removed */}
        </div>
      </div>

      {/* Existing Mobile Phone field */}
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm text-gray-700 block mb-1">Mobile Phone</label>
          <Input
            name="mobile_phone"
            type="tel"
            value={formData.mobile_phone}
            onChange={handleChange}
            onBlur={(e) => handleBlur(e, 'mobile_phone')}
            labelProps={{ className: "hidden" }}
            placeholder="Enter mobile phone number"
          />
          {/* Typography error message removed */}
        </div>
      </div>
    </div>
  );
};

export default AccountForm;
