import React, { useState, useEffect, useRef } from 'react';
import { Table, Badge, Tooltip, Popconfirm, Button } from 'antd';
import { useMediaQuery } from 'react-responsive';

// StatusCell Component
const StatusCell = ({ status }) => {
  const statusColors = {
    active: { dot: 'bg-green-500', text: 'text-green-700' },
    draft: { dot: 'bg-blue-500', text: 'text-blue-700' },
    inactive: { dot: 'bg-gray-400', text: 'text-gray-600' },
    archived: { dot: 'bg-red-500', text: 'text-red-700' }
  };

  const colors = statusColors[status] || statusColors.inactive;
  const displayText = status ? 
    status.charAt(0).toUpperCase() + status.slice(1) : '';

  return (
    <div className="flex items-center">
      <span className={`h-2 w-2 rounded-full mr-2 ${colors.dot}`}></span>
      <span className={`text-xs ${colors.text}`}>
        {displayText}
      </span>
    </div>
  );
};

// BulkActions Component
const BulkActions = ({ 
  selectedCount, 
  onDelete, 
  onClear 
}) => (
  <div className="overflow-hidden transition-all duration-300 ease-in-out">
    <div className="bg-gray-50 shadow-sm border-y border-gray-300">
      <div className="flex flex-wrap items-center bg-gray-200 justify-between gap-3 p-3 mx-6">
        <div className="flex items-center">
          <Badge
            count={selectedCount}
            className="text-white font-medium"
          />
          <span className="ml-2 text-gray-700 font-medium">
             item{selectedCount > 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Tooltip title="Delete selected">
            <Popconfirm
              title="Delete selected categories?"
              description="This action cannot be undone. Are you sure?"
              onConfirm={onDelete}
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
            onClick={onClear}
          >
            Clear Selection
          </Button>
        </div>
      </div>
    </div>
  </div>
);

// Main CategoryTable Component
const CategoryTable = ({ 
  data, 
  columns, 
  rowSelection, 
  loading, 
  emptyText,
  onRowClick,
  bulkActionsProps
}) => {
  const [scrollConfig, setScrollConfig] = useState({ x: 'max-content', y: undefined });
  const containerRef = useRef(null);
  const bulkActionsRef = useRef(null);
  const ROW_HEIGHT = 55;
  const MIN_HEIGHT = 200;
  const PAGINATION_HEIGHT = 43; // Approx height of pagination component

  useEffect(() => {
    const calculateTableHeight = () => {
      if (!containerRef.current) return;

      // Calculate total available height
      const containerHeight = containerRef.current.clientHeight;
      
      // Calculate BulkActions height if visible
      const bulkActionsHeight = bulkActionsProps?.selectedCount > 0 
        ? (bulkActionsRef.current?.clientHeight || 60) 
        : 0;

      // Calculate available height for table (subtract both BulkActions and Pagination)
      const availableHeight = containerHeight - bulkActionsHeight - PAGINATION_HEIGHT;
      
      // Calculate needed height based on rows
      const contentHeight = data.length * ROW_HEIGHT;

      // Determine final table height
      const tableHeight = Math.max(
        MIN_HEIGHT,
        Math.min(contentHeight, availableHeight)
      );

      setScrollConfig({
        x: 'max-content',
        y: contentHeight > availableHeight ? tableHeight : undefined,
      });
    };

    calculateTableHeight();
    
    const resizeObserver = new ResizeObserver(calculateTableHeight);
    resizeObserver.observe(containerRef.current);
    
    window.addEventListener('resize', calculateTableHeight);
    return () => {
      window.removeEventListener('resize', calculateTableHeight);
      resizeObserver.disconnect();
    };
  }, [data.length, bulkActionsProps?.selectedCount]);

  const handleRow = (record) => ({
    onClick: () => onRowClick(record._id),
  });

  return (
    <div 
      className="flex flex-col h-full" 
      ref={containerRef}
      style={{ height: '100%' }}
    >
      {bulkActionsProps?.selectedCount > 0 && (
        <div ref={bulkActionsRef}>
          <BulkActions {...bulkActionsProps} />
        </div>
      )}
      
      <div className="flex-grow overflow-hidden">
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={data.map(item => ({ ...item, key: item._id }))}
          pagination={false}
          scroll={scrollConfig}
          className="service-now-table"
          rowClassName="hover:bg-gray-50 cursor-pointer"
          loading={loading}
          locale={{ emptyText }}
          onRow={handleRow}
        />
      </div>
    </div>
  );
};

// Attach sub-components
CategoryTable.StatusCell = StatusCell;
CategoryTable.BulkActions = BulkActions;

export default CategoryTable;