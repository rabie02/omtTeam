import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Empty, Spin, Pagination, Tooltip, Popconfirm, notification } from 'antd';
import {
    getQuotes,
    deleteQuote,
    updateQuoteState,
} from '../../../features/servicenow/quote/quotaSlice';
import {
    generateContract,downloadContract
} from '../../../features/servicenow/contract/contractSlice';

function QuoteTable({ setData, setOpen, searchQuery }) {
    const dispatch = useDispatch();
    const {
        data: quotes,
        loading,
        partiallyLoading,
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

    const handleDelete = async (id) => {
        try {
            await dispatch(deleteQuote(id));
            notification.success({
                message: 'Quote Deleted',
                description: 'Quote has been deleted successfully'
            });
            dispatch(getQuotes({ page: currentPage, limit, q: searchQuery }));
        } catch (error) {
            notification.error({
                message: 'Deletion Failed',
                description: error.message || 'Failed to delete quote'
            });
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await dispatch(updateQuoteState({ id, state: newStatus }));
            notification.success({
                message: 'Status Updated',
                description: `Quote status changed to ${newStatus}`
            });
            dispatch(getQuotes({ page: currentPage, limit, q: searchQuery }));
        } catch (error) {
            notification.error({
                message: 'Update Failed',
                description: error.message || 'Failed to update quote status'
            });
        }
    };

    // Contract generation handlers
    const handleGenerateContract = async (quoteId) => {
        try {
            const res = await dispatch(generateContract(quoteId));
            if (!res.error) {
                notification.success({
                    message: 'Contract Generated',
                    description: 'Contract has been generated successfully',
                });
                dispatch(getQuotes({ page: currentPage, limit, q: searchQuery }));
            }
        } catch (error) {
            notification.error({
                message: 'Generation Failed',
                description: error.message || 'Failed to generate Contract'
            });
        }
    };

const handleDownloadContract = async (contractId, quoteNumber = '') => {
  try {
    // Pass as single object
    const action = await dispatch(downloadContract({ 
      contract_id: contractId, 
      quoteNumber 
    }));
    
    if (action.payload) {
      const { content, fileName } = action.payload;
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    }
  } catch (error) {
    notification.error({
      message: 'Download Failed',
      description: error.message || 'Failed to download Contract'
    });
  }
};

    // Status action mapping function
    const getStatusAction = (currentStatus) => {
        const status = (currentStatus || '').toLowerCase();
        switch (status) {
            case 'draft': return { action: 'Approve', newStatus: 'approved' };
            default: return { action: 'Update Status', newStatus: status };
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
            render: (_, record) => {
                const status = record.state || 'N/A';
                let statusClass = 'bg-gray-100 text-gray-700';

                if (status.toLowerCase() === 'published') {
                    statusClass = 'bg-green-100 text-green-700';
                } else if (status.toLowerCase() === 'retired') {
                    statusClass = 'bg-yellow-100 text-yellow-700';
                } else if (status.toLowerCase() === 'archived') {
                    statusClass = 'bg-red-100 text-red-700';
                }

                return (
                    <span className={`px-2 py-1 capitalize rounded ${statusClass}`}>
                        {status}
                    </span>
                );
            },
            width: 120,
        },
        {
            title: 'Client',
            key: 'client',
            render: (_, record) => record.account?.name || 'N/A',
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
            render: (_, record) => {
                const { action, newStatus } = getStatusAction(record.state);
                const isApproved = (record.state || '').toLowerCase() === 'approved';
                
                return (
                    <div className="flex space-x-2">
                        <Tooltip title="View Quote Details">
                            <button
                                className="text-gray-500 hover:text-blue-600"
                                onClick={() => seeData(record)}
                            >
                                <i className="ri-eye-line text-2xl"></i>
                            </button>
                        </Tooltip>

                        {/* Status toggle button */}
                        {!isApproved && (
                            <Tooltip title={`${action} Quote`}>
                                <Popconfirm
                                    title={`${action} Quote`}
                                    description={`Are you sure you want to ${action.toLowerCase()} this quote?`}
                                    onConfirm={() => handleStatusUpdate(record._id, newStatus)}
                                    okText="Yes"
                                    cancelText="No"
                                >
                                    <button className="text-gray-500 hover:text-green-600">
                                        <i className="ri-check-line text-2xl"></i>
                                    </button>
                                </Popconfirm>
                            </Tooltip>
                        )}
                        {isApproved && (
                            <Tooltip title={record.contracts?.length > 0 ? "Download Contract" : "Generate Contract"}>
                                {record.contracts?.length > 0 ? (
                                    <button
                                        className="text-gray-500 hover:text-orange-300"
                                        onClick={() => handleDownloadContract(record?.contracts[0]._id, record.number)}
                                        disabled={partiallyLoading}
                                    >
                                        <i className="ri-contract-fill text-2xl"></i>
                                    </button>
                                ) : (
                                    <Popconfirm
                                        title="Generate Contract"
                                        description="Generate a contract for this quote?"
                                        onConfirm={() => handleGenerateContract(record._id)}
                                        okText="Yes"
                                        cancelText="No"
                                    >
                                        <button
                                            className="text-gray-500 hover:text-orange-300"
                                            disabled={partiallyLoading}
                                        >
                                            <i className="ri-contract-line text-2xl"></i>
                                        </button>
                                    </Popconfirm>
                                )}
                            </Tooltip>

                        )}

                        <Tooltip title="Delete This Quote">
                            <Popconfirm
                                title="Delete Quote"
                                description="Are you sure you want to delete this quote?"
                                onConfirm={() => handleDelete(record._id)}
                                okText="Yes"
                                cancelText="No"
                            >
                                <button className="text-gray-500 hover:text-red-600">
                                    <i className="ri-delete-bin-6-line text-2xl"></i>
                                </button>
                            </Popconfirm>
                        </Tooltip>

                        {/* Contract Button */}

                    </div>
                );
            },
            width: 200,
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
                                {record.quote_lines?.length > 0 ? (
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
                        rowExpandable: (record) => record.quote_lines?.length > 0,
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