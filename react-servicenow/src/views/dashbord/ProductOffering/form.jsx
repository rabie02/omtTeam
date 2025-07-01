import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { notification, Spin, Popconfirm, Select, Table, Tabs } from 'antd';
import { formatDateForInput } from '@/utils/formatDateForInput.js';
import {
  getOne,
  createProductOffering,
  updateProductOffering,
  updateProductOfferingStatus,
  deleteProductOffering
} from '../../../features/servicenow/product-offering/productOfferingSlice';
import { getPublish as getCategories } from '../../../features/servicenow/product-offering/productOfferingCategorySlice';
// import { getall as getChannels } from '../../features/servicenow/channel/channelSlice';
import { getPublished as getSpecifications } from '../../../features/servicenow/product-specification/productSpecificationSlice';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  start_date: Yup.string().required('Start date is required'),
  end_date: Yup.string()
    .test('end-date', 'End date must be after start date', function (value) {
      if (!value) return true;
      return new Date(value) >= new Date(this.parent.start_date);
    }),
  category: Yup.string().required('Category is required'),
  description: Yup.string().required('Description is required'),
  p_spec: Yup.string().required('Product Specification is required'),
  recurring_price: Yup.number().min(0, 'Price must be positive'),
  non_recurring_price: Yup.number().min(0, 'Price must be positive'),
});

const STATUS_TRANSITIONS = {
  draft: { next: 'published', action: 'Publish' },
  published: { next: 'archived', action: 'Archive' },
  archived: { next: 'retired', action: 'Retire' },
  retired: null
};

