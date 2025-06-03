import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Modal, Steps, notification } from 'antd';
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
  getAccounts,
  getUnitOfMeasures,
  workflow
} from '../../../features/servicenow/opportunity/opportunitySlice';
import { getPriceList } from '../../../features/servicenow/price-list/priceListSlice';
import {getall as getProductOfferings} from '../../../features/servicenow/product-offering/productOfferingSlice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Step } = Steps;

// const validationSchema = Yup.object().shape({
//   opportunity: Yup.object().shape({
//     short_description: Yup.string().required('Short description is required'),
//     estimated_closed_date: Yup.string()
//       .required('Estimated close date is required')
//       .test(
//         'is-future',
//         'Estimated close date must be in the future',
//         function(value) {
//           if (!value) return false;
//           const today = new Date();
//           today.setHours(0, 0, 0, 0);
//           const closeDate = new Date(value);
//           return closeDate > today;
//         }
//       ),
//     sales_cycle_type: Yup.string().required('Sales cycle type is required'),
//     stage: Yup.string().required('Stage is required'),
//     account: Yup.string(),
//     probability: Yup.number().min(0).max(100),
//   }),
//   createNewPriceList: Yup.boolean().required(),

//   selectedPriceList: Yup.string().when('createNewPriceList', {
//     is: (value) => value === false,
//     then: () => Yup.string().required('Please select a price list'),
//     otherwise: () => Yup.string().nullable(),
//   }),

//   priceList: Yup.object().when('createNewPriceList', {
//     is: (value) => value === true,
//     then: () => Yup.object().shape({
//       name: Yup.string().required('Name is required'),
//       currency: Yup.string().required('Currency is required'),
//       state: Yup.string(),
//       start_date: Yup.string().required('Start date is required'),
//       end_date: Yup.string()
//         .test(
//           'end-after-start',
//           'End date must be after start date',
//           function(value) {
//             const { start_date } = this.parent;
//             if (!start_date || !value) return true;
//             return new Date(value) > new Date(start_date);
//           }
//         ),
//     }),
//     otherwise: () => Yup.object().nullable(),
//   }),
//   productOfferings: Yup.array()
//     .min(1, 'At least one product offering is required')
//     .of(
//       Yup.object().shape({
//         name: Yup.string(),
//         price: Yup.object().shape({
//           value: Yup.number().min(0),
//           unit: Yup.string()
//             .test(
//               'currency-match',
//               'Currency must match Price List currency',
//               function(value) {
                
//                 const { createNewPriceList, priceList, selectedPriceList } = this.options.context;
//                 // If creating new price list, compare with priceList.currency
//                 // Otherwise, need to compare with selectedPriceList's currency (implementation depends on your data structure)
//                 // This is a simplified version - you'll need to adjust based on how you access the selected price list's currency
//                 if (createNewPriceList) {
//                   return value === priceList?.currency;
//                 }
//                 // You'll need to implement logic to compare with selected price list's currency
//                 return true; // placeholder
//               }
//             ),
//         }),
//         validFor: Yup.object().shape({
//           startDateTime: Yup.string()
//             .required('Start date is required')
//             .test(
//               'not-future',
//               'Start date cannot be in the future',
//               function(value) {
//                 if (!value) return false;
//                 const today = new Date();
//                 today.setHours(0, 0, 0, 0);
//                 const startDate = new Date(value);
//                 return startDate <= today;
//               }
//             )
//             .test(
//               'within-price-list',
//               'Start date must be within Price List dates',
//               function(value) {
//                 const { createNewPriceList, priceList, selectedPriceList } = this.options.context;
//                 if (!value) return false;
                
//                 const startDate = new Date(value);
//                 let priceListStart, priceListEnd;
                
//                 if (createNewPriceList) {
//                   priceListStart = priceList?.start_date ? new Date(priceList.start_date) : null;
//                   priceListEnd = priceList?.end_date ? new Date(priceList.end_date) : null;
//                 } else {
//                   // Need to get dates from selected price list
//                   // This depends on your data structure
//                   // Placeholder logic - implement based on your app
//                   return true;
//                 }
                
