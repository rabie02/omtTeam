import React from 'react';
import FormInput from './shared/FormInput';
import FormSelect from './shared/FormSelect';
import {useSelector} from 'react-redux';

const OpportunityStep1 = ({ formik }) => {
  const { salesCycleTypes, stages, accounts } = useSelector((state) => state.opportunity);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Opportunity Details</h3>
      
      <FormInput
        formik={formik}
        name="opportunity.short_description"
        label="Short Description*"
      />
      
      <FormInput
        formik={formik}
        name="opportunity.estimated_closed_date"
        label="Estimated Close Date*"
        type="date"
      />
      
      <FormSelect
        formik={formik}
        name="opportunity.sales_cycle_type"
        label="Sales Cycle Type*"
        options={salesCycleTypes.map(type => ({
          value: type.sys_id,
          label: type.name
        }))}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      
        <FormSelect
        formik={formik}
        name="opportunity.stage"
        label="Stage*"
        options={stages.map(stage => ({
          value: stage.sys_id,
          label: stage.sys_name
        }))}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />

      <FormSelect
        formik={formik}
        name="opportunity.account"
        label="Account*"
        options={accounts.map(account => ({
          value: account.sys_id,
          label: account.name
        }))}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />

      <FormInput
        formik={formik}
        name="opportunity.probability"
        label="Probability"
        type="number"
      />
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