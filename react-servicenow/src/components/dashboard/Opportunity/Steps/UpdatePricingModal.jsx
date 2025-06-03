import React, { useState, useEffect } from 'react';
import { Modal, Button, Divider, notification, Input, Select, Spin } from 'antd';
import FormInput from './shared/FormInput';
import FormSelect from './shared/FormSelect';
import { useSelector, useDispatch } from 'react-redux';
import { getByPriceList } from '../../../../features/servicenow/product-offering-price/productOfferingPriceSlice';

const { Option } = Select;


const UpdatePricingModal = ({
  visible,
  onCancel,
  opportunity,
  onSubmit,
  loading = false
}) => {
    try{
        
    const dispatch = useDispatch();
    const { productOfferingPrices } = useSelector((state) => state.productOfferingPrice);

    
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    currency: 'USD',
    start_date: '',
    end_date: '',
    account: ''
  });

  const [lineItems, setLineItems] = useState([]);

  // Create a Formik-like object for custom form components
  const formik = {
    values: formValues,
    touched: {},
    errors: {},
    handleChange: (e) => {
      const { name, value } = e.target;
      setFormValues(prev => ({ ...prev, [name]: value }));
    },
    handleBlur: () => {} // No-op for this implementation
  };

  useEffect(() => {
    dispatch(getByPriceList(opportunity?.price_list?._id))
    .then((result) => {
        const prods = result.payload;
        
        if (opportunity) {
            // Initialize form values from opportunity
            const initialValues = {
              name: opportunity.price_list?.name + " " + new Date().toLocaleDateString() || `${opportunity.account?.name || 'New'} Price List - ${new Date().toLocaleDateString()}`,
              description: opportunity.price_list?.description || `Updated pricing for ${opportunity.account?.name || ''} opportunity`,
              currency: opportunity.price_list?.currency || 'USD',
              start_date: opportunity.price_list?.start_date || new Date().toISOString().split('T')[0],
              end_date: opportunity.price_list?.end_date || '',
              account: opportunity.account?._id || ''
            };
            
            setFormValues(initialValues);
      
            // Initialize line items with their product offerings and prices
            if (opportunity.line_items && opportunity.line_items.length > 0) {
              const itemsWithPrices = opportunity.line_items.map(item => {
                  const pop = prods.filter(product => product.productOffering === item.productOffering._id)[0];
      
                return {
                  ...item,
                  currentRecurringPrice: pop?.price?.value || "N/A",
                  newPrice: pop?.price?.value || 0,
                  priceType: pop?.priceType || "N/A",
                  recurringChargePeriod: pop?.recurringChargePeriodType || 'monthly'
                };
              });
      
              setLineItems(itemsWithPrices);
            }
          }
    })
    .catch((error) => {
        console.error('Error loading price list:', error);
    });
    
  }, [dispatch, opportunity]);

  const handleSubmit = async () => {
    try {
      const newPrices = lineItems.map(item => {
        const isRecurring = item.priceType === 'recurring';
        return {
          name: `${item.productOffering.name} - Updated ${isRecurring ? 'Recurring' : 'One-time'} Price`,
          description: `Updated price for ${item.productOffering.name}`,
          price: {
            taxIncludedAmount: {
              unit: formValues.currency,
              value: item.newPrice
            }
          },
          priceType: item.priceType,
          recurringChargePeriod: isRecurring ? item.recurringChargePeriod : '',
          productOffering: {
            id: item.productOffering._id
          },
          unitOfMeasure: item.unit_of_measurement ? {
            id: item.unit_of_measurement.value
          } : null
        };
      });

      const payload = {
        opportunityId: opportunity._id,
        priceListData: {
          name: formValues.name,
          description: formValues.description,
          state: "published",
          currency: formValues.currency,
          start_date: formValues.start_date,
          end_date: formValues.end_date || "",
          account: formValues.account
        },
        newPrices: newPrices
      };

      

      await onSubmit(payload);
    } catch (error) {
      console.error('Validation failed:', error);
      notification.error({
        message: 'Validation Error',
        description: 'Please check all fields and try again.'
      });
    }
  };

  const updateLineItemPrice = (index, field, value) => {
    setLineItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const currencyOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' }
  ];

  const priceTypeOptions = (item) => {
    return (item.productOfferingPrice[0].price.taxIncludedAmount.value !=="0" && item.productOfferingPrice[0].priceType === "recurring") ? 'Recurring' : 'One-time' ;
}

  const recurringPeriodOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  return (
    <Modal
      title="Update Pricing"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleSubmit}
          loading={loading}
        >
          Update Pricing
        </Button>,
      ]}
      width={800}
    >
      <div className="space-y-4">
        <FormInput
          formik={formik}
          name="name"
          label="Price List Name"
          type="text"
        />
        <FormInput
          formik={formik}
          name="description"
          label="Description"
          type="text"
        />
        <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <Select
                value={formValues.currency}
                onChange={(value) => setFormValues(prev => ({ ...prev, currency: value }))}
                className="w-full border rounded px-3 py-2.5 border-gray-300"
            >
                {currencyOptions.map(option => (
                <Option key={option.value} value={option.value}>
                    {option.label}
                </Option>
                ))}
            </Select>
        </div>
        <FormInput
          formik={formik}
          name="start_date"
          label="Start Date"
          type="date"
        />
        <FormInput
          formik={formik}
          name="end_date"
          label="End Date (optional)"
          type="date"
        />
      </div>

      <Divider>Product Offerings</Divider>
      
      {lineItems.length > 0 ? (
        <div className="space-y-4">
          {lineItems.map((item, index) => (
            <div key={item._id || item.sys_id} className="p-4 border rounded border-gray-300">
              <h4 className="font-medium">{item.productOffering.name}</h4>
              <p className="text-sm text-gray-600">{item.productOffering.description}</p>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Price</label>
                  <p className="mt-1">
                    {item.currentRecurringPrice} {formValues.currency}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Price</label>
                  <Input
                    type="number"
                    value={item.newPrice}
                    onChange={(e) => updateLineItemPrice(index, 'newPrice', e.target.value)}
                    addonAfter={formValues.currency}
                  />
                </div>
              </div>

              
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price Type</label>
                  <p className="mt-1">
                    {priceTypeOptions(item.productOffering)}
                  </p>
                </div>
                {item.priceType === 'recurring' && 
                (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recurring Period</label>
                    <Select
                      value={item.recurringChargePeriod}
                      onChange={(value) => updateLineItemPrice(index, 'recurringChargePeriod', value)}
                      className="w-full border rounded px-3 py-2.5 border-gray-300"
                    >
                      {recurringPeriodOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No line items found for this opportunity.</p>
      )}
    </Modal>
  );
    }catch(error){
        console.log(error);
    }
};

export default UpdatePricingModal;