// src/components/common/PageHeader.jsx
import React from 'react';
import { Input, Button } from 'antd';

const { Search } = Input;

const PageHeader = ({ 
  title, 
  searchPlaceholder, 
  createButtonText,
  onSearchChange,
  onSearch,
  onCreate,
  children
}) => (
  <div className="flex flex-col md:flex-row px-6 py-4 bg-gray-200 justify-between items-start md:items-center gap-4">
    <div>
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
    </div>

    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
      <Search
        placeholder={searchPlaceholder}
        prefix={<i className="ri-search-line text-gray-400"></i>}
        allowClear
        enterButton={<Button type="primary">Search</Button>}
        size="large"
        className="w-full md:w-80"
        onChange={onSearchChange}
        onSearch={onSearch}
      />

    {createButtonText &&  <Button
        type="primary"
        icon={<i className="ri-add-line"></i>}
        size="large"
        onClick={onCreate}
        className="flex items-center"
      >
        {createButtonText}
      </Button>}
      
      {children}
    </div>
  </div>
);

export default PageHeader;