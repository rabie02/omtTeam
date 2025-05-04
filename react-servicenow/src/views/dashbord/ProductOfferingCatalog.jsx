import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Table from '../../components/dashbord/ProductOfferingCatalog/Table';
import Form from '../../components/dashbord/ProductOfferingCatalog/Form';


function ProductOfferingCatalog() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [searchQuery, setSearchQuery] = useState(null);
  const dispatch = useDispatch();

  return (
    <>
      <div className='h-svh'>
        <div className='h-36 bg-cyan-700/40 flex items-end py-3 px-20'>
          <div className='flex w-full justify-between'>

            <div className="relative w-48 transition-all focus-within:w-60">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="searchInput"
                className="w-full py-2 pl-10 pr-4 text-gray-700 bg-white border outline-none transition-all border-gray-300"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <button
              className="overflow-hidden relative w-36 h-10 cursor-pointer flex items-center border border-cyan-700 bg-cyan-700 group hover:bg-cyan-700 active:bg-cyan-700 active:border-cyan-700"
              onClick={() => { setOpen(true); setData(null) }}
            >
              <span
                className="text-gray-200 font-semibold ml-12 transform group-hover:translate-x-20 transition-all duration-300"
              >Add </span>

              <span
                className="absolute right-0 h-full w-10 rounded-lg bg-cyan-700 flex items-center justify-center transform group-hover:translate-x-0 group-hover:w-full transition-all duration-300"
              >
                <i className="ri-add-line text-xl text-white font-semibold"></i>
              </span>
            </button>

          </div>
        </div>

        <div className='flex justify-center items-center py-5'>
          <Table setData={setData} setOpen={setOpen} dispatch={dispatch} searchQuery={searchQuery} ></Table>
        </div>

        <Form open={open} setOpen={setOpen} initialData={data} dispatch={dispatch} ></Form>


      </div>
    </>
  );
}

export default ProductOfferingCatalog;