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
    getOnePriceList as getOne,
    createPriceList,
    resetCurrentPriceList,
    deletePriceList
} from '../../../features/servicenow/price-list/priceListSlice';
import { getAccount } from '../../../features/servicenow/account/accountSlice';
import FormSelectSearch from '../../../components/shared/FormSelectSearch';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  start_date: Yup.string().required('Start date is required'),
  currency: Yup.string().required('Currency is required'),
});
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

function PriceListForm() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const [activeTab, setActiveTab] = useState('1');

    const { currentPriceList, loading } = useSelector(
        state => state.priceList
    );
    const { data, error } = useSelector((state) => state.account);
    const [initialized, setInitialized] = useState(false);
    const [nextStatusAction, setNextStatusAction] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [accSearchTerm, setAccSearchTerm] = useState('');
    
    // Fetch PriceList details in edit mode
    useEffect(() => {
        const fetchData = async()=>{
            if (isEditMode) {
                await dispatch(getOne({id})).then(() => setInitialized(true));
            } else {
                setInitialized(true);
            }
        }
        dispatch(getAccount({ page: 1, limit: 1000, q: accSearchTerm }));
        fetchData();
    }, [id, isEditMode, dispatch]);

    // Determine next status action
    useEffect(() => {
        if (isEditMode && currentPriceList) {
            const transition = STATUS_TRANSITIONS[currentPriceList.status];
            setNextStatusAction(transition ? transition.action : null);
        }
    }, [currentPriceList, isEditMode]);

    const formik = useFormik({
    initialValues: {
      name: currentPriceList?.name || '',
      start_date: formatDateForInput(currentPriceList?.start_date) || '',
      end_date: currentPriceList?.end_date ? formatDateForInput(currentPriceList?.end_date) : '',
      state: currentPriceList?.state || 'published',
      description: currentPriceList?.description || '',
      sales_agreement: currentPriceList?.sales_agreement || '',
      currency: currentPriceList?.currency || 'USD',
      defaultflag: currentPriceList?.defaultflag || 'false',
      account: currentPriceList?.account || '',
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const action = isEditMode
          ? updatePriceList({ id: currentPriceList._id, ...values })
          : createPriceList(values);
        await dispatch(action).unwrap();
        notification.success({
              message: isEditMode ? 'Price List Updated' : 'Price List Created',
              description: isEditMode 
                ? 'Price List has been updated successfully'
                : 'New Price List has been created successfully',
            });
            navigate(`/dashboard/price-list`);
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



    const handleCancel = () => {dispatch(resetCurrentPriceList());formik.resetForm();navigate('/dashboard/price-list');}

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
                description: `PriceList has been ${nextStatusAction.toLowerCase()} successfully`,
            });

            // Update next action
            const newTransition = STATUS_TRANSITIONS[nextStatus];
            setNextStatusAction(newTransition ? newTransition.action : null);
        } catch (error) {
            notification.error({
                message: 'Status Update Failed',
                description: error.message || 'Failed to update PriceList status',
            });
        }
    };

    // Handle delete with Popconfirm
    const handleDelete = async () => {
        setDeleting(true);
        try {
            await dispatch(deletePriceList(id)).unwrap();
            notification.success({
                message: 'PriceList Deleted',
                description: 'PriceList has been deleted successfully',
            });
            navigate('/dashboard/price-list');
        } catch (error) {
            notification.error({
                message: 'Deletion Failed',
                description: error.message || 'Failed to delete PriceList',
            });
        } finally {
            formik.resetForm();
            dispatch(resetCurrentPriceList());
            setDeleting(false);
        }
    };

    // Define table columns for categories
    const popsTableColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Product Offering',
            dataIndex: ['productOffering', 'name'],
            key: 'productOffering',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (text, record) => (
                <span
                    className="text-cyan-600 font-medium hover:underline cursor-pointer"
                    onClick={() => navigate(`/dashboard/product-offering/edit/${record.productOffering._id}`)}
                >
                    {text}
                </span>
            )
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (record) => record.value + " " + record.unit,
        },
        {
            title: <span className="font-semibold">Status</span>,
            dataIndex: 'state',
            key: 'status',
            render: (status) => {
                // Define color mapping for all statuses
                const statusColors = {
                    published: {
                        dot: 'bg-green-500',
                        text: 'text-green-700'
                    },
                    draft: {
                        dot: 'bg-blue-500',
                        text: 'text-blue-700'
                    },
                    archived: {
                        dot: 'bg-gray-400',
                        text: 'text-gray-600'
                    },
                    retired: {
                        dot: 'bg-red-500',
                        text: 'text-red-700'
                    }
                };

                // Get colors for current status or use archived as default
                const colors = statusColors[status] || statusColors.archived;
                const displayText = status ?
                    status.charAt(0).toUpperCase() + status.slice(1) :
                    '';

                return (
                    <div className="flex items-center">
                        <span className={`h-2 w-2 rounded-full mr-2 ${colors.dot}`}></span>
                        <span className={`text-xs ${colors.text}`}>
                            {displayText}
                        </span>
                    </div>
                );
            },
            filters: [
                { text: 'Published', value: 'published' },
                { text: 'Draft', value: 'draft' },
                { text: 'Archived', value: 'archived' },
                { text: 'Retired', value: 'retired' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Start Date',
            dataIndex: ['validFor', 'startDateTime'],
            key: 'start_date',
            sorter: (a, b) => new Date(a.start_date) - new Date(b.start_date),
            render: (date) => date
                ? new Date(date).toISOString().split("T")[0]
                : 'N/A',
        },
        {
            title: 'End Date',
            dataIndex: ['validFor', 'endDateTime'],
            key: 'end_date',
            sorter: (a, b) => new Date(a.end_date) - new Date(b.end_date),
            render: (date) => date
                ? new Date(date).toISOString().split("T")[0]
                : 'N/A',
        },
    ];

    // Tab items configuration
    const tabItems = [
        {
            key: '1',
            label: (
                <span className="flex items-center">
                    <i className="ri-folder-line text-lg mr-2"></i>
                    Product Offering Prices
                </span>
            ),
            children: (
                <div className="p-4">
                    <Table
                        columns={popsTableColumns}
                        dataSource={currentPriceList?.pops || []}
                        pagination={true}
                        rowKey="_id"
                        scroll={{ x: true }}
                        locale={{
                            emptyText: (
                                <div className="py-8 text-center">
                                    <i className="ri-information-line mx-auto text-3xl text-gray-400 mb-3"></i>
                                    <p className="text-gray-500">No Product Offerings associated with this PriceList</p>
                                </div>
                            )
                        }}
                    />
                </div>
            ),
        },
    ];

    // Show spinner while initializing or loading PriceList data
    if ((isEditMode && loading) || !initialized) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin
                    size="large"
                    tip="Loading PriceList details..."
                    indicator={<i className="ri-refresh-line animate-spin text-2xl"></i>}
                />
            </div>
        );
    }

    const hasPublishedCategory = currentPriceList?.categories?.some(category => category.status === 'published') || false;

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
                            <h1 className="text-xl font-semibold text-gray-800">PriceList</h1>
                            <p className="text-gray-600 text-md flex items-center gap-2">
                                {isEditMode ? currentPriceList.name : 'New record'}
                                {isEditMode && (
                                    <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-xs font-medium rounded-md capitalize">
                                        {currentPriceList.state}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {isEditMode && (
                            <>
                                {nextStatusAction && (
                                    <Tooltip
                                        title={hasPublishedCategory ? "Action disabled due to published categories" : ""}
                                        placement="bottom"
                                    >
                                        <div>
                                            <button
                                                type="button"
                                                onClick={handleStatusUpdate}
                                                disabled={formik.isSubmitting || hasPublishedCategory}
                                                className={`overflow-hidden relative w-32 h-10 ${hasPublishedCategory
                                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                                    : 'bg-cyan-700 text-white hover:bg-cyan-800 cursor-pointer'
                                                    } border-none rounded-md text-base font-medium z-10 group transition-colors`}
                                            >
                                                {nextStatusAction}
                                            </button>
                                        </div>
                                    </Tooltip>
                                )}
                            </>
                        )}

                        <Tooltip
                            title={hasPublishedCategory && isEditMode ? "Cannot update with published categories" : ""}
                            placement="bottom"
                        >
                            <div>
                                <button
                                    type="button"
                                    onClick={formik.handleSubmit}
                                    disabled={formik.isSubmitting || (isEditMode && hasPublishedCategory)}
                                    className={`overflow-hidden relative w-32 h-10 border-2 rounded-md text-base font-medium z-10 group transition-colors ${(isEditMode && hasPublishedCategory)
                                        ? 'bg-gray-100 border-gray-400 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border-cyan-700 text-cyan-700 hover:bg-cyan-50 cursor-pointer'
                                        } ${formik.isSubmitting ? 'opacity-70' : ''}`}
                                    hidden={isEditMode}
                                >
                                    {formik.isSubmitting ? (
                                        <span>Processing...</span>
                                    ) : isEditMode ? (
                                        <span>Update</span>
                                    ) : (
                                        <span>Create</span>
                                    )}
                                </button>
                            </div>
                        </Tooltip>

                        {isEditMode && (
                            <Tooltip
                                title={hasPublishedCategory ? "Cannot delete with published categories" : ""}
                                placement="bottom"
                            >
                                <div>
                                    <Popconfirm
                                        title="Delete PriceList"
                                        description={
                                            <div>
                                                <p className="font-medium">Are you sure you want to delete this PriceList?</p>
                                                <p className="text-gray-600 mt-2">
                                                    This action cannot be undone. All associated product offerings will be removed.
                                                </p>
                                                {hasPublishedCategory && (
                                                    <p className="text-red-500 mt-2 font-medium">
                                                        <i className="ri-error-warning-line mr-1"></i>
                                                        Cannot delete PriceList with published categories
                                                    </p>
                                                )}
                                            </div>
                                        }
                                        icon={<i className="ri-error-warning-line text-red-500 text-xl mr-2"></i>}
                                        onConfirm={hasPublishedCategory ? null : handleDelete}
                                        okText="Delete"
                                        okButtonProps={{
                                            loading: deleting,
                                            danger: true,
                                            disabled: hasPublishedCategory
                                        }}
                                        cancelText="Cancel"
                                        disabled={hasPublishedCategory}
                                    >
                                        <button
                                            type="button"
                                            disabled={formik.isSubmitting || deleting || hasPublishedCategory}
                                            className={`overflow-hidden relative w-32 h-10 border-2 rounded-md text-base font-medium z-10 group transition-colors ${hasPublishedCategory
                                                ? 'bg-gray-100 border-gray-400 text-gray-400 cursor-not-allowed'
                                                : 'bg-white border-cyan-700 text-cyan-700 hover:bg-cyan-50 cursor-pointer'
                                                }`}
                                        >
                                            Delete
                                        </button>
                                    </Popconfirm>
                                </div>
                            </Tooltip>
                        )}
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-grow overflow-y-auto  ">
                <div className="bg-white  shadow-sm  max-w-6xl mx-auto my-6">
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
                                        disabled={formik.isSubmitting || (isEditMode && currentPriceList.state !== 'draft')}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
                                    />
                                    {formik.touched.name && formik.errors.name && (
                                        <p className="text-red-500 text-sm mt-1">{formik.errors.name}</p>
                                    )}
                                </div>

                                    <FormSelectSearch
                                        formik={formik}
                                        name="account"
                                        label="Account*"
                                        onSearch = {(value)=>{setAccSearchTerm(value)}}
                                        filterOption = {false}
                                        options={data.map(account => ({
                                        value: account.sys_id,
                                        label: account.name
                                        }))}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        disabled={isEditMode}
                                    />
                                    


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
                                        disabled={formik.isSubmitting || (isEditMode && currentPriceList.state !== 'draft')}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
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
                                        disabled={formik.isSubmitting || (isEditMode && currentPriceList.state !== 'draft')}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
                                    />
                                    {formik.touched.end_date && formik.errors.end_date && (
                                        <p className="text-red-500 text-sm mt-1">{formik.errors.end_date}</p>
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
                                disabled={formik.isSubmitting || (isEditMode && currentPriceList.state !== 'draft')}
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
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

                            {/* Status - Disabled Radio Buttons */}
                            <div className="w-full md:w-1/2">
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
                                                checked={formik.values.state === status}
                                                onChange={() => { }} // Disabled
                                                disabled={true}
                                                className="mr-2"
                                            />
                                            <span className="capitalize">{status}</span>
                                        </label>
                                    ))}
                                </div>
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
                                    disabled={formik.isSubmitting || (isEditMode && currentPriceList.state !== 'draft')}
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
                                />
                            </div>
                        </form>
                    </div>
                </div>
                {isEditMode ? (
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
                ) : null}



            </div>
        </div>
    );
}

export default PriceListForm;