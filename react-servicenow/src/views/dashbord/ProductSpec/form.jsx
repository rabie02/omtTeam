import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { notification, Spin, Popconfirm, Tabs, Table } from 'antd';
import { getone } from '../../../features/servicenow/product-specification/productSpecificationSlice';

// StatusCell component for consistent status rendering
const StatusCell = ({ status }) => {
  const statusColors = {
    published: { dot: 'bg-green-500', text: 'text-green-700' },
    draft: { dot: 'bg-blue-500', text: 'text-blue-700' },
    archived: { dot: 'bg-red-500', text: 'text-red-700' },
    retired: { dot: 'bg-gray-400', text: 'text-gray-600' },
  };

  const colors = statusColors[status?.toLowerCase()] || statusColors.retired;
  const displayText = status ?
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : '';

  return (
    <div className="flex items-center">
      <span className={`h-2 w-2 rounded-full mr-2 ${colors.dot}`}></span>
      <span className={`text-xs ${colors.text}`}>
        {displayText}
      </span>
    </div>
  );
};

function ProductSpecificationFormPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [activeTab, setActiveTab] = useState('1');
  const [initialized, setInitialized] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Select specification data from Redux store
  const { currentSpec, loading, loadingSpec } = useSelector(
    state => state.productSpecification
  );

  // Fetch specification details
  useEffect(() => {
    if (isEditMode) {
      dispatch(getone(id)).then(() => setInitialized(true));
    } else {
      setInitialized(true);
    }
  }, [id, isEditMode, dispatch]);

  // Initialize form with proper default values
  const initialValues = {
    name: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    description: '',
    displayName: '',
    isBundle: false,
    specification_type: '',
  };

  // Merge with currentSpec if available
  if (isEditMode && currentSpec && !loading) {
    initialValues.name = currentSpec.name || '';
    initialValues.displayName = currentSpec.displayName || '';
    initialValues.start_date = currentSpec.validFor?.startDateTime || '';
    initialValues.end_date = currentSpec.validFor?.endDateTime || '';
    initialValues.status = currentSpec.status || 'draft';
    initialValues.description = currentSpec.description || '';
    initialValues.isBundle = currentSpec.isBundle || false;
    initialValues.specification_type = currentSpec.specification_type || '';
  }

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
  });

  const handleCancel = () => navigate('/dashboard/product-specification');

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleRowClick = (id) => navigate(`/dashboard/product-offering/edit/${id}`);

  // Tab items configuration
  const tabItems = [
    {
      key: '1',
      label: (
        <span className="flex items-center">
          <i className="ri-shopping-bag-line text-lg mr-2"></i>
          Product Offerings
        </span>
      ),
      children: (
        <div className="p-4">
          <Table
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
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
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => <StatusCell status={status} />,
              },
              {
                title: 'Valid From',
                dataIndex: 'validFor',
                key: 'startDateTime',
                render: (validFor) => formatDate(validFor?.startDateTime),
              },
              {
                title: 'Valid To',
                dataIndex: 'validFor',
                key: 'endDateTime',
                render: (validFor) => formatDate(validFor?.endDateTime),
              },
            ]}
            dataSource={currentSpec?.productOffering || []}
            pagination={{ pageSize: 5 }}
            rowKey="_id"
            locale={{
              emptyText: (
                <div className="py-8 text-center">
                  <i className="ri-information-line mx-auto text-3xl text-gray-400 mb-3"></i>
                  <p className="text-gray-500">No product offerings associated with this specification.</p>
                </div>
              )
            }}
          />
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <span className="flex items-center">
          <i className="ri-share-line text-lg mr-2"></i>
          Relationships
        </span>
      ),
      children: (
        <div className="p-4">
          <Table
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                render: (text) => <span className="text-gray-800 font-medium">{text}</span>,
              },
              {
                title: 'Type',
                dataIndex: 'relationshipType',
                key: 'type',
              },
              {
                title: 'Valid From',
                dataIndex: 'validFor',
                key: 'startDateTime',
                render: (validFor) => formatDate(validFor?.startDateTime),
              },
              {
                title: 'Valid To',
                dataIndex: 'validFor',
                key: 'endDateTime',
                render: (validFor) => formatDate(validFor?.endDateTime),
              },
            ]}
            dataSource={currentSpec?.productSpecificationRelationship || []}
            pagination={{ pageSize: 5 }}
            rowKey="id"
            locale={{
              emptyText: (
                <div className="py-8 text-center">
                  <i className="ri-information-line mx-auto text-3xl text-gray-400 mb-3"></i>
                  <p className="text-gray-500">No relationships associated with this specification.</p>
                </div>
              )
            }}
          />
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <span className="flex items-center">
          <i className="ri-list-check-2 text-lg mr-2"></i>
          Characteristics
        </span>
      ),
      children: (
        <div className="p-4">
          <Table
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                render: (text) => <span className="text-gray-800 font-medium">{text}</span>,
              },
              {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
              },
              {
                title: 'Value Type',
                dataIndex: 'valueType',
                key: 'valueType',
              },
              {
                title: 'Values',
                dataIndex: 'productSpecCharacteristicValue',
                key: 'values',
                render: (values) => (
                  <div>
                    {values?.map((val, index) => (
                      <div key={index} className="mb-1">
                        <span className="font-medium">{val.value}</span>
                        {val.validFor?.startDateTime && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Valid from: {formatDate(val.validFor.startDateTime)})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )
              },
            ]}
            dataSource={currentSpec?.productSpecCharacteristic || []}
            pagination={{ pageSize: 5 }}
            rowKey="name"
            locale={{
              emptyText: (
                <div className="py-8 text-center">
                  <i className="ri-information-line mx-auto text-3xl text-gray-400 mb-3"></i>
                  <p className="text-gray-500">No characteristics defined for this specification.</p>
                </div>
              )
            }}
          />
        </div>
      ),
    },
  ];

  // Show spinner while loading
  if ((isEditMode && loadingSpec) || !initialized) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin
          size="large"
          tip="Loading specification details..."
          indicator={<i className="ri-refresh-line animate-spin text-2xl"></i>}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 h-full flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row px-6 py-2.5 bg-gray-200 justify-between items-start md:items-center gap-4">
          <div className="flex items-center">
            <button
              onClick={handleCancel}
              className="mr-3 text-cyan-700 hover:text-cyan-800 bg-white border border-cyan-700 hover:bg-cyan-50 w-10 h-10 flex justify-center items-center "
            >
              <i className="ri-arrow-left-s-line text-2xl"></i>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Product Specification</h1>
              <p className="text-gray-600 text-md flex items-center gap-2">
                {isEditMode ? currentSpec?.name : 'New record'}
                {isEditMode && (
                  <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-xs font-medium rounded-md capitalize">
                    {currentSpec?.status}
                  </span>
                )}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Form Content */}
      <div className="flex-grow overflow-y-auto">
        <div className="bg-white shadow-sm max-w-6xl mx-auto my-6">
          <div className="p-6">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={formik.values.name}
                    disabled={true}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                {/* Display Name */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Display Name
                  </label>
                  <input
                    name="displayName"
                    value={formik.values.displayName}
                    disabled={true}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="start_date"
                    value={formatDate(formik.values.start_date)}
                    disabled={true}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">End Date</label>
                  <input
                    type="text"
                    name="end_date"
                    value={formatDate(formik.values.end_date)}
                    disabled={true}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                {/* Specification Type */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Specification Type
                  </label>
                  <input
                    name="specification_type"
                    value={formik.values.specification_type}
                    disabled={true}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                  />
                </div>


              </div>

              {/* Status */}
              <div className="w-full md:w-1/2">
                <label className="block font-medium mb-1 text-gray-700">Status</label>
                <div className="flex space-x-4">
                  {['draft', 'published', 'archived', 'retired'].map(status => (
                    <label
                      key={status}
                      className={`flex items-center px-4 py-2 border rounded-md cursor-not-allowed ${formik.values.status === status
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-gray-100'}`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={formik.values.status === status}
                        disabled={true}
                        className="mr-2"
                      />
                      <span className="capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-medium mb-1 text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formik.values.description}
                  rows="4"
                  disabled={true}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Tabs Section */}
        {isEditMode && currentSpec && (
          <div className='bg-white max-w-7xl mx-auto my-4'>
            <div className="p-3">
              <Tabs
                activeKey={activeTab}
                type="card"
                onChange={setActiveTab}
                items={tabItems}
                className="tabs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductSpecificationFormPage;