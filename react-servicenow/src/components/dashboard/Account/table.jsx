import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Empty, Spin, Pagination, Tooltip, Popconfirm, notification } from 'antd';
import { getAccount, deleteAccount } from '../../../features/servicenow/account/accountSlice';

function AccountTable({ setData, setOpen, searchQuery }) {
    const dispatch = useDispatch();
    const accountState = useSelector((state) => state.account);  // Make sure this matches your slice name

    // Then destructure from the state object
    const {
    data: accounts = [],  // Default empty array
    loading = false,
    error = null,
    page: currentPage = 1,
    total: totalItems = 0,
    limit = 6
    } = accountState || {};

    useEffect(() => {
        dispatch(getAccount({ page: 1, limit: 6, q: searchQuery }));
    }, [dispatch, searchQuery]);

    const handlePageChange = (page) => {
        dispatch(getAccount({ page, limit, q: searchQuery }));
    };

    const seeData = (accountData) => {
        setData(accountData);
        setOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await dispatch(deleteAccount(id));
            notification.success({
                message: 'Account Deleted',
                description: 'Account has been deleted successfully'
            });
            dispatch(getAccount({ page: currentPage, limit, q: searchQuery }));
        } catch (error) {
            notification.error({
                message: 'Deletion Failed',
                description: error.message || 'Failed to delete account'
            });
        }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 200,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 200,
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            width: 150,
        },
        {
            title: 'Updated At',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: 150,
            render: (text, record) => {
                // Prefer 'updatedAt', but fall back to 'createdAt'
                const dateToDisplay = record.updatedAt || record.createdAt;
                return dateToDisplay ? new Date(dateToDisplay).toLocaleString() : 'N/A';
            }},
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => (
                <span className={`px-2 py-1 capitalize rounded ${
                    record.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                }`}>
                    {record.status || 'N/A'}
                </span>
            ),
            width: 120,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <>
                    <Tooltip title="View Account Details">
                        <button
                            className="text-gray-500 hover:text-blue-600"
                            onClick={() => seeData(record)}
                        >
                            <i className="ri-eye-line text-2xl"></i>
                        </button>
                    </Tooltip>
                    <Tooltip title="Delete This Account">
                        <Popconfirm
                            title="Delete Account"
                            description="Are you sure you want to delete this account?"
                            onConfirm={() => handleDelete(record._id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <button className="text-gray-500 hover:text-red-600 ml-2">
                                <i className="ri-delete-bin-6-line text-2xl"></i>
                            </button>
                        </Popconfirm>
                    </Tooltip>
                </>
            ),
            width: 100,
        },
    ];

    if (loading) return (
        <div className="h-full flex justify-center items-center">
            <Spin size="large" tip="Loading accounts..." />
        </div>
    );

    if (error) return (
        <div className="text-red-500 p-4">
            Error: {error.message || 'Failed to load accounts'}
        </div>
    );

    return (
        <div className='w-full justify-center flex'>
            <div className="w-10/12">
                <Table
                    columns={columns}
                    dataSource={accounts}
                    rowKey="_id"
                    loading={loading}
                    pagination={false}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="No accounts found"
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

export default AccountTable;