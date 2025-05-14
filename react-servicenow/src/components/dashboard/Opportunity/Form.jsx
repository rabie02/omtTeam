import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Modal, Steps, message } from 'antd';
import { formatDateForInput } from '@/utils/formatDateForInput.js';
import { useSelector, useDispatch } from 'react-redux';
import {
  createOpportunity,
  createPriceList,
  createProductOfferingPrice,
  createOpportunityLineItem,
  getSalesCycleTypes,
  getStages,
  getAccounts,
  getUnitOfMeasures,
  getProductOfferings
} from '../../../features/servicenow/opportunity/opportunitySlice';
//import {getall as getProductOfferings} from '../../../features/servicenow/product-offering/productOfferingSlice';

const { Step } = Steps;

const validationSchema = Yup.object().shape({
  // Opportunity step validation
  opportunity: Yup.object().shape({
    short_description: Yup.string().required('Short description is required'),
    //assignment_group: Yup.string().required('Assignment group is required'),
    estimated_closed_date: Yup.string().required('Estimated close date is required'),
    sales_cycle_type: Yup.string().required('Sales cycle type is required'),
    stage: Yup.string().required('Stage is required'),
    account: Yup.string().required('Account is required'),
    probability: Yup.number().min(0).max(100).required('Probability is required'),
  }),
  // Price list step validation
  priceList: Yup.object().shape({
    name: Yup.string().required('Name is required'),
    currency: Yup.string().required('Currency is required'),
    state: Yup.string().required('State is required'),
    start_date: Yup.string().required('Start date is required'),
  }),
  // Product offering price step validation
  productOfferingPrice: Yup.object().shape({
    name: Yup.string().required('Name is required'),
    price: Yup.object().shape({
      value: Yup.number().required('Price value is required').min(0),
      unit: Yup.string().required('Currency is required'),
    }),
    productOffering: Yup.object().shape({
      id: Yup.string().required('Unit of measure is required'),
    }),
    unitOfMeasure: Yup.object().shape({
      id: Yup.string().required('Unit of measure is required'),
    }),
    priceType: Yup.string().required('Price type is required'),
  }),
  // Opportunity line item step validation
  opportunityLineItem: Yup.object().shape({
    quantity: Yup.number().required('Quantity is required').min(1),
    term_month: Yup.number().required('Term is required').min(1),
  }),
});

