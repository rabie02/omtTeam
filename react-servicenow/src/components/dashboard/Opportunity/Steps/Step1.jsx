import React from 'react';
import FormInput from './shared/FormInput';
import FormSelect from './shared/FormSelect';
import {useSelector} from 'react-redux';
import { useRef, useEffect } from 'react';
const OpportunityStep1 = ({ formik }) => {
  const { salesCycleTypes, stages, accounts } = useSelector((state) => state.opportunity);
   // Focus the input when the component mounts
   const shortDescriptionRef = useRef(null);
  useEffect(() => {
    if (shortDescriptionRef.current) {
      shortDescriptionRef.current.focus();
    }
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Opportunity Details</h3>
      
      <FormInput
        formik={formik}
        name="opportunity.short_description"
        label="Short Description*"
        inputRef={shortDescriptionRef}
        autoFocus
      />
      <div className="grid grid-cols-2 gap-4">
      <FormInput
        formik={formik}
        name="opportunity.estimated_closed_date"
        label="Estimated Close Date*"
        type="date"
      />

      <FormInput
        formik={formik}
        name="opportunity.probability"
        label="Probability"
        type="number"
      />
      </div>
      <div className="grid grid-cols-2 gap-4">
      <FormSelect
        formik={formik}
        name="opportunity.sales_cycle_type"
        label="Sales Cycle Type*"
        options={salesCycleTypes.map(type => ({
          value: type._id,
          label: type.sys_name
        }))}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      
        <FormSelect
        formik={formik}
        name="opportunity.stage"
        label="Stage*"
        options={stages.map(stage => ({
          value: stage._id,
          label: stage.sys_name
        }))}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      </div>
      {salesCycleTypes.filter(s=> s.sys_id === formik.values.opportunity.sales_cycle_type)?.[0]?.["sys_name"] === "NEWCUST" && 
      <div className="grid grid-cols-2 gap-4">
         <FormInput
          formik={formik}
          name="account.name"
          label="Account Name*"
        />
        <FormInput
          formik={formik}
          name="account.email"
          label="Account Email*"
          type="email"
        />
      </div>}
      
      {salesCycleTypes.filter(s=> s.sys_id === formik.values.opportunity.sales_cycle_type)?.[0]?.["sys_name"] !== "NEWCUST" &&
      <FormSelect
        formik={formik}
        name="opportunity.account"
        label="Account*"
        options={accounts.map(account => ({
          value: account._id,
          label: account.name
        }))}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      }

      
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
  );
};

export default OpportunityStep1;