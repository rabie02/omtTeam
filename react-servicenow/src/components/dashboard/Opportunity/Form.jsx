import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Modal, Steps, message } from 'antd';
import { useSelector } from 'react-redux';
import OpportunityNavigation from './Steps/Navigation';
import OpportunityStep1 from './Steps/Step1';
import OpportunityStep2 from './Steps/Step2';
import OpportunityStep3 from './Steps/Step3';
import OpportunityStep4 from './Steps/Step4';
import { formatDateForInput } from '@/utils/formatDateForInput.js';
import {
  createOpportunity,
  createProductOfferingPrice,
  createOpportunityLineItem,
  getSalesCycleTypes,
  getStages,
  getAccounts,
  getUnitOfMeasures,
  getProductOfferings
} from '../../../features/servicenow/opportunity/opportunitySlice';
import { getPriceList } from '../../../features/servicenow/price-list/priceListSlice';

const { Step } = Steps;

const validationSchema = Yup.object().shape({
  opportunity: Yup.object().shape({
    short_description: Yup.string().required('Short description is required'),
        estimated_closed_date: Yup.string(),
        sales_cycle_type: Yup.string().required('Sales cycle type is required'),
        stage: Yup.string().required('Stage is required'),
        account: Yup.string(),
        probability: Yup.number().min(0).max(100),
  }),
  createNewPriceList: Yup.boolean().required(),

  selectedPriceList: Yup.string().when('createNewPriceList', {
    is: (value) => value === false,
    then: () => Yup.string().required('Please select a price list'),
    otherwise: ()=> Yup.string().nullable(),
  }),

  priceList: Yup.object().when('createNewPriceList', {
    is: (value) => value === true,
    then: () => Yup.object().shape({
      name: Yup.string().required('Name is required'),
      currency: Yup.string().required('Currency is required'),
      state: Yup.string().required('State is required'),
      start_date: Yup.string().required('Start date is required'),
    }),
    otherwise: () => Yup.object().nullable(),
  }),
  productOfferings: Yup.array().min(1, 'At least one product offering is required').of(
    Yup.object().shape({
      name: Yup.string(),
      price: Yup.object().shape({
        value: Yup.number().min(0),
        unit: Yup.string(),
      }),
      productOffering: Yup.object().shape({
        id: Yup.string(),
      }),
      unitOfMeasure: Yup.object().shape({
        id: Yup.string(),
      }),
      priceType: Yup.string(),
    })
  ),
  opportunityLineItem: Yup.object().shape({
    quantity: Yup.number().min(1),
    term_month: Yup.number().min(1),
  }),
});

