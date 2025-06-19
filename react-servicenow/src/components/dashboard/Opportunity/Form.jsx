import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Modal, Steps, notification, Spin } from 'antd';
import { useSelector } from 'react-redux';
import OpportunityNavigation from './Steps/Navigation';
import OpportunityStep1 from './Steps/Step1_CreateOpportunity';
import OpportunityStep2 from './Steps/Step2_SelectPriceList';
import OpportunityStep3 from './Steps/Step3_ProductOfferingPrice';
import OpportunityStep4 from './Steps/Step4_Summary';
import { formatDateForInput } from '@/utils/formatDateForInput.js';
import {
  getSalesCycleTypes,
  getStages,
  getUnitOfMeasures,
  workflow,
  updateOpportunityPricing,
  resetError
} from '../../../features/servicenow/opportunity/opportunitySlice';
import {getAccount} from '../../../features/servicenow/account/accountSlice';
import { getPriceList } from '../../../features/servicenow/price-list/priceListSlice';
import { getByPriceList } from '../../../features/servicenow/product-offering-price/productOfferingPriceSlice';
import {getall as getProductOfferings} from '../../../features/servicenow/product-offering/productOfferingSlice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Step } = Steps;

function OpportunityForm({ open, setOpen, dispatch, initialData=null }) {
try{
  dispatch(resetError());
  const [editMode, setEditMode] = useState(Boolean(initialData)); 
  const [offSearchTerm, setOffSearchTerm] = useState(''); 
  const [pLSearchTerm, setPLSearchTerm] = useState('');
  const [accSearchTerm, setAccSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const FORM_STORAGE_KEY = 'opportunityFormData'
  // Get required data from Redux store
  // More efficient selectors that won't cause unnecessary re-renders
const loading = useSelector(state => state.opportunity.loading);
const productOfferings = useSelector(state => state.productOffering.data);
const priceLists = useSelector(state => state.priceList.priceLists);
const { 
  productOfferingPrices, 
  loading: popLoading, 
  error 
} = useSelector(state => state.productOfferingPrice);

// Fetch required data on component mount
useEffect(() => {
  // Always fetch these
  const fetchBaseData = async () => {
    await dispatch(getSalesCycleTypes());
    await dispatch(getStages());
    await dispatch(getAccount({ page: 1, limit: 99, q:accSearchTerm }));
    await dispatch(getUnitOfMeasures());
    await dispatch(getProductOfferings({ page: 1, limit: 99, q:offSearchTerm }));
    await dispatch(getPriceList({ page: 1, limit: 99, q:pLSearchTerm }));
  };

  // Only fetch in edit mode
  const fetchEditModeData = async () => {
    if (editMode && initialData?.price_list?._id) {
      await dispatch(getByPriceList(initialData.price_list._id));
    }
  };

  fetchBaseData();
  fetchEditModeData();

}, [dispatch, editMode, initialData?.price_list?._id,]); // Proper dependencies

useEffect( () => {
   dispatch(getProductOfferings({ page: 1, limit: 99, q:offSearchTerm }));
}, [dispatch, offSearchTerm]);

useEffect( () => {
   dispatch(getPriceList({ page: 1, limit: 99, q:pLSearchTerm }));
}, [dispatch, pLSearchTerm]);

useEffect( () => {
   dispatch(getAccount({ page: 1, limit: 99, q:accSearchTerm }));
}, [dispatch, accSearchTerm]);



  // Get initial values from localStorage or use defaults
  const getInitialValues = () => {
    const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
    if (!editMode && savedForm) return  JSON.parse(savedForm);
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
              if (editMode) return true;
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
        if(editMode){
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

  // Save form to localStorage whenever it changes
  useEffect(() => {
    if (!editMode && formik.dirty) {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formik.values));
    }
  }, [editMode, formik.values, formik.dirty]);
  
  const handleCancel = () => {
    setOpen(false);
    
    if(editMode) {
      setEditMode(false);
      formik.resetForm({ values: getInitialValues() })
    };
    setCurrentStep(0);
  };

  // Reset form handler
  const handleReset = () => {
    setOpen(false);
    localStorage.removeItem(FORM_STORAGE_KEY);
    formik.resetForm({ values: getInitialValues() });
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

    useEffect(() => {
      if (editMode) {
        // Set initial values
        formik.setValues(getInitialValues());
        formik.setFieldValue('opportunityId', initialData._id);
        
        // Set touched fields
        const touched = {
          createNewPriceList: true,
          selectedPriceList: true,
          account: {
            name: true,
            email: true
          },
          opportunity: {
            short_description: true,
            estimated_closed_date: true,
            description: true,
            term_month: true,
            sales_cycle_type: true,
            probability: true,
            //stage: true,
            industry: true,
            account: true
          },
          priceList: {
            name: true,
            currency: true,
            state: true,
            start_date: true,
            end_date: true,
            description: true
          },
          productOfferings: formik.values.productOfferings.map(() => ({
            name: true,
            price: { unit: true, value: true },
            productOffering: { id: true },
            unitOfMeasure: { id: true },
            priceType: true,
            recurringChargePeriodType: true,
            validFor: {
              startDateTime: true,
              endDateTime: true
            },
            term_month: true,
            quantity: true
          }))
        };
        formik.setTouched(touched);
      }
    }, [editMode]);
    if(loading){
      return <Modal
      title="Create New Opportunity"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnHidden
    >
      <div className='h-full flex justify-center items-center'><Spin /></div>
    </Modal>
    }
  return (
    <Modal
      title={editMode ? "Update Opportunity" : `Create New Opportunity`}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnHidden
    >
      <Steps current={currentStep} className="mb-6">
        <Step title="Opportunity" />
        <Step title="Price List" />
        <Step title="Line Items" />
        <Step title="Summary" />
      </Steps>

      <form onSubmit={(e) => { e.preventDefault() }} className="space-y-4">
        {currentStep === 0 && (
          <OpportunityStep1 formik={formik} editMode={editMode} setAccSearchTerm={setAccSearchTerm} />
        )}
        {currentStep === 1 && (
          <OpportunityStep2 formik={formik} editMode={editMode} setPLSearchTerm={setPLSearchTerm}/>
        )}
        {currentStep === 2 && (
          <OpportunityStep3 
            formik={formik} 
            editMode={editMode}
            lineItems={editMode && initialData.line_items}
            pops={productOfferingPrices.productOfferingPrices}
            setOffSearchTerm={setOffSearchTerm}
          />
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
          resetForm={handleReset}
          editMode={editMode}
        />
      </form>
    </Modal>
  );
}catch(error){
  console.log(error);
}
}

export default OpportunityForm;