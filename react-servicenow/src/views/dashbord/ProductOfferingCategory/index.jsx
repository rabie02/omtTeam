// src/features/servicenow/product-offering/ProductOfferingCategory.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getall,
  deleteCategory
} from '../../../features/servicenow/product-offering/productOfferingCategorySlice';
import {
  Pagination,
  Spin,
  Button
} from 'antd';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';

// Import components
import PageHeader from '../../../layout/dashbord/headerTable';
import CategoryTable from '../../../components/dashboard/ProductOfferingCategory/Table';

const ProductOfferingCategory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    data,
    currentPage,
    totalPages,
    totalItems,
    loading,
    error
  } = useSelector(state => state.productOfferingCategory);

  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
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
  const navigateToCreate = () => navigate('/dashboard/category/create');
  const handleRowClick = (id) => navigate(`/dashboard/category/edit/${id}`);

  // Bulk actions
  const handleBulkDelete = () => {
    selectedRowKeys.forEach(id => dispatch(deleteCategory(id)));
    setSelectedRowKeys([]);
    fetchData();
  };


  const handleClearSelection = () => setSelectedRowKeys([]);

  const columns = [
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

// Custom row selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
    getCheckboxProps: (record) => {
      const hasPublished = record.productOffering?.some(productOffering => productOffering.status === 'published') || false;
      return {
        disabled: hasPublished,
        // This will show a native tooltip on hover for disabled checkboxes
        title: hasPublished ? "Cannot select catalog with published categories" : undefined
      };
    },
  };


  // Empty state configuration
  const emptyState = (
    <div className="py-12 text-center">
      <i className="ri-information-line mx-auto text-3xl text-gray-400 mb-3"></i>
      <p className="text-gray-500">No categories found</p>
      <Button
        type="primary"
        className="mt-4 flex items-center mx-auto bg-blue-600 hover:bg-blue-700 border-blue-600"
        icon={<i className="ri-add-line"></i>}
        onClick={navigateToCreate}
      >
        Create New Category
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
          title="Product Offering Categories"
          searchPlaceholder="Search by name..."
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
              tip="Loading categories..."
              indicator={<i className="ri-refresh-line animate-spin text-2xl"></i>}
            />
          </div>
        ) : (
          <CategoryTable
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
            onChange={(page) => {
              setCurrent(page);
            }}
            className="mt-2 md:mt-0"
          />
          <div className="text-gray-600 text-sm">
              Showing {Math.min((current - 1) * pageSize + 1, totalItems)} to {Math.min(current * pageSize, totalItems)} of {totalItems} </div>
        </div>
      </div>
    </div>
  );
};

export default ProductOfferingCategory;