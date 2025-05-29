import { useState } from 'react';
import PriceListForm from '../../components/dashboard/PriceList/Form';
import PriceListTable from '../../components/dashboard/PriceList/Table';
import { useDispatch } from 'react-redux';
import PageLayout from '../../layout/dashbord/PageLayout';

function PriceList() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null); 
  const [searchQuery, setSearchQuery] = useState(null);
  const dispatch = useDispatch();

  return (
    
      <PageLayout
      title="Price List"
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      open={open}
      setOpen={setOpen}
      data={data}
      setData={setData}
      TableComponent={PriceListTable}
      FormComponent={PriceListForm}
      dispatch={dispatch}
    />
    
  );
}

export default PriceList;