import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Empty, Spin, Pagination, Tooltip } from 'antd';
import { getQuotes } from '../../../features/servicenow/quote/quotaSlice';

function QuoteTable({ setData, setOpen, searchQuery }) {
    const dispatch = useDispatch();
    const {
        data: quotes,
        loading,
        error,
        page: currentPage,
        total: totalItems,
        limit
    } = useSelector((state) => state.quotes);

    useEffect(() => {
        dispatch(getQuotes({ page: 1, limit: 6, q: searchQuery }));
    }, [dispatch, searchQuery]);

    const handlePageChange = (page) => {
        dispatch(getQuotes({ page, limit, q: searchQuery }));
    };

    const seeData = (newData) => {
        setData(newData);
        setOpen(true);
    };

    const mainColumns = [
        {
            title: 'Number',
            dataIndex: 'number',
            key: 'number',
            width: 150,
        },
        {
            title: 'Version',
            dataIndex: 'version',
            key: 'version',
            width: 100,
        },
        {
            title: 'Description',
            dataIndex: 'short_description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Status',
            key: 'state',
            render: (_, record) => (
                <span className={`px-2 py-1 capitalize rounded ${
                    record.state === 'published' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                }`}>
                    {record.state || 'N/A'}
                </span>
            ),
            width: 120,
        },
        {
            title: 'Client',
            key: 'client',
            render: (_, record) => record.account?.name  || 'N/A',
            width: 150,
        },
        {
            title: 'Expiration Date',
            key: 'expiration_date',
            sorter: (a, b) => new Date(a.expiration_date) - new Date(b.expiration_date),
            render: (_, record) => record.expiration_date 
                ? new Date(record.expiration_date).toLocaleDateString()
                : 'N/A',
            width: 150,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Tooltip title="View Quote Details">
                    <button
                        className="text-gray-500 hover:text-blue-600"
                        onClick={() => seeData(record)}
                    >
                        <i className="ri-eye-line text-2xl"></i>
                    </button>
                </Tooltip>
            ),
            width: 100,
        },
    ];

    const quoteLineColumns = [
        {
            title: 'Product',
            key: 'product',
            render: (_, record) => record.product_offering?.name || 'N/A',
        },
        {
            title: 'Quantity',
            key: 'quantity',
            render: (_, record) => Number(record.quantity) || 0,
            align: 'center',
        },
        {
            title: 'Unit Price',
            key: 'unit_price',
            render: (_, record) => record.unit_price 
                ? `$${Number(record.unit_price).toFixed(2)}`
                : 'N/A',
            align: 'right',
        },
        {
            title: 'Total Price',
            key: 'total_price',
            render: (_, record) => {
                const qty = Number(record.quantity) || 0;
                const price = Number(record.unit_price) || 0;
                return `$${(qty * price).toFixed(2)}`;
            },
            align: 'right',
        },
    ];

    if (loading) return (
        <div className="h-full flex justify-center items-center">
            <Spin size="large" tip="Loading quotes..." />
        </div>
    );

    if (error) return (
        <div className="text-red-500 p-4">
            Error: {error.message || 'Failed to load quotes'}
        </div>
    );
    

    return (
        <div className='w-full justify-center flex'>
            <div className="w-10/12">
                <Table
                    columns={mainColumns}
                    dataSource={quotes}
                    rowKey="sys_id"
                    loading={loading}
                    expandable={{
                        expandedRowRender: (record) => (
                            <div className="ml-8 bg-gray-50 rounded">
                                {record.quote_lines.length > 0 ? (
                                    <Table
                                        columns={quoteLineColumns}
                                        dataSource={record.quote_lines}
                                        rowKey="id"
                                        bordered
                                        size="small"
                                        pagination={
                                            record.quote_lines?.length > 4
                                                ? { pageSize: 4, showSizeChanger: false }
                                                : false
                                        }
                                    />
                                ) : (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="No quote lines found"
                                    />
                                )}
                            </div>
                        ),
                        rowExpandable: (record) => record.quote_lines.length > 0,
                    }}
                    pagination={false}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="No quotes found"
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

export default QuoteTable;