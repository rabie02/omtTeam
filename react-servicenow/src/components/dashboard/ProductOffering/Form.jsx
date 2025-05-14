import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Modal } from 'antd';
import { updateProductOffering, createProductOffering,  } from '../../../features/servicenow/product-offering/productOfferingSlice';




const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    start_date: Yup.string().required('Start date is required'),
    end_date: Yup.string(),
    description: Yup.string(),
    recurring_price: Yup.string(), // Initialize as string for input control
    non_recurring_price: Yup.string(), // Initialize as string
    po_term: Yup.string(), // Default value
    p_spec: Yup.string().required('Product Specification is required'), // Product Specification ID
    channel: Yup.string(), // Channel ID
    category: Yup.string().required('Category is required'), // Category ID
});

function ProductOfferingForm({ open, setOpen, initialData = null, options=null, dispatch }) {

  const isEditMode = Boolean(initialData);
  const formik = useFormik({
    initialValues: {
        name: initialData?.name || '',
        start_date: initialData?.validFor?.startDateTime?.split('T')[0] || '', // Handle potential timestamp
        end_date: initialData?.validFor?.endDateTime?.split('T')[0] || '',     // Handle potential timestamp
        description: initialData?.description || '',
        recurring_price: initialData?.productOfferingPrice[0].price?.taxIncludedAmount?.value || '', // Use nullish coalescing
        non_recurring_price: initialData?.productOfferingPrice[1].price?.taxIncludedAmount?.value || '', // Use nullish coalescing
        po_term: initialData?.productOfferingTerm || 'not_applicable',
        p_spec: initialData?.productSpecification?.id || '', // Get ID from nested object
        channel: initialData?.channel?.[0]?.id || '', // Get ID from first item in array
        category: initialData?.category[0]?.id || '', // Get ID from nested object
    },
    validationSchema,
    onSubmit: async (values, {resetForm}) => {
      try {
       
        // Find the selected Product Specification object
        const selectedSpec = options.specifications.find(spec => 
          (spec.id || spec.sys_id) === values.p_spec
        );

        if (!selectedSpec) {
          throw new Error('Selected Product Specification not found');
        }

        // Transform characteristic values (same logic as old form)
        const prodSpecCharValueUse = selectedSpec.productSpecCharacteristic?.map(specChar => {
          const valueToUse = (specChar.productSpecCharacteristicValue && 
                            specChar.productSpecCharacteristicValue.length > 0)
              ? [specChar.productSpecCharacteristicValue[0]]
              : [];

          return {
              name: specChar.name,
              description: specChar.description,
              valueType: specChar.valueType,
              validFor: specChar.validFor,
              productSpecCharacteristicValue: valueToUse,
              productSpecification: {
                  id: selectedSpec.id || selectedSpec.sys_id,
                  name: selectedSpec.name,
                  version: selectedSpec.version,
                  internalVersion: selectedSpec.internalVersion,
                  internalId: selectedSpec.internalId || selectedSpec.id || selectedSpec.sys_id
              }
          };
        }) || [];

        // Prepare the payload (same structure as old form)
        const productOfferingDataPayload = {
          name: values.name,
          version: initialData?.version || "1",
          internalVersion: initialData?.internalVersion || "1",
          description: values.description,
          lastUpdate: new Date().toISOString(),

          validFor: {
              startDateTime: values.start_date,
              endDateTime: values.end_date || null
          },
          productOfferingTerm: values.po_term,
          productOfferingPrice: [
              { 
                priceType: "recurring", 
                price: { 
                  taxIncludedAmount: { 
                    unit: "USD", 
                    value: parseFloat(values.recurring_price || 0) 
                  }
                }
              },
              { 
                priceType: "nonRecurring", 
                price: { 
                  taxIncludedAmount: { 
                    unit: "USD", 
                    value: parseFloat(values.non_recurring_price || 0) 
                  }
                }
              }
          ],
          productSpecification: {
            id: values.p_spec,
            name: options.specifications.find(s => (s.id || s.sys_id) === values.p_spec)?.name || "",
            version: "",
            internalVersion: "1",
            internalId: values.p_spec
          },
          prodSpecCharValueUse: prodSpecCharValueUse,
          channel: [
              {
                  id: values.channel,
                  name: options.channels.find(c => (c.id || c.sys_id) === values.channel)?.name || ""
              }
          ],
          category: {
              id: values.category,
              name: options.categories.find(c => (c.id || c.sys_id) === values.category)?.name || ""
          },
          lifecycleStatus: "Draft",
          status: "draft"
        };

        // Dispatch the appropriate Redux action
        const action = isEditMode
          ? updateProductOffering({ 
              id: initialData.id, 
              ...productOfferingDataPayload 
            })
          : createProductOffering(productOfferingDataPayload);
        
          await dispatch(action).unwrap();
          setOpen(false);
          resetForm();
      } catch (error) {
        console.error('Submission error:', error);
        // You might want to show a notification to the user here
      }
    },
    enableReinitialize: true,
  });



  const handleCancel = () => setOpen(false);
 
  return (
    <Modal
      title={isEditMode ? 'Edit Record ' : 'Add New Record'}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block font-medium mb-1">Name</label>
          <input
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full border rounded px-3 py-2"
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-red-500 text-sm mt-1">{formik.errors.name}</p>
          )}
        </div>

       

        {/* Start Date */}
        <div>
          <label className="block font-medium mb-1">Start Date</label>
          <input
            type="date"
            name="start_date"
            value={formik.values.start_date}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full border rounded px-3 py-2"
          />
          {formik.touched.start_date && formik.errors.start_date && (
            <p className="text-red-500 text-sm mt-1">{formik.errors.start_date}</p>
          )}
        </div>

        {/* End Date */}
        <div>
          <label className="block font-medium mb-1">End Date (Optional)</label>
          <input
            type="date"
            name="end_date"
            value={formik.values.end_date}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="columns-3">
          <label className="block font-medium mb-1">Recurring Price</label>
          <input
            type="number"
            name="recurring_price"
            value={formik.values.recurring_price}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full border rounded px-3 py-2"
            placeholder='USD'
            step="0.01"
          />
          <label className="block font-medium mb-1">Non Recurring Price</label>
          <input
            type="number"
            name="non_recurring_price"
            value={formik.values.non_recurring_price}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full border rounded px-3 py-2"
            placeholder='USD'
            step="0.01"
          />
          <label className="block font-medium mb-1">Currency (unavailable)</label>
          <input
           className="w-full border rounded px-3 py-2"
            type="string"
            readOnly
            disabled
            placeholder='USD'
          />
        </div>


        {/* Product Offering Term */}
        <div>
        <label className="block font-medium mb-1">Contract Term:</label>
        <select
          id="po_term"
          name="po_term"
          value={formik.values.po_term}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={formik.isSubmitting}
          className="w-full border rounded px-3 py-2"
        >
          <option value="not_applicable">Not Applicable</option>
          <option value="12_months">12 Months</option>
          <option value="24_months">24 Months</option>
          <option value="36_months">36 Months</option>
          <option value="48_months">48 Months</option>
          <option value="60_months">60 Months</option>
          
        </select>
      </div>

       {/* {Product Specification} */}
       <div>
        <label className="block font-medium mb-1">Product Specification:</label>
        <select
          id="p_spec"
          name="p_spec"
          value={formik.values.p_spec}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={formik.isSubmitting}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Select a product specification</option>
          {/* Map over the specs passed via props */}
          {options.specifications.map(spec => ( spec.status ==="published"?
                <option key={spec.id || spec.sys_id} value={spec.id || spec.sys_id}> {/* Use correct ID field */}
                    {spec.display_name} {/* Use correct Name field */}
                </option> : ""
                ))}
          </select>
           {/* Add validation message display */}
     {formik.touched.p_spec && formik.errors.p_spec && (
        <p className="text-red-500 text-sm mt-1">{formik.errors.p_spec}</p>
     )}
      </div>

       {/* {Product Offering Category} */}
       <div>
        <label className="block font-medium mb-1">Category:</label>
        <select
          id="category"
          name="category"
          value={formik.values.category}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={formik.isSubmitting}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Select a Category</option>
          {/* Map over the categories passed via props */}
          {options.categories.map(cat => ( cat.status ==="published" || "draft" ?
                <option key={cat.id || cat.sys_id} value={cat.id || cat.sys_id}> {/* Use correct ID field */}
                    {cat.name} {/* Use correct Name field */}
                </option> : ""
                ))}
          </select>
           {/* Add validation message display */}
     {formik.touched.category && formik.errors.category && (
        <p className="text-red-500 text-sm mt-1">{formik.errors.category}</p>
     )}
      </div>

      {/* {Distribution Channel} */}
      <div>
        <label className="block font-medium mb-1">Channel:</label>
        <select
          id="channel"
          name="channel"
          value={formik.values.channel}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={formik.isSubmitting}
          className="w-full border rounded px-3 py-2"
          
        >
          <option value="">Select the Web Channel</option>
          {/* Map over the channels passed via props */}
          {options.channels.map(channel => ( channel.name ==="Web"?
                <option key={channel.id || channel.sys_id} value={channel.id || channel.sys_id}> {/* Use correct ID field */}
                    {channel.name} {/* Use correct Name field */}
                </option> : ""
                ))}
          </select>
           {/* Add validation message display */}
     {formik.touched.channel && formik.errors.channel && (
        <p className="text-red-500 text-sm mt-1">{formik.errors.channel}</p>
     )}
      </div>

        {/* Description */}
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            rows="3"
            disabled={formik.isSubmitting}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={formik.isSubmitting}
            className="px-4 py-2 rounded border bg-gray-200 text-red-400 hover:bg-red-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="px-4 py-2 rounded bg-cyan-700 text-white hover:bg-cyan-800"
          >
            {formik.isSubmitting
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : isEditMode
              ? 'Update Record'
              : 'Create Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductOfferingForm;
