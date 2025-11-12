'use client';
import React from 'react';

export default function TechSpecsTable({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="bg-[#f8f9fa] rounded-lg p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item, idx) => (
          <div key={`${item.label}-${idx}`} className="flex items-start justify-between">
            <span className="text-[#212529] font-semibold">{item.label}</span>
            <span className="text-[#6c757d]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

