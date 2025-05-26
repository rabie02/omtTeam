import React, { useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Modal, Steps, notification } from 'antd';
import { useSelector } from 'react-redux';
import OpportunityNavigation from './Steps/Navigation';
import OpportunityStep1 from './Steps/Step1';
import OpportunityStep2 from './Steps/Step2';
import OpportunityStep3 from './Steps/Step3';
import OpportunityStep4 from './Steps/Step4';
import { formatDateForInput } from '@/utils/formatDateForInput.js';
import {
  getSalesCycleTypes,
  getStages,
  getAccounts,
  getUnitOfMeasures,
  workflow
} from '../../../features/servicenow/opportunity/opportunitySlice';
import { getPriceList } from '../../../features/servicenow/price-list/priceListSlice';
import {getall as getProductOfferings} from '../../../features/servicenow/product-offering/productOfferingSlice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
      state: Yup.string(),
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
  account: Yup.object().shape({
    name: Yup.string(),
    email: Yup.string(),
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
    loading,
    data:productOfferings,
    priceLists
  } = useSelector((state) => ({
    ...state.opportunity,
    productOfferings: state.productOffering,
    priceLists: state.priceList
  }));

  // Fetch required data on component mount
  useEffect(() => {
    dispatch(getSalesCycleTypes());
    dispatch(getStages());
    dispatch(getAccounts());
    dispatch(getUnitOfMeasures());
    dispatch(getProductOfferings({ page: 1, limit: 6}));
    dispatch(getPriceList());
  }, [dispatch]);

  const formik = useFormik({
    initialValues: {
      createNewPriceList: true,
      selectedPriceList: '',
      account:{
        name: "",
        email: ""
      },
      opportunity: {
        short_description: '',
        estimated_closed_date: formatDateForInput(new Date()),
        description: '',
        term_month: '12',
        sales_cycle_type: '',
        probability: '50',
        stage: '',
        industry: "telecommunications",
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
      },
      account:{
        name:"",
        email:""
      }
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        dispatch(workflow(values));
        notification.success({
              message: 'Opportunity Created',
              description: 'New Opportunity has been created successfully',
            });
        
        setOpen(false);
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
  });

  
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
      
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };


  const pdfRef = useRef();
  
    const downloadPDF = () => {
      const input = pdfRef.current;
      
      html2canvas(input, {
        scale: 2,
        windowHeight: input.scrollHeight
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 190; // mm (A4 width minus margins)
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 10; // Start 10mm from top
        const pageHeight = 277; // A4 height in mm (297 - 20mm margins)
        
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add new pages as needed
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        pdf.save('opportunity_details.pdf');
      });
    };

    console.log(stages);

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

      <form onSubmit={(e)=>{e.preventDefault()}}className="space-y-4">
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
          <OpportunityStep4 formik={formik} pdfRef={pdfRef} />
        )}

        <OpportunityNavigation
          currentStep={currentStep}
          loading={loading}
          prevStep={prevStep}
          nextStep={nextStep}
          handleCancel={handleCancel}
          formik={formik}
          downloadPDF={downloadPDF}
        />
      </form>
    </Modal>
  );
}

export default OpportunityForm;