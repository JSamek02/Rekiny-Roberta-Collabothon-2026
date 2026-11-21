'use client';

import React, { useState } from 'react';
import { QuarterHistoryEntry } from './types';
import { useTranslations } from 'next-intl';

interface QuarterHistoryChartProps {
  history: QuarterHistoryEntry[];
}

export const QuarterHistoryChart: React.FC<QuarterHistoryChartProps> = ({ history }) => {
  const t = useTranslations('components.stock.chart');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!history || history.length === 0) {
    return null;
  }

  // Dimensions
  const width = 340;
  const height = 150;
  const paddingX = 35;
  const paddingY = 25;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Extract values
  const nominalValues = history.map((h) => h.portfolio_value);
  const realValues = history.map((h) => h.real_value);
  const allValues = [...nominalValues, ...realValues];

  const minVal = Math.min(...allValues) * 0.96;
  const maxVal = Math.max(...allValues) * 1.04;
  const range = maxVal - minVal || 1;

  // Calculate points
  const pointsNominal = history.map((h, i) => {
    const x = paddingX + (i / Math.max(1, history.length - 1)) * chartW;
    const y = paddingY + chartH - ((h.portfolio_value - minVal) / range) * chartH;
    return { x, y, data: h };
  });

  const pointsReal = history.map((h, i) => {
    const x = paddingX + (i / Math.max(1, history.length - 1)) * chartW;
    const y = paddingY + chartH - ((h.real_value - minVal) / range) * chartH;
    return { x, y, data: h };
  });

  const pathNominal = pointsNominal.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const pathReal = pointsReal.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  // Gradient area under nominal line
  const areaNominal = `${pathNominal} L ${pointsNominal[pointsNominal.length - 1].x} ${paddingY + chartH} L ${pointsNominal[0].x} ${paddingY + chartH} Z`;

  const hoveredData = hoveredIndex !== null ? history[hoveredIndex] : history[history.length - 1];

  return (
    <div className="bg-white rounded-2xl p-4 border border-blue-100 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-xs text-blue-950">{t('title')}</h4>
          <div className="flex items-center gap-3 text-[10px] mt-0.5">
            <span className="flex items-center gap-1 font-medium text-blue-600">
              <span className="w-2.5 h-0.5 bg-blue-500 rounded-full inline-block" /> {t('nominal-legend')}
            </span>
            <span className="flex items-center gap-1 font-medium text-[#10b981]">
              <span className="w-2.5 h-0.5 border-b border-dashed border-[#10b981] inline-block" /> {t('real-legend')}
            </span>
          </div>
        </div>
        {hoveredData && (
          <div className="text-right">
            <span className="text-[10px] text-grey-600 block">{hoveredData.quarter}</span>
            <span className="text-xs font-bold text-blue-950">
              {hoveredData.portfolio_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
            </span>
          </div>
        )}
      </div>

      <div className="relative w-full flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-[340px] overflow-visible">
          <defs>
            <linearGradient id="nominalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b5cff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b5cff" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#e2e2e2"
            strokeDasharray="2 2"
          />
          <line
            x1={paddingX}
            y1={paddingY + chartH / 2}
            x2={width - paddingX}
            y2={paddingY + chartH / 2}
            stroke="#e2e2e2"
            strokeDasharray="2 2"
          />
          <line
            x1={paddingX}
            y1={paddingY + chartH}
            x2={width - paddingX}
            y2={paddingY + chartH}
            stroke="#e2e2e2"
          />

          {/* Area fill */}
          <path d={areaNominal} fill="url(#nominalGradient)" />

          {/* Real line (dashed green) */}
          <path
            d={pathReal}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="3 3"
            strokeLinecap="round"
          />

          {/* Nominal line (solid blue) */}
          <path
            d={pathNominal}
            fill="none"
            stroke="#3b5cff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Points */}
          {pointsNominal.map((p, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5 : 3}
                  className="fill-white stroke-blue-500 transition-all duration-150"
                  strokeWidth="2"
                />
                <circle
                  cx={p.x}
                  cy={pointsReal[idx].y}
                  r={isHovered ? 4 : 2}
                  className="fill-white stroke-[#10b981] transition-all duration-150"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
