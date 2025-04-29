
import React, { useState, useEffect } from 'react';



function ProductOfferingForm({ onSubmit, onCancel, isLoading, specs=[], specsLoading, cats=[], catsLoading, channels=[], channelsLoading, initialData = null }) {

  const isEditMode = initialData !== null; // Determine if we are editing

  // --- State for the Add ProductOffering Form ---
  const [formValues, setFormValues] = useState({
    name: '',
    start_date: '',
    end_date: '',
    description: '',
    recurring_price: '', // Initialize as string for input control
    non_recurring_price: '', // Initialize as string
    po_term: 'not_applicable', // Default value
    p_spec: '', // Product Specification ID
    channel: '', // Channel ID
    category: '', // Category ID
});


// --- Effect to pre-fill form for EDIT mode ---
useEffect(() => {
  if (isEditMode) {
      // Find recurring and non-recurring prices from the array
      const recurring = initialData.productOfferingPrice?.find(p => p.priceType === 'recurring');
      const nonRecurring = initialData.productOfferingPrice?.find(p => p.priceType === 'nonRecurring');

      setFormValues({
          name: initialData.name || '',
          // Ensure dates are in YYYY-MM-DD format
          start_date: initialData.validFor?.startDateTime?.split('T')[0] || '', // Handle potential timestamp
          end_date: initialData.validFor?.endDateTime?.split('T')[0] || '',     // Handle potential timestamp
          description: initialData.description || '',
          recurring_price: recurring?.price?.taxIncludedAmount?.value ?? '', // Use nullish coalescing
          non_recurring_price: nonRecurring?.price?.taxIncludedAmount?.value ?? '', // Use nullish coalescing
          po_term: initialData.productOfferingTerm || 'not_applicable',
          p_spec: initialData.productSpecification?.id || '', // Get ID from nested object
          channel: initialData.channel?.[0]?.id || '', // Get ID from first item in array
          category: initialData.category[0]?.id || '', // Get ID from nested object
      });
  } else {
       // Reset to defaults when initialData is null (e.g., switching from edit to add)
       // This might be redundant if using a key prop on the form component
       setFormValues({
          name: '', start_date: '', end_date: '', description: '',
          recurring_price: '', non_recurring_price: '', po_term: 'not_applicable',
          p_spec: '', channel: '', category: ''
      });
  }
}, [initialData, isEditMode]); // Re-run if initialData changes


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

    // --- Basic Validation ---
    // Add checks for new required fields like p_spec, channel, category if needed
    if (!formValues.name || !formValues.start_date|| !formValues.p_spec || !formValues.channel || !formValues.category) {
        alert('Please fill in all required fields.');
        return;
    }
    // Add validation for prices if needed (e.g., ensure they are numbers >= 0)
    const recurringPrice = parseFloat(formValues.recurring_price || 0);
    const nonRecurringPrice = parseFloat(formValues.non_recurring_price || 0);

    if (isNaN(recurringPrice) || isNaN(nonRecurringPrice) || recurringPrice < 0 || nonRecurringPrice < 0) {
        alert('Please enter valid non-negative values for prices.');
        return;
    }

    // --- Find the selected Product Specification object ---
    const selectedSpec = specs.find(spec => (spec.id || spec.sys_id) === formValues.p_spec);

    if (!selectedSpec) {
        alert('Selected Product Specification not found. Please re-select.');
        console.error("Could not find spec with ID:", formValues.p_spec, "in", specs);
        return;
    }


    const prodSpecCharValueUse = selectedSpec.productSpecCharacteristic?.map(specChar => {
      // Determine the value array for this characteristic in the PO
      // Strategy: Use the *first* value defined in the spec characteristic, if any.
      // This matches the examples for "Data Plan" and "Social Media Option".
      // For characteristics like "ISP Email Account" where the spec has [], this will result in [].
      // This does NOT allow for user selection/input of characteristic values via the current form.
      const valueToUse = (specChar.productSpecCharacteristicValue && specChar.productSpecCharacteristicValue.length > 0)
          ? [specChar.productSpecCharacteristicValue[0]] // Take the first predefined value
          : []; // Use empty array if no predefined values

      return {
          name: specChar.name,
          description: specChar.description,
          valueType: specChar.valueType,
          validFor: specChar.validFor, // Copy validity from the characteristic definition
          productSpecCharacteristicValue: valueToUse, // Use the determined value array
          productSpecification: { // Reference the parent product spec
              id: selectedSpec.id || selectedSpec.sys_id,
              name: selectedSpec.name,
              version: selectedSpec.version,
              internalVersion: selectedSpec.internalVersion,
              internalId: selectedSpec.internalId || selectedSpec.id || selectedSpec.sys_id // Use best available ID
          }
      };
  }) || [];

    // --- Prepare data object (payload) ---
        // Structure should match what the onSubmit prop expects (likely the API format)
        const productOfferingDataPayload = {
          name: formValues.name,
          version: initialData?.version || "1", // Keep existing version if editing, else default
          internalVersion: initialData?.internalVersion || "1", // Keep existing version
          description: formValues.description,
          lastUpdate: new Date().toISOString(), // Always update timestamp on save

          validFor: {
              startDateTime: formValues.start_date,
              endDateTime: formValues.end_date || null
          },
          productOfferingTerm: formValues.po_term,
          productOfferingPrice: [
              { priceType: "recurring", price: { taxIncludedAmount: { unit: "USD", value: recurringPrice }}},
              { priceType: "nonRecurring", price: { taxIncludedAmount: { unit: "USD", value: nonRecurringPrice }}}
          ],
          // Include simplified objects for relations, assuming API only needs ID on update
          // Or include full details if needed by API/thunk
          productSpecification: {
            // Assuming the selected value 'formValues.p_spec' is the ID
            id: formValues.p_spec,
            // Add other fields like name if needed, might require finding the full spec object
            name: specs.find(s => (s.id || s.sys_id) === formValues.p_spec)?.name || "",
            version: "",
            internalVersion: "1",
            internalId: formValues.p_spec
        },
        prodSpecCharValueUse: prodSpecCharValueUse,
        channel: [
            {
                // Assuming the selected value 'formValues.channel' is the ID
                id: formValues.channel,
                // Add other fields like name if needed
                "name": channels.find(c => (c.id || c.sys_id) === formValues.channel)?.name || ""
            }
        ],

        category: {
            // Assuming the selected value 'formValues.category' is the ID
            id: formValues.category,
            // Add other fields like name if needed
            "name": cats.find(c => (c.id || c.sys_id) === formValues.category)?.name || ""
        },

        lifecycleStatus: formValues.lifecycleStatus,
        status: formValues.status
      };

      // console.log("Submitting data:", JSON.stringify(productOfferingDataPayload, null, 2));
      onSubmit(productOfferingDataPayload); // Pass the formatted data
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
      <h2>{isEditMode ? 'Edit Product Offering' : 'Add New Product Offering'}</h2>
            <hr style={{ margin: '15px 0' }} />
      <div>
        <label htmlFor="name" style={labelStyle}>Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formValues.name}
          onChange={handleInputChange}
          style={inputStyle}
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="start_date" style={labelStyle}>Start Date:</label>
        <input
          type="date"
          id="start_date"
          name="start_date"
          value={formValues.start_date}
          onChange={handleInputChange}
          style={inputStyle}
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="end_date" style={labelStyle}>End Date (Optional):</label>
        <input
          type="date"
          id="end_date"
          name="end_date"
          value={formValues.end_date}
          onChange={handleInputChange}
          style={inputStyle}
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor='price' style={labelStyle}>
          Pricing
        </label>
        <div className="row border py-2 mb-2" id="price">
        <div className="col"><label htmlFor="recurring_price" style={labelStyle}>Recurring:</label>
        <input
          type="number"
          step=".01"
          placeholder="USD"
          min="0"
          id="recurring_price"
          name="recurring_price"
          value={formValues.recurring_price}
          onChange={handleInputChange}
          style={inputStyle}
          disabled={isLoading}
        /></div>
        <div className="col"><label htmlFor="non_recurring_price" style={labelStyle}>Non Reccuring:</label>
        <input
          type="number"
          step=".01"
          min="0"
          placeholder="USD"
          id="non_recurring_price"
          name="non_recurring_price"
          value={formValues.non_recurring_price}
          onChange={handleInputChange}
          style={inputStyle}
          disabled={isLoading}
        /></div>
      </div>
      </div>
      <div>
        <label htmlFor="po_term" style={labelStyle}>Contract Term:</label>
        <select
          id="po_term"
          name="po_term"
          value={formValues.po_term}
          onChange={handleInputChange}
          style={inputStyle}
          
          disabled={isLoading}
        >
          <option value="not_applicable">Not Applicable</option>
          <option value="12_months">12 Months</option>
          <option value="24_months">24 Months</option>
          <option value="36_months">36 Months</option>
          <option value="48_months">48 Months</option>
          <option value="60_months">60 Months</option>
          
        </select>
      </div>
      <div>
        <label htmlFor="p_spec" style={labelStyle}>Product Specification</label>
        <select
          id="p_spec"
          name="p_spec"
          value={formValues.p_spec}
          onChange={handleInputChange}
          style={inputStyle}
          
          disabled={isLoading}
        >
        <option value="" disabled>
                {specsLoading ? 'Loading specs...' : '-- Select a Product Specification --'}
                </option>
                {/* Map over the specs passed via props */}
                {!specsLoading && specs.map(spec => ( spec.status ==="published"?
                <option key={spec.id || spec.sys_id} value={spec.id || spec.sys_id}> {/* Use correct ID field */}
                    {spec.name} {/* Use correct Name field */}
                </option> : ""
                ))}
        </select>
      </div>
      <div>
        <label htmlFor="channel" style={labelStyle}>Channel</label>
        <select
          id="channel"
          name="channel"
          value={formValues.channel}
          onChange={handleInputChange}
          style={inputStyle}
          
          disabled={isLoading}
        >
          <option value="" disabled>
                {channelsLoading ? 'Loading channels...' : '-- Select a Channel --'}
                </option>
                {/* Map over the channels passed via props */}
                {!channelsLoading && channels.map(channel => (
                <option key={channel.id || channel.sys_id} value={channel.id || channel.sys_id}> {/* Use correct ID field */}
                    {channel.name} {/* Use correct Name field */}
                </option> 
                ))}
        </select>
      </div>
      <div>
        <label htmlFor="category" style={labelStyle}>Category</label>
        <select
          id="category"
          name="category"
          value={formValues.category}
          onChange={handleInputChange}
          style={inputStyle}
          
          disabled={isLoading}
        >
         <option value="" disabled>
                {catsLoading ? 'Loading categories...' : '-- Select a Category --'}
                </option>
                {/* Map over the categories passed via props */}
                {!catsLoading && cats.map(cat => ( cat.status ==="published" ?
                  
                <option key={cat.id || cat.sys_id} value={cat.id || cat.sys_id}> {/* Use correct ID field */}
                    {cat.name} {/* Use correct Name field */}
                </option> : ""
                ))}
        </select>
      </div>
      <div>
        <label htmlFor="description" style={labelStyle}>Description:</label>
        <textarea
          id="description"
          name="description"
          value={formValues.description}
          onChange={handleInputChange}
          style={inputStyle}
          rows="3"
          disabled={isLoading}
        ></textarea>
      </div>
      {/* Action Buttons */}
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button type="button" onClick={onCancel} style={cancelButtonStyle} disabled={isLoading}>Cancel</button>
                {/* Change button text based on mode */}
                <button type="submit" style={submitButtonStyle} disabled={isLoading}>{isLoading ? 'Saving...' : (isEditMode ? 'Update Product Offering' : 'Create Product Offering')}</button>
            </div>
    </form>
  );
}

export default ProductOfferingForm;