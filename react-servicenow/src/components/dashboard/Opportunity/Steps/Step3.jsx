import React from 'react';
import { Button, Space, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import  FormInput  from './shared/FormInput';
import  FormSelect  from './shared/FormSelect';
import {useSelector} from 'react-redux';
import { formatDateForInput } from '@/utils/formatDateForInput.js';

const OpportunityStep3 = ({ formik }) => {
  const { productOfferings: allOfferings, unitOfMeasures } = useSelector((state) => state.opportunity);

  const addProductOffering = () => {
    console.log("we here")
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

  const removeProductOffering = (index) => {
    const newOfferings = [...formik.values.productOfferings];
    newOfferings.splice(index, 1);
    formik.setFieldValue('productOfferings', newOfferings);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Product Offerings</h3>
      
      {formik.errors.productOfferings && typeof formik.errors.productOfferings === 'string' && (
        <p className="text-red-500 text-sm mb-4">{formik.errors.productOfferings}</p>
      )}

      {formik.values.productOfferings.map((offering, index) => (
        <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-800">Product Offering #{index + 1}</h4>
            {formik.values.productOfferings.length > 1 && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeProductOffering(index)}
                size="small"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
            formik={formik}
              label="Name*"
              name={`productOfferings[${index}].name`}
              value={offering.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              
            />

            <div>
              <label className="block font-medium">Price*</label>
              <Space.Compact className="w-full p-0">
                <FormInput
                formik={formik}
                  name={`productOfferings[${index}].price.value`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={offering.price.value}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full rounded py-2 px-2 border-1"
                  noLabel
                />
                <FormSelect
                  name={`productOfferings[${index}].price.unit`}
                  formik={formik}
                  value={offering.price.unit}
                    onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  options={[
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'GBP', label: 'GBP' }
                  ]}
                  className="ml-7 mt-1"
                  noLabel
                />
              </Space.Compact>
              {formik.touched.productOfferings?.[index]?.price?.value && 
               formik.errors.productOfferings?.[index]?.price?.value && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.productOfferings[index].price.value}
                </p>
              )}
            </div>

            <FormSelect
              label="Product Offering*"
              formik={formik}
              name={`productOfferings[${index}].productOffering.id`}
              value={offering.productOffering.id}
              onChange={formik.handleChange}
        onBlur={formik.handleBlur}
              options={allOfferings
                .filter(po => po.status === "published")
                .map(po => ({
                  value: po.id,
                  label: po.name
                }))}
              
            />

            <FormSelect
            formik={formik}
              label="Unit of Measure*"
              name={`productOfferings[${index}].unitOfMeasure.id`}
              value={offering.unitOfMeasure.id}
              onChange={formik.handleChange}
        onBlur={formik.handleBlur}
              options={unitOfMeasures.map(uom => ({
                value: uom.sys_id,
                label: uom.name
              }))}
              
            />

            <FormSelect
            formik={formik}
              label="Price Type*"
              name={`productOfferings[${index}].priceType`}
              value={offering.priceType}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              options={[
                { value: 'recurring', label: 'Recurring' },
                { value: 'one-time', label: 'One-time' }
              ]}
             
            />

            {offering.priceType === 'recurring' && (
              <FormSelect
              formik={formik}
                label="Recurring Period*"
                name={`productOfferings[${index}].recurringChargePeriodType`}
                value={offering.recurringChargePeriodType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                options={[
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                  { value: 'annually', label: 'Annually' }
                ]}
              />
            )}

            <FormInput
            formik={formik}
              label="Valid From*"
              name={`productOfferings[${index}].validFor.startDateTime`}
              type="datetime-local"
              value={offering.validFor.startDateTime}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />

            <FormInput
            formik={formik}
              label="Valid Until"
              name={`productOfferings[${index}].validFor.endDateTime`}
              type="datetime-local"
              value={offering.validFor.endDateTime}
              onChange={formik.handleChange}
            />
          </div>
          <Divider className="my-4" />
        </div>
      ))}

      <Button
        type="dashed"
        onClick={addProductOffering}
        icon={<PlusOutlined />}
        className="w-full"
      >
        Add Product Offering
      </Button>
    </div>
  );
};

export default OpportunityStep3;