import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { notification, Spin, Popconfirm, Tabs, Table, Tooltip } from 'antd';
import { 
  getQuote, 
  resetCurrentQuote,
  updateQuoteState 
} from '../../../features/servicenow/quote/quotaSlice';
import {
  generateContract,
  downloadContract
} from '../../../features/servicenow/contract/contractSlice';

// StatusCell component for consistent status rendering
const StatusCell = ({ status }) => {
  const statusColors = {
    approved: { dot: 'bg-green-500', text: 'text-green-700' },
    draft: { dot: 'bg-blue-500', text: 'text-blue-700' },
    rejected: { dot: 'bg-red-500', text: 'text-red-700' },
    pending: { dot: 'bg-yellow-500', text: 'text-yellow-700' },
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

function QuoteFormPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [activeTab, setActiveTab] = useState('1');
  const [initialized, setInitialized] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [partiallyLoading, setPartiallyLoading] = useState(false);

  // Select quote data from Redux store
  const { currentQuote, loading, loadingQuote } = useSelector(
    state => state.quote
  );

  // Calculate subtotal from quote lines
  const calculateSubtotal = () => {
    if (!formik.values.quote_lines || formik.values.quote_lines.length === 0) return '0.00';
    
    const subtotal = formik.values.quote_lines.reduce((sum, line) => {
      return sum + (parseFloat(line.unit_price) * parseInt(line.quantity) * parseInt(line.term_month));
    }, 0);

    return subtotal.toFixed(2);
  };

  // Calculate tax (simplified - would normally use tax rates)
  const calculateTax = () => {
    const subtotal = parseFloat(calculateSubtotal());
    return (subtotal * 0.1).toFixed(2); // 10% tax for example
  };

  // Calculate total
  const calculateTotal = () => {
    const subtotal = parseFloat(calculateSubtotal());
    const tax = parseFloat(calculateTax());
    return (subtotal + tax).toFixed(2);
  };

  // Handle status update
  const handleStatusUpdate = async (quoteId, newStatus) => {
    try {
      setPartiallyLoading(true);
      await dispatch(updateQuoteState({ id: quoteId, state: newStatus })).unwrap();
      notification.success({
        message: 'Success',
        description: `Quote ${newStatus.toLowerCase()} successfully`
      });
      dispatch(getQuote(quoteId)); // Refresh the quote data
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to update quote status'
      });
    } finally {
      setPartiallyLoading(false);
    }
  };

  // Handle generate contract
  const handleGenerateContract = async (quoteId) => {
    try {
      setPartiallyLoading(true);
      await dispatch(generateContract(quoteId)).unwrap();
      notification.success({
        message: 'Success',
        description: 'Contract generated successfully'
      });
      dispatch(getQuote(quoteId)); // Refresh the quote data
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to generate contract'
      });
    } finally {
      setPartiallyLoading(false);
    }
  };

  // Handle download contract
  const handleDownloadContract = async (contractId, quoteNumber) => {
    try {
      setPartiallyLoading(true);
      const response = await dispatch(downloadContract(contractId)).unwrap();
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Contract_${quoteNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to download contract'
      });
    } finally {
      setPartiallyLoading(false);
    }
  };

  // Determine status actions
  const getStatusActions = (currentStatus) => {
    switch (currentStatus) {
      case 'draft':
        return { action: 'Approve', newStatus: 'Approved' };
      default:
        return { action: 'Approve', newStatus: 'approved' };
    }
  };

  const { action, newStatus } = getStatusActions(currentQuote?.state);
  const isApproved = currentQuote?.state === 'Approved';

  // Tab items configuration
  

  // Fetch quote details
  useEffect(() => {
    if (isEditMode) {
      dispatch(getQuote(id)).then(() => setInitialized(true));
    } else {
      setInitialized(true);
    }

    return () => {
      dispatch(resetCurrentQuote());
    };
  }, [id, isEditMode, dispatch]);

  // Initialize form with proper default values
  const initialValues = {
    number: '',
    state: 'draft',
    version: '',
    currency: 'USD',
    subscription_start_date: '',
    subscription_end_date: '',
    short_description: '',
    expiration_date: '',
    account: null,
    price_list: null,
    quote_lines: [],
  };

  // Merge with currentQuote if available
  if (isEditMode && currentQuote && !loading) {
    initialValues.number = currentQuote.number || '';
    initialValues.state = currentQuote.state || 'draft';
    initialValues.version = currentQuote.version || '';
    initialValues.currency = currentQuote.currency || 'USD';
    initialValues.subscription_start_date = currentQuote.subscription_start_date || '';
    initialValues.subscription_end_date = currentQuote.subscription_end_date || '';
    initialValues.short_description = currentQuote.short_description || '';
    initialValues.expiration_date = currentQuote.expiration_date || '';
    initialValues.account = currentQuote.account || null;
    initialValues.price_list = currentQuote.price_list || null;
    initialValues.quote_lines = currentQuote.quote_lines || [];
  }

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
  });

  const tabItems = [
    {
      key: '1',
      label: (
        <span className="flex items-center">
          <i className="ri-list-check-2 text-lg mr-2"></i>
          Quote Lines
        </span>
      ),
      children: (
        <div className="p-4">
          <Table
            columns={[
              {
                title: 'Number',
                dataIndex: 'number',
                key: 'number',
                render: (text) => (
                  <span className="text-gray-800 font-medium">{text}</span>
                )
              },
              {
                title: 'Product',
                dataIndex: ['product_offering', 'name'],
                key: 'product',
              },
              {
                title: 'Quantity',
                dataIndex: 'quantity',
                key: 'quantity',
              },
              {
                title: 'Unit Price',
                dataIndex: 'unit_price',
                key: 'unit_price',
                render: (price) => (
                  <span>{price} {formik.values.currency}</span>
                )
              },
              {
                title: 'Term',
                dataIndex: 'term_month',
                key: 'term',
                render: (term) => (
                  <span>{term} months</span>
                )
              },
              {
                title: 'Status',
                dataIndex: 'state',
                key: 'status',
                render: (status) => <StatusCell status={status} />,
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => (
                  <div className="flex items-center gap-2">
                    {/* Status toggle button */}
                    {!isApproved && (
                      <Tooltip title={`${action} Quote`}>
                        <Popconfirm
                          title={`${action} Quote`}
                          description={`Are you sure you want to ${action.toLowerCase()} this quote?`}
                          onConfirm={() => handleStatusUpdate(currentQuote._id, newStatus)}
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
                      <Tooltip title={currentQuote.contracts?.length > 0 ? "Download Contract" : "Generate Contract"}>
                        {currentQuote.contracts?.length > 0 ? (
                          <button
                            className="text-gray-500 hover:text-orange-300"
                            onClick={() => handleDownloadContract(currentQuote?.contracts[0]._id, currentQuote.number)}
                            disabled={partiallyLoading}
                          >
                            <i className="ri-contract-fill text-2xl"></i>
                          </button>
                        ) : (
                          <Popconfirm
                            title="Generate Contract"
                            description="Generate a contract for this quote?"
                            onConfirm={() => handleGenerateContract(currentQuote._id)}
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
                  </div>
                ),
              },
            ]}
            dataSource={formik.values.quote_lines || []}
            pagination={{ pageSize: 5 }}
            rowKey="_id"
            locale={{
              emptyText: (
                <div className="py-8 text-center">
                  <i className="ri-information-line mx-auto text-3xl text-gray-400 mb-3"></i>
                  <p className="text-gray-500">No quote lines associated with this quote.</p>
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
          <i className="ri-file-list-2-line text-lg mr-2"></i>
          Pricing Summary
        </span>
      ),
      children: (
        <div className="p-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Subtotal</h3>
                <p className="text-2xl font-semibold">
                  {calculateSubtotal()} {formik.values.currency}
                </p>
              </div>
              <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Tax</h3>
                <p className="text-2xl font-semibold">
                  {calculateTax()} {formik.values.currency}
                </p>
              </div>
              <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total</h3>
                <p className="text-2xl font-semibold text-blue-600">
                  {calculateTotal()} {formik.values.currency}
                </p>
              </div>
            </div>

            <Table
              columns={[
                {
                  title: 'Item',
                  dataIndex: ['product_offering', 'name'],
                  key: 'item',
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantity',
                  key: 'quantity',
                },
                {
                  title: 'Unit Price',
                  dataIndex: 'unit_price',
                  key: 'unit_price',
                  render: (price) => (
                    <span>{price} {formik.values.currency}</span>
                  )
                },
                {
                  title: 'Term',
                  dataIndex: 'term_month',
                  key: 'term',
                  render: (term) => (
                    <span>{term} months</span>
                  )
                },
                {
                  title: 'Total',
                  key: 'total',
                  render: (_, record) => (
                    <span>
                      {(parseFloat(record.unit_price) * parseInt(record.quantity) * parseInt(record.term_month)).toFixed(2)} {formik.values.currency}
                    </span>
                  )
                },
              ]}
              dataSource={formik.values.quote_lines || []}
              pagination={false}
              rowKey="_id"
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row className="font-semibold">
                    <Table.Summary.Cell index={0} colSpan={4}>Grand Total</Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      {calculateTotal()} {formik.values.currency}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </div>
        </div>
      ),
    },
  ];

  const handleCancel = () => navigate('/dashboard/quote');

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Show spinner while loading
  if ((isEditMode && loadingQuote) || !initialized) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin
          size="large"
          tip="Loading quote details..."
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
              <h1 className="text-xl font-semibold text-gray-800">Quote</h1>
              <p className="text-gray-600 text-md flex items-center gap-2">
                {isEditMode ? currentQuote?.number : 'New quote'}
                {isEditMode && (
                  <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-xs font-medium rounded-md capitalize">
                    {currentQuote?.state}
                  </span>
                )}
              </p>
            </div>
          </div>

          {isEditMode && (
            <div className="flex items-center gap-2">

              {/* Status toggle button in header */}
              {!isApproved && (
                <Tooltip title={`${action} Quote`}>
                  <Popconfirm
                    title={`${action} Quote`}
                    description={`Are you sure you want to ${action.toLowerCase()} this quote?`}
                    onConfirm={() => handleStatusUpdate(currentQuote._id, newStatus)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <button className="overflow-hidden relative w-32 h-10 bg-cyan-700 text-white hover:bg-cyan-800 cursor-pointer">
                      {action}
                    </button>
                  </Popconfirm>
                </Tooltip>
              )}
              {isApproved && (
                <Tooltip title={currentQuote.contracts?.length > 0 ? "Download Contract" : "Generate Contract"}>
                  {currentQuote.contracts?.length > 0 ? (
                    <button className="overflow-hidden relative w-fit px-2 h-10 bg-cyan-700 text-white hover:bg-cyan-800 cursor-pointer"
                      onClick={() => handleDownloadContract(currentQuote?.contracts[0]._id, currentQuote.number)}
                      disabled={partiallyLoading}
                    >
                     
                      Download Contract
                    </button>
                  ) : (
                    <Popconfirm
                      title="Generate Contract"
                      description="Generate a contract for this quote?"
                      onConfirm={() => handleGenerateContract(currentQuote._id)}
                      okText="Yes"
                      cancelText="No"
                    >
                    <button className="overflow-hidden relative w-fit px-2 h-10 bg-cyan-700 text-white hover:bg-cyan-800 cursor-pointer"
                        disabled={partiallyLoading}
                      >
                        
                        Generate Contract
                      </button>
                    </Popconfirm>
                  )}
                </Tooltip>
              )}
               <Popconfirm
                title="Are you sure you want to delete this quote?"
                onConfirm={() => {}}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <button
                  className="overflow-hidden relative w-32 h-10 border-2 rounded-md text-base font-medium z-10 group transition-colors bg-white border-cyan-700 text-cyan-700 hover:bg-cyan-50 cursor-pointer"
                  disabled={deleting}
                >
                  {deleting ? (
                    <Spin indicator={<i className="ri-refresh-line animate-spin text-lg"></i>} />
                  ) : (
                    <>
                     
                      Delete
                    </>
                  )}
                </button>
              </Popconfirm>
            </div>
          )}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-grow overflow-y-auto">
        <div className="bg-white shadow-sm max-w-6xl mx-auto my-6">
          <div className="p-6">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quote Number */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Quote Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="number"
                    value={formik.values.number}
                    disabled={true}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                {/* Version */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Version
                  </label>
                  <input
                    name="version"
                    value={formik.values.version}
                    disabled={true}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                {/* Account */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Account
                  </label>
                  <input
                    value={formik.values.account?.name || 'N/A'}
                    disabled={true}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                {/* Price List */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Price List
                  </label>
                  <input
                    value={formik.values.price_list?.name || 'N/A'}
                    disabled={true}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                {/* Subscription Start Date */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Subscription Start Date
                  </label>
                  <input
                    value={formatDate(formik.values.subscription_start_date)}
                    disabled={true}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                {/* Subscription End Date */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Subscription End Date
                  </label>
                  <input
                    value={formatDate(formik.values.subscription_end_date)}
                    disabled={true}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                {/* Expiration Date */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Expiration Date
                  </label>
                  <input
                    value={formatDate(formik.values.expiration_date)}
                    disabled={true}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block font-medium mb-1 text-gray-700">
                    Currency
                  </label>
                  <input
                    value={formik.values.currency}
                    disabled={true}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="w-full md:w-1/2">
                <label className="block font-medium mb-1 text-gray-700">Status</label>
                <div className="flex space-x-4">
                  {['draft',  'Approved',].map(status => (
                    <label
                      key={status}
                      className={`flex items-center px-4 py-2 border rounded-md cursor-not-allowed ${formik.values.state === status
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-gray-100'}`}
                    >
                      <input
                        type="radio"
                        name="state"
                        value={status}
                        checked={formik.values.state === status}
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
                <label className="block font-medium mb-1 text-gray-700">Short Description</label>
                <textarea
                  name="short_description"
                  value={formik.values.short_description}
                  rows="3"
                  disabled={true}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Tabs Section */}
        {isEditMode && currentQuote && (
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

export default QuoteFormPage;