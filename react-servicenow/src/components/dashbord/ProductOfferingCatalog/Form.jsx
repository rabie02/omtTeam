import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Modal } from 'antd';
import { updateCatalog, createCatalog } from '../../../features/servicenow/product-offering/productOfferingCatalogSlice';

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
  return `${codePrefix}101`;
};

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  start_date: Yup.string().required('Start date is required'),
  status: Yup.string().required('Status is required'),
  code: Yup.string().required('Code is required'),
});

function ProductOfferingCatalogForm({ open, setOpen, initialData = null, dispatch }) {
  const isEditMode = Boolean(initialData);

  const formik = useFormik({
    initialValues: {
      name: initialData?.name || '',
      start_date: initialData?.start_date?.split(' ')[0] || '',
      end_date: initialData?.end_date?.split(' ')[0] || '',
      status: initialData?.status || 'draft',
      description: initialData?.description || '',
      code: initialData?.code || '',
    },
    validationSchema,
    onSubmit: async (values, {resetForm}) => {
      try {
        const action = isEditMode
          ? updateCatalog({ id: initialData.sys_id, ...values })
          : createCatalog(values);
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
      title={isEditMode ? 'Edit Catalog' : 'Add New Catalog'}
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
        {/* <div>
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
        </div> */}

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
              ? 'Update Catalog'
              : 'Create Catalog'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductOfferingCatalogForm;
