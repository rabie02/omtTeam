import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, notification, Popconfirm, Empty, Spin, Pagination, Tooltip } from 'antd';
import { 
  getLocations, 
  deleteLocation 
} from '../../../features/servicenow/location/locationSlice';

function LocationTable({ setData, setOpen, searchQuery }) {
  const dispatch = useDispatch();
  const {
    data,
    loading,
    error,
    currentPage,
    totalItems,
    limit
  } = useSelector((state) => state.location);

  useEffect(() => {
    dispatch(getLocations({ page: 1, limit: 6, q: searchQuery }));
  }, [dispatch, searchQuery]);

  const handleDelete = async (locationId) => {
    try {
      await dispatch(deleteLocation(locationId)).unwrap();
      notification.success({ message: 'Location Deleted', description: 'Location has been deleted successfully' });
      dispatch(getLocations({ page: currentPage, limit, q: searchQuery }));
    } catch (error) {
      notification.error({ message: 'Deletion Failed', description: error.message || 'Failed to delete location' });
    }
  };

  const handlePageChange = (page) => {
    dispatch(getLocations({ page, limit, q: searchQuery }));
  };

  const viewDetails = (locationData) => {
    setData(locationData);
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
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      sorter: (a, b) => a.city.localeCompare(b.city),
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      sorter: (a, b) => a.state.localeCompare(b.state),
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      sorter: (a, b) => a.country.localeCompare(b.country),
    },
    {
      title: 'Account',
      key: 'account',
      render: (_, record) => record.account?.name || 'N/A',
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

          <Tooltip title="Delete This Location">
            <Popconfirm
              title="Delete Location"
              description="Are you sure to delete this location?"
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
    // {
    //   title: 'Primary',
    //   dataIndex: 'isPrimaryContact',
    //   key: 'isPrimaryContact',
    //   render: (isPrimary) => (
    //     <span className={`px-2 py-1 rounded ${isPrimary
    //       ? 'bg-blue-100 text-blue-700'
    //       : 'bg-gray-100 text-gray-700'
    //       }`}>
    //       {isPrimary ? 'Yes' : 'No'}
    //     </span>
    //   ),
    // },
    // {
    //   title: 'Status',
    //   key: 'active',
    //   render: (_, record) => (
    //     <span className={`px-2 py-1 capitalize rounded ${record.active
    //       ? 'bg-green-100 text-green-700'
    //       : 'bg-gray-100 text-gray-700'
    //       }`}>
    //       {record.active ? 'active' : 'inactive'}
    //     </span>
    //   ),
    // }
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
                  <h3 className="font-medium mb-2">Contact Information</h3>
                  {record.contact ? (
                    <Table
                      columns={contactColumns}
                      dataSource={[record.contact]} // Wrap single contact in array
                      rowKey="_id"
                      bordered
                      size="small"
                      pagination={false}
                    />
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No contact available for this location"
                    />
                  )}
                </div>
              </div>
            ),
            rowExpandable: (record) => !!record.contact, // Check if contact exists
          }}
          pagination={false}
          locale={{
            emptyText: <Empty description="No locations found" />,
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

export default LocationTable;