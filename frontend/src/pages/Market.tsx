import React, { useState } from 'react';
import MarketDashboard from '../components/market/MarketDashboard';
import IpoAndCommodities from '../components/market/IpoAndCommodities';
import { 
  ChartBarIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

const Market: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ipo-commodities'>('dashboard');

  const tabs = [
    { 
      id: 'dashboard', 
      name: 'Market Dashboard', 
      icon: ChartBarIcon,
      description: 'Live market data, trending stocks, and news'
    },
    { 
      id: 'ipo-commodities', 
      name: 'IPO & Investments', 
      icon: BriefcaseIcon,
      description: 'IPO listings, commodities, and mutual funds'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Indian Stock Market
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Comprehensive Indian stock market data and investment opportunities
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">Live Data</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'dashboard' | 'ipo-commodities')}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon 
                    className={`w-5 h-5 mr-3 transition-colors duration-200 ${
                      activeTab === tab.id 
                        ? 'text-blue-500 dark:text-blue-400' 
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }`} 
                  />
                  <div className="text-left">
                    <div>{tab.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-normal">
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'dashboard' && <MarketDashboard />}
          {activeTab === 'ipo-commodities' && <IpoAndCommodities />}
        </div>
      </div>
    </div>
  );
};

export default Market;
