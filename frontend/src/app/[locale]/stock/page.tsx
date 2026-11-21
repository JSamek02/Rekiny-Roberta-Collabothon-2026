import React from 'react';
import { StockMarketView } from '@/components/stock/StockMarketView';

export default function StockPage() {
  return (
    <main className="flex-1 flex flex-col">
      <StockMarketView />
    </main>
  );
}
