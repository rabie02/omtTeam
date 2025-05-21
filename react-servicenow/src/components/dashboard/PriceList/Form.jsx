
import { createPriceList } from '../../../features/servicenow/opportunity/opportunitySlice';
import { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Modal } from 'antd';
import { formatDateForInput } from '@/utils/formatDateForInput.js';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  start_date: Yup.string().required('Start date is required'),
  currency: Yup.string().required('Currency is required'),
});

function PriceListForm({ open, setOpen, initialData = null, dispatch }) {
  const isEditMode = Boolean(initialData);

  const formik = useFormik({
    initialValues: {
      name: initialData?.name || '',
      start_date: formatDateForInput(initialData?.start_date) || '',
      end_date: initialData?.end_date ? formatDateForInput(initialData?.end_date) : '',
      state: initialData?.state || 'published',
      description: initialData?.description || '',
      sales_agreement: initialData?.sales_agreement || '',
      currency: initialData?.currency || 'USD',
      defaultflag: initialData?.defaultflag || 'false',
      account: initialData?.account || '',
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const action = isEditMode
          ? updatePriceList({ id: initialData._id, ...values })
          : createPriceList(values);
        setTimeout(await dispatch(action).unwrap(), 3000);
        setOpen(false);
        resetForm();
      } catch (error) {
        console.error('Submission error:', error);
      }
    },
    enableReinitialize: true,
  });

  const handleCancel = () => setOpen(false);

  return (
    <Modal
      title={isEditMode ? 'Edit Price List' : 'Add New Price List'}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block font-medium mb-1">Name *</label>
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

        {/* Currency */}
        <div>
          <label className="block font-medium mb-1">Currency *</label>
          <select
            name="currency"
            value={formik.values.currency}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full border rounded px-3 py-2"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            {/* Add more currencies as needed */}
          </select>
          {formik.touched.currency && formik.errors.currency && (
            <p className="text-red-500 text-sm mt-1">{formik.errors.currency}</p>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label className="block font-medium mb-1">Start Date *</label>
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

        {/* State
        <div>
          <label className="block font-medium mb-1">State</label>
          <select
            name="state"
            value={formik.values.state}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full border rounded px-3 py-2"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div> */}

        {/* Default Flag */}
        <div>
          <label className="block font-medium mb-1">Default Price List</label>
          <select
            name="defaultflag"
            value={formik.values.defaultflag}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full border rounded px-3 py-2"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>

        {/* Sales Agreement */}
        <div>
          <label className="block font-medium mb-1">Sales Agreement (Optional)</label>
          <input
            name="sales_agreement"
            value={formik.values.sales_agreement}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium mb-1">Description (Optional)</label>
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
                ? 'Update Price List'
                : 'Create Price List'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default PriceListForm;