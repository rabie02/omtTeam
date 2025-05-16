import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Modal, Steps, message } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import {
  OpportunityStep1,
  OpportunityStep2,
  OpportunityStep3,
  OpportunityStep4,
  OpportunityNavigation
} from './components';

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
    is: false,
    then: Yup.string().required('Please select a price list'),
  }),
  priceList: Yup.object().when('createNewPriceList', {
    is: true,
    then: Yup.object().shape({
      name: Yup.string().required('Name is required'),
      currency: Yup.string().required('Currency is required'),
      state: Yup.string().required('State is required'),
      start_date: Yup.string().required('Start date is required'),
    }),
  }),
  productOfferings: Yup.array().min(1, 'At least one product offering is required').of(
    Yup.object().shape({
      name: Yup.string().required('Name is required'),
      price: Yup.object().shape({
        value: Yup.number().required('Price value is required').min(0),
        unit: Yup.string().required('Currency is required'),
      }),
      productOffering: Yup.object().shape({
        id: Yup.string().required('Product offering is required'),
      }),
      unitOfMeasure: Yup.object().shape({
        id: Yup.string().required('Unit of measure is required'),
      }),
      priceType: Yup.string(),
    })
  ),
  opportunityLineItem: Yup.object().shape({
    quantity: Yup.number().required('Quantity is required').min(1),
    term_month: Yup.number().required('Term is required').min(1),
  }),
});

const OpportunityForm = ({ open, setOpen, dispatch }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { loading } = useSelector((state) => state.opportunity);

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
        console.log(formik);
        // Step 1: Create opportunity
        const opportunityResponse = await dispatch(createOpportunity(values.opportunity)).unwrap();
        
        // Step 2: Use existing or create new price list
        let priceListId;
        if (values.createNewPriceList) {
          const priceListResponse = await dispatch(createPriceList({
            ...values.priceList,
            account: values.opportunity.account
          })).unwrap();
          priceListId = priceListResponse.sys_id;
        } else {
          priceListId = values.selectedPriceList;
        }

        // Step 3: Create product offering prices
        const productOfferingPrices = await Promise.all(
          values.productOfferings.map(async (productOffering) => {
            const response = await dispatch(createProductOfferingPrice({
              ...productOffering,
              priceList: { id: priceListId }
            })).unwrap();
            return response.id;
          })
        );

        // Step 4: Create opportunity line items
        await Promise.all(
          values.productOfferings.map((productOffering, index) => (
            dispatch(createOpportunityLineItem({
              price_list: priceListId,
              product_offering: productOffering.productOffering.id,
              opportunity: opportunityResponse.sys_id,
              unit_of_measurement: productOffering.unitOfMeasure.id,
              quantity: values.opportunityLineItem.quantity,
              term_month: values.opportunityLineItem.term_month
            }))
          ))
        );

        message.success('Opportunity created successfully!');
        setOpen(false);
        resetForm();
      } catch (error) {
        console.error('Submission error:', error);
        message.error('Failed to create opportunity. Please try again.');
      }
    },
  });

  const nextStep = () => {
    // ... validation and step navigation ...
  };

  const prevStep = () => setCurrentStep(currentStep - 1);
  const handleCancel = () => {
    setOpen(false);
    formik.resetForm();
    setCurrentStep(0);
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
        />
      </form>
    </Modal>
  );
};

export default OpportunityForm;