const StatusCell = ({ status }) => {
  const statusColors = {
    published: { dot: 'bg-green-500', text: 'text-green-700' },
    draft: { dot: 'bg-blue-500', text: 'text-blue-700' },
    archived: { dot: 'bg-red-500', text: 'text-red-700' },
    retired: { dot: 'bg-gray-400', text: 'text-gray-600' },
  };

  const colors = statusColors[status] || statusColors.inactive;
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

function ProductOfferingFormPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [initialized, setInitialized] = useState(false);
  const [nextStatusAction, setNextStatusAction] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [specSearch, setSpecSearch] = useState('');
  const [activeTab, setActiveTab] = useState('category');

  const {
    currentProductOffering,
    loading: loadingProductOffering
  } = useSelector(state => state.productOffering);

  const {
    data: categories,
    loading: loadingCategories
  } = useSelector(state => state.productOfferingCategory);

  const {
    data: specifications,
    loading: loadingSpecifications
  } = useSelector(state => state.productSpecification);

  // Fetch all required data
  useEffect(() => {
    dispatch(getCategories({ q: categorySearch }));
    dispatch(getSpecifications({ q: specSearch }));
  }, [dispatch, categorySearch, specSearch]);

  // Fetch product offering details in edit mode
  useEffect(() => {
    if (isEditMode) {
      dispatch(getOne(id)).then(() => setInitialized(true));
    } else {
      setInitialized(true);
    }
  }, [id, isEditMode, dispatch]);

  // Determine next status action
  useEffect(() => {
    if (isEditMode && currentProductOffering) {
      const transition = STATUS_TRANSITIONS[currentProductOffering.status];
      setNextStatusAction(transition ? transition.action : null);
    }
  }, [currentProductOffering, isEditMode]);

  const getInitialValues = () => {
    const defaultValues = {
      name: '',
      start_date: formatDateForInput(new Date()),
      end_date: '',
      status: 'draft',
      description: '',
      category: '',
      p_spec: '',
      pricing_type: 'recurring',
      recurring_price: '0',
      non_recurring_price: '0',
      currency: 'USD',
      po_term: 'not_applicable',
      channel: 'e561aae4c3e710105252716b7d40dd8f'
    };

    if (!isEditMode || !currentProductOffering || loadingProductOffering) {
      return defaultValues;
    }

    return {
      ...defaultValues,
      name: currentProductOffering.name || '',
      start_date: formatDateForInput(currentProductOffering.validFor?.startDateTime) || defaultValues.start_date,
      end_date: currentProductOffering.validFor?.endDateTime
        ? formatDateForInput(currentProductOffering.validFor.endDateTime)
        : '',
      status: currentProductOffering.status || 'draft',
      description: currentProductOffering.description || '',
      category: currentProductOffering.category[0]?._id || '',
      p_spec: currentProductOffering.productSpecification?._id || '',
      recurring_price: currentProductOffering.productOfferingPrice?.find(p => p.priceType === 'recurring')?.price?.taxIncludedAmount?.value || '0',
      non_recurring_price: currentProductOffering.productOfferingPrice?.find(p => p.priceType === 'nonRecurring')?.price?.taxIncludedAmount?.value || '0',
      po_term: currentProductOffering.productOfferingTerm || 'not_applicable',
      pricing_type: currentProductOffering.productOfferingPrice?.find(p => p.priceType === 'recurring')?.price?.taxIncludedAmount?.value !== "0"
        ? 'recurring'
        : 'one_time'
    };
  };

  // ... existing imports and code ...

  const formik = useFormik({
    initialValues: getInitialValues(),
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const selectedSpec = specifications?.find(spec => spec._id === values.p_spec);
        if (!selectedSpec) {
          throw new Error('Selected Product Specification not found');
        }

        // Transform characteristic values
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

        // FIX 1: Remove lastUpdate completely as ServiceNow handles timestamps automatically
        // FIX 2: Remove externalId from payload
        const productOfferingDataPayload = {
          name: values.name,
          version: currentProductOffering?.version || "1",
          internalVersion: currentProductOffering?.internalVersion || "1",
          description: values.description,

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
                  unit: values.currency,
                  // FIX 3: Corrected typo in "recurring"
                  value: parseFloat(values.pricing_type === "recurring" ? values.recurring_price : 0)
                }
              }
            },
            {
              priceType: "nonRecurring",
              price: {
                taxIncludedAmount: {
                  unit: values.currency,
                  value: parseFloat(values.pricing_type === "one_time" ? values.non_recurring_price : 0)
                }
              }
            }
          ],
          productSpecification: {
            _id: values.p_spec,
            id: specifications.find(s => s._id === values.p_spec)?.sys_id,
            name: specifications.find(s => s._id === values.p_spec)?.display_name || "",
            version: "",
            internalVersion: "1",
            internalId: specifications.find(s => s._id === values.p_spec)?.sys_id
          },
          prodSpecCharValueUse: prodSpecCharValueUse,
          channel: [
            {
              id: values.channel,
              name: "Web"
            }
          ],
          category: {
            _id: values.category,
            id: categories.find(c => c._id === values.category)?.id ||
              categories.find(c => c._id === values.category)?.sys_id,
            name: categories.find(c => c._id === values.category)?.name || ""
          },
          lifecycleStatus: "Draft",
          status: "draft"
        };

        // FIX 4: Remove unexpected externalId property
        delete productOfferingDataPayload.externalId;

        const action = isEditMode
          ? updateProductOffering({
            id: currentProductOffering._id,
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




  const handleCancel = () => navigate('/dashboard/product-offering');

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!currentProductOffering || !STATUS_TRANSITIONS[currentProductOffering.status]) return;

    const nextStatus = STATUS_TRANSITIONS[currentProductOffering.status].next;

    try {
      await dispatch(updateProductOfferingStatus({
        id,
        status: nextStatus
      })).unwrap();

      formik.setFieldValue('status', nextStatus);
      notification.success({
        message: 'Status Updated',
        description: `Product offering has been ${nextStatusAction.toLowerCase()} successfully`,
      });

      const newTransition = STATUS_TRANSITIONS[nextStatus];
      setNextStatusAction(newTransition ? newTransition.action : null);
    } catch (error) {
      notification.error({
        message: 'Status Update Failed',
        description: error.payload || 'Failed to update product offering status',
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteProductOffering(id)).unwrap();
      notification.success({
        message: 'Product Offering Deleted',
        description: 'Product offering has been deleted successfully',
      });
      navigate('/dashboard/product-offering');
    } catch (error) {
      notification.error({
        message: 'Deletion Failed',
        description: error.payload || 'Failed to delete product offering',
      });
    } finally {
      setDeleting(false);
    }
  };

  if ((isEditMode && loadingProductOffering) || !initialized) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin
          size="large"
          tip="Loading product offering details..."
          indicator={<i className="ri-refresh-line animate-spin text-2xl"></i>}
        />
      </div>
    );
  }
  const handleNumberClick = (id) => {
    navigate(`/dashboard/catalog/edit/${id}`);
  };

  const handleRowClick = (id) => navigate(`/dashboard/product-specification/view/${id}`);

  const tabItems = [
    {
      key: 'category',
      label: (
        <span className="flex items-center">
          <i className="ri-price-tag-3-line text-lg mr-2"></i>
          Category
        </span>
      ),
      children: (
        <div className="p-4">
          <Table
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                render: (text, record) => (
                  <span
                    className="text-cyan-600 font-medium hover:underline cursor-pointer"
                    onClick={() => handleNumberClick(record._id)}
                  >
                    {text}
                  </span>
                )
              },
              {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => <StatusCell status={status} />,
              },
              {
                title: 'Created',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (date) => date
                  ? new Date(date).toISOString().split("T")[0]
                  : 'N/A',
              },
            ]}
            dataSource={currentProductOffering?.category || []}
            pagination={{ pageSize: 5 }}
            rowKey="_id"
            locale={{
              emptyText: (
                <div className="py-8 text-center">
                  <i className="ri-information-line mx-auto text-3xl text-gray-400 mb-3"></i>
                  <p className="text-gray-500">No category information available.</p>
                </div>
              )
            }}
          />
        </div>
      )
    },
    {
      key: 'pricing',
      label: (
        <span className="flex items-center">
          <i className="ri-money-dollar-circle-line text-lg mr-2"></i>
          Pricing
        </span>
      ),
      children: (
        <div className="p-4">
          <Table
            columns={[
              {
                title: 'Type',
                dataIndex: 'priceType',
                key: 'priceType',
                render: (type) => (
                  <span className="capitalize">
                    {type === 'recurring' ? 'Recurring' : 'One-time'}
                  </span>
                ),
              },
              {
                title: 'Amount',
                dataIndex: 'price',
                key: 'amount',
                render: (price) => (
                  <span className="text-gray-800 font-medium">
                    {price?.taxIncludedAmount?.value} {price?.taxIncludedAmount?.unit}
                  </span>
                ),
              },
              {
                title: 'Billing Period',
                dataIndex: 'recurringChargePeriod',
                key: 'period',
                render: (period) => period || 'N/A',
              },
            ]}
            dataSource={currentProductOffering?.productOfferingPrice || []}
            pagination={{ pageSize: 5 }}
            rowKey="priceType"
            locale={{
              emptyText: (
                <div className="py-8 text-center">
                  <i className="ri-information-line mx-auto text-3xl text-gray-400 mb-3"></i>
                  <p className="text-gray-500">No pricing information available.</p>
                </div>
              )
            }}
          />
        </div>
      )
    },
    {
      key: 'specification',
      label: (
        <span className="flex items-center">
          <i className="ri-list-settings-line text-lg mr-2"></i>
          Specification
        </span>
      ),
      children: (
        <div className="p-4">
          <Table
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                render: (text, record) => (
                  <span
                    className="text-cyan-600 font-medium hover:underline cursor-pointer"
                    onClick={() => handleRowClick(record._id)}
                  >
                    {text}
                  </span>
                )
              },
              {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => <StatusCell status={status} />,
              },
            ]}
            dataSource={currentProductOffering?.productSpecification ? [currentProductOffering.productSpecification] : []}
            pagination={{ pageSize: 5 }}
            rowKey="sys_id"
            locale={{
              emptyText: (
                <div className="py-8 text-center">
                  <i className="ri-information-line mx-auto text-3xl text-gray-400 mb-3"></i>
                  <p className="text-gray-500">No specification information available.</p>
                </div>
              )
            }}
          />
        </div>
      )
    }
  ];

  return (
    <div className="bg-gray-50 h-full flex flex-col">
      {/* Header */}
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
              <h1 className="text-xl font-semibold text-gray-800">Product Offering</h1>
              <p className="text-gray-600 text-md flex items-center gap-2">
                {isEditMode ? currentProductOffering.name : 'New record'}
                {isEditMode && (
                  <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-xs font-medium rounded-md capitalize">
                    {currentProductOffering.status}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isEditMode && nextStatusAction && (
              <button
                onClick={handleStatusUpdate}
                disabled={formik.isSubmitting}
                className="overflow-hidden relative w-32 h-10 bg-cyan-700 text-white border-none rounded-md text-base font-medium cursor-pointer z-10 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {nextStatusAction}
              </button>
            )}

            <button
              type="button"
              onClick={formik.handleSubmit}
              disabled={formik.isSubmitting}
              className="overflow-hidden relative w-32 h-10 bg-white border-cyan-700 text-cyan-700 hover:bg-cyan-50 border-2 text-base font-medium cursor-pointer z-10 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formik.isSubmitting ? 'Processing...' : isEditMode ? 'Update' : 'Create'}
            </button>

            {isEditMode && (
              <Popconfirm
                title="Delete Product Offering"
                description={
                  <div>
                    <p className="font-medium">Are you sure you want to delete this product offering?</p>
                    <p className="text-gray-600 mt-2">
                      This action cannot be undone.
                    </p>
                  </div>
                }
                icon={<i className="ri-error-warning-line text-red-500 text-xl mr-2"></i>}
                onConfirm={handleDelete}
                okText="Delete"
                okButtonProps={{ loading: deleting, danger: true }}
                cancelText="Cancel"
              >
                <button
                  type="button"
                  disabled={formik.isSubmitting || deleting}
                  className="overflow-hidden relative w-32 h-10 bg-white border-cyan-700 text-cyan-700 border-2 hover:bg-cyan-50 text-base font-medium cursor-pointer z-10 group disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className='col-span-2 '>
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

                {/* Category Select */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Select
                    showSearch
                    placeholder="Select a category"
                    value={formik.values.category}
                    onChange={value => formik.setFieldValue('category', value)}
                    onSearch={setCategorySearch}
                    options={categories?.map(cat => ({
                      value: cat._id,
                      label: cat.name
                    }))}
                    className="w-full"
                    loading={loadingCategories}
                    filterOption={false}
                  />
                  {formik.touched.category && formik.errors.category && (
                    <p className="text-red-500 text-sm mt-1">{formik.errors.category}</p>
                  )}
                </div>
                {/* Product Specification */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Product Specification <span className="text-red-500">*</span>
                  </label>
                  <Select
                    showSearch
                    placeholder="Select Product Specification"
                    value={formik.values.p_spec}
                    onChange={value => formik.setFieldValue('p_spec', value)}
                    onSearch={setSpecSearch}
                    options={specifications?.map(spec => ({
                      value: spec._id,
                      label: spec.display_name || spec.name
                    }))}
                    className="w-full"
                    loading={loadingSpecifications}
                    filterOption={false}
                  />
                  {formik.touched.p_spec && formik.errors.p_spec && (
                    <p className="text-red-500 text-sm mt-1">{formik.errors.p_spec}</p>
                  )}
                </div>
              </div>

              {/* Pricing Fields */}
              <div className="grid grid-cols-8 gap-3">
                <div className="col-span-2">
                  <label className="block font-medium mb-1 text-gray-700">Pricing Type</label>
                  <select
                    id="pricing_type"
                    name="pricing_type"
                    value={formik.values.pricing_type}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={formik.isSubmitting}
                    className="w-full border border-gray-300 rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="recurring">Recurring</option>
                    <option value="one_time">One Time</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-medium mb-1 text-gray-700">Price</label>
                  {formik.values.pricing_type === "recurring" ? (
                    <input
                      type="number"
                      name="recurring_price"
                      value={formik.values.recurring_price}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={formik.isSubmitting}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={formik.values.currency}
                      step="0.01"
                      min="0"
                    />
                  ) : (
                    <input
                      type="number"
                      name="non_recurring_price"
                      value={formik.values.non_recurring_price}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={formik.isSubmitting}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder='USD'
                      step="0.01"
                      min="0"
                    />
                  )}
                  {(formik.touched.recurring_price && formik.errors.recurring_price) && (
                    <p className="text-red-500 text-sm mt-1">{formik.errors.recurring_price}</p>
                  )}
                  {(formik.touched.non_recurring_price && formik.errors.non_recurring_price) && (
                    <p className="text-red-500 text-sm mt-1">{formik.errors.non_recurring_price}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block font-medium mb-1 text-gray-700">Currency</label>
                  <select
                    id="currency"
                    name="currency"
                    value={formik.values.currency}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={formik.isSubmitting}
                    className="w-full border border-gray-300 rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-medium mb-1 text-gray-700">Contract Term</label>
                  <select
                    id="po_term"
                    name="po_term"
                    value={formik.values.po_term}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={formik.isSubmitting}
                    className="w-full border border-gray-300 rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="not_applicable">Not Applicable</option>
                    <option value="12_months">12 Months</option>
                    <option value="24_months">24 Months</option>
                    <option value="36_months">36 Months</option>
                    <option value="48_months">48 Months</option>
                    <option value="60_months">60 Months</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="w-full">
                <label className="block font-medium mb-1 text-gray-700">Status</label>
                <div className="flex space-x-4">
                  {['draft', 'published', 'archived', 'retired'].map(status => (
                    <label
                      key={status}
                      className={`flex items-center px-4 py-2 border rounded-md cursor-not-allowed ${formik.values.status === status
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                        }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={formik.values.status === status}
                        onChange={() => { }}
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
                <label className="block font-medium mb-1 text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  rows="4"
                  disabled={formik.isSubmitting}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formik.touched.description && formik.errors.description && (
                  <p className="text-red-500 text-sm mt-1">{formik.errors.description}</p>
                )}
              </div>
            </form>
          </div>
        </div>
        {/* Tabs Section */}
        {isEditMode && currentProductOffering && (
          <div className='bg-white max-w-7xl mx-auto my-4'>
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

export default ProductOfferingFormPage;