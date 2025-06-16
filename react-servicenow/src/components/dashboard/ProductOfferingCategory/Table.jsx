import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, notification, Popconfirm, Empty, Spin, Pagination, Tooltip } from 'antd';
import { getall, deleteCategory, updateCategoryStatus } from '../../../features/servicenow/product-offering/productOfferingCategorySlice';

function CategoryTable({ setData, setOpen, searchQuery, dispatch }) {
    const {
        data: categories,
        loading,
        error,
        currentPage,
        totalItems,
        limit
    } = useSelector((state) => state.productOfferingCategory);

    useEffect(() => {
        dispatch(getall({ page: 1, limit: 6, q: searchQuery }));
    }, [dispatch, searchQuery]);

    const handleDelete = async (productId) => {
        try {
            await dispatch(deleteCategory(productId)).unwrap();
            notification.success({
                message: 'Category Deleted',
                description: 'Category has been deleted successfully'
            });
            dispatch(getall({ page: currentPage, limit, q: searchQuery }));
        } catch (error) {
            notification.error({
                message: 'Deletion Failed',
                description: error.message || 'Failed to delete category'
            });
        }
    };

    const handleUpdateStatus = async (categoryId, newStatus) => {
        try {
            await dispatch(updateCategoryStatus({
                id: categoryId,
                status: newStatus
            })).unwrap();

            notification.success({
                message: 'Status Updated',
                description: `Category has been ${newStatus} successfully`
            });

            dispatch(getall({ page: currentPage, limit, q: searchQuery }));
        } catch (error) {
            notification.error({
                message: 'Update Failed',
                description: error.message || 'Status update failed'
            });
        }
    };

    const handlePageChange = (page) => {
        dispatch(getall({ page, limit, q: searchQuery }));
    };

    const changeData = (newData) => {
        setData(newData);
        setOpen(true);
    };

    const getStatusAction = (currentStatus) => {
        switch (currentStatus.toLowerCase()) {
            case 'draft': return { action: 'Publish', newStatus: 'published' };
            case 'published': return { action: 'Retire', newStatus: 'retired' };
            case 'retired': return { action: 'Archive', newStatus: 'archived' };
            default: return { action: "No update possible for this", newStatus: currentStatus };
        }
    };


    const productOfferingColumns = [
        {
            title: 'Product Offering Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <span className={`px-2 py-1 capitalize ${status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                    }`}>
                    {status}
                </span>
            ),
        },
        {
            title: 'Term',
            dataIndex: 'productOfferingTerm',
            key: 'term',
            render: (text) => text ?
                text.replace(/_/g, ' ')  // Replace underscores with spaces
                    .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letters
                : 'N/A',
        },
        {
            title: 'Start Date',
            render: (_, record) => record.validFor.startDateTime
                ? new Date(record.validFor.startDateTime).toISOString().split("T")[0]
                : 'N/A',
        },
        {
            title: 'End Date',
            render: (_, record) => record.validFor.endDateTime
                ? new Date(record.validFor.endDateTime).toISOString().split("T")[0]
                : 'N/A',
        },
        {
            title: 'Price',
            render: (_, record) => {
                const recurringPrice = record.productOfferingPrice?.find(p => p.priceType === 'recurring');
                return recurringPrice
                    ? `${recurringPrice.price.taxIncludedAmount.value} ${recurringPrice.price.taxIncludedAmount.unit}`
                    : 'N/A';
            },
        },
    ];


    const mainColumns = [
        {
            title: 'Number',
            dataIndex: 'number',
            key: 'number',
            width: 150,

        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',

        },
        {
            title: 'Status',
            key: 'status',

            render: (_, record) => (
                <span className={`px-2 py-1 capitalize rounded ${record.status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                    }`}>
                    {record.status}
                </span>
            ),

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
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => {
                const { action, newStatus } = getStatusAction(record.status);
                return (
                    <div className="flex items-center">
                        {/* Status Change Button - Hidden for archived */}

                        <Tooltip title={`${action} Category`}>
                            <Popconfirm
                                title={`${action} Category`}
                                description={`Are you sure to ${action.toLowerCase()} this category?`}
                                onConfirm={() => handleUpdateStatus(record._id, newStatus)}
                                disabled={record.status === "archived"}
                                okText="Yes"
                                cancelText="No"
                            >
                                <button 
                                    className={`mx-1 ${record.status == "archived" ? "text-gray-300 cursor-not-allowed" : "mx-1 text-gray-500 hover:text-green-600  "}`}>
                                    <i className="ri-loop-right-line text-2xl"></i>
                                </button>
                            </Popconfirm>
                        </Tooltip>


                        {/* Edit Button - Only shown for draft */}
                        <Tooltip title={record.status !== "draft" ? "Editing is only allowed in this status" : "Edit This Category"}>
                            <button
                                className={`mx-1 ${record.status !== "draft" ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-yellow-400"}`}
                                onClick={() => changeData(record)}
                                disabled={record.status !== "draft"}
                            >
                                <i className="ri-pencil-line text-2xl"></i>
                            </button>
                        </Tooltip>


                        {/* Delete Button - Always shown */}
                        <Tooltip title="Delete This Category">
                            <Popconfirm
                                title="Delete Category"
                                description="Are you sure to delete this category?"
                                onConfirm={() => handleDelete(record._id)}
                                okText="Yes"
                                cancelText="No"
                            >
                                <button className=" mx-1 text-gray-500 hover:text-red-600">
                                    <i className="ri-delete-bin-6-line text-2xl"></i>
                                </button>
                            </Popconfirm>
                        </Tooltip>
                    </div>
                );
            },
        }
    ];

    // if (loading) return (
    //     <div className="h-full flex justify-center items-center">
    //         <Spin size="large" tip="Loading categories..." />
    //     </div>
    // );

    // if (error) return (
    //     <div className="text-red-500 p-4">
    //         Error: {error.message || 'Failed to load categories'}
    //     </div>
    // );
     useEffect(() => {
            if (error) {
                notification.error({
                    message: 'Error Occurred',
                    description: error,
                });
            }
        }, [error]);

    return (
        <div className='w-full justify-center flex'>
            <div className="w-10/12 ">
                <Table
                    columns={mainColumns}
                    dataSource={categories}
                    rowKey="sys_id"
                    loading={loading}
                    expandable={{
                        expandedRowRender: (record) => (
                            <div className="ml-8 bg-gray-50 p-4 rounded">
                                {record.productOffering?.length > 0 ? (
                                    <Table
                                        columns={productOfferingColumns}
                                        dataSource={record.productOffering}
                                        rowKey="_id"
                                        bordered
                                        size="small"
                                        pagination={
                                            record.productOffering?.length > 4
                                                ? { pageSize: 4, showSizeChanger: false }
                                                : false
                                        }
                                    />
                                ) : (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="No product Offering found"
                                    />
                                )}
                            </div>
                        ),
                        rowExpandable: (record) => record.productOffering?.length > 0,
                    }}
                    pagination={false}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="No categories found"
                            />
                        ),
                    }}
                    className="shadow-lg rounded-lg overflow-hidden"
                />

                <div className="mt-4 flex justify-end">
                    <Pagination
                        current={currentPage}
                        total={totalItems}
                        pageSize={limit}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                        disabled={loading}
                        className="ant-pagination-custom"
                    />
                </div>
            </div>
        </div>
    );
}

export default CategoryTable;