//                 if (priceListStart && startDate < priceListStart) return false;
//                 if (priceListEnd && startDate > priceListEnd) return false;
//                 return true;
//               }
//             ),
//           endDateTime: Yup.string()
//             .required('End date is required')
//             .test(
//               'after-start',
//               'End date must be after start date',
//               function(value) {
//                 const { startDateTime } = this.parent;
//                 if (!startDateTime || !value) return true;
//                 return new Date(value) > new Date(startDateTime);
//               }
//             )
//             .test(
//               'within-price-list',
//               'End date must be within Price List dates',
//               function(value) {
//                 const { createNewPriceList, priceList, selectedPriceList } = this.options.context;
//                 if (!value) return false;
                
//                 const endDate = new Date(value);
//                 let priceListStart, priceListEnd;
                
//                 if (createNewPriceList) {
//                   priceListStart = priceList?.start_date ? new Date(priceList.start_date) : null;
//                   priceListEnd = priceList?.end_date ? new Date(priceList.end_date) : null;
//                 } else {
//                   // Need to get dates from selected price list
//                   // This depends on your data structure
//                   // Placeholder logic - implement based on your app
//                   return true;
//                 }
                
//                 if (priceListStart && endDate < priceListStart) return false;
//                 if (priceListEnd && endDate > priceListEnd) return false;
//                 return true;
//               }
//             ),
//         }),
//         productOffering: Yup.object().shape({
//           id: Yup.string(),
//           // Add test to verify priceType matches if needed
//         }),
//         unitOfMeasure: Yup.object().shape({
//           id: Yup.string(),
//         }),
//         priceType: Yup.string()
//           .test(
//             'matches-product-offering',
//             'Price type must match product offering pricing type',
//             function(value) {
//               // This depends on your product offering data structure
//               // You'll need to compare with productOffering.priceType or similar
//               return true; // placeholder
//             }
//           ),
//       })
//     ),
//   opportunityLineItem: Yup.object().shape({
//     quantity: Yup.number().min(1),
//     term_month: Yup.number().min(1),
//   }),
//   account: Yup.object().shape({
//     name: Yup.string(),
//     email: Yup.string(),
//   }),
// });

function OpportunityForm({ open, setOpen, dispatch }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [createNewPriceList, setCreateNewPriceList] = useState(true);
  const [productOfferingsList, setProductOfferingsList] = useState([]);
  const FORM_STORAGE_KEY = 'opportunityFormData'
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
    dispatch(getPriceList({page: 1, limit: 1000}));
  }, [dispatch]);

  // Get initial values from localStorage or use defaults
  const getInitialValues = () => {
    const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
    return savedForm ? JSON.parse(savedForm) : {
      createNewPriceList: true,
      selectedPriceList: '',
      account: {
        name: "",
        email: ""
      },
      opportunity: {
        short_description: '',
        estimated_closed_date: formatDateForInput(new Date(new Date().getTime() + 86400000)),
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
        start_date: formatDateForInput(new Date("01-01-2010")),
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
              if (!value) return false;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const closeDate = new Date(value);
              return closeDate > today;
            }
          ),
        sales_cycle_type: Yup.string().required('Sales cycle type is required'),
        stage: Yup.string().required('Stage is required'),
        account: Yup.string(),
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
                      const selectedPL = priceLists.priceLists.find(pl => pl._id === selectedPriceList);
                      
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
                      const selectedPL = priceLists?.priceLists?.find(pl => pl._id === selectedPriceList);
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
                      const selectedPL = priceLists?.priceLists?.find(pl => pl._id === selectedPriceList);
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
      account: Yup.object().shape({
        name: Yup.string(),
        email: Yup.string(),
      }),
    });
  }, [priceLists, productOfferings]);

  const formik = useFormik({
    initialValues: getInitialValues(),
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        await dispatch(workflow(values));
        notification.success({
          message: 'Opportunity Created',
          description: 'New Opportunity has been created successfully',
        });
        
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
    if (formik.dirty) {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formik.values));
    }
  }, [formik.values, formik.dirty]);
  
  const handleCancel = () => {
    setOpen(false);
    //formik.resetForm();
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



  return (
    <Modal
      title="Create New Opportunity"
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
          <OpportunityStep1 formik={formik} />
        )}
        {currentStep === 1 && (
          <OpportunityStep2 formik={formik} priceLists={priceLists} />
        )}
        {currentStep === 2 && (
          <OpportunityStep3 
            formik={formik} 
            productOfferings={productOfferings} 
            unitOfMeasures={unitOfMeasures}
            priceLists={priceLists}
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
        />
      </form>
    </Modal>
  );
}

export default OpportunityForm;