function OpportunityForm({ open, setOpen, dispatch }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [createNewPriceList, setCreateNewPriceList] = useState(true);
  const [productOfferingsList, setProductOfferingsList] = useState([]);

  // Get required data from Redux store
  const {
    salesCycleTypes,
    stages,
    accounts,
    unitOfMeasures,
    productOfferings,
    loading,
    priceLists
  } = useSelector((state) => ({
    ...state.opportunity,
    priceLists: state.priceList.priceLists || []
  }));

  // Fetch required data on component mount
  useEffect(() => {
    dispatch(getSalesCycleTypes());
    dispatch(getStages());
    dispatch(getAccounts());
    dispatch(getUnitOfMeasures());
    dispatch(getProductOfferings());
    dispatch(getPriceList());
  }, [dispatch]);

  

  const formik = useFormik({
    initialValues: {
      createNewPriceList: true,
      selectedPriceList: '',
      opportunity: {
        short_description: '',
        estimated_closed_date: formatDateForInput(new Date()),
        description: '',
        term_month: '12',
        sales_cycle_type: '',
        probability: '50',
        stage: '',
        account: ''
      },
      priceList: {
        name: '',
        currency: 'USD',
        state: 'published',
        start_date: formatDateForInput(new Date()),
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
          startDateTime: formatDateForInput(new Date()),
          endDateTime: ''
        }
      }],
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
        term_month: '12',
        quantity: '1'
      }
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        console.log("here")
        // // Step 1: Create opportunity
        // const opportunityResponse = await dispatch(createOpportunity(values.opportunity)).unwrap();
        
        // // Step 2: Use existing or create new price list
        // let priceListId;
        // if (values.createNewPriceList) {
        //   const priceListResponse = await dispatch(createPriceList({
        //     ...values.priceList,
        //     account: values.opportunity.account
        //   })).unwrap();
        //   priceListId = priceListResponse.sys_id;
        // } else {
        //   priceListId = values.selectedPriceList;
        // }

        // // Step 3: Create product offering prices
        // const productOfferingPrices = await Promise.all(
        //   values.productOfferings.map(async (productOffering) => {
        //     const response = await dispatch(createProductOfferingPrice({
        //       ...productOffering,
        //       priceList: { id: priceListId }
        //     })).unwrap();
        //     return response.id;
        //   })
        // );

        // // Step 4: Create opportunity line items
        // await Promise.all(
        //   values.productOfferings.map((productOffering, index) => (
        //     dispatch(createOpportunityLineItem({
        //       price_list: priceListId,
        //       product_offering: productOffering.productOffering.id,
        //       opportunity: opportunityResponse.sys_id,
        //       unit_of_measurement: productOffering.unitOfMeasure.id,
        //       quantity: values.opportunityLineItem.quantity,
        //       term_month: values.opportunityLineItem.term_month
        //     }))
        //   ))
        // );

        

        message.success('Opportunity created successfully!');
        setOpen(false);
        resetForm();
        setCurrentStep(0);
      } catch (error) {
        console.error('Submission error:', error);
        message.error('Failed to create opportunity. Please try again.');
      }
    },
  });

  // Helper function to get value from ServiceNow objects
  const getValue = (field) => {
    if (!field) return '';
    return typeof field === 'object' ? field.value : field;
  };

  // Add a new product offering to the list
  const addProductOffering = () => {
    formik.setFieldValue('productOfferings', [
      ...formik.values.productOfferings,
      {
        name: '',
        price: { unit: 'USD', value: '' },
        productOffering: { id: '' },
        unitOfMeasure: { id: '' },
        priceType: 'recurring',
        recurringChargePeriodType: 'monthly',
        validFor: {
          startDateTime: formatDateForInput(new Date()),
          endDateTime: ''
        }
      }
    ]);
  };

  // Remove a product offering from the list
  const removeProductOffering = (index) => {
    const newOfferings = [...formik.values.productOfferings];
    newOfferings.splice(index, 1);
    formik.setFieldValue('productOfferings', newOfferings);
  };

  // Update product offering field
  const updateProductOffering = (index, field, value) => {
    const newOfferings = [...formik.values.productOfferings];
    newOfferings[index][field] = value;
    formik.setFieldValue('productOfferings', newOfferings);
    // Manually trigger validation for the updated field
    formik.setFieldTouched(`productOfferings[${index}].${field}`, true, false);
  };

  const handleCancel = () => {
    setOpen(false);
    formik.resetForm();
    setCurrentStep(0);
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
      formik.setFieldTouched('opportunity.stage', true);
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

   // Render error message for a field
  const renderErrorMessage = (fieldName) => {
    const touched = formik.touched[fieldName];
    const error = formik.errors[fieldName];
    return touched && error ? (
      <p className="text-red-500 text-sm mt-1">{error}</p>
    ) : null;
  };

  // Render error message for array fields
  const renderArrayErrorMessage = (arrayName, index, fieldName) => {
    const touched = formik.touched[arrayName]?.[index]?.[fieldName];
    const error = formik.errors[arrayName]?.[index]?.[fieldName];
    return touched && error ? (
      <p className="text-red-500 text-sm mt-1">{error}</p>
    ) : null;
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
        <Step title="Product Offerings" />
        <Step title="Summary" />
      </Steps>

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        {currentStep === 0 && (
          <OpportunityStep1 formik={formik} />
        )}
        {currentStep === 1 && (
          <OpportunityStep2 formik={formik} />
        )}
        {currentStep === 2 && (
          <OpportunityStep3 formik={formik} />
        )}
        {currentStep === 3 && (
          <OpportunityStep4 formik={formik} />
        )}

        <OpportunityNavigation
          currentStep={currentStep}
          loading={loading}
          prevStep={prevStep}
          nextStep={nextStep}
          handleCancel={handleCancel}
          formik={formik}
        />
      </form>
    </Modal>
  );
}

export default OpportunityForm;