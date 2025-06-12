import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, notification, Popconfirm, Empty, Spin, Pagination, Tooltip } from 'antd';
import {
    getAccount,
    deleteAccount
} from '../../../features/servicenow/account/accountSlice';

function AccountTable({ setData, setOpen, searchQuery }) {
    const dispatch = useDispatch();
    const {
        data,
        loading,
        error,
        currentPage,
        totalItems,
        limit
    } = useSelector((state) => state.account);

    useEffect(() => {
        dispatch(getAccount({ page: 1, limit: 6, q: searchQuery }));
    }, [dispatch, searchQuery]);

    const handleDelete = async (accountId) => {
        try {
            await dispatch(deleteAccount(accountId)).unwrap();
            notification.success({ message: 'Account Deleted', description: 'Account has been deleted successfully' });
            dispatch(getAccount({ page: currentPage, limit, q: searchQuery }));
        } catch (error) {
            notification.error({ message: 'Deletion Failed', description: error.message || 'Failed to delete account' });
        }
    };

    const handlePageChange = (page) => {
        dispatch(getAccount({ page, limit, q: searchQuery }));
    };

    const viewDetails = (accountData) => {
        setData(accountData);
        setOpen(true);
    };

    const mainColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => (
                <span className={`px-2 py-1 capitalize rounded ${record.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                    }`}>
                    {record.status}
                </span>
            ),
        },
        {
            title: 'Updated At',
            key: 'updatedAt',
            sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
            render: (_, record) => record.updatedAt
                ? new Date(record.updatedAt).toISOString().split(".")[0]
                : 'N/A',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div className="flex items-center">
                    <Tooltip title="View Details">
                        <button
                            className="text-gray-500 hover:text-blue-600"
                            onClick={() => viewDetails(record)}
                        >
                            <i className="ri-eye-line text-2xl"></i>
                        </button>
                    </Tooltip>

                    <Tooltip title="Delete This Account">
                        <Popconfirm
                            title="Delete Account"
                            description="Are you sure to delete this account?"
                            onConfirm={() => handleDelete(record._id)}
                        >
                            <button className="ml-2 text-gray-500 hover:text-red-600">
                                <i className="ri-delete-bin-6-line text-2xl"></i>
                            </button>
                        </Popconfirm>
                    </Tooltip>
                </div>
            ),
        }
    ];

    const contactColumns = [
        {
            title: 'First Name',
            dataIndex: 'firstName',
            key: 'firstName',
        },
        {
            title: 'Last Name',
            dataIndex: 'lastName',
            key: 'lastName',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Primary',
            dataIndex: 'isPrimaryContact',
            key: 'isPrimaryContact',
            render: (isPrimary) => (
                <span className={`px-2 py-1 rounded ${isPrimary
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                    }`}>
                    {isPrimary ? 'Yes' : 'No'}
                </span>
            ),
        }
    ];

    const locationColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'City',
            dataIndex: 'city',
            key: 'city',
        },
        {
            title: 'State',
            dataIndex: 'state',
            key: 'state',
        },
        {
            title: 'Country',
            dataIndex: 'country',
            key: 'country',
        }
    ];

    if (loading) return <div className="h-full flex justify-center items-center"><Spin size="large" /></div>;
    if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

    return (
        <div className='w-full justify-center flex'>
            <div className="w-10/12">
                <Table
                    columns={mainColumns}
                    dataSource={data}
                    rowKey="_id"
                    loading={loading}
                    expandable={{
                        expandedRowRender: (record) => (
                            <div className="ml-8 space-y-6">
                                <div>
                                    <h3 className="font-medium mb-2">Contacts</h3>
                                    {record.contacts?.length > 0 ? (
                                        <Table
                                            columns={contactColumns}
                                            dataSource={record.contacts}
                                            rowKey="_id"
                                            bordered
                                            size="small"
                                            pagination={
                                                record.contacts?.length > 4
                                                    ? {
                                                        pageSize: 4,
                                                        showSizeChanger: false,
                                                    }
                                                    : false
                                            }
                                        />
                                    ) : (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description="No contacts available"
                                        />
                                    )}
                                </div>
                                
                                <div>
                                    <h3 className="font-medium mb-2">Locations</h3>
                                    {record.locations?.length > 0 ? (
                                        <Table
                                            columns={locationColumns}
                                            dataSource={record.locations}
                                            rowKey="_id"
                                            bordered
                                            size="small"
                                            pagination={
                                                record.locations?.length > 4
                                                    ? {
                                                        pageSize: 4,
                                                        showSizeChanger: false,
                                                    }
                                                    : false
                                            }
                                        />
                                    ) : (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description="No locations available"
                                        />
                                    )}
                                </div>
                            </div>
                        ),
                        rowExpandable: (record) => record.contacts?.length > 0 || record.locations?.length > 0,
                    }}
                    pagination={false}
                    locale={{
                        emptyText: <Empty description="No accounts found" />,
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

export default AccountTable;