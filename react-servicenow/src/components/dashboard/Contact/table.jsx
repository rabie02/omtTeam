import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, notification, Popconfirm, Empty, Spin, Pagination, Tooltip } from 'antd';
import { 
  getContacts, 
  deleteContact 
} from '../../../features/servicenow/contact/contactSlice';

function ContactTable({ setData, setOpen, searchQuery }) {
  const dispatch = useDispatch();
  const {
    data,
    loading,
    error,
    currentPage,
    totalItems,
    limit
  } = useSelector((state) => state.contact);

  useEffect(() => {
    dispatch(getContacts({ page: 1, limit: 6, q: searchQuery }));
  }, [dispatch, searchQuery]);

  const handleDelete = async (contactId) => {
    try {
      await dispatch(deleteContact(contactId)).unwrap();
      notification.success({ message: 'Contact Deleted', description: 'Contact has been deleted successfully' });
      dispatch(getContacts({ page: currentPage, limit, q: searchQuery }));
    } catch (error) {
      notification.error({ message: 'Deletion Failed', description: error.message || 'Failed to delete contact' });
    }
  };

  const handlePageChange = (page) => {
    dispatch(getContacts({ page, limit, q: searchQuery }));
  };

  const viewDetails = (contactData) => {
    setData(contactData);
    setOpen(true);
  };

  const mainColumns = [
    {
      title: 'First Name',
      dataIndex: 'firstName',
      key: 'firstName',
      sorter: (a, b) => a.firstName.localeCompare(b.firstName),
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName',
      sorter: (a, b) => a.lastName.localeCompare(b.lastName),
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

          <Tooltip title="Delete This Contact">
            <Popconfirm
              title="Delete Contact"
              description="Are you sure to delete this contact?"
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

  const locationColumns = [
    {
      title: 'Location Name',
      dataIndex: ['location', 'name'],
      key: 'locationName',
    },
    {
      title: 'City',
      dataIndex: ['location', 'city'],
      key: 'city',
    },
    {
      title: 'State',
      dataIndex: ['location', 'state'],
      key: 'state',
    },
    {
      title: 'Country',
      dataIndex: ['location', 'country'],
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
              <div className="ml-8">
                <div>
                  <h3 className="font-medium mb-2">Location Information</h3>
                  {record.location ? (
                    <Table
                      columns={locationColumns}
                      dataSource={[record]}
                      rowKey="_id"
                      bordered
                      size="small"
                      pagination={false}
                    />
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No location information available"
                    />
                  )}
                </div>
              </div>
            ),
            rowExpandable: (record) => record.location,
          }}
          pagination={false}
          locale={{
            emptyText: <Empty description="No contacts found" />,
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

export default ContactTable;