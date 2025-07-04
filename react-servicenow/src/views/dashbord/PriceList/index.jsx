// src/features/opportunity/price-list/PriceList.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getPriceList,
  deletePriceList
} from '../../../features/servicenow/price-list/priceListSlice';
import {
  Pagination,
  Spin,
  Button
} from 'antd';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';

// Import components
import PageHeader from '../../../layout/dashbord/headerTable';
import PriceListTable from '../../../components/dashboard/ProductOfferingCategory/Table';

const PriceList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    priceLists,
    currentPage,
    totalPages,
    limit,
    loading,
    error
  } = useSelector(state => state.priceList);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Fetch data with debounced search
  const fetchData = debounce((query, page = currentPage, pageSize = limit) => {
    dispatch(getPriceList({ 
      q: query,
      page,
      limit: pageSize 
    }));
  }, 500);

  useEffect(() => {
    fetchData(searchTerm, currentPage, limit);
    return () => fetchData.cancel();
  }, [searchTerm, currentPage, limit]);

  // Navigation handlers
  const navigateToCreate = () => navigate('/dashboard/price-list/create');
  const handleRowClick = (id) => navigate(`/dashboard/price-list/edit/${id}`);

  // Bulk actions
  const handleBulkDelete = () => {
    selectedRowKeys.forEach(id => dispatch(deletePriceList(id)));
    setSelectedRowKeys([]);
    fetchData(searchTerm, currentPage, limit);
  };

  const handleClearSelection = () => setSelectedRowKeys([]);

  // Handle pagination change
  const handlePageChange = (page, pageSize) => {
    fetchData(searchTerm, page, pageSize);
  };

  const columns = [
    {
      title: (
        <div className="flex items-center font-semibold">
          <span>Name</span>
        </div>
      ),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
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
      render: (text) => text || 'N/A'
    },
    {
      title: <span className="font-semibold">Status</span>,
      dataIndex: 'state',
      key: 'state',
      render: (state) => {
        const stateColors = {
          published: {
            dot: 'bg-green-500',
            text: 'text-green-700'
          },
          draft: {
            dot: 'bg-blue-500',
            text: 'text-blue-700'
          }
        };

        const colors = stateColors[state] || stateColors.draft;
        const displayText = state ?
          state.charAt(0).toUpperCase() + state.slice(1) :
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
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
      width: 100,
      render: (text) => text || 'N/A'
    },
    {
      title: 'Created At',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (_, record) => record.createdAt
        ? new Date(record.createdAt).toLocaleDateString()
        : 'N/A',
    }
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
      <p className="text-gray-500">No price lists found</p>
      <Button
        type="primary"
        className="mt-4 flex items-center mx-auto bg-blue-600 hover:bg-blue-700 border-blue-600"
        icon={<i className="ri-add-line"></i>}
        onClick={navigateToCreate}
      >
        Create New Price List
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
          title="Price Lists"
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
              tip="Loading price lists..."
              indicator={<i className="ri-refresh-line animate-spin text-2xl"></i>}
            />
          </div>
        ) : (
          <PriceListTable
            data={priceLists}
            columns={columns}
            rowSelection={rowSelection}
            emptyText={emptyState}
            onRowClick={handleRowClick}
            bulkActionsProps={bulkActionsProps}
          />
        )}
      </div>

      {/* Pagination */}
      {priceLists?.length > 0 && (
        <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200 p-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <Pagination
              current={currentPage}
              total={totalPages * limit}
              pageSize={limit}
              className="mt-2 md:mt-0"
              onChange={handlePageChange}
            />
            <div className="text-gray-600 text-sm">
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalPages * limit)} of {totalPages * limit}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceList;