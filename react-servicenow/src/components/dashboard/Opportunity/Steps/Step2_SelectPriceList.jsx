
import  FormInput  from './shared/FormInput';
import  FormSelect  from './shared/FormSelect';
import  FormRadioGroup  from './shared/FormRadioGroup';
import {useSelector} from 'react-redux';


const OpportunityStep2 = ({ formik }) => {
  const { priceLists } = useSelector((state) => state.priceList);

  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-medium">Price List Selection</h3>
      
      <FormRadioGroup
        formik={formik}
        name="createNewPriceList"
        options={[
          { value: true, label: 'Create New Price List' },
          { value: false, label: 'Use Existing Price List' }
        ]}
      />
      
      {formik.values.createNewPriceList ? (
        <>
        <div class="grid grid-cols-4 gap-4">
          <span className="col-span-3">
            <FormInput
            formik={formik}
            name="priceList.name"
            label="Name*"
          />
          </span>

          <span className=''>
            <FormSelect
                formik={formik}
                name="priceList.currency"
                label="Currency*"
                options={["EUR","USD","GBP"].map(currency => ({
                value: currency,
                label: currency
                }))}
                onChange={formik.handleChange}
        onBlur={formik.handleBlur}
            />
          </span>
        </div>    

            {/* <FormSelect
                formik={formik}
                name="priceList.state"
                label="State*"
                options={["published"].map(state => ({
                value: state,
                label: state
                }))}
                onChange={formik.handleChange}
        onBlur={formik.handleBlur}
            /> */}
          <div class="grid grid-cols-2 gap-4">
            <FormInput
            formik={formik}
            name="priceList.start_date"
            label="Start Date*"
            type="date"
          />
          <FormInput
            formik={formik}
            name="priceList.end_date"
            label="End Date"
            type="date"
            min={new Date(new Date(formik.values.priceList.start_date).getTime() + 86400000).toISOString().split('T')[0]}
            disabled={!formik.values.priceList.start_date} 
          />
          </div>
          {/* Description */}
            <div>
              <label className="block font-medium mb-1">Description</label>
              <textarea
                name="priceList.description"
                
                onChange={formik.handleChange}
                rows="3"
                className="w-full border rounded px-3 py-2"
              />
            </div>
        </>
      ) : (
        <FormSelect
          formik={formik}
          name="selectedPriceList"
          label="Select Price List*"
          options={priceLists
            .map(pl => ({
              value: pl._id,
              label: `${pl.name} (${pl.currency})`
            }))}
            onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        />
      )}
    </div>
  );
};

export default OpportunityStep2;