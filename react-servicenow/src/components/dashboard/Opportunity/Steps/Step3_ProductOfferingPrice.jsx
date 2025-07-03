import React, {useEffect} from 'react';
import { Button, Space, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import  FormInput  from '../../../shared/FormInput';
import  FormSelect  from '../../../shared/FormSelect';
import {useSelector, shallowEqual } from 'react-redux';
import { formatDateForInput } from '@/utils/formatDateForInput.js';
import  FormSelectSearch  from '../../../shared/FormSelectSearch';

const OpportunityStep3 = ({ formik, lineItems, editMode=false, setOffSearchTerm }) => {
  
  const selectOpportunityData = (state) => ({
    unitOfMeasures: state.opportunity.unitOfMeasures,
    productOfferings: state.productOffering.data ?? [],
    priceLists: state.priceList.priceLists ?? [],
    productOfferingPrices: state.productOfferingPrice.productOfferingPrices ?? []
  });

  const { 
    unitOfMeasures, 
    productOfferings: allOfferings, 
    priceLists, 
    productOfferingPrices: pops 
  } = useSelector(selectOpportunityData, shallowEqual);


  let minDate = "";
  let maxDate = "";
  let editable = !editMode;
  
  if(formik.values.createNewPriceList){
    minDate = formik.values.priceList.start_date;
    maxDate = formik.values.priceList.end_date || "";
    editable = true;
  }else{
    const chosenPriceList = priceLists.filter(pl =>  pl._id === formik.values.selectedPriceList );
    minDate = chosenPriceList[0].start_date;
    maxDate = chosenPriceList[0].end_date || "";
  }

  

  useEffect(() => {
    if (editMode && pops?.length && lineItems?.length) {
      // Create the new product offerings array
      const newProductOfferings = lineItems.map((item) => {
        const pop = pops.find(prod => prod.productOffering === item.productOffering._id);
        if (!pop) return null;
        
        return {
          name: pop.name,
          price: pop.price,
          productOffering: { id: item.productOffering._id },
          unitOfMeasure: { id: item.unit_of_measurement.value },
          priceType: pop.priceType,
          recurringChargePeriodType: pop.recurringChargePeriodType,
          validFor: {
            startDateTime: formatDateForInput(pop.validFor.startDateTime),
            endDateTime: formatDateForInput(pop.validFor.endDateTime)
          },
          term_month: item.term_month,
          quantity: item.quantity
        };
      }).filter(Boolean); // Remove any null entries
  
      // Only update if the values are different
      if (JSON.stringify(newProductOfferings) !== JSON.stringify(formik.values.productOfferings)) {
        formik.setFieldValue('productOfferings', newProductOfferings);
      }
    }
  }, [editMode, pops, lineItems]); // Only run when these dependencies change


  const addProductOffering = () => {

    setOffSearchTerm('')
    
    formik.setFieldValue('productOfferings', [
      ...formik.values.productOfferings,
      {
        name: '',
        price: { unit: 'USD', value: '' },
        productOffering: { id: '' },
        unitOfMeasure: { id: '' },
        priceType: 'recurring',
        recurringChargePeriodType: '',
        validFor: {
          startDateTime: formatDateForInput(new Date(new Date().getTime() - 86400000)),
          endDateTime: formatDateForInput(new Date(new Date().getTime() + 86400000*29))
        },
        term_month: '12',
        quantity: '1',
        new: editMode
      }
    ]);
  };
  

  const removeProductOffering = (index) => {
    const newOfferings = [...formik.values.productOfferings];
    newOfferings.splice(index, 1);
    formik.setFieldValue('productOfferings', newOfferings);
  };

  const filterOffering = (id)=>{
    if(id === "" || id === undefined) return allOfferings[0];
    return allOfferings.find(p => p._id === id);
  }

  // Get all currently selected product offering IDs except the current one
  const getSelectedProductOfferings = (currentIndex) => {
    return formik.values.productOfferings
      .filter((_, index) => index !== currentIndex)
      .map(item => item.productOffering.id);
  };

  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-medium">Opportunity Line Items</h3>
      
      {formik.errors.productOfferings && typeof formik.errors.productOfferings === 'string' && (
        <p className="text-red-500 text-sm mb-4">{formik.errors.productOfferings}</p>
      )}

      {formik.values.productOfferings.map((offering, index) => (
        <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-800">Item #{index + 1}</h4>
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
              disabled={!editable && !offering.new}
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
                  //className="w-full rounded py-2 px-2"
                  //noLabel
                  disabled={!editable && !offering.new}
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
                  //noLabel
                  disabled={!editable && !offering.new}
                />
              </Space.Compact>
              
            </div>

            <FormSelectSearch
              label="Product Offering*"
              formik={formik}
              name={`productOfferings[${index}].productOffering.id`}
              value={offering.productOffering.id}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              onSearch = {(value)=>{setOffSearchTerm(value)}}
              filterOption = {false}
              options={allOfferings
                .filter(po => po.status.toLowerCase() === "published" && !getSelectedProductOfferings(index).includes(po._id))
                .map(po => ({
                  value: po._id,
                  label: po.name,
                }))}
              disabled={!editable && !offering.new}
              
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
              disabled={!editable && !offering.new}
            />

            <FormSelect
            formik={formik}
              label="Price Type*"
              name={`productOfferings[${index}].priceType`}
              value={offering.priceType}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              options={filterOffering(offering.productOffering.id) !== undefined ? (filterOffering(offering.productOffering.id).productOfferingPrice[0].price.taxIncludedAmount.value !=="0" && filterOffering(offering.productOffering.id).productOfferingPrice[0].priceType === "recurring"? [{ value: 'recurring', label: 'Recurring' }] : [{ value: 'one_time', label: 'One-time' }]): [{ value: 'recurring', label: 'Recurring' }]}
              //options={[{ value: 'recurring', label: 'Recurring' }, { value: 'one_time', label: 'One-time' }]}
              disabled={!editable && !offering.new}
            />
            

            {offering.priceType === 'recurring' ? (
              <div className="grid grid-cols-1 gap-2">
                {/* <FormSelect
                formik={formik}
                label="Recurring Period*"
                name={`productOfferings[${index}].recurringChargePeriodType`}
                value={offering.recurringChargePeriodType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                options={[
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'annually', label: 'Annually' }
                ]}
                disabled={!editable && !offering.new}
              /> */}
              <FormInput
                formik={formik}
                  name={`productOfferings[${index}].term_month`}
                  type="number"
                  label="Term in months"
                  min="1"
                  step="1"
                  value={offering.term_month}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  //className="w-full rounded py-2 px-2"
                  //noLabel
                  disabled={!editable && !offering.new}
              />
              </div>
            ):(
              <FormInput
                formik={formik}
                  name={`productOfferings[${index}].quantity`}
                  type="number"
                  label="Quantity"
                  min="1"
                  step="1"
                  default="1"
                  value={offering.quantity}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  //className="w-full rounded py-2 px-2"
                  //noLabel
                  disabled={!editable && !offering.new}
              />
            )}

            <FormInput
            formik={formik}
              label="Valid From*"
              name={`productOfferings[${index}].validFor.startDateTime`}
              type="date"
              value={offering.validFor.startDateTime}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              min={new Date(new Date(minDate).getTime() + 86400000).toISOString().split('T')[0]}
              max={maxDate != "" ? new Date(new Date(maxDate).getTime() - 86400000*2).toISOString().split('T')[0] : ""}
              //description="must be within the price list start/end date"
              disabled={!editable && !offering.new}
            />

            <FormInput
            formik={formik}
              label="Valid Until"
              name={`productOfferings[${index}].validFor.endDateTime`}
              type="date"
              value={offering.validFor.endDateTime}
              onChange={formik.handleChange}
              min={new Date(new Date(offering.validFor.startDateTime).getTime() + 86400000).toISOString().split('T')[0]}
              max={maxDate != "" ? new Date(new Date(maxDate).getTime() - 86400000).toISOString().split('T')[0] : ""}
              disabled={!offering.validFor.startDateTime || (!editable && !offering.new)}
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
        Add Opportunity Line Item
      </Button>
    </div>
  );
};

export default OpportunityStep3;