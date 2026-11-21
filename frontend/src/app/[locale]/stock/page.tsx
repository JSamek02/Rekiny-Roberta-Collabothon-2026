import React from 'react';
import { StockMarketView } from '@/components/stock/StockMarketView';

export const metadata = {
  title: 'Giełda — Symulator Inwestycyjny | Rekiny Finansów',
  description: 'Historyczna symulacja giełdowa i alokacja portfela z Robertem Biznesu',
};

export default function StockPage() {
  return (
    <main className="flex-1 flex flex-col">
      <StockMarketView />
    </main>
  );
}
