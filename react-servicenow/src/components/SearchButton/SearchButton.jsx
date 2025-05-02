import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { IoCloseCircle } from 'react-icons/io5';

const SearchButton = ({ placeholder, onSearch }) => {
  const [searchText, setSearchText] = useState('');

  const handleInputChange = (e) => setSearchText(e.target.value);
  const handleSearch = () => onSearch && onSearch(searchText);
  const clearSearch = () => setSearchText('');

  return (
    <div className="relative flex items-center bg-white border border-gray-200 rounded-full shadow-sm focus-within:ring-2 focus-within:ring-cyan-500 transition-all duration-200 w-full max-w-xs">
      <input
        type="text"
        className="w-full pl-4 pr-10 py-2 text-sm text-gray-700 rounded-full outline-none bg-transparent placeholder:text-gray-400 focus:placeholder:text-gray-300 transition"
        placeholder={placeholder || 'Search...'}
        value={searchText}
        onChange={handleInputChange}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      />
      {searchText && (
        <IoCloseCircle
          onClick={clearSearch}
          className="absolute right-10 text-gray-400 hover:text-red-500 text-lg cursor-pointer transition"
        />
      )}
      <button
        onClick={handleSearch}
        className="absolute right-2 bg-cyan-600 hover:bg-cyan-700 text-white p-2 rounded-full transition-all duration-200"
      >
        <FaSearch className="text-sm" />
      </button>
    </div>
  );
};

export default SearchButton;
