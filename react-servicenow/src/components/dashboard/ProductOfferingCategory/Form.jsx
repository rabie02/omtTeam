import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Modal, Select } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import { formatDateForInput } from '@/utils/formatDateForInput.js';
import { updateCategory, createCategory } from '../../../features/servicenow/product-offering/productOfferingCategorySlice';
import { getPublish } from '../../../features/servicenow/product-offering/productOfferingCatalogSlice';

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
  end_date: Yup.string()
    .test('end-date', 'End date must be after start date', function (value) {
      if (!value) return true;
      return new Date(value) >= new Date(this.parent.start_date);
    }),
  code: Yup.string().required('Code is required'),
});

function ProductOfferingCategoryForm({ open, setOpen, initialData = null }) {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.productOfferingCatalog);
  const [searchTerm, setSearchTerm] = useState('');
  const isEditMode = Boolean(initialData);

  useEffect(() => {
    dispatch(getPublish({ q: searchTerm }));
  }, [dispatch, searchTerm, open]);

  const formik = useFormik({
    initialValues: {
      name: initialData?.name || '',
      start_date: formatDateForInput(initialData?.start_date) || '',
      end_date: initialData?.end_date ? formatDateForInput(initialData?.end_date) : '',
      status: initialData?.status || 'draft',
      description: initialData?.description || '',
      code: initialData?.code || '',
      catalog: initialData?.catalogs[0]?._id || '',
      is_leaf: true,
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const action = isEditMode
          ? updateCategory({ id: initialData._id, ...values })
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
      style={{ top: 20 }}

    >
      <form onSubmit={formik.handleSubmit} className={`space-y-4`}>
        {/* Name */}
        <div>
          <label className="block font-medium mb-1">Name <span className="text-red-500">*</span></label>
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
            <label className="block font-medium mb-1">Code <span className="text-red-500">*</span></label>
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
          <label className="block font-medium mb-1">Start Date <span className="text-red-500">*</span></label>
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
          <label className="block font-medium mb-1">End Date </label>
          <input
            type="date"
            name="end_date"
            value={formik.values.end_date}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full border rounded px-3 py-2"
          />
          {formik.touched.end_date && formik.errors.end_date && (
            <p className="text-red-500 text-sm mt-1">{formik.errors.end_date}</p>
          )}
        </div>

        {/* Catalog Select */}
        <div className="col-span-2">
          <label className="block font-medium mb-1">Catalogs <span className="text-red-500">*</span></label>
          <Select
            showSearch
            placeholder="Select catalogs"
            value={formik.values.catalog}
            onChange={(value) => formik.setFieldValue('catalog', value)}
            onSearch={(value) => setSearchTerm(value)}
            options={data?.map(catalog => ({
              value: catalog._id,
              label: catalog.name
            }))}
            className="w-full border rounded px-3 py-2"
            loading={loading}
            filterOption={false}
          />
          {formik.touched.catalog && formik.errors.catalog && (
            <p className="text-red-500 text-sm mt-1">{formik.errors.catalog}</p>
          )}
        </div>

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
              <span className="group-hover:opacity-100 group-hover:duration-1000 duration-100 opacity-0 absolute top-1.25 left-5.25 z-10">
                Category
              </span>
            )}
          </button>
        </div>

      </form>
    </Modal>
  );
}

export default ProductOfferingCategoryForm;