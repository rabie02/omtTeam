import React from 'react';
import { Descriptions, Card, Tag } from 'antd';
import { format } from 'date-fns';
import {useSelector} from 'react-redux';

const OpportunityStep4 = ({ formik, pdfRef }) => {
  const { 
    opportunity, 
    priceList, 
    selectedPriceList, 
    createNewPriceList, 
    productOfferings,
    opportunityLineItem,
    account
  } = formik.values;


  const { unitOfMeasures, accounts } = useSelector(
    (state) =>   state.opportunity
  );
  const { priceLists } = useSelector((state) => state.priceList);
  const { data: allOfferings } = useSelector((state) => state.productOffering);
  const getSelectedPriceList = () => {
    if (createNewPriceList) return priceList;
    return priceLists.find(pl => pl._id === selectedPriceList);
  };

  const getOfferingName = (id) => {
    const offering = allOfferings.find(o => o._id === id);
    return offering ? offering.name : 'Not found';
  };

  const getUomName = (id) => {
    const uom = unitOfMeasures.find(u => u.sys_id === id);
    return uom ? uom.name : 'Not found';
  };

  const currentPriceList = getSelectedPriceList();

  const getAccountName = (id) => {
     const account = accounts.find(u => u._id === id);
    return account ? account.name : false;
  }

  console.log(JSON.stringify(formik.values,null, 2  ));
  
  return (
    <div className="space-y-6" ref={pdfRef}>
      <h3 className="text-lg font-medium">Opportunity Summary</h3>
      
      <Card title="Opportunity Details" variant>
        <Descriptions column={1}>
          <Descriptions.Item label="Short Description">
            {opportunity.short_description}
          </Descriptions.Item>
          <Descriptions.Item label="Estimated Close Date">
            {format(new Date(opportunity.estimated_closed_date), 'MMM dd, yyyy')}
          </Descriptions.Item>
          <Descriptions.Item label="Account">
            {getAccountName(opportunity.account) || account.name}
          </Descriptions.Item>
          <Descriptions.Item label="Probability">
            {opportunity.probability}%
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            {opportunity.description || 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Price List" variant>
        <Descriptions column={1}>
          <Descriptions.Item label="Name">
            {currentPriceList?.name || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Currency">
            {currentPriceList?.currency || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={currentPriceList?.state === 'published' ? 'green' : 'blue'}>
              {currentPriceList?.state || 'N/A'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Start Date">
            {currentPriceList?.start_date ? 
              format(new Date(currentPriceList.start_date), 'MMM dd, yyyy') : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="End Date">
            {currentPriceList?.end_date ? 
              format(new Date(currentPriceList.end_date), 'MMM dd, yyyy') : 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Product Offerings" variant>
        {productOfferings.map((offering, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <Descriptions 
              title={`Offering #${index + 1}`} 
              column={1} 
              bordered
              className="mb-4"
            >
              <Descriptions.Item label="Product">
                {getOfferingName(offering.productOffering.id)}
              </Descriptions.Item>
              <Descriptions.Item label="Price">
                {offering.price.value} {offering.price.unit}
              </Descriptions.Item>
              <Descriptions.Item label="Unit of Measure">
                {getUomName(offering.unitOfMeasure.id)}
              </Descriptions.Item>
              <Descriptions.Item label="Price Type">
                <Tag color={offering.priceType === 'recurring' ? 'blue' : 'purple'}>
                  {offering.priceType}
                </Tag>
              </Descriptions.Item>
              {offering.priceType === 'recurring' && (
                <Descriptions.Item label="Recurring Period">
                  {offering.recurringChargePeriodType}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Valid From">
                {format(new Date(offering.validFor.startDateTime), 'MMM dd, yyyy HH:mm')}
              </Descriptions.Item>
              {offering.validFor.endDateTime!="" && (
                <Descriptions.Item label="Valid Until">
                  {format(new Date(offering.validFor.endDateTime), 'MMM dd, yyyy HH:mm')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        ))}
      </Card>

      <Card title="Line Item Details" variant>
        <Descriptions column={1}>
          <Descriptions.Item label="Quantity">
            {opportunityLineItem.quantity}
          </Descriptions.Item>
          <Descriptions.Item label="Term (Months)">
            {opportunityLineItem.term_month}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default OpportunityStep4;