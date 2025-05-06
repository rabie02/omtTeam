import React, { useState, useEffect } from 'react';
import Table from '../../components/dashbord/spec/table'; // Import du composant existant

const ProductSpec = () => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);

  return (
    <>

      <div className='h-svh'>
        <div className='h-36 bg-cyan-700/40 flex items-end py-3 px-20'>
          <div className='flex w-full justify-between'>

            <div className="relative w-48 transition-all focus-within:w-64 ">
              <input
                type="text"
                placeholder="Search..."
                id="searchInput"
                className="w-full py-2 pl-10 pr-4 text-gray-700 bg-white border outline-none transition-all border-gray-300"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            

          </div>
        </div>

        <div className='flex justify-center items-center py-5'>
          <Table setData={setData} setOpen={setOpen} ></Table>
        </div>

        {/* <Form open={open} setOpen={setOpen} initialData={data} ></Form> */}


      </div>
    </>
  );
};

export default ProductSpec;
