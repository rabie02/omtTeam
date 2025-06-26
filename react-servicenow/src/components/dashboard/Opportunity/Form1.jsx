import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  notification,
  Spin,
  Popconfirm,
  Tabs,
  Table,
  Tooltip,
  Badge,
  Steps
} from 'antd';
import { formatDateForInput } from '@/utils/formatDateForInput.js';
import {
  workflow,
  updateOpportunityPricing,
  resetError,
  getSalesCycleTypes,
  getStages,
  getUnitOfMeasures
} from '../../../features/servicenow/opportunity/opportunitySlice';
import { getAccount } from '../../../features/servicenow/account/accountSlice';
import { getPriceList } from '../../../features/servicenow/price-list/priceListSlice';
import { getByPriceList } from '../../../features/servicenow/product-offering-price/productOfferingPriceSlice';
import { getall as getProductOfferings } from '../../../features/servicenow/product-offering/productOfferingSlice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import OpportunityStep1 from './Steps/Step1_CreateOpportunity';
import OpportunityStep2 from './Steps/Step2_SelectPriceList';
import OpportunityStep3 from './Steps/Step3_ProductOfferingPrice';
import OpportunityStep4 from './Steps/Step4_Summary';

const { Step } = Steps;

const FORM_STORAGE_KEY = 'opportunityFormData';

const OpportunityFormPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [currentStep, setCurrentStep] = useState(0);
  const [offSearchTerm, setOffSearchTerm] = useState('');
  const [pLSearchTerm, setPLSearchTerm] = useState('');
  const [accSearchTerm, setAccSearchTerm] = useState('');
  const headerRef = useRef(null);
  const pdfRef = useRef();
  const [initialized, setInitialized] = useState(false);

  // Get data from Redux store
  const {
    loading,
    currentOpportunity: initialData,
    error
  } = useSelector(state => state.opportunity);
  const productOfferings = useSelector(state => state.productOffering.data);
  const priceLists = useSelector(state => state.priceList.priceLists);
  const { productOfferingPrices } = useSelector(state => state.productOfferingPrice);

  // Fetch required data
  useEffect(() => {
    const fetchData = async () => {
      await dispatch(getSalesCycleTypes());
      await dispatch(getStages());
      await dispatch(getAccount({ page: 1, limit: 99, q: accSearchTerm }));
      await dispatch(getUnitOfMeasures());
      await dispatch(getProductOfferings({ page: 1, limit: 99, q: offSearchTerm }));
      await dispatch(getPriceList({ page: 1, limit: 99, q: pLSearchTerm }));

      if (isEditMode && initialData?.price_list?._id) {
        await dispatch(getByPriceList(initialData.price_list._id));
      }

      setInitialized(true);
    };

    fetchData();
  }, [dispatch, isEditMode, initialData?.price_list?._id, accSearchTerm, offSearchTerm, pLSearchTerm]);

  // Get initial values
  const getInitialValues = () => {
    const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
    if (!isEditMode && savedForm) return JSON.parse(savedForm);
    
    return {
      createNewPriceList: initialData?.price_list?._id ? false : true,
      selectedPriceList: initialData?.price_list?._id || '',
      account: {
        name: "",
        email: ""
      },
      opportunity: {
        short_description: initialData?.short_description || '',
        estimated_closed_date: formatDateForInput(initialData?.estimated_closed_date) || formatDateForInput(new Date(new Date().getTime() + 86400000)),
        description: initialData?.description || '',
        term_month: initialData?.term_month || '12',
        sales_cycle_type: initialData?.sales_cycle_type?._id || '',
        probability: initialData?.probability || '50',
        stage: initialData?.stage?._id || '6834b29a3582eabbafc8bec0',
        industry: "telecommunications",
        account: initialData?.account?._id || ''
      },
      priceList: {
        name: '',
        currency: 'USD',
        state: 'published',
        start_date: formatDateForInput(new Date("01-01-2025")),
        end_date: '',
        description: ''
      },
      productOfferings: initialData?.line_items?.map(item => ({
        name: item.name,
        price: { unit: item.price.unit, value: item.price.value },
        productOffering: { id: item.product_offering._id },
        unitOfMeasure: { id: item.unit_of_measure._id },
        priceType: item.price_type,
        recurringChargePeriodType: item.recurring_charge_period_type,
        validFor: {
          startDateTime: formatDateForInput(new Date(item.valid_for.start_date_time)),
          endDateTime: formatDateForInput(new Date(item.valid_for.end_date_time))
        },
        term_month: item.term_month,
        quantity: item.quantity
      })) || [{
        name: '',
        price: { unit: 'USD', value: '' },
        productOffering: { id: '' },
        unitOfMeasure: { id: '' },
        priceType: 'recurring',
        recurringChargePeriodType: 'monthly',
        validFor: {
          startDateTime: formatDateForInput(new Date(new Date().getTime() - 86400000)),
          endDateTime: formatDateForInput(new Date(new Date().getTime() + 86400000 * 29))
        },
        term_month: '',
        quantity: ''
      }]
    };
  };

  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      // ... (keep your existing validation schema)
    });
  }, [priceLists, productOfferings]);

  const formik = useFormik({
    initialValues: getInitialValues(),
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (isEditMode) {
          await dispatch(updateOpportunityPricing(values));
          notification.success({
            message: 'Opportunity Updated',
            description: 'Opportunity has been updated successfully',
          });
        } else {
          values.opportunity.stage = "6834b29a3582eabbafc8bec0";
          await dispatch(workflow(values));
          notification.success({
            message: 'Opportunity Created',
            description: 'New Opportunity has been created successfully',
          });
        }

        navigate('/dashboard/opportunity');
        localStorage.removeItem(FORM_STORAGE_KEY);
        resetForm();
        setCurrentStep(0);
      } catch (error) {
        notification.error({
          message: 'Operation Failed',
          description: error.message || 'Failed to create opportunity. Please try again.',
        });
      }
    },
    validateOnMount: true,
    enableReinitialize: true
  });

  // Save form to localStorage
  useEffect(() => {
    if (!isEditMode && formik.dirty) {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formik.values));
    }
  }, [isEditMode, formik.values, formik.dirty]);

  const handleCancel = () => {
    navigate('/dashboard/opportunity');
  };

  const handleReset = () => {
    navigate('/dashboard/opportunity');
    localStorage.removeItem(FORM_STORAGE_KEY);
    formik.resetForm({ values: getInitialValues() });
    setCurrentStep(0);
  };

  const nextStep = () => {
    // ... (keep your existing nextStep logic)
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const downloadPDF = () => {
    // ... (keep your existing downloadPDF logic)
  };

  // StatusCell component for consistent status rendering
  const StatusCell = ({ status }) => {
    const statusColors = {
      published: { dot: 'bg-green-500', text: 'text-green-700' },
      draft: { dot: 'bg-blue-500', text: 'text-blue-700' },
      archived: { dot: 'bg-gray-400', text: 'text-gray-600' },
      retired: { dot: 'bg-red-500', text: 'text-red-700' },
    };

    const colors = statusColors[status] || statusColors.draft;
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

  // Define table columns for line items
  const lineItemColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-medium">{text}</span>
    },
    {
      title: 'Product Offering',
      dataIndex: ['productOffering', 'name'],
      key: 'productOffering',
      render: (text) => <span className="text-gray-700">{text}</span>
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => (
        <span className="font-medium">
          {price.unit} {price.value}
        </span>
      )
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (text) => <span className="text-gray-700">{text}</span>
    },
    {
      title: 'Valid From',
      dataIndex: ['validFor', 'startDateTime'],
      key: 'startDateTime',
      render: (date) => (
        <span className="text-gray-600">
          {date ? new Date(date).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      title: 'Valid To',
      dataIndex: ['validFor', 'endDateTime'],
      key: 'endDateTime',
      render: (date) => (
        <span className="text-gray-600">
          {date ? new Date(date).toLocaleDateString() : 'N/A'}
        </span>
      )
    }
  ];

  // Tab items configuration
  const tabItems = [
    {
      key: '1',
      label: (
        <span className="flex items-center">
          <i className="ri-file-list-line text-lg mr-2"></i>
          Line Items
        </span>
      ),
      children: (
        <div className="p-4">
          <Table
            columns={lineItemColumns}
            dataSource={formik.values.productOfferings}
            pagination={false}
            rowKey={(record, index) => index}
            scroll={{ x: true }}
            locale={{
              emptyText: (
                <div className="py-8 text-center">
                  <i className="ri-information-line mx-auto text-3xl text-gray-400 mb-3"></i>
                  <p className="text-gray-500">No line items added yet</p>
                </div>
              )
            }}
          />
        </div>
      ),
    },
  ];

  if (!initialized || (isEditMode && loading)) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin
          size="large"
          tip={isEditMode ? "Loading opportunity details..." : "Initializing form..."}
          indicator={<i className="ri-refresh-line animate-spin text-2xl"></i>}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 h-full flex flex-col">
      {/* Sticky Header */}
      <div
        ref={headerRef}
        className="sticky top-0 z-10 bg-white border-b border-gray-200"
      >
        <div className="flex flex-col md:flex-row px-6 py-2.5 bg-gray-200 justify-between items-start md:items-center gap-4">
          <div className="flex items-center">
            <button
              onClick={handleCancel}
              className="mr-3 text-cyan-700 hover:text-cyan-800 bg-white border border-cyan-700 hover:bg-cyan-50 w-10 h-10 flex justify-center items-center rounded-md"
            >
              <i className="ri-arrow-left-s-line text-2xl"></i>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Opportunity</h1>
              <p className="text-gray-600 text-md flex items-center gap-2">
                {isEditMode ? initialData.short_description : 'New opportunity'}
                {isEditMode && (
                  <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-xs font-medium rounded-md capitalize">
                    {initialData.stage?.sys_name}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={formik.isSubmitting}
              className="overflow-hidden relative w-32 h-10 border-2 border-gray-300 rounded-md text-gray-700 text-base font-medium hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={formik.handleSubmit}
              disabled={formik.isSubmitting || !formik.isValid}
              className={`overflow-hidden relative w-32 h-10 border-2 rounded-md text-base font-medium z-10 group transition-colors ${
                formik.isSubmitting || !formik.isValid
                  ? 'bg-gray-100 border-gray-400 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-cyan-700 text-cyan-700 hover:bg-cyan-50 cursor-pointer'
              }`}
            >
              {formik.isSubmitting ? (
                <span>Processing...</span>
              ) : isEditMode ? (
                <span>Update</span>
              ) : (
                <span>Create</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-grow overflow-y-auto">
        <div className="bg-white shadow-sm max-w-7xl mx-auto my-6">
          <div className="p-6">
            <Steps current={currentStep} className="mb-8">
              <Step title="Opportunity" />
              <Step title="Price List" />
              <Step title="Line Items" />
              <Step title="Summary" />
            </Steps>

            <form onSubmit={(e) => { e.preventDefault() }} className="space-y-6">
              {currentStep === 0 && (
                <OpportunityStep1 
                  formik={formik} 
                  isEditMode={isEditMode} 
                  setAccSearchTerm={setAccSearchTerm} 
                />
              )}
              {currentStep === 1 && (
                <OpportunityStep2 
                  formik={formik} 
                  isEditMode={isEditMode} 
                  setPLSearchTerm={setPLSearchTerm}
                />
              )}
              {currentStep === 2 && (
                <OpportunityStep3
                  formik={formik}
                  isEditMode={isEditMode}
                  lineItems={isEditMode && initialData.line_items}
                  pops={productOfferingPrices}
                  setOffSearchTerm={setOffSearchTerm}
                />
              )}
              {currentStep === 3 && (
                <OpportunityStep4 formik={formik} pdfRef={pdfRef} />
              )}

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <div>
                  {currentStep > 0 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={formik.handleSubmit}
                      disabled={formik.isSubmitting || !formik.isValid}
                      className={`px-4 py-2 rounded-md ${
                        formik.isSubmitting || !formik.isValid
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-cyan-600 text-white hover:bg-cyan-700'
                      }`}
                    >
                      {formik.isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {isEditMode && (
          <div className="bg-white max-w-7xl mx-auto my-4">
            {/* Tabs Section */}
            <div className="p-3">
              <Tabs
                activeKey="1"
                type="card"
                items={tabItems}
                className="tabs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityFormPage;