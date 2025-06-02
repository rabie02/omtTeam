import React, {useRef} from 'react';
import { Descriptions, Card, Tag } from 'antd';
import { format } from 'date-fns';
import {useSelector} from 'react-redux';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const OpportunityStep4 = ({ initialData }) => {
  try{
  const tempID = initialData.price_list !== (null || undefined) && initialData.price_list._id ;
  const { 
    opportunity, 
    priceList, 
    selectedPriceList, 
    createNewPriceList, 
    productOfferings,
    opportunityLineItem
  } = {
    opportunity: initialData,
    priceList: initialData.price_list,
    selectedPriceList: tempID, 
    createNewPriceList:false,
    productOfferings: initialData.line_items.map(item => ({...item.productOffering, unit_of_measurement: item.unit_of_measurement})),
    opportunityLineItem: initialData.line_items
  };


  const { unitOfMeasures, accounts, productOfferingPrices } = useSelector(
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
     const account = accounts.find(u => u.sys_id === id);
    return account ? account.name : 'Not found';
  }

  const pops = productOfferingPrices.filter(p=> p.priceList === opportunity.price_list._id);
  
  const pdfRef = useRef();
    
  const downloadPDF = () => {
    const input = pdfRef.current;
    
    if (!input) {
      console.error("PDF ref element not found");
      return;
    }
    
    html2canvas(input, {
      scale: 2,
      windowHeight: input.scrollHeight
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;
      const pageHeight = 277;
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('opportunity_details.pdf');
    });
  };

  //console.log(JSON.stringify(formik.values,null, 2  ));
  //console.log(productOfferings[0].name)
  return (
    <>
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
            {opportunity.account.name}
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
            {opportunity.price_list.name || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Currency">
            {opportunity.price_list.currency || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={opportunity.price_list.state === 'published' ? 'green' : 'blue'}>
              {opportunity.price_list.state || 'N/A'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Start Date">
            {opportunity.price_list.start_date ? 
              format(new Date(opportunity.price_list.start_date), 'MMM dd, yyyy') : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="End Date">
            {opportunity.price_list.end_date ? 
              format(new Date(opportunity.price_list.end_date), 'MMM dd, yyyy') : 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Line Item Details" variant>
        <Descriptions column={1}>
          <Descriptions.Item label="Quantity">
            {opportunityLineItem[0].quantity}
          </Descriptions.Item>
          <Descriptions.Item label="Term (Months)">
            {opportunityLineItem[0].term_month}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Product Offerings" variant>
        {pops.map((offering, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <Descriptions 
              title={`Price #${index + 1}`} 
              column={1} 
              bordered
              className="mb-4"
            >
              <Descriptions.Item label="Product Offering">
                {offering.productOffering.name}
              </Descriptions.Item>
              <Descriptions.Item label="Price">
                {offering.price.value} {offering.price.unit}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Type">
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

    </div>
    <div className="grid grid-cols-3 gap-5 mt-5">
      <div></div>
      <button
            type="button"
            className="px-4 py-2 rounded border bg-red-200 hover:bg-gray-300"
            onClick={downloadPDF}
          >
            Download as PDF
        </button>
        <div></div>
    </div>
    </>
  )}catch(error){
    console.log(error)
  }
};

export default OpportunityStep4;