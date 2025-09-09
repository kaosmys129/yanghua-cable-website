'use client';

import React, { useState } from 'react';
import { Check, Zap, Settings, X } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function ProductComparison() {
  const t = useTranslations('flexibleBusbarComparison');
  const [activeTab, setActiveTab] = useState('traditional');

  const comparisonData = {
    traditional: {
      competitor: {
        name: t('traditional.name'),
        icon: <Settings className="w-8 h-8 text-gray-500" />,
        description: t('traditional.description'),
        image: "/images/homepage/ArmouredCable.webp",
        features: [
          {
            name: t('traditional.features.currentCapacity.name'),
            description: t('traditional.features.currentCapacity.description'),
            available: false
          },
          {
            name: t('traditional.features.heatManagement.name'), 
            description: t('traditional.features.heatManagement.description'),
            available: false
          },
          {
            name: t('traditional.features.installation.name'),
            description: t('traditional.features.installation.description'),
            available: false
          },
          {
            name: t('traditional.features.spaceEfficiency.name'),
            description: t('traditional.features.spaceEfficiency.description'),
            available: false
          },
          {
            name: t('traditional.features.costEfficiency.name'),
            description: t('traditional.features.costEfficiency.description'),
            available: false
          }
        ]
      }
    },
    compact: {
      competitor: {
        name: t('compact.name'),
        icon: <Settings className="w-8 h-8 text-blue-500" />,
        description: t('compact.description'),
        image: "/images/homepage/contract-busbar-1756864022556-rvsop0-original.webp",
        features: [
          {
            name: t('compact.features.installationFlexibility.name'),
            description: t('compact.features.installationFlexibility.description'),
            available: false
          },
          {
            name: t('compact.features.temperaturePerformance.name'),
            description: t('compact.features.temperaturePerformance.description'),
            available: false
          },
          {
            name: t('compact.features.emergencyBackup.name'),
            description: t('compact.features.emergencyBackup.description'),
            available: false
          },
          {
            name: t('compact.features.energyEfficiency.name'),
            description: t('compact.features.energyEfficiency.description'),
            available: false
          },
          {
            name: t('compact.features.spaceRequirements.name'),
            description: t('compact.features.spaceRequirements.description'),
            available: false
          }
        ]
      }
    }
  };

  const flexibleBusbar = {
    name: t('flexibleBusbar.name'),
    icon: <Zap className="w-8 h-8 text-red-500" />,
    description: t('flexibleBusbar.description'),
    features: [
      {
        name: t('flexibleBusbar.features.currentCapacity.name'),
        description: t('flexibleBusbar.features.currentCapacity.description'),
        available: true
      },
      {
        name: t('flexibleBusbar.features.heatManagement.name'),
        description: t('flexibleBusbar.features.heatManagement.description'),
        available: true
      },
      {
        name: t('flexibleBusbar.features.installation.name'), 
        description: t('flexibleBusbar.features.installation.description'),
        available: true
      },
      {
        name: t('flexibleBusbar.features.spaceOptimization.name'),
        description: t('flexibleBusbar.features.spaceOptimization.description'),
        available: true
      },
      {
        name: t('flexibleBusbar.features.costSavings.name'),
        description: t('flexibleBusbar.features.costSavings.description'),
        available: true
      }
    ]
  };

  const currentComparison = comparisonData[activeTab as keyof typeof comparisonData];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="bg-[#f8f9fa] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('traditional')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'traditional'
                  ? 'bg-[#FFA500] text-[#000000] shadow-md'
                  : 'bg-[#808080] text-[#FFFFFF] hover:text-[#FFFFFF]'
              }`}
            >
              {t('tabs.traditional')}
            </button>
            <button
              onClick={() => setActiveTab('compact')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'compact'
                  ? 'bg-[#FFA500] text-[#000000] shadow-md'
                  : 'bg-[#808080] text-[#FFFFFF] hover:text-[#FFFFFF]'
              }`}
            >
              {t('tabs.compact')}
            </button>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Competitor Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 relative flex-1 shadow-sm">
            <div className="text-center mb-8">
              {/* 产品图片展示区域 */}
              <div className="mb-6">
                <div className="relative w-64 h-64 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={currentComparison.competitor.image}
                    alt={currentComparison.competitor.name}
                    fill
                    sizes="256px"
                    className="object-cover"
                    priority={false}
                  />
                </div>
              </div>
              {/* 产品名称展示区域 */}
              <h3 className="text-xl font-semibold text-[#212529] mb-2">
                {currentComparison.competitor.name}
              </h3>
              <p className="text-sm text-[#6c757d]">
                {currentComparison.competitor.description}
              </p>
            </div>

            <div className="space-y-4">
              {currentComparison.competitor.features.map((feature, idx) => (
                <div key={idx} className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-[#212529]">{feature.name}</h4>
                    <p className="text-sm text-[#6c757d] mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>


          </div>

          {/* Flexible Busbar Card - Recommended */}
          <div className="bg-white border-2 border-[#fdb827] rounded-lg p-8 relative flex-1 shadow-lg">

            <div className="text-center mb-8 mt-4">
              {/* 产品图片展示区域 */}
              <div className="mb-6">
                <div className="relative w-64 h-64 mx-auto bg-gradient-to-br from-[#fdb827]/20 to-[#fdb827]/10 rounded-lg overflow-hidden border-2 border-[#fdb827]/30">
                  <Image
                    src="/images/homepage/flexible-busbar-1756864022556-cxda7k-original.webp"
                    alt={flexibleBusbar.name}
                    fill
                    sizes="256px"
                    className="object-cover"
                    priority={false}
                  />
                  {/* 推荐标识覆盖层 */}
                  <div className="absolute top-2 right-2">
                    <div className="bg-[#fdb827] text-[#212529] text-xs px-2 py-1 rounded-full font-medium">
                      {t('recommended')}
                    </div>
                  </div>
                </div>
              </div>
              {/* 产品名称展示区域 */}
              <h3 className="text-xl font-semibold text-[#212529] mb-2">
                {flexibleBusbar.name}
              </h3>
              <p className="text-sm text-[#6c757d]">
                {flexibleBusbar.description}
              </p>
            </div>

            <div className="space-y-4">
              {flexibleBusbar.features.map((feature, idx) => (
                <div key={idx} className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Check className="w-5 h-5 text-[#fdb827]" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-[#212529]">{feature.name}</h4>
                    <p className="text-sm text-[#6c757d] mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>


          </div>
        </div>


      </div>
    </section>
  );
};