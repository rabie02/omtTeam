import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getOpportunities,
  deleteOpportunity,
  updateStage,
  resetError
} from '../../../features/servicenow/opportunity/opportunitySlice';
import {
  Table,
  Input,
  Button,
  Space,
  Popconfirm,
  Tag,
  Pagination,
  Spin,
  Tooltip,
  Badge,
  Modal
} from 'antd';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;

const OpportunityIndex = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    opportunities,
    currentPage,
    totalPages,
    totalItems,
    loading,
    error
  } = useSelector(state => state.opportunity);

  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [current, setCurrent] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    field: null,
    direction: null
  });
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Row selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  // Measure header height for sticky offset
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, [loading, error, selectedRowKeys]);

  // Fetch data with debounced search
  const fetchData = debounce((page, size, query) => {
    dispatch(getOpportunities({
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

  // Navigate to create form
  const navigateToCreate = () => {
    navigate('/dashboard/opportunity/create');
  };

  // Handle number click to navigate to edit page
  const handleNumberClick = (id) => {
    navigate(`/dashboard/opportunity/edit/${id}`);
  };

  // Handle bulk actions
  const handleBulkDelete = () => {
    selectedRowKeys.forEach(id => dispatch(deleteOpportunity(id)));
    setSelectedRowKeys([]);
    fetchData(current, pageSize, searchTerm);
  };

  const handleWin = (id) => {
    Modal.confirm({
      title: 'Confirm Win',
      content: 'Are you sure you want to record this as a Win?',
      okText: 'Yes, Win',
      cancelText: 'Cancel',
      async onOk() {
        const body = { 
          id,
          stage: "6834b2d23582eabbafc8bec2"
        }
        const res = await dispatch(updateStage(body));
        if(!res.error){
          notification.success({
            message: 'Win recorded!',
            description: "We've updated the opportunity to the Closed-Won stage"
          });
          fetchData(current, pageSize, searchTerm);
        }
      },
    });
  };

  const handleLose = (id) => {
    Modal.confirm({
      title: 'Confirm Lose',
      content: 'Are you sure you want to record this as a Lose?',
      okText: 'Yes, Lose',
      cancelText: 'Cancel',
      async onOk() {
        const body = { 
          id,
          stage: "6834b2ee3582eabbafc8bec4"
        }
        const res = await dispatch(updateStage(body));
        if(!res.error){
          notification.success({
            message: 'Lose recorded!',
            description: "We've updated the opportunity to the Closed-Lost stage"
          });
          fetchData(current, pageSize, searchTerm);
        }
      },
    });
  };

  // StatusCell component for consistent status rendering
  const StatusCell = ({ status }) => {
    const statusColors = {
      closed_won: { dot: 'bg-green-500', text: 'text-green-700' },
      closed_lost: { dot: 'bg-red-500', text: 'text-red-700' },
      default: { dot: 'bg-blue-500', text: 'text-blue-700' }
    };
    
    const colors = statusColors[status] || statusColors.default;
    const displayText = status ?
      status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') :
      '';

    return (
      <div className="flex items-center">
        <span className={`h-2 w-2 rounded-full mr-2 ${colors.dot}`}></span>
        <span className={`text-xs ${colors.text}`}>
          {displayText}
        </span>
      </div>
    );
  };

  // Table columns configuration
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
          onClick={() => handleNumberClick(record._id)}
        >
          {text}
        </span>
      )
    },
    {
      title: 'Short Description',
      dataIndex: 'short_description',
      key: 'short_description',
      sorter: (a, b) => a.short_description.localeCompare(b.short_description),
    },
    {
      title: 'Account',
      dataIndex: ['account', 'name'],
      key: 'account',
      render: (text) => <span className="text-gray-700">{text || 'N/A'}</span>
    },
    {
      title: <span className="font-semibold">Status</span>,
      dataIndex: ['stage', 'type'],
      key: 'status',
      render: (status) => <StatusCell status={status} />,
      filters: [
        { text: 'Closed Won', value: 'closed_won' },
        { text: 'Closed Lost', value: 'closed_lost' },
        { text: 'In Progress', value: 'in_progress' },
      ],
      onFilter: (value, record) => record.stage?.type === value,
    },
    {
      title: '%',
      dataIndex: 'probability',
      key: 'probability',
      render: (prob) => <span className="font-medium">{prob}%</span>,
      sorter: (a, b) => a.probability - b.probability,
    },
    {
      title: 'EC',
      dataIndex: 'estimated_closed_date',
      key: 'estimated_closed_date',
      render: (date) => (
        <span className="text-gray-600">
          {date ? new Date(date).toLocaleDateString() : 'N/A'}
        </span>
      ),
      sorter: (a, b) => new Date(a.estimated_closed_date) - new Date(b.estimated_closed_date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title="Close Opportunity"
            description="Won or Lost the opportunity?"
            onConfirm={() => handleWin(record._id)}
            onCancel={() => handleLose(record._id)}
            okText="Win"
            cancelText="Lose"
          >
            <Tooltip title="Close Opportunity">
              <Button 
                icon={<i className="ri-door-closed-line"></i>} 
                className="text-gray-500 hover:text-cyan-600"
              />
            </Tooltip>
          </Popconfirm>

          <Tooltip title="Edit Opportunity">
            <Button
              icon={<i className="ri-pencil-line"></i>}
              className="text-gray-500 hover:text-blue-600"
              onClick={() => handleNumberClick(record._id)}
            />
          </Tooltip>

          <Popconfirm
            title="Delete Opportunity"
            description="Are you sure to delete this opportunity?"
            onConfirm={() => {
              dispatch(deleteOpportunity(record._id));
              fetchData(current, pageSize, searchTerm);
            }}
          >
            <Tooltip title="Delete Opportunity">
              <Button 
                icon={<i className="ri-delete-bin-line"></i>} 
                className="text-gray-500 hover:text-red-600"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="bg-gray-50 h-full flex flex-col max-w-full">
      {/* Sticky Header */}
      <div
        ref={headerRef}
        className="sticky top-0 z-10 bg-white border-b border-gray-200"
      >
        <div className="flex flex-col md:flex-row px-6 py-4 bg-gray-200 justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Opportunities</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <Search
              placeholder="Search by description or number..."
              prefix={<i className="ri-search-line text-gray-400"></i>}
              allowClear
              enterButton={
                <Button type="primary">Search</Button>
              }
              size="large"
              className="w-full md:w-80"
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={(value) => setSearchTerm(value)}
            />

            <Button
              type="primary"
              icon={<i className="ri-add-line"></i>}
              size="large"
              onClick={navigateToCreate}
              className="flex items-center"
            >
              New Opportunity
            </Button>
          </div>
        </div>

        {/* Bulk Actions Toolbar with Animation */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: selectedRowKeys.length > 0 ? '100px' : '0',
            opacity: selectedRowKeys.length > 0 ? 1 : 0
          }}
        >
          <div className="bg-gray-50 shadow-sm border-y border-gray-300">
            <div className="flex flex-wrap items-center bg-gray-200 justify-between gap-3 p-3 mx-6">
              <div className="flex items-center">
                <Badge
                  count={selectedRowKeys.length}
                  className="text-white font-medium"
                />
                <span className="ml-2 text-gray-700 font-medium">
                  {selectedRowKeys.length} item{selectedRowKeys.length > 1 ? 's' : ''} selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Tooltip title="Delete selected">
                  <Popconfirm
                    title="Delete selected opportunities?"
                    description="This action cannot be undone. Are you sure?"
                    onConfirm={handleBulkDelete}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      icon={<i className="ri-delete-bin-line"></i>}
                      className="flex items-center"
                    >
                      Delete
                    </Button>
                  </Popconfirm>
                </Tooltip>
                <Button
                  icon={<i className="ri-close-line"></i>}
                  className="flex items-center"
                  onClick={() => setSelectedRowKeys([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        </div>
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
              tip="Loading opportunities..."
              indicator={<i className="ri-refresh-line animate-spin text-2xl"></i>}
            />
          </div>
        ) : (
          <Table
            rowSelection={{
              type: 'checkbox',
              ...rowSelection
            }}
            columns={columns}
            dataSource={opportunities.map(item => ({ ...item, key: item._id }))}
            pagination={false}
            scroll={{ x: 'max-content' }}
            sticky={{
              offsetScroll: 0,
            }}
            className="service-now-table relative"
            rowClassName="hover:bg-gray-50"
            locale={{
              emptyText: (
                <div className="py-12 text-center">
                  <i className="ri-information-line mx-auto text-3xl text-gray-400 mb-3"></i>
                  <p className="text-gray-500">No opportunities found</p>
                  <Button
                    type="primary"
                    className="mt-4 flex items-center mx-auto bg-blue-600 hover:bg-blue-700 border-blue-600"
                    icon={<i className="ri-add-line"></i>}
                    onClick={navigateToCreate}
                  >
                    Create New Opportunity
                  </Button>
                </div>
              )
            }}
          />
        )}
      </div>

      {/* Sticky Pagination at Bottom */}
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
            showSizeChanger
            pageSizeOptions={[10, 20, 50, 100]}
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

export default OpportunityIndex;