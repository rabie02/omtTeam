import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Modal, Select } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import {formatDateForInput} from '@/utils/formatDateForInput.js'
import {handleFileChange} from '@/utils/validationfileUploader.js'
import { updateCategory, createCategory } from '../../../features/servicenow/product-offering/productOfferingCategorySlice';
import { getall as getCatalogs } from '../../../features/servicenow/product-offering/productOfferingCatalogSlice';

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
  const randomNumber = Math.floor(Math.random() * 900) + 100;
  return `${codePrefix}${randomNumber}`;
};

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  start_date: Yup.string().required('Start date is required'),
  status: Yup.string().required('Status is required'),
  code: Yup.string().required('Code is required'),
  catalog: Yup.string().when('status', {
    is: (val) => val === 'published',
    then: () => Yup.string().required('Catalog is required when publishing'),
    otherwise: () => Yup.string()
  }),
});

function ProductOfferingCategoryForm({ open, setOpen, initialData = null }) {
  const dispatch = useDispatch();
  const isEditMode = Boolean(initialData);
  
  // Use the catalog data from the Redux store
  const { 
    data: catalogs, 
    loading: loadingCatalogs 
  } = useSelector((state) => state.productOfferingCatalog);

  // Fetch catalogs on component mount
  useEffect(() => {
    dispatch(getCatalogs({ page: 1, limit: 100 }));
  }, [dispatch]);  

  const formik = useFormik({
    initialValues: {
      name: initialData?.name || '',
      start_date: formatDateForInput(initialData?.start_date)  || '',
      end_date: initialData?.end_date ? formatDateForInput(initialData?.end_date):'',
      status: initialData?.status || 'draft',
      description: initialData?.description || '',
      code: initialData?.code || '',
      is_leaf: true,
      image: initialData?.image || '',
      thumbnail: initialData?.thumbnail || '',
      catalog: initialData?.catalog || '',
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        //console.log(values);
        
        const action = isEditMode
          ? updateCategory({ id: initialData.sys_id, ...values })
          : createCategory(values);
        await dispatch(action).unwrap();
        setOpen(false);
        resetForm();
      } catch (error) {
        console.error('Submission error:', error);
      }
    },
    enableReinitialize: true,
  });

  useEffect(() => {
    if (!isEditMode) {
      const generatedCode = generateCodeFromName(formik.values.name);
      formik.setFieldValue('code', generatedCode);
    }
  }, [formik.values.name, isEditMode]);

  const handleCancel = () => setOpen(false);

  return (
    <Modal
      title={isEditMode ? 'Edit Category' : 'Add a New Category'}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      width={isEditMode ? 900 : 500} 
    >
      <form onSubmit={formik.handleSubmit} className={`space-y-4 ${isEditMode ? 'grid grid-cols-2 gap-6 ' : ''}`}>
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

        {/* Code (Edit mode only) */}
        {isEditMode && (
          <div>
            <label className="block font-medium mb-1">Code</label>
            <input
              name="code"
              value={formik.values.code}
              readOnly
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>
        )}

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

        {/* Status */}
        <div>
          <label className="block font-medium mb-1">Status</label>
          <select
            name="status"
            value={formik.values.status}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full border rounded px-3 py-2"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
            <option value="retired">Retired</option>
          </select>
          {formik.touched.status && formik.errors.status && (
            <p className="text-red-500 text-sm mt-1">{formik.errors.status}</p>
          )}
        </div>

        {/* Catalog Selection - Show when status is published */}
        {formik.values.status === 'published' && (
          <div>
            <label className="block font-medium mb-1">Catalog</label>
            <Select
              className="w-full"
              name="catalog"
              value={formik.values.catalog}
              onChange={(value) => formik.setFieldValue('catalog', value)}
              onBlur={() => formik.setFieldTouched('catalog', true)}
              disabled={formik.isSubmitting || loadingCatalogs}
              loading={loadingCatalogs}
              placeholder="Select a catalog"
              options={catalogs.map(catalog => ({
                value: catalog.sys_id,
                label: catalog.name
              }))}
            />
            {formik.touched.catalog && formik.errors.catalog && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.catalog}</p>
            )}
          </div>
        )}

        {/* Image Upload (Edit mode only) */}
        {isEditMode && (
          <>
            <div>
              <label className="block font-medium mb-1">Category Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange('image', formik.setFieldValue, formik.setFieldError)}
                className="w-full border rounded px-3 py-2"
              />
              {formik.values.image && (
                <div className="mt-2">
                  <img 
                    src={formik.values.image} 
                    alt="Category preview" 
                    className="h-20 w-20 object-cover rounded"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">Thumbnail Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange('thumbnail', formik.setFieldValue, formik.setFieldError)}
                className="w-full border rounded px-3 py-2"
              />
              {formik.values.thumbnail && (
                <div className="mt-2">
                  <img 
                    src={formik.values.thumbnail} 
                    alt="Thumbnail preview" 
                    className="h-20 w-20 object-cover rounded"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Description */}
        <div className='col-span-2'>
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

        {/* Form Actions */}
        <div className="col-span-2 flex justify-end space-x-2 pt-2">
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
              ? 'Update Category'
              : 'Create Category'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductOfferingCategoryForm;