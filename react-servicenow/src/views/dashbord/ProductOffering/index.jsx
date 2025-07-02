// src/features/servicenow/product-offering/ProductOffering.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getall,
    deleteProductOffering
} from '../../../features/servicenow/product-offering/productOfferingSlice';
import {
    Pagination,
    Spin,
    Button
} from 'antd';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';

// Import components
import PageHeader from '../../../layout/dashbord/headerTable';
import ProductOfferingTable from '../../../components/dashboard/ProductOfferingCategory/Table';

const ProductOffering = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {
        data,
        currentPage,
        totalPages,
        totalItems,
        limit,
        loading,
        error
    } = useSelector(state => state.productOffering);

    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(limit || 10);
    const [current, setCurrent] = useState(1);
    const [sortConfig, setSortConfig] = useState({
        field: null,
        direction: null
    });
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    // Fetch data with debounced search
    const fetchData = debounce((page, size, query) => {
        dispatch(getall({
            page,
            limit: size,
            q: query,
            sortField: sortConfig.field,
            sortOrder: sortConfig.direction
        }));
    }, 500);

    useEffect(() => {
        fetchData(current, pageSize, searchTerm);
        return () => fetchData.cancel();
    }, [current, pageSize, searchTerm, sortConfig]);

    useEffect(() => {
        if (currentPage) setCurrent(currentPage);
    }, [currentPage]);

    // Navigation handlers
    const navigateToCreate = () => navigate('/dashboard/product-offering/create');
    const handleRowClick = (id) => navigate(`/dashboard/product-offering/edit/${id}`);

    // Bulk actions
    const handleBulkDelete = () => {
        selectedRowKeys.forEach(id => dispatch(deleteProductOffering(id)));
        setSelectedRowKeys([]);
        fetchData();
    };

    const handleClearSelection = () => setSelectedRowKeys([]);

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
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
            render: (text) => text || 'N/A',
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
            sorter: (a, b) => new Date(a.validFor.startDateTime) - new Date(b.validFor.startDateTime),
            render: (_, record) => record.validFor.startDateTime
                ? new Date(record.validFor.startDateTime).toISOString().split("T")[0]
                : 'N/A',
        },
        {
            title: 'End Date',
            key: 'end_date',
            sorter: (a, b) => new Date(a.validFor.endDateTime) - new Date(b.validFor.endDateTime),
            render: (_, record) => record.validFor.endDateTime
                ? new Date(record.validFor.endDateTime).toISOString().split("T")[0]
                : 'N/A',
        },
    ];

    // Row selection configuration
    const rowSelection = {
        selectedRowKeys,
        onChange: setSelectedRowKeys,
        getCheckboxProps: (record) => ({
            disabled: record.status === 'inactive',
        }),
    };

    // Empty state configuration
    const emptyState = (
        <div className="py-12 text-center">
            <i className="ri-information-line mx-auto text-3xl text-gray-400 mb-3"></i>
            <p className="text-gray-500">No product offerings found</p>
            <Button
                type="primary"
                className="mt-4 flex items-center mx-auto bg-blue-600 hover:bg-blue-700 border-blue-600"
                icon={<i className="ri-add-line"></i>}
                onClick={navigateToCreate}
            >
                Create New Product Offering
            </Button>
        </div>
    );

    // Bulk actions props
    const bulkActionsProps = {
        selectedCount: selectedRowKeys.length,
        onDelete: handleBulkDelete,
        onClear: handleClearSelection
    };

    return (
        <div className="bg-gray-50 h-full flex flex-col max-w-full">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <PageHeader
                    title="Product Offerings"
                    searchPlaceholder="Search by name or number..."
                    createButtonText="New"
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                    onSearch={(value) => setSearchTerm(value)}
                    onCreate={navigateToCreate}
                />
            </div>

            {/* Scrollable Table Container */}
            <div className="flex-grow overflow-hidden">
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 rounded">
                        <div className="flex items-center">
                            <i className="ri-error-warning-line text-red-500 text-xl mr-2"></i>
                            <div>
                                <p className="font-bold text-red-700">Error</p>
                                <p className="text-red-600">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spin
                            size="large"
                            tip="Loading product offerings..."
                            indicator={<i className="ri-refresh-line animate-spin text-2xl"></i>}
                        />
                    </div>
                ) : (
                    <ProductOfferingTable
                        data={data}
                        columns={columns}
                        rowSelection={rowSelection}
                        emptyText={emptyState}
                        onRowClick={handleRowClick}
                        bulkActionsProps={bulkActionsProps}
                    />
                )}
            </div>

            {/* Sticky Pagination */}
            <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200 p-4">
                <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                    <Pagination
                        current={current}
                        total={totalItems}
                        pageSize={pageSize}
                        onChange={(page, size) => {
                            setCurrent(page);
                            setPageSize(size);
                        }}
                        className="mt-2 md:mt-0"
                    />
                    <div className="text-gray-600 text-sm">
                          Showing {Math.min((current - 1) * pageSize + 1, totalItems)} to {Math.min(current * pageSize, totalItems)} of {totalItems}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductOffering;