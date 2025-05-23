import React, { useState } from 'react';
import OpportunityForm from '../../components/dashboard/Opportunity/Form';
import OpportunityTable from '../../components/dashboard/Opportunity/Table';
import { useDispatch } from 'react-redux';
import PageLayout from '../../layout/dashbord/PageLayout';

function Opportunity() {
  const [openForm, setOpenForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState(null);
  const [data, setData] = useState(null);
  const dispatch = useDispatch();

  return (
    <PageLayout
      title="Opportunity"
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      open={openForm}
      setOpen={setOpenForm}
      data={data}
      setData={setData}
      TableComponent={OpportunityTable}
      FormComponent={OpportunityForm}
      dispatch={dispatch}
    />
  );
}

export default Opportunity;