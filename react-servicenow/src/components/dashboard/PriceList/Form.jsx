// src/features/opportunity/price-list/PriceListFormPage.jsx
import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  notification,
  Spin,
  Popconfirm,
  Tabs,
  Table,
  Tooltip
} from 'antd';
import { format } from 'date-fns';
import { formatDateForInput } from '@/utils/formatDateForInput.js';
import {
  updatePriceList,
  createPriceList,
  getOnePriceList,
  deletePriceList,
  updatePriceListStatus
} from '../../../features/opportunity/priceListSlice';

// Status transition mapping
const STATUS_TRANSITIONS = {
  draft: { next: 'published', action: 'Publish' },
  published: { next: 'archived', action: 'Archive' },
  archived: { next: 'retired', action: 'Retire' },
  retired: null // No next status
};

// StatusCell component for consistent status rendering
const StatusCell = ({ status }) => {
  const statusColors = {
    published: { dot: 'bg-green-500', text: 'text-green-700' },
    draft: { dot: 'bg-blue-500', text: 'text-blue-700' },
    archived: { dot: 'bg-gray-400', text: 'text-gray-600' },
    retired: { dot: 'bg-red-500', text: 'text-red-700' },
  };
  const colors = statusColors[status] || statusColors.draft;
  const displayText = status ?
    status.charAt(0).toUpperCase() + status.slice(1) : '';

  return (
    <div className="flex items-center">
      <span className={`h-2 w-2 rounded-full mr-2 ${colors.dot}`}></span>
      <span className={`text-xs ${colors.text}`}>
        {displayText}
      </span>
    </div>
  );
};

function PriceListFormPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [activeTab, setActiveTab] = useState('1');
  const [initialized, setInitialized] = useState(false);
  const [nextStatusAction, setNextStatusAction] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { currentPriceList, loading, loadingPriceList } = useSelector(
    state => state.priceList
  );

  // Fetch Price List details in edit mode
  useEffect(() => {
    if (isEditMode) {
      dispatch(getOnePriceList(id)).then(() => setInitialized(true));
    } else {
      setInitialized(true);
    }
  }, [id, isEditMode, dispatch]);

  // Determine next status action
  useEffect(() => {
    if (isEditMode && currentPriceList) {
      const transition = STATUS_TRANSITIONS[currentPriceList.status];
      setNextStatusAction(transition ? transition.action : null);
    }
  }, [currentPriceList, isEditMode]);

  // Initialize form with proper default values
  const initialValues = {
    name: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    description: '',
    currency: 'USD',
    defaultflag: false,
    sales_agreement: ''
  };

  // Merge with currentPriceList if available
  if (isEditMode && currentPriceList && !loading) {
    initialValues.name = currentPriceList.name || '';
    initialValues.start_date = formatDateForInput(currentPriceList.start_date) || '';
    initialValues.end_date = currentPriceList.end_date
      ? formatDateForInput(currentPriceList.end_date)
      : '';
    initialValues.status = currentPriceList.status || 'draft';
    initialValues.description = currentPriceList.description || '';
    initialValues.currency = currentPriceList.currency || 'USD';
    initialValues.defaultflag = currentPriceList.defaultflag || false;
    initialValues.sales_agreement = currentPriceList.sales_agreement || '';
  }

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    start_date: Yup.string().required('Start date is required'),
    end_date: Yup.string()
      .test('end-date', 'End date must be after start date', function (value) {
        if (!value) return true;
        return new Date(value) >= new Date(this.parent.start_date);
      }),
    currency: Yup.string().required('Currency is required'),
  });

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const action = isEditMode
          ? updatePriceList({ id, ...values })
          : createPriceList(values);

        await dispatch(action).unwrap();

        notification.success({
          message: isEditMode ? 'Price List Updated' : 'Price List Created',
          description: isEditMode
            ? 'Price List has been updated successfully'
            : 'New Price List has been created successfully',
        });

        navigate('/dashboard/price-list');
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

  const handleCancel = () => navigate('/dashboard/price-list');

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!currentPriceList || !STATUS_TRANSITIONS[currentPriceList.status]) return;

    const nextStatus = STATUS_TRANSITIONS[currentPriceList.status].next;

    try {
      await dispatch(updatePriceListStatus({
        id,
        status: nextStatus
      })).unwrap();

      // Update formik values to reflect new status
      formik.setFieldValue('status', nextStatus);

      notification.success({
        message: 'Status Updated',
        description: `Price List has been ${nextStatusAction.toLowerCase()} successfully`,
      });

      // Update next action
      const newTransition = STATUS_TRANSITIONS[nextStatus];
      setNextStatusAction(newTransition ? newTransition.action : null);
    } catch (error) {
      notification.error({
        message: 'Status Update Failed',
        description: error.message || 'Failed to update Price List status',
      });
    }
  };

  // Handle delete with Popconfirm
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deletePriceList(id)).unwrap();
      notification.success({
        message: 'Price List Deleted',
        description: 'Price List has been deleted successfully',
      });
      navigate('/dashboard/price-list');
    } catch (error) {
      notification.error({
        message: 'Deletion Failed',
        description: error.message || 'Failed to delete Price List',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Define table columns for price items
  const priceItemsTableColumns = [
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => price ? `${currentPriceList?.currency || 'USD'} ${price}` : 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusCell status={status} />
    },
    {
      title: 'Valid From',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date) => date ? format(new Date(date), 'yyyy-MM-dd') : 'N/A'
    },
    {
      title: 'Valid To',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date) => date ? format(new Date(date), 'yyyy-MM-dd') : 'N/A'
    }
  ];

  // Tab items configuration
  const tabItems = [
    {
      key: '1',
      label: (
        <span className="flex items-center">
          <i className="ri-price-tag-3-line text-lg mr-2"></i>
          Price Items
        </span>
      ),
      children: (
        <div className="p-4">
          <Table
            columns={priceItemsTableColumns}
            dataSource={currentPriceList?.priceItems || []}
            pagination={true}
            rowKey="_id"
            locale={{
              emptyText: (
                <div className="py-8 text-center">
                  <i className="ri-information-line mx-auto text-3xl text-gray-400 mb-3"></i>
                  <p className="text-gray-500">No price items associated with this price list.</p>
                </div>
              )
            }}
          />
        </div>
      ),
    }
  ];

  // Show spinner while initializing or loading Price List data
  if ((isEditMode && loading) || !initialized) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin
          size="large"
          tip="Loading Price List details..."
          indicator={<i className="ri-refresh-line animate-spin text-2xl"></i>}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 h-full flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row px-6 py-2.5 bg-gray-200 justify-between items-start md:items-center gap-4">
          <div className="flex items-center">
            <button
              onClick={handleCancel}
              className="mr-3 text-cyan-700 hover:text-cyan-800 bg-white border border-cyan-700 hover:bg-cyan-50 w-10 h-10 flex justify-center items-center "
            >
              <i className="ri-arrow-left-s-line text-2xl"></i>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Price List</h1>
              <p className="text-gray-600 text-md flex items-center gap-2">
                {isEditMode ? currentPriceList.name : 'New record'}
                {isEditMode && (
                  <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-xs font-medium rounded-md capitalize">
                    {currentPriceList.status}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isEditMode && nextStatusAction && (
              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={formik.isSubmitting}
                className={`overflow-hidden relative w-32 h-10 bg-cyan-700 text-white hover:bg-cyan-800 border-none rounded-md text-base font-medium z-10 group`}
              >
                {nextStatusAction}
              </button>
            )}

            <button
              type="button"
              onClick={formik.handleSubmit}
              disabled={formik.isSubmitting}
              className={`overflow-hidden relative w-32 h-10 border-2 rounded-md text-base font-medium z-10 group ${
                'bg-white border-cyan-700 text-cyan-700 hover:bg-cyan-50 cursor-pointer'
              } ${formik.isSubmitting ? 'opacity-70' : ''}`}
            >
              {formik.isSubmitting ? (
                <span>Processing...</span>
              ) : isEditMode ? (
                <span>Update</span>
              ) : (
                <span>Create</span>
              )}
            </button>

            {isEditMode && (
              <Popconfirm
                title="Delete Price List"
                description={
                  <div>
                    <p className="font-medium">Are you sure you want to delete this price list?</p>
                    <p className="text-gray-600 mt-2">
                      This action cannot be undone. All associated price items will be removed.
                    </p>
                  </div>
                }
                icon={<i className="ri-error-warning-line text-red-500 text-xl mr-2"></i>}
                onConfirm={handleDelete}
                okText="Delete"
                okButtonProps={{
                  loading: deleting,
                  danger: true
                }}
                cancelText="Cancel"
              >
                <button
                  type="button"
                  disabled={formik.isSubmitting || deleting}
                  className={`overflow-hidden relative w-32 h-10 border-2 rounded-md text-base font-medium z-10 group ${
                    'bg-white border-cyan-700 text-cyan-700 hover:bg-cyan-50 cursor-pointer'
                  }`}
                >
                  Delete
                </button>
              </Popconfirm>
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-grow overflow-y-auto">
        <div className="bg-white shadow-sm max-w-6xl mx-auto my-6">
          <div className="p-6">
            <form onSubmit={formik.handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={formik.isSubmitting}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="text-red-500 text-sm mt-1">{formik.errors.name}</p>
                  )}
                </div>

                {/* Currency */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="currency"
                    value={formik.values.currency}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={formik.isSubmitting}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                  {formik.touched.currency && formik.errors.currency && (
                    <p className="text-red-500 text-sm mt-1">{formik.errors.currency}</p>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formik.values.start_date}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={formik.isSubmitting}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formik.touched.start_date && formik.errors.start_date && (
                    <p className="text-red-500 text-sm mt-1">{formik.errors.start_date}</p>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formik.values.end_date}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={formik.isSubmitting}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formik.touched.end_date && formik.errors.end_date && (
                    <p className="text-red-500 text-sm mt-1">{formik.errors.end_date}</p>
                  )}
                </div>

                {/* Default Flag */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Default Price List</label>
                  <select
                    name="defaultflag"
                    value={formik.values.defaultflag}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={formik.isSubmitting}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={false}>No</option>
                    <option value={true}>Yes</option>
                  </select>
                </div>

                {/* Sales Agreement */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Sales Agreement (Optional)</label>
                  <input
                    name="sales_agreement"
                    value={formik.values.sales_agreement}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={formik.isSubmitting}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status - Disabled Radio Buttons */}
              <div className="w-full md:w-1/2">
                <label className="block font-medium mb-1 text-gray-700">Status</label>
                <div className="flex space-x-4">
                  {['draft', 'published', 'archived', 'retired'].map(status => (
                    <label
                      key={status}
                      className={`flex items-center px-4 py-2 border rounded-md cursor-not-allowed ${
                        formik.values.status === status
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={formik.values.status === status}
                        onChange={() => { }} // Disabled
                        disabled={true}
                        className="mr-2"
                      />
                      <span className="capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-medium mb-1 text-gray-700">Description</label>
                <textarea
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rows="4"
                    disabled={formik.isSubmitting}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>
          </div>
        </div>
        
        {isEditMode && (
          <div className='bg-white max-w-7xl mx-auto my-4'>
            {/* Tabs Section */}
            <div className="p-3">
              <Tabs
                activeKey={activeTab}
                type="card"
                onChange={setActiveTab}
                items={tabItems}
                className="tabs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PriceListFormPage;