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
  getUnitOfMeasures,
  getOpportunity
} from '../../../features/servicenow/opportunity/opportunitySlice';
import { createQuote } from '../../../features/servicenow/quote/quotaSlice';
import { getAccount } from '../../../features/servicenow/account/accountSlice';
import { getPriceList } from '../../../features/servicenow/price-list/priceListSlice';
import { getByPriceList } from '../../../features/servicenow/product-offering-price/productOfferingPriceSlice';
import { getall as getProductOfferings } from '../../../features/servicenow/product-offering/productOfferingSlice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import OpportunityStep1 from '../../../components/dashboard/Opportunity/Steps/Step1_CreateOpportunity';
import OpportunityStep2 from '../../../components/dashboard/Opportunity/Steps/Step2_SelectPriceList';
import OpportunityStep3 from '../../../components/dashboard/Opportunity/Steps/Step3_ProductOfferingPrice';
import OpportunityStep4 from '../../../components/dashboard/Opportunity/Steps/Step4_Summary';

const { Step } = Steps;

const FORM_STORAGE_KEY = 'opportunityFormData';

const OpportunityFormPage = () => {
  try{
    const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('1');
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
      console.log("here")
      await dispatch(getSalesCycleTypes());
      await dispatch(getStages());
      await dispatch(getAccount({ page: 1, limit: 99, q: accSearchTerm }));
      await dispatch(getUnitOfMeasures());
      await dispatch(getProductOfferings({ page: 1, limit: 99, q: offSearchTerm }));
      await dispatch(getPriceList({ page: 1, limit: 99, q: pLSearchTerm }));
      if (isEditMode) {
            console.log("here")
              await dispatch(getOpportunity({id})).then(() => {dispatch(getByPriceList(initialData.price_list._id));})
              .catch(error => {
              console.error("Failed to load opportunity:", error);
              setInitialized(true); // You might want to handle this differently
      });
    }
      setInitialized(true);
    };

    fetchData();
  }, [dispatch, id, isEditMode, accSearchTerm, offSearchTerm, pLSearchTerm]);

  // Get initial values
  const getInitialValues = () => {
    const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
    if (!isEditMode && savedForm) return  JSON.parse(savedForm);
    return {
      createNewPriceList: initialData?.price_list?._id ?  false : true,
      selectedPriceList: initialData?.price_list?._id || '',
      account: {
        name: "",
        email: ""
      },
      opportunity: {
        short_description: initialData?.short_description||'',
        estimated_closed_date: formatDateForInput(initialData?.estimated_closed_date)||formatDateForInput(new Date(new Date().getTime() + 86400000)),
        description: initialData?.description||'',
        term_month: initialData?.term_month||'12',
        sales_cycle_type: initialData?.sales_cycle_type._id||'',
        probability: initialData?.probability||'50',
        stage: initialData?.stage._id||'6834b29a3582eabbafc8bec0',
        industry: "telecommunications",
        account: initialData?.account._id||''
      },
      priceList: {
        name: '',
        currency: 'USD',
        state: 'published',
        start_date: formatDateForInput(new Date("01-01-2025")),
        end_date: '',
        description: ''
      },
      productOfferings: [{
        name: '',
        price: { unit: 'USD', value: '' },
        productOffering: { id: '' },
        unitOfMeasure: { id: '' },
        priceType: 'recurring',
        recurringChargePeriodType: 'monthly',
        validFor: {
          startDateTime: formatDateForInput(new Date(new Date().getTime() - 86400000)),
          endDateTime: formatDateForInput(new Date(new Date().getTime() + 86400000*29))
        },
        term_month: '',
        quantity: ''
      }]
    };
  };

   const validationSchema = useMemo(() => {
    return Yup.object().shape({
      opportunity: Yup.object().shape({
        short_description: Yup.string().required('Short description is required'),
        estimated_closed_date: Yup.string()
          .required('Estimated close date is required')
          .test(
            'is-future',
            'Estimated close date must be in the future',
            function(value) {
              if (isEditMode) return true;
              if (!value) return false;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const closeDate = new Date(value);
              return closeDate > today;
            }
          ),
        sales_cycle_type: Yup.string().required('Sales cycle type is required'),
        account: Yup.string().when('sales_cycle_type', {
          is: (value) => value !== '6834b3513582eabbafc8bec7',
          then: () => Yup.string().required('Account is required'),
          otherwise: () => Yup.string().nullable()
        }),
        probability: Yup.number().min(0).max(100),
      }),
      createNewPriceList: Yup.boolean().required(),

      selectedPriceList: Yup.string().when('createNewPriceList', {
        is: (value) => value === false,
        then: () => Yup.string().required('Please select a price list'),
        otherwise: () => Yup.string().nullable(),
      }),

      priceList: Yup.object().when('createNewPriceList', {
        is: (value) => value === true,
        then: () => Yup.object().shape({
          name: Yup.string().required('Name is required'),
          currency: Yup.string().required('Currency is required'),
          state: Yup.string(),
          start_date: Yup.string().required('Start date is required'),
          end_date: Yup.string()
            .test(
              'end-after-start',
              'End date must be after start date',
              function(value) {
                const { start_date } = this.parent;
                if (!start_date || !value) return true;
                return new Date(value) > new Date(start_date);
              }
            ),
        }),
        otherwise: () => Yup.object().nullable(),
      }),
      productOfferings: Yup.array()
        .min(1, 'At least one product offering is required')
        .of(
          Yup.object().shape({
            name: Yup.string().required("Name is required"),
            price: Yup.object().shape({
              value: Yup.number().min(0).required("Price is required"),
              unit: Yup.string()
                .test(
                  'currency-match',
                  'Currency must match Price List currency',
                  function(value) {
                    const { createNewPriceList, priceList, selectedPriceList } = this.options.context;
                    
                    if (createNewPriceList) {
                      return value === priceList?.currency;
                    } else {
                      // Find the selected price list from pre-fetched data
                      const selectedPL = priceLists.find(pl => pl._id === selectedPriceList);
                      
                      return value === selectedPL?.currency;
                    }
                  }
                ),
            }),
            validFor: Yup.object().shape({
              startDateTime: Yup.string()
                .required('Start date is required')
                .test(
                  'not-future',
                  'Start date cannot be in the future',
                  function(value) {
                    if (!value) return false;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const startDate = new Date(value);
                    return startDate <= today;
                  }
                )
                .test(
                  'within-price-list',
                  'Start date must be within Price List dates',
                  function(value) {
                    const { createNewPriceList, priceList, selectedPriceList } = this.options.context;
                    if (!value) return false;
                    
                    const startDate = new Date(value);
                    let priceListStart, priceListEnd;
                    
                    if (createNewPriceList) {
                      priceListStart = priceList?.start_date ? new Date(priceList.start_date) : null;
                      priceListEnd = priceList?.end_date ? new Date(priceList.end_date) : null;
                    } else {
                      // Use pre-fetched price list data
                      const selectedPL = priceLists?.find(pl => pl._id === selectedPriceList);
                      if (!selectedPL) return false;
                      priceListStart = selectedPL?.start_date ? new Date(selectedPL.start_date) : null;
                      priceListEnd = selectedPL?.end_date ? new Date(selectedPL.end_date) : null;
                    }
                    
                    if (priceListStart && startDate < priceListStart) return false;
                    if (priceListEnd && startDate > priceListEnd) return false;
                    return true;
                  }
                ),
              endDateTime: Yup.string()
                .required('End date is required')
                .test(
                  'after-start',
                  'End date must be after start date',
                  function(value) {
                    const { startDateTime } = this.parent;
                    if (!startDateTime || !value) return true;
                    return new Date(value) > new Date(startDateTime);
                  }
                )
                .test(
                  'within-price-list',
                  'End date must be within Price List dates',
                  function(value) {
                    
                    const { createNewPriceList, priceList, selectedPriceList } = this.options.context;
                    if (!value) return false;
                    
                    const endDate = new Date(value);
                    let priceListStart, priceListEnd;
                    
                    if (createNewPriceList) {
                      priceListStart = priceList?.start_date ? new Date(priceList.start_date) : null;
                      priceListEnd = priceList?.end_date ? new Date(priceList.end_date) : null;
                    } else {
                      // Use pre-fetched price list data
                      const selectedPL = priceLists?.find(pl => pl._id === selectedPriceList);
                      if (!selectedPL) return false;
                      priceListStart = selectedPL?.start_date ? new Date(selectedPL.start_date) : null;
                      priceListEnd = selectedPL?.end_date ? new Date(selectedPL.end_date) : null;
                    }
                    
                    if (priceListStart && endDate < priceListStart) return false;
                    if (priceListEnd && endDate > priceListEnd) return false;
                    return true;
                  }
                ),
            }),
            productOffering: Yup.object().shape({
              id: Yup.string().required('Product offering is required'),
            }),
            unitOfMeasure: Yup.object().shape({
              id: Yup.string().required('Unit of measure is required'),
            }),
            quantity: Yup.number().min(1),
            term_month: Yup.number().min(1),
            priceType: Yup.string()
              .test(
                'matches-product-offering',
                'Price type must match product offering pricing type',
                function(value) {
                  const { productOffering } = this.parent;
                  if (!productOffering?.id) return true;
                  
                  // Find the product offering from pre-fetched data
                  const offering = productOfferings?.data?.find(po => po.sys_id === productOffering.id);
                  if (!offering) return true;
                  
                  return value === offering.priceType;
                }
              )
              .required('Price type is required'),
          }),
        ),
      account: Yup.object().when('opportunity.sales_cycle_type', {
        is: (value) => value === '6834b3513582eabbafc8bec7',
        then: () => Yup.object().shape({
          name: Yup.string().required('Account name is required'),
          email: Yup.string().email('Invalid email').required('Email is required'),
        }),
        otherwise: () => Yup.object().nullable()
      }),
    });
  }, [priceLists, productOfferings]);

  const formik = useFormik({
    initialValues: getInitialValues(),
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        if(isEditMode){
            await dispatch(updateOpportunityPricing(values));
            notification.success({
              message: 'Opportunity Updated',
              description: 'Opportunity has been updated successfully',
            });
        }else{
          values.opportunity.stage = "6834b29a3582eabbafc8bec0";
          await dispatch(workflow(values));
          notification.success({
            message: 'Opportunity Created',
            description: 'New Opportunity has been created successfully',
          });
        }
        
        setOpen(false);
        localStorage.removeItem(FORM_STORAGE_KEY);
        resetForm();
        setCurrentStep(0);
      } catch (error) {
        console.error('Submission error:', error);
        notification.error({
          message: 'Operation Failed',
          description: error.message || 'Failed to create opportunity. Please try again.',
        });
      }
    },
    validateOnMount: true,
  });

  // Save form to localStorage
  useEffect(() => {
    if (!isEditMode && formik.dirty) {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formik.values));
    }
  }, [isEditMode, formik.values, formik.dirty]);

  const handleCancel = () => {
    localStorage.removeItem(FORM_STORAGE_KEY);
    formik.resetForm({ values: getInitialValues() });
    navigate('/dashboard/opportunity');
  };

  const handleReset = () => {
    navigate('/dashboard/opportunity');
    localStorage.removeItem(FORM_STORAGE_KEY);
    formik.resetForm({ values: getInitialValues() });
    setCurrentStep(0);
  };

  const handleQuoteGeneration = async () => {
      try {
        await dispatch(createQuote(id)).unwrap();
        notification.success({
          message: 'Quote Created',
          description: 'The quote and its line items have been created successfully.',
        });
      } catch (error) {
        notification.error({
          message: 'Creation Failed',
          description: error.message || 'Failed to create quote.',
        });
      }
    };

  const nextStep = () => {
    // Validate current step before proceeding
    let currentStepValid = true;
    let errors = {};
    
    if (currentStep === 0) {
      // Validate opportunity fields
      formik.setFieldTouched('opportunity.short_description', true);
      formik.setFieldTouched('opportunity.estimated_closed_date', true);
      formik.setFieldTouched('opportunity.sales_cycle_type', true);
      // formik.setFieldTouched('opportunity.stage', true);
      formik.setFieldTouched('opportunity.account', true);
      formik.setFieldTouched('opportunity.probability', true);
      
      errors = formik.errors.opportunity || {};
      currentStepValid = !Object.keys(errors).length;
    } 
    else if (currentStep === 1) {
      // Validate price list fields
      formik.setFieldTouched('createNewPriceList', true);
      
      if (formik.values.createNewPriceList) {
        formik.setFieldTouched('priceList.name', true);
        formik.setFieldTouched('priceList.currency', true);
        formik.setFieldTouched('priceList.state', true);
        formik.setFieldTouched('priceList.start_date', true);
        
        errors = formik.errors.priceList || {};
      } else {
        formik.setFieldTouched('selectedPriceList', true);
        errors = formik.errors.selectedPriceList ? { selectedPriceList: formik.errors.selectedPriceList } : {};
      }
      
      currentStepValid = !Object.keys(errors).length;
    } 
    else if (currentStep === 2) {
      // Validate product offerings
      formik.setFieldTouched('productOfferings', true);
      
      // Validate each product offering
      formik.values.productOfferings.forEach((_, index) => {
        formik.setFieldTouched(`productOfferings[${index}].productOffering.id`, true);
        formik.setFieldTouched(`productOfferings[${index}].price.value`, true);
        formik.setFieldTouched(`productOfferings[${index}].unitOfMeasure.id`, true);
        formik.setFieldTouched(`productOfferings[${index}].priceType`, true);
      });
        
      errors = formik.errors.productOfferings ? { productOfferings: formik.errors.productOfferings } : {};
      currentStepValid = !formik.errors.productOfferings;
    }
    
    if (currentStepValid) {
      setCurrentStep(currentStep + 1);
    } else {
      console.log('Validation errors:', errors);
      
    }
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
      title: 'Number',
      dataIndex: 'number',
      key: 'number',
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
      dataIndex: 'cumulative_mrr',
      key: 'price',
      render: (price) => (
        <span className="font-medium">
          {price}
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
      title: 'Term',
      dataIndex: 'term_month',
      key: 'term_month',
      render: (text) => <span className="text-gray-700">{text}</span>
    }
  ];

  const quoteColumns = [
    {
      title: 'Number',
      dataIndex: 'number',
      key: 'number',
      render: (text) => <span className="font-medium">{text}</span>
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      render: (text) => <span className="text-gray-700">{text}</span>
    },
    {
      title: 'Start date',
      dataIndex: 'subscription_start_date',
      key: 'text',
      render: (text) => (
        <span className="font-medium">
          {formatDateForInput(new Date(text))}
        </span>
      )
    },
    {
      title: 'End date',
      dataIndex: 'subscription_end_date',
      key: 'text',
      render: (text) => (
        <span className="font-medium">
          {formatDateForInput(new Date(text))}
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
            dataSource={initialData?.line_items || []}
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
    {
      key: '2',
      label: (
        <span className="flex items-center">
          <i className="ri-file-list-line text-lg mr-2"></i>
          Quotes
        </span>
      ),
      children: (
        <div className="p-4">
          <Table
            columns={quoteColumns}
            dataSource={initialData?.quote || []}
            pagination={false}
            rowKey={(record, index) => index}
            scroll={{ x: true }}
            locale={{
              emptyText: (
                <div className="py-8 text-center">
                  <i className="ri-information-line mx-auto text-3xl text-gray-400 mb-3"></i>
                  <p className="text-gray-500">No quotes have been generated yet</p>
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
              hidden={isEditMode}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleQuoteGeneration}
              disabled={formik.isSubmitting}
              className="overflow-hidden relative w-38 h-10 text-base font-medium bg-cyan-700 text-white hover:bg-cyan-800 cursor-pointer border-none rounded-md z-10 group transition-colors"
              hidden={!isEditMode}
            >
              Generate Quote
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
                  editMode={isEditMode} 
                  setAccSearchTerm={setAccSearchTerm} 
                />
              )}
              {currentStep === 1 && (
                <OpportunityStep2 
                  formik={formik} 
                  editMode={isEditMode} 
                  setPLSearchTerm={setPLSearchTerm}
                />
              )}
              {currentStep === 2 && (
                <OpportunityStep3
                  formik={formik}
                  editMode={isEditMode}
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
                      className="px-4 py-2 bg-cyan-600 w-30 mr-10 text-white rounded-md hover:bg-cyan-700"
                    >
                      Next
                    </button>
                  ) : (
                    <></>
                    // <button
                    //   type="button"
                    //   onClick={formik.handleSubmit}
                    //   disabled={formik.isSubmitting || !formik.isValid}
                    //   className={`px-4 py-2 rounded-md ${
                    //     formik.isSubmitting || !formik.isValid
                    //       ? 'bg-gray-400 text-white cursor-not-allowed'
                    //       : 'bg-cyan-600 text-white hover:bg-cyan-700'
                    //   }`}
                    // >
                    //   {formik.isSubmitting ? 'Submitting...' : 'Submit'}
                    // </button>
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
                type="card"
                items={tabItems}
                className="tabs"
                activeKey={activeTab}
                onChange={setActiveTab}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
  }catch(error){
    console.log(error);
  }
};

export default OpportunityFormPage;