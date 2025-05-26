import { useState, useEffect } from 'react';
import PriceListForm from '../../components/dashboard/PriceList/Form';
import PriceListTable from '../../components/dashboard/PriceList/Table';
import { useDispatch, useSelector } from 'react-redux';
import PageLayout from '../../layout/dashbord/PageLayout';
import { getPriceList } from '../../features/servicenow/price-list/priceListSlice';

function PriceList() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null); 
  const [searchQuery, setSearchQuery] = useState(null);
  const dispatch = useDispatch();
  const { priceLists, loading, error } = useSelector((state) => state.priceList);
  
  useEffect(() => {
      dispatch(getPriceList());
  }, [dispatch]);


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