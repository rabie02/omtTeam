import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Modal, notification, Select } from 'antd';
import { updateProductOffering, createProductOffering } from '../../../features/servicenow/product-offering/productOfferingSlice';




const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    start_date: Yup.string().required('Start date is required'),
    end_date: Yup.string(),
    description: Yup.string().required('Description is required'),
    recurring_price: Yup.string(), // Initialize as string for input control
    non_recurring_price: Yup.string(), // Initialize as string
    po_term: Yup.string(), // Default value
    p_spec: Yup.string().required('Product Specification is required'), // Product Specification ID
    channel: Yup.string(), // Channel ID
    category: Yup.string().required('Category is required'), // Category ID
});

function ProductOfferingForm({ open, setOpen, initialData = null, options=null, dispatch, setSearchTerm }) {
  console.log(initialData?.productSpecification);
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
        p_spec: initialData?.productSpecification._id || '', // Get ID from nested object
        channel: initialData?.channel?.[0]?.id || '', // Get ID from first item in array
        category: initialData?.category[0]?._id || '', // Get ID from nested object
    },
    validationSchema,
    onSubmit: async (values, {resetForm}) => {
      try {
       console.log(values.p_spec)
        // Find the selected Product Specification object
        const selectedSpec = options.specifications.find(spec => 
          (spec._id) === values.p_spec
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
                  name: selectedSpec.display_name || selectedSpec.name,
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
            _id: values.p_spec,
            id: options.specifications.find(s => (s._id) === values.p_spec)?.sys_id,
            name: options.specifications.find(s => (s._id) === values.p_spec)?.display_name || "",
            version: "",
            internalVersion: "1",
            internalId: options.specifications.find(s => (s._id) === values.p_spec)?.sys_id
          },
          prodSpecCharValueUse: prodSpecCharValueUse,
          channel: [
              {
                  id: values.channel,
                  name: options.channels.find(c => (c.id || c.sys_id) === values.channel)?.name || ""
              }
          ],
          category: {
              _id: values.category,
              id: options.categories.find(c=> c._id === values.category)?.id || options.categories.find(c=> c._id === values.category)?.sys_id,
              name: options.categories.find(c => c._id === values.category)?.name || ""
          },
          lifecycleStatus: "Draft",
          status: "draft"
        };

        // Dispatch the appropriate Redux action
        const action = isEditMode
          ? updateProductOffering({ 
              id: initialData._id, 
              ...productOfferingDataPayload 
            })
          : createProductOffering(productOfferingDataPayload);
        
          await dispatch(action).unwrap();

          notification.success({
            message: isEditMode ? 'Product Offering Updated' : 'Product Offering Created',
            description: isEditMode 
              ? 'Product Offering has been updated successfully'
              : 'New Product Offering has been created successfully',
          });
          setOpen(false);
          resetForm();
      } catch (error) {
        console.error('Submission error:', error);
        notification.error({
          message: 'Operation Failed',
          description: error.message || 'Something went wrong. Please try again.',
        });
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
      destroyOnHidden
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

       
          <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-2">
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
          </div>
          <div className="col-span-2">
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
          </div>
          <div>
            <label className="block font-medium mb-1">Currency</label>
            <input
            className="w-full border rounded px-3 py-2"
              type="string"
              readOnly
              disabled
              placeholder='USD'
            />
          </div>
        </div>

          <div className="grid grid-cols-3 gap-4">
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
       <div className="col-span-2">
        <label className="block font-medium mb-1">Product Specification:</label>
        
          <Select
            id="p_spec"
            name="p_spec"
            showSearch
            placeholder="Select Product Specification"
            value={formik.values.p_spec || undefined} // Use undefined instead of empty string for better Select behavior
            onChange={(value) => formik.setFieldValue('p_spec', value)}
            onBlur={formik.handleBlur}
            onSearch={(value) => setSearchTerm(value)}
            options={options.specifications.map(spec => ({
              value: spec._id,
              label: spec.displayName
            }))}
            filterOption={false}
            disabled={formik.isSubmitting || isEditMode}
            className="w-full border rounded px-3 py-2"
          />
           {/* Add validation message display */}
     {formik.touched.p_spec && formik.errors.p_spec && (
        <p className="text-red-500 text-sm mt-1">{formik.errors.p_spec}</p>
     )}
      </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
       {/* {Product Offering Category} */}
       <div>
        <label className="block font-medium mb-1">Category:</label>
        <select
          id="category"
          name="category"
          value={formik.values.category}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={formik.isSubmitting || isEditMode}
          className="w-full border rounded px-3 py-2 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
        >
          <option value="">Select a Category</option>
          {/* Map over the categories passed via props */}
          {options.categories.map(cat => ( cat.status ==="published" ?
                <option key={cat._id} value={cat._id}> {/* Use correct ID field */}
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
          disabled={formik.isSubmitting || isEditMode}
          
          className="w-full border rounded px-3 py-2 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
          
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
          {formik.touched.description && formik.errors.description && (
        <p className="text-red-500 text-sm mt-1">{formik.errors.description}</p>
     )}
        </div>

         {/* Actions */}
         <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={formik.isSubmitting}
            className="overflow-hidden relative w-28 h-10 bg-gray-200 text-red-400 border-none rounded-md text-lg font-bold cursor-pointer z-10 group disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            Cancel

            {/* Red bubble hover effect */}
            <span className="absolute w-32 h-28 -top-7 -left-2 bg-red-200 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-500 duration-1000 origin-bottom"></span>
            <span className="absolute w-32 h-28 -top-7 -left-2 bg-red-400 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-700 duration-700 origin-bottom"></span>
            <span className="absolute w-32 h-28 -top-7 -left-2 bg-red-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-1000 duration-500 origin-bottom"></span>
            <span className="group-hover:opacity-100 text-white group-hover:duration-1000 duration-100 opacity-0 absolute top-1.25 left-7.25 z-10">
              Cancel
            </span>
          </button>


          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="overflow-hidden relative w-32 h-10 bg-cyan-700 text-white border-none rounded-md text-xl font-bold cursor-pointer z-10 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formik.isSubmitting ? 'Please wait...' : isEditMode ? 'Update' : 'Create'}

            {/* Conditional yellow bubbles for edit, green bubbles for create */}
            <span
              className={`absolute w-36 h-32 -top-8 -left-2 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-bottom ${isEditMode
                ? 'bg-yellow-200 group-hover:duration-500 duration-1000'
                : 'bg-green-200 group-hover:duration-500 duration-1000'
                }`}
            ></span>
            <span
              className={`absolute w-36 h-32 -top-8 -left-2 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-bottom ${isEditMode
                ? 'bg-yellow-400 group-hover:duration-700 duration-700'
                : 'bg-green-400 group-hover:duration-700 duration-700'
                }`}
            ></span>
            <span
              className={`absolute w-36 h-32 -top-8 -left-2 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-bottom ${isEditMode
                ? 'bg-yellow-600 group-hover:duration-1000 duration-500'
                : 'bg-green-600 group-hover:duration-1000 duration-500'
                }`}
            ></span>

            {!formik.isSubmitting && (
              <span className="group-hover:opacity-100 group-hover:duration-1000 duration-100 opacity-0 absolute top-1.25 left-7 z-10">
                Product Offering
              </span>
            )}
          </button>


        </div>
      </form>
    </Modal>
  );
}

export default ProductOfferingForm;
