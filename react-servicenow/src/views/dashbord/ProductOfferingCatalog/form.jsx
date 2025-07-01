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
    updateCatalog,
    createCatalog,
    getOne,
    deleteCatalog,
    updateCatalogStatus
} from '../../../features/servicenow/product-offering/productOfferingCatalogSlice';

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

function ProductOfferingCatalogFormPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const [activeTab, setActiveTab] = useState('1');

    const { currentCatalog, loading, loadingCatalog } = useSelector(
        state => state.productOfferingCatalog
    );
    const [initialized, setInitialized] = useState(false);
    const [nextStatusAction, setNextStatusAction] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch catalog details in edit mode
    useEffect(() => {
        if (isEditMode) {
            dispatch(getOne(id)).then(() => setInitialized(true));
        } else {
            setInitialized(true);
        }
    }, [id, isEditMode, dispatch]);

    // Determine next status action
    useEffect(() => {
        if (isEditMode && currentCatalog) {
            const transition = STATUS_TRANSITIONS[currentCatalog.status];
            setNextStatusAction(transition ? transition.action : null);
        }
    }, [currentCatalog, isEditMode]);

    // Initialize form with proper default values
    const initialValues = {
        name: '',
        start_date: '',
        end_date: '',
        status: 'draft',
        description: '',
        code: '',
    };

    // Merge with currentCatalog if available
    if (isEditMode && currentCatalog && !loading) {
        initialValues.name = currentCatalog.name || '';
        initialValues.start_date = formatDateForInput(currentCatalog.start_date) || '';
        initialValues.end_date = currentCatalog.end_date
            ? formatDateForInput(currentCatalog.end_date)
            : '';
        initialValues.status = currentCatalog.status || 'draft';
        initialValues.description = currentCatalog.description || '';
        initialValues.code = currentCatalog.code || '';
    }

    const formik = useFormik({
        initialValues,
        validationSchema,
        onSubmit: async (values, { resetForm }) => {
            try {
                const action = isEditMode
                    ? updateCatalog({ id, ...values })
                    : createCatalog(values);

                await dispatch(action).unwrap();

                notification.success({
                    message: isEditMode ? 'Catalog Updated' : 'Catalog Created',
                    description: isEditMode
                        ? 'Catalog has been updated successfully'
                        : 'New catalog has been created successfully',
                });

                navigate('/dashboard/catalog');
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

    // Generate code only in create mode when name changes
    useEffect(() => {
        if (!isEditMode && initialized) {
            const generatedCode = generateCodeFromName(formik.values.name);
            formik.setFieldValue('code', generatedCode);
        }
    }, [formik.values.name, isEditMode, initialized]);

    const handleCancel = () => navigate('/dashboard/catalog');
    const handleRowClick = (id) => navigate(`/dashboard/category/edit/${id}`);

    // Handle status update
    const handleStatusUpdate = async () => {
        if (!currentCatalog || !STATUS_TRANSITIONS[currentCatalog.status]) return;

        const nextStatus = STATUS_TRANSITIONS[currentCatalog.status].next;

        try {
            await dispatch(updateCatalogStatus({
                id,
                status: nextStatus
            })).unwrap();

            // Update formik values to reflect new status
            formik.setFieldValue('status', nextStatus);

            notification.success({
                message: 'Status Updated',
                description: `Catalog has been ${nextStatusAction.toLowerCase()} successfully`,
            });

            // Update next action
            const newTransition = STATUS_TRANSITIONS[nextStatus];
            setNextStatusAction(newTransition ? newTransition.action : null);
        } catch (error) {
            notification.error({
                message: 'Status Update Failed',
                description: error.message || 'Failed to update catalog status',
            });
        }
    };

    // Handle delete with Popconfirm
    const handleDelete = async () => {
        setDeleting(true);
        try {
            await dispatch(deleteCatalog(id)).unwrap();
            notification.success({
                message: 'Catalog Deleted',
                description: 'Catalog has been deleted successfully',
            });
            navigate('/dashboard/catalog');
        } catch (error) {
            notification.error({
                message: 'Deletion Failed',
                description: error.message || 'Failed to delete catalog',
            });
        } finally {
            setDeleting(false);
        }
    };

    // Define table columns for categories
    const categoryTableColumns = [
        {
            title: (
                <div className="flex items-center font-semibold">
                    <span>Number</span>
                </div>
            ),
            dataIndex: 'number',
            key: 'number',
            sorter: (a, b) => a.number.localeCompare(b.number),
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
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: <span className="font-semibold">Status</span>,
            dataIndex: 'status',
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
            key: 'start_date',
            sorter: (a, b) => new Date(a.start_date) - new Date(b.start_date),
            render: (_, record) => record.start_date
                ? new Date(record.start_date).toISOString().split("T")[0]
                : 'N/A',
        },
        {
            title: 'End Date',
            key: 'end_date',
            sorter: (a, b) => new Date(a.end_date) - new Date(b.end_date),
            render: (_, record) => record.end_date
                ? new Date(record.end_date).toISOString().split("T")[0]
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
                    Category
                </span>
            ),
            children: (
                <div className="p-4">
                    <Table
                        columns={categoryTableColumns}
                        dataSource={currentCatalog?.categories || []}
                        pagination={true}
                        rowKey="_id"
                        scroll={{ x: true }}
                        locale={{
                            emptyText: (
                                <div className="py-8 text-center">
                                    <i className="ri-information-line mx-auto text-3xl text-gray-400 mb-3"></i>
                                    <p className="text-gray-500">No categories associated with this catalog</p>
                                </div>
                            )
                        }}
                    />
                </div>
            ),
        },
    ];

    // Show spinner while initializing or loading catalog data
    if ((isEditMode && loading) || !initialized) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin
                    size="large"
                    tip="Loading catalog details..."
                    indicator={<i className="ri-refresh-line animate-spin text-2xl"></i>}
                />
            </div>
        );
    }

    const hasPublishedCategory = currentCatalog?.categories?.some(category => category.status === 'published') || false;

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
                            <h1 className="text-xl font-semibold text-gray-800">Product Offering Catalog</h1>
                            <p className="text-gray-600 text-md flex items-center gap-2">
                                {isEditMode ? currentCatalog.name : 'New record'}
                                {isEditMode && (
                                    <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-xs font-medium rounded-md capitalize">
                                        {currentCatalog.status}
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
                                        title="Delete Catalog"
                                        description={
                                            <div>
                                                <p className="font-medium">Are you sure you want to delete this catalog?</p>
                                                <p className="text-gray-600 mt-2">
                                                    This action cannot be undone. All associated product offerings will be removed.
                                                </p>
                                                {hasPublishedCategory && (
                                                    <p className="text-red-500 mt-2 font-medium">
                                                        <i className="ri-error-warning-line mr-1"></i>
                                                        Cannot delete catalog with published categories
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
                                        disabled={formik.isSubmitting}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {formik.touched.name && formik.errors.name && (
                                        <p className="text-red-500 text-sm mt-1">{formik.errors.name}</p>
                                    )}
                                </div>

                                {/* Code */}
                                <div>
                                    <label className="block font-medium mb-1 text-gray-700">
                                        Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="code"
                                        value={formik.values.code}
                                        readOnly
                                        className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                                    />
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

export default ProductOfferingCatalogFormPage;