function OpportunityForm({ open, setOpen, dispatch }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [createdOpportunityId, setCreatedOpportunityId] = useState(null);
  const [createdPriceListId, setCreatedPriceListId] = useState(null);
  const [createdProductOfferingPriceId, setCreatedProductOfferingPriceId] = useState(null);
  
  // Get required data from Redux store
  const {
    salesCycleTypes,
    stages,
    accounts,
    unitOfMeasures,
    productOfferings,
    loading
  } = useSelector((state) => state.opportunity);

  // Fetch required data on component mount
  useEffect(() => {
    dispatch(getSalesCycleTypes());
    dispatch(getStages());
    dispatch(getAccounts());
    dispatch(getUnitOfMeasures());
    dispatch(getProductOfferings());
  }, [dispatch]);
 
  const formik = useFormik({
    initialValues: {
      opportunity: {
        short_description: '',
        assignment_group: '',
        estimated_closed_date: formatDateForInput(new Date()),
        actual_closed_date: '',
        description: '',
        term_month: '12',
        industry: '',
        source: 'direct',
        sales_cycle_type: '',
        score: '1',
        contact: '',
        probability: '50',
        do_not_share: 'false',
        stage: '',
        do_not_email: 'false',
        do_not_call: 'false',
        account: ''
      },
      priceList: {
        end_date: '',
        description: '',
        sales_agreement: '',
        defaultflag: 'false',
        name: '',
        currency: 'USD',
        state: 'published',
        account: '',
        start_date: formatDateForInput(new Date())
      },
      productOfferingPrice: {
        name: '',
        price: {
          unit: 'USD',
          value: ''
        },
        lifecycleStatus: 'Active',
        validFor: {
          startDateTime: formatDateForInput(new Date()),
          endDateTime: ''
        },
        productOffering: {
          id: ''
        },
        priceType: 'recurring',
        recurringChargePeriodType: 'monthly',
        unitOfMeasure: {
          id: ''
        },
        priceList: {
          id: ''
        },
        '@type': 'ProductOfferingPrice'
      },
      opportunityLineItem: {
        price_list: '',
        product_offering: '',
        term_month: '12',
        opportunity: '',
        quantity: '1',
        unit_of_measurement: ''
      }
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        
        // Step 1: Create opportunity
        const opportunityResponse = await dispatch(createOpportunity(values.opportunity)).unwrap();
        setCreatedOpportunityId(opportunityResponse.sys_id);
        
        // Step 2: Create price list (link to account from opportunity)
        const priceListValues = {
          ...values.priceList,
          account: values.opportunity.account
        };
        const priceListResponse = await dispatch(createPriceList(priceListValues)).unwrap();
        setCreatedPriceListId(priceListResponse.sys_id);
        
        // Step 3: Create product offering price
        const productOfferingPriceValues = {
          ...values.productOfferingPrice,
          priceList: { id: priceListResponse.sys_id },
          unitOfMeasure: { id: values.productOfferingPrice.unitOfMeasure.id }
        };
        const productOfferingPriceResponse = await dispatch(
          createProductOfferingPrice(productOfferingPriceValues)
        ).unwrap();
        setCreatedProductOfferingPriceId(productOfferingPriceResponse.id);
        
        // Step 4: Create opportunity line item
        const opportunityLineItemValues = {
          ...values.opportunityLineItem,
          price_list: priceListResponse.sys_id,
          product_offering: values.productOfferingPrice.productOffering.id,
          opportunity: opportunityResponse.sys_id,
          unit_of_measurement: values.productOfferingPrice.unitOfMeasure.id
        };
        await dispatch(createOpportunityLineItem(opportunityLineItemValues)).unwrap();
        
        message.success('Opportunity created successfully!');
        setOpen(false);
        resetForm();
      } catch (error) {
        console.error('Submission error:', error);
        message.error('Failed to create opportunity. Please try again.');
      }
    },
  });

  const handleCancel = () => {
    setOpen(false);
    formik.resetForm();
    setCurrentStep(0);
  };

  const nextStep = () => {
    // Validate current step before proceeding
    let currentStepValid = true;
    
    if (currentStep === 0) {
      formik.setFieldTouched('opportunity', true);
      currentStepValid = formik.errors.opportunity ? false : true;
    } else if (currentStep === 1) {
      formik.setFieldTouched('priceList', true);
      currentStepValid = formik.errors.priceList ? false : true;
    } else if (currentStep === 2) {
      formik.setFieldTouched('productOfferingPrice', true);
      currentStepValid = formik.errors.productOfferingPrice ? false : true;
    }
    
    if (currentStepValid) {
      setCurrentStep(currentStep + 1);
    } else {
      console.log(formik.errors)
      message.error('Please fill all required fields before proceeding');
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Update account in both opportunity and price list when changed
  const handleAccountChange = (accountId) => {
    formik.setFieldValue('opportunity.account', accountId);
    formik.setFieldValue('priceList.account', accountId);
  };

  // Update unit of measure in both product offering price and opportunity line item
  const handleUnitOfMeasureChange = (uomId) => {
    formik.setFieldValue('productOfferingPrice.unitOfMeasure.id', uomId);
    formik.setFieldValue('opportunityLineItem.unit_of_measurement', uomId);
  };

  // Update product offering in both product offering price and opportunity line item
  const handleProductOfferingChange = (productOfferingId) => {
    formik.setFieldValue('productOfferingPrice.productOffering.id', productOfferingId);
    formik.setFieldValue('opportunityLineItem.product_offering', productOfferingId);
  };
  

  return (
    <Modal
      title="Create New Opportunity"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Steps current={currentStep} className="mb-6">
        <Step title="Opportunity" />
        <Step title="Price List" />
        <Step title="Product Offering" />
        <Step title="Line Item" />
      </Steps>

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        {/* Step 1: Opportunity Details */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Opportunity Details</h3>
            
            {/* Short Description */}
            <div>
              <label className="block font-medium mb-1">Short Description*</label>
              <input
                name="opportunity.short_description"
                value={formik.values.opportunity.short_description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              />
              {formik.touched.opportunity?.short_description && formik.errors.opportunity?.short_description && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.opportunity.short_description}</p>
              )}
            </div>
            
            {/* Assignment Group
            <div>
              <label className="block font-medium mb-1">Assignment Group*</label>
              <input
                name="opportunity.assignment_group"
                value={formik.values.opportunity.assignment_group}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              />
              {formik.touched.opportunity?.assignment_group && formik.errors.opportunity?.assignment_group && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.opportunity.assignment_group}</p>
              )}
            </div> */}
            
            {/* Estimated Close Date */}
            <div>
              <label className="block font-medium mb-1">Estimated Close Date*</label>
              <input
                type="date"
                name="opportunity.estimated_closed_date"
                value={formik.values.opportunity.estimated_closed_date}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              />
              {formik.touched.opportunity?.estimated_closed_date && formik.errors.opportunity?.estimated_closed_date && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.opportunity.estimated_closed_date}</p>
              )}
            </div>
            
            {/* Sales Cycle Type */}
            <div>
              <label className="block font-medium mb-1">Sales Cycle Type*</label>
              <select
                name="opportunity.sales_cycle_type"
                value={formik.values.opportunity.sales_cycle_type}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Sales Cycle Type</option>
                {salesCycleTypes.map((type) => (
                  <option key={type.sys_id} value={type.sys_id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {formik.touched.opportunity?.sales_cycle_type && formik.errors.opportunity?.sales_cycle_type && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.opportunity.sales_cycle_type}</p>
              )}
            </div>
            
            {/* Stage */}
            <div>
              <label className="block font-medium mb-1">Stage*</label>
              <select
                name="opportunity.stage"
                value={formik.values.opportunity.stage}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Stage</option>
                {stages.map((stage) => (
                  <option key={stage.sys_id} value={stage.sys_id}>
                    {stage.sys_name}
                  </option>
                ))}
              </select>
              {formik.touched.opportunity?.stage && formik.errors.opportunity?.stage && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.opportunity.stage}</p>
              )}
            </div>
            
            {/* Account */}
            <div>
              <label className="block font-medium mb-1">Account*</label>
              <select
                name="opportunity.account"
                value={formik.values.opportunity.account}
                onChange={(e) => handleAccountChange(e.target.value)}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.sys_id} value={account.sys_id}>
                    {account.name}
                  </option>
                ))}
              </select>
              {formik.touched.opportunity?.account && formik.errors.opportunity?.account && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.opportunity.account}</p>
              )}
            </div>
            
            {/* Probability */}
            <div>
              <label className="block font-medium mb-1">Probability (%)*</label>
              <input
                type="number"
                min="0"
                max="100"
                name="opportunity.probability"
                value={formik.values.opportunity.probability}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              />
              {formik.touched.opportunity?.probability && formik.errors.opportunity?.probability && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.opportunity.probability}</p>
              )}
            </div>
            
            {/* Description */}
            <div>
              <label className="block font-medium mb-1">Description</label>
              <textarea
                name="opportunity.description"
                value={formik.values.opportunity.description}
                onChange={formik.handleChange}
                rows="3"
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        )}
        
        {/* Step 2: Price List */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Price List Details</h3>
            
            {/* Name */}
            <div>
              <label className="block font-medium mb-1">Name*</label>
              <input
                name="priceList.name"
                value={formik.values.priceList.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              />
              {formik.touched.priceList?.name && formik.errors.priceList?.name && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.priceList.name}</p>
              )}
            </div>
            
            {/* Currency */}
            <div>
              <label className="block font-medium mb-1">Currency*</label>
              <select
                name="priceList.currency"
                value={formik.values.priceList.currency}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
              {formik.touched.priceList?.currency && formik.errors.priceList?.currency && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.priceList.currency}</p>
              )}
            </div>
            
            {/* State */}
            <div>
              <label className="block font-medium mb-1">State*</label>
              <select
                name="priceList.state"
                value={formik.values.priceList.state}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              {formik.touched.priceList?.state && formik.errors.priceList?.state && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.priceList.state}</p>
              )}
            </div>
            
            {/* Start Date */}
            <div>
              <label className="block font-medium mb-1">Start Date*</label>
              <input
                type="date"
                name="priceList.start_date"
                value={formik.values.priceList.start_date}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              />
              {formik.touched.priceList?.start_date && formik.errors.priceList?.start_date && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.priceList.start_date}</p>
              )}
            </div>
            
            {/* End Date */}
            <div>
              <label className="block font-medium mb-1">End Date</label>
              <input
                type="date"
                name="priceList.end_date"
                value={formik.values.priceList.end_date}
                onChange={formik.handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block font-medium mb-1">Description</label>
              <textarea
                name="priceList.description"
                value={formik.values.priceList.description}
                onChange={formik.handleChange}
                rows="3"
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        )}
        
        {/* Step 3: Product Offering Price */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Product Offering Price</h3>
            
            {/* Name */}
            <div>
              <label className="block font-medium mb-1">Name*</label>
              <input
                name="productOfferingPrice.name"
                value={formik.values.productOfferingPrice.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              />
              {formik.touched.productOfferingPrice?.name && formik.errors.productOfferingPrice?.name && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.productOfferingPrice.name}</p>
              )}
            </div>
            
            {/* Price Value */}
            <div>
              <label className="block font-medium mb-1">Price Value*</label>
              <div className="flex">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="productOfferingPrice.price.value"
                  value={formik.values.productOfferingPrice.price.value}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full border rounded-l px-3 py-2"
                />
                <select
                  name="productOfferingPrice.price.unit"
                  value={formik.values.productOfferingPrice.price.unit}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="border-l-0 border rounded-r px-3 py-2"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              {formik.touched.productOfferingPrice?.price?.value && formik.errors.productOfferingPrice?.price?.value && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.productOfferingPrice.price.value}</p>
              )}
            </div>
            
            {/* Product Offering */}
            <div>
              <label className="block font-medium mb-1">Product Offering*</label>
              <select
                name="productOfferingPrice.productOffering.id"
                value={formik.values.productOfferingPrice.productOffering.id}
                onChange={(e) => handleProductOfferingChange(e.target.value)}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Product Offering</option>
                {productOfferings.data?.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {offering.name}
                  </option>
                ))}
              </select>
              {formik.touched.productOfferingPrice?.productOffering?.id && formik.errors.productOfferingPrice?.productOffering?.id && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.productOfferingPrice.productOffering.id}</p>
              )}
            </div>
            
            {/* Unit of Measure */}
            <div>
              <label className="block font-medium mb-1">Unit of Measure*</label>
              <select
                name="productOfferingPrice.unitOfMeasure.id"
                value={formik.values.productOfferingPrice.unitOfMeasure.id}
                onChange={(e) => handleUnitOfMeasureChange(e.target.value)}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Unit of Measure</option>
                {unitOfMeasures.map((uom) => (
                  <option key={uom.sys_id} value={uom.sys_id}>
                    {uom.name}
                  </option>
                ))}
              </select>
              {formik.touched.productOfferingPrice?.unitOfMeasure?.id && formik.errors.productOfferingPrice?.unitOfMeasure?.id && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.productOfferingPrice.unitOfMeasure.id}</p>
              )}
            </div>
            
            {/* Price Type */}
            <div>
              <label className="block font-medium mb-1">Price Type*</label>
              <select
                name="productOfferingPrice.priceType"
                value={formik.values.productOfferingPrice.priceType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              >
                <option value="recurring">Recurring</option>
                <option value="one-time">One-time</option>
              </select>
              {formik.touched.productOfferingPrice?.priceType && formik.errors.productOfferingPrice?.priceType && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.productOfferingPrice.priceType}</p>
              )}
            </div>
            
            {/* Recurring Charge Period (if price type is recurring) */}
            {formik.values.productOfferingPrice.priceType === 'recurring' && (
              <div>
                <label className="block font-medium mb-1">Recurring Charge Period*</label>
                <select
                  name="productOfferingPrice.recurringChargePeriodType"
                  value={formik.values.productOfferingPrice.recurringChargePeriodType}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            )}
            
            {/* Valid For - Start Date */}
            <div>
              <label className="block font-medium mb-1">Valid From*</label>
              <input
                type="datetime-local"
                name="productOfferingPrice.validFor.startDateTime"
                value={formik.values.productOfferingPrice.validFor.startDateTime}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            {/* Valid For - End Date */}
            <div>
              <label className="block font-medium mb-1">Valid Until</label>
              <input
                type="datetime-local"
                name="productOfferingPrice.validFor.endDateTime"
                value={formik.values.productOfferingPrice.validFor.endDateTime}
                onChange={formik.handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        )}
        
        {/* Step 4: Opportunity Line Item */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Opportunity Line Item</h3>
            
            {/* Quantity */}
            <div>
              <label className="block font-medium mb-1">Quantity*</label>
              <input
                type="number"
                min="1"
                name="opportunityLineItem.quantity"
                value={formik.values.opportunityLineItem.quantity}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              />
              {formik.touched.opportunityLineItem?.quantity && formik.errors.opportunityLineItem?.quantity && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.opportunityLineItem.quantity}</p>
              )}
            </div>
            
            {/* Term (Months) */}
            <div>
              <label className="block font-medium mb-1">Term (Months)*</label>
              <input
                type="number"
                min="1"
                name="opportunityLineItem.term_month"
                value={formik.values.opportunityLineItem.term_month}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full border rounded px-3 py-2"
              />
              {formik.touched.opportunityLineItem?.term_month && formik.errors.opportunityLineItem?.term_month && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.opportunityLineItem.term_month}</p>
              )}
            </div>
            
            {/* Display linked information (readonly) */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-2">Linked Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Product Offering</p>
                  <p>
                    {productOfferings.data.find(po => po.sys_id === formik.values.opportunityLineItem.product_offering)?.name || 'Not selected'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unit of Measure</p>
                  <p>
                    {unitOfMeasures.find(uom => uom.sys_id === formik.values.opportunityLineItem.unit_of_measurement)?.name || 'Not selected'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price List</p>
                  <p>{formik.values.priceList.name || 'Not created'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Opportunity</p>
                  <p>{formik.values.opportunity.short_description || 'Not created'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation buttons */}
        <div className="flex justify-between pt-4">
          <div>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 rounded border bg-gray-200 hover:bg-gray-300"
              >
                Previous
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                {loading ? 'Creating...' : 'Create Opportunity'}
              </button>
            )}
            
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded border bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default OpportunityForm;