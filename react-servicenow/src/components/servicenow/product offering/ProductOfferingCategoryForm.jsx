// src/features/productOfferingCategory/AddCategoryForm.jsx
import React, { useState, useEffect } from 'react';

// Helper function (can be defined here or imported)
const generateCodeFromName = (name) => {
    if (!name || typeof name !== 'string' || name.trim() === '') return '';
    const words = name.toUpperCase().split(/[\s&\-,_]+/);
    let codePrefix = '';
    for (const word of words) {
        if (word.length > 0 && codePrefix.length < 8) {
        codePrefix += word.substring(0, Math.min(3, 8 - codePrefix.length));
        }
        if (codePrefix.length >= 8) break;
    }
    const codeNumber = '101'; // Simple example number
    return `${codePrefix}${codeNumber}`;
};

// Define prop types for clarity (optional but good practice, especially with TypeScript)
// interface AddCategoryFormProps {
//   onSubmit: (CategoryData: object) => Promise<void>; // Expects a promise for async handling
//   onCancel: () => void;
//   isLoading: boolean;
// }

function ProductOfferingCategoryForm({ onSubmit, onCancel, isLoading, initialData = null }) {
    const isEditMode = initialData !== null;
    // --- State for the Add Category Form ---
  const [formValues, setFormValues] = useState({
    name: '',
    start_date: '', // Consider setting default '' or today's date string 'YYYY-MM-DD'
    end_date: '',
    status: 'published', // Default status
    description: '',
    code: '',
    is_leaf: true
  });

   // --- Effect to pre-fill form on initial load OR when initialData changes ---
  useEffect(() => {
      if (isEditMode) {
          // Pre-fill form with data from the record being edited
          setFormValues({
              name: initialData.name || '',
              // Ensure dates are in YYYY-MM-DD format if coming from API differently
              start_date: initialData.start_date?.split(' ')[0] || '', // Handle potential time part
              end_date: initialData.end_date?.split(' ')[0] || '',     // Handle potential time part
              status: initialData.status || 'published',
              description: initialData.description || '',
              code: initialData.code || '' // Display existing code, but likely non-editable
              // Add any other relevant fields from your product object
          });
      } else {
          // Reset form for 'Add' mode (or rely on component unmount/key change)
           setFormValues({
              name: '',
              start_date: '',
              end_date: '',
              status: 'published',
              description: '',
              code: ''
          });
      }
  }, [initialData, isEditMode]); // Depend on initialData
  
  // --- Effect to auto-generate code ONLY in 'Add' mode ---
   useEffect(() => {
      // Only generate code if NOT in edit mode and name changes
      if (!isEditMode) {
          const generatedCode = generateCodeFromName(formValues.name);
          setFormValues(currentValues => ({ ...currentValues, code: generatedCode }));
      }
  }, [formValues.name, isEditMode]); // Add isEditMode dependency

  // --- Form Input Change Handler ---
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };

  // --- Form Submission Handler ---
  const handleSubmit = (event) => {
    event.preventDefault();
    // Basic Validation
    if (!formValues.name || !formValues.start_date || !formValues.status || !formValues.code) {
      alert('Please fill in Name, Start Date, and Status. Code should auto-generate.');
      return;
    }

    // Prepare data in the format API expects
    const newCategoryData = {
      name: formValues.name,
      start_date: formValues.start_date,
      end_date: formValues.end_date || null, // Adjust if API needs "" vs null
      status: formValues.status,
      description: formValues.description,
      code: formValues.code,
      is_leaf: true
    };

    

    // Call the onSubmit prop passed from the parent, which handles the dispatch
    onSubmit(newCategoryData);
     // Let the parent component handle closing the modal and resetting state after successful submission
  };

  // Basic Inline Styles (can be replaced with CSS/Tailwind)
  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333'};
  const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', fontSize: '1rem'};
  const buttonStyle = { padding: '10px 20px', marginRight: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' };
  const submitButtonStyle = { ...buttonStyle, backgroundColor: '#28a745', color: 'white' };
  const cancelButtonStyle = { ...buttonStyle, backgroundColor: '#6c757d', color: 'white' };

  return (
    <form onSubmit={handleSubmit}>
            {/* Change title based on mode */}
            <h2>{isEditMode ? 'Edit Catalog' : 'Add New Catalog'}</h2>
            <hr style={{margin: '15px 0'}}/>
            {/* Name */}
            <div>
                <label htmlFor="name" style={labelStyle}>Name:</label>
                <input type="text" id="name" name="name" value={formValues.name} onChange={handleInputChange} style={inputStyle} required disabled={isLoading} />
            </div>
            {/* Code - Display only in edit mode, maybe non-editable? */}
             {isEditMode && ( // Conditionally show code only when editing
                 <div>
                    <label htmlFor="code" style={labelStyle}>Code:</label>
                    <input type="text" id="code" name="code" value={formValues.code} style={{ ...inputStyle, backgroundColor: '#e9ecef' }} readOnly disabled={isLoading} />
                 </div>
             )}
             {/* Start Date */}
             <div>
                 <label htmlFor="start_date" style={labelStyle}>Start Date:</label>
                 <input type="date" id="start_date" name="start_date" value={formValues.start_date} onChange={handleInputChange} style={inputStyle} required disabled={isLoading} />
             </div>
             {/* End Date */}
             <div>
                 <label htmlFor="end_date" style={labelStyle}>End Date (Optional):</label>
                 <input type="date" id="end_date" name="end_date" value={formValues.end_date} onChange={handleInputChange} style={inputStyle} disabled={isLoading} />
             </div>
             {/* Status */}
             <div>
                <label htmlFor="status" style={labelStyle}>Status:</label>
                <select id="status" name="status" value={formValues.status} onChange={handleInputChange} style={inputStyle} required disabled={isLoading}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                    <option value="retired">Retired</option> {/* Added missing status */}
                </select>
             </div>
             {/* Description */}
             <div>
                <label htmlFor="description" style={labelStyle}>Description:</label>
                <textarea id="description" name="description" value={formValues.description} onChange={handleInputChange} style={inputStyle} rows="3" disabled={isLoading}></textarea>
            </div>
            {/* Buttons */}
            <div style={{marginTop: '20px', textAlign: 'right'}}>
                <button type="button" onClick={onCancel} style={cancelButtonStyle} disabled={isLoading}>Cancel</button>
                {/* Change button text based on mode */}
                <button type="submit" style={submitButtonStyle} disabled={isLoading}>{isLoading ? 'Saving...' : (isEditMode ? 'Update Category' : 'Create Category')}</button>
            </div>
        </form>
  );
}

export default ProductOfferingCategoryForm;