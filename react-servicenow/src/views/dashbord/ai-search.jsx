import React, { useEffect, useState } from 'react';
import { Card, Input, Button, Spin, message } from 'antd';
import { SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { searchAI, setSearchTerm as setAiSearchTerm, clearResults } from '../../features/servicenow/ai-search/aiSearchSlice';


function AiSearch() {
    const dispatch = useDispatch();
    // AI Search from Redux
    const {
        results: aiResults,
        loading: isAiSearching,
        error: aiSearchError,
        searchTerm: aiSearchTerm
    } = useSelector((state) => state.aiSearch);

    const [searchTerm, setSearchTerm] = useState('');

    const handleAiSearch = () => {
        if (!aiSearchTerm.trim()) {
            message.warning('Please enter a search term');
            return;
        }
        dispatch(searchAI(aiSearchTerm));
    };

    const handleAiSearchTermChange = (e) => {
        dispatch(setAiSearchTerm(e.target.value));
    };

    const handleClearAiResults = () => {
        dispatch(clearResults());
    };

    return (
        <>
            <div className='h-svh'>
                <div className='h-36 bg-cyan-700/40 flex items-end py-3 px-20'>
                    <div className='flex w-full justify-center'>

                        <Input
                            placeholder="Describe your ideal product..."
                            size="large"
                            value={aiSearchTerm}
                            onChange={handleAiSearchTermChange}
                            className='mr-5'
                        />
                        <Button
                            type="primary"
                            size="large"
                            loading={isAiSearching}
                            onClick={handleAiSearch}
                            icon={<SearchOutlined />}
                            className="bg-green-500 hover:bg-green-600"
                        >
                            Question
                        </Button>
                        {aiResults.length > 0 && (
                            <Button
                                size="large"
                                onClick={handleClearAiResults}
                                danger
                            >
                                Clear
                            </Button>
                        )}




                    </div>


                </div>
                <div className="bg-gray-50 border border-gray-200  p-6 mb-8">
                    {/* AI Results */}
                    {  aiResults.length == 0 && (
                        <div class="max-w-2xl mx-auto p-6 bg-white mt-10">
                            <h2 class="text-2xl font-bold text-gray-800 mb-4">Need Help? We're Here for You!</h2>
                            <p class="text-gray-600 mb-6">
                                Have a question or need assistance? Our team is here to help! Whether you're having trouble navigating the site, need more information, or just want to ask something — feel free to reach out.
                            </p>

                           
                        </div>

                    )}
                    {aiResults.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-4 text-gray-800">Search Results</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {aiResults.map((result, index) => (
                                    <Card
                                        key={index}
                                        hoverable
                                        className="h-full"
                                    >
                                        <h4 className="text-blue-500 font-medium mb-2">{result.title || 'Product'}</h4>
                                        <p className="text-gray-600 mb-4 text-sm">{result.description || 'No description available'}</p>
                                        <a href={result.url} className="p-0">
                                            Learn more <ArrowRightOutlined />
                                        </a>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {isAiSearching && (
                        <div className="flex justify-center py-6">
                            <Spin tip="Searching..." />
                        </div>
                    )}

                   
                </div>





            </div>
        </>
    );
}


export default AiSearch;