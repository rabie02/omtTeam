import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Popconfirm, Pagination, Spin, Empty, notification, Table } from 'antd';
import { getall, deleteProductOffering, updateProductOfferingStatus } from '../../../features/servicenow/product-offering/productOfferingSlice';

function ProductOfferingTable({ setData, setOpen, searchQuery }) {
    const dispatch = useDispatch();
    const {
        data: products,
        loading,
        error,
        currentPage,
        totalItems,
        limit
    } = useSelector((state) => state.productOffering);

    useEffect(() => {
        dispatch(getall({ page: 1, limit: 6, q: searchQuery }));
    }, [dispatch, searchQuery]);

    const handleDelete = async (productId) => {
        try {
            await dispatch(deleteProductOffering(productId));
            notification.success({
                message: 'Product Offering Deleted',
                description: 'Product Offering has been deleted successfully',
            });
            dispatch(getall({ page: currentPage, limit, q: searchQuery }));
        } catch (error) {
            console.error('Deletion failed:', error);
            notification.error({
                message: 'Deletion Failed',
                description: error.message || 'Failed to delete Product Offering. Please try again.',
            });
        }
    };

    const handleUpdateStatus = async (productId, newStatus) => {
        try {
            await dispatch(updateProductOfferingStatus({
                id: productId,
                status: newStatus
            }));
            notification.success({
                message: 'Status Updated',
                description: `Product Offering has been ${newStatus} successfully`,
            });
            dispatch(getall({
                page: currentPage,
                limit,
                q: searchQuery
            }));
        } catch (error) {
            console.error('Status update failed:', error);
            notification.error({
                message: 'Update Failed',
                description: error.message || 'Failed to update Product Offering status. Please try again.',
            });
        }
    };

    function changeData(newData) {
        setData(newData)
        setOpen(true)
    }

    const handlePageChange = (page) => {
        dispatch(getall({ page, limit, q: searchQuery }));
    };

    const getStatusAction = (currentStatus) => {
        switch (currentStatus.toLowerCase()) {
            case 'draft':
                return { action: 'Publish', newStatus: 'published' };
            case 'published':
                return { action: 'Retire', newStatus: 'retired' };
            case 'retired':
                return { action: 'Archive', newStatus: 'archived' };
            default:
                return { action: 'Update Status', newStatus: currentStatus };
        }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name?.localeCompare(b.name),
            render: (name) => name || 'N/A'
        },
        {
            title: 'Product Specification',
            dataIndex: ['productSpecification', 'name'],
            key: 'productSpecification',
            render: (text) => text || 'N/A',
            sorter: (a, b) => {
                const nameA = a.productSpecification?.name || '';
                const nameB = b.productSpecification?.name || '';
                return nameA.localeCompare(nameB);
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <span className={`px-2 py-1 text-xs capitalize rounded ${status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {status}
                </span>
            ),
            sorter: (a, b) => a.status?.localeCompare(b.status)
        },
        {
            title: 'Start Date',
            dataIndex: ['validFor', 'startDateTime'],
            key: 'startDate',
            render: (text) => text || 'N/A',
            sorter: (a, b) => {
                const dateA = a.validFor?.startDateTime || '';
                const dateB = b.validFor?.startDateTime || '';
                return dateA.localeCompare(dateB);
            }
        },
        {
            title: 'End Date',
            dataIndex: ['validFor', 'endDateTime'],
            key: 'endDate',
            render: (text) => text || 'N/A',
            sorter: (a, b) => {
                const dateA = a.validFor?.endDateTime || '';
                const dateB = b.validFor?.endDateTime || '';
                return dateA.localeCompare(dateB);
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, product) => (
                <div className="flex">
                    <Popconfirm
                        title={`${getStatusAction(product.status).action} Product offering`}
                        description={`Are you sure you want to ${getStatusAction(product.status).action.toLowerCase()} this product offering?`}
                        icon={<i className="ri-error-warning-line text-yellow-600 text-md mr-2"></i>}
                        onConfirm={() => handleUpdateStatus(product._id, getStatusAction(product.status).newStatus)}
                    >
                        <button className="mr-1 text-gray-500 hover:text-green-600">
                            <i className="ri-loop-right-line text-2xl"></i>
                        </button>
                    </Popconfirm>
                    {product.status === "draft" && (
                        <button
                            className="text-gray-500 hover:text-blue-600"
                            onClick={() => changeData(product)}
                        >
                            <i className="ri-pencil-line text-2xl"></i>
                        </button>
                    )}
                    <Popconfirm
                        title="Delete the Product Offering"
                        description="Are you sure to delete this Product Offering?"
                        icon={<i className="ri-error-warning-line text-red-600 mr-2"></i>}
                        onConfirm={() => handleDelete(product._id)}
                    >
                        <button className="ml-1 text-gray-500 hover:text-red-600">
                            <i className="ri-delete-bin-6-line text-2xl"></i>
                        </button>
                    </Popconfirm>
                </div>
            )
        }
    ];

    if (loading) return <div className='h-full flex justify-center items-center'><Spin /></div>;
    if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

    return (
        <div className='w-full justify-center flex'>
            <div className="w-9/12">
                <Table
                    columns={columns}
                    dataSource={products}
                    rowKey="_id"
                    pagination={false}
                    showSorterTooltip={{ title: 'Click to sort' }}
                    locale={{
                        emptyText: <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No Product Offerings found"
                        />
                    }}
                    className="border border-gray-300 shadow-2xl"
                />
                <div className="mt-5 flex justify-end">
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

export default ProductOfferingTable;