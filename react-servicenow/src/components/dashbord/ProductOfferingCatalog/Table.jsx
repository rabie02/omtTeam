import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, notification, Popconfirm, Empty, Spin, Pagination, Tooltip } from 'antd';
import {
    getall,
    deleteCatalog,
    updateCatalogStatus
} from '../../../features/servicenow/product-offering/productOfferingCatalogSlice';

function CatalogTable({ setData, setOpen, searchQuery }) {
    const dispatch = useDispatch();
    const {
        data,
        loading,
        error,
        currentPage,
        totalItems,
        limit
    } = useSelector((state) => state.productOfferingCatalog);

    useEffect(() => {
        dispatch(getall({ page: 1, limit: 6, q: searchQuery }));
    }, [dispatch, searchQuery]);

    const handleDelete = async (productId) => {
        try {
            await dispatch(deleteCatalog(productId)).unwrap();
            notification.success({ message: 'Catalog Deleted', description: 'Catalog has been deleted successfully' });
            dispatch(getall({ page: currentPage, limit, q: searchQuery }));
        } catch (error) {
            notification.error({ message: 'Deletion Failed', description: error.message || 'Failed to delete catalog' });
        }
    };

    const handleUpdateStatus = async (productId, newStatus) => {
        try {
            await dispatch(updateCatalogStatus({ id: productId, status: newStatus })).unwrap();
            notification.success({ message: 'Status Updated', description: `Catalog has been ${newStatus} successfully` });
            dispatch(getall({ page: currentPage, limit, q: searchQuery }));
        } catch (error) {
            notification.error({ message: 'Update Failed', description: error.message || 'Status update failed' });
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
            case 'archived': return { action: 'Archive', newStatus: 'archived' };
            default: return { action: 'Update Status', newStatus: currentStatus };
        }
    };

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
            sorter: (a, b) => a.name.localeCompare(b.name),
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
                        <Tooltip title={`${action} Catalog`}>
                            <Popconfirm
                                title={`${action} Catalog`}
                                description={`Are you sure to ${action.toLowerCase()} this catalog?`}
                                onConfirm={() => handleUpdateStatus(record._id, newStatus)}
                            >
                                <button className="text-gray-500 hover:text-green-600">
                                    <i className="ri-loop-right-line text-2xl"></i>
                                </button>
                            </Popconfirm>
                        </Tooltip>
                        <Tooltip title="Edit This Catalog">
                            <button
                                className="mx-2 text-gray-500 hover:text-yellow-400"
                                onClick={() => changeData(record)}
                            >
                                <i className="ri-pencil-line text-2xl"></i>
                            </button>
                        </Tooltip>
                        <Tooltip title="Delete This Catalog">
                            <Popconfirm
                                title="Delete Catalog"
                                description="Are you sure to delete this catalog?"
                                onConfirm={() => handleDelete(record._id)}
                            >
                                <button className="text-gray-500 hover:text-red-600">
                                    <i className="ri-delete-bin-6-line text-2xl"></i>
                                </button>
                            </Popconfirm>
                        </Tooltip>
                    </div>
                );
            },
        },
    ];

    const categoryColumns = [
        {
            title: 'Category Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
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
            title: 'Start Date',
            dataIndex: 'start_date',
            render: (date) => new Date(date).toISOString().split("T")[0],
        },
        {
            title: 'End date',
            dataIndex: 'end_date',
            render: (_, record) => record.end_date
                ? new Date(record.end_date).toISOString().split("T")[0]
                : 'N/A',
        },
    ];

    if (loading) return <div className="h-full flex justify-center items-center"><Spin size="large" /></div>;
    if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

    return (
        <div className='w-full justify-center flex'>
            <div className="w-10/12 ">
                <Table
                    columns={mainColumns}
                    dataSource={data}
                    rowKey="_id"
                    loading={loading}
                    expandable={{
                        expandedRowRender: (record) => (
                            <div className="ml-8">
                                {record.categories?.length > 0 ? (
                                    <Table
                                        columns={categoryColumns}
                                        dataSource={record.categories}
                                        rowKey="_id"
                                        pagination={false}
                                        bordered
                                        size="small"
                                    />
                                ) : (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="No categories available"
                                    />
                                )}
                            </div>
                        ),
                        rowExpandable: (record) => record.categories?.length > 0,
                    }}
                    pagination={false}
                    locale={{
                        emptyText: <Empty description="No catalogs found" />,
                    }}
                    className="shadow-lg rounded-lg overflow-hidden"
                />

                <div className="mt-6 flex justify-end">
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

export default CatalogTable;