'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { LevelBar } from '@/components/level-bar';
import { RobertChatbot } from '@/components/chat/RobertChatbot';
import { BankIcon } from '@/icons/bank';
import { DollarIcon } from '@/icons/dollar';
import { HandCoinsIcon } from '@/icons/hand-coins';
import { WalletIcon } from '@/icons/wallet';
import { routes } from '@/utils/routes';

export const DashboardContent: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="py-4 px-4 flex flex-col gap-4 max-w-md mx-auto w-full pb-8">
      {/* Level Bar from Figma */}
      <LevelBar />

      {/* Featured Giełda Callout Banner */}
      <Link
        href={routes.stock}
        className="relative overflow-hidden rounded-2xl bg-blue-500 p-4 text-white shadow-xs hover:shadow-md transition-all border border-blue-400 group"
      >
        <div className="relative z-10 max-w-[75%]">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold backdrop-blur-sm mb-1.5">
            <span>📈</span> NOWOŚĆ • SILNIK SYMULACJI
          </div>
          <h2 className="text-base font-bold leading-tight">Giełda — Symulator</h2>
          <p className="text-xs text-blue-100 mt-1 leading-snug">
            Przetestuj swój portfel w 3 historycznych krachach: 2008 Lehman Brothers, COVID-19 i inflacja 2022.
          </p>
          <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-yellow-300 group-hover:translate-x-1 transition-transform">
            <span>Wejdź na Giełdę</span>
            <span>➔</span>
          </div>
        </div>
        <div className="absolute -bottom-2 -right-2 w-24 h-28 opacity-90 group-hover:scale-105 transition-transform">
          <Image
            src="/img/shark.png"
            alt="Rekin na giełdzie"
            width={96}
            height={112}
            className="object-contain"
          />
        </div>
      </Link>

      {/* 4 Lessons Grid from Figma 5:617 */}
      <div>
        <h3 className="font-bold text-xs uppercase tracking-wider text-grey-600 mb-2">Kategorie Wiedzy</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Bonds and Stocks */}
          <Link
            href={routes.stock}
            className="bg-white p-3 flex flex-col justify-between gap-3 rounded-2xl border border-blue-100 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all"
          >
            <div className="flex gap-2 items-center">
              <div className="size-10 rounded-xl bg-blue-50 text-blue-950 flex items-center justify-center shrink-0">
                <HandCoinsIcon className="text-2xl" />
              </div>
              <h4 className="leading-tight font-semibold text-xs text-blue-950">Bonds and Stocks</h4>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-grey-600 font-medium">
                <span>Postęp</span>
                <span>6/12 lekcji</span>
              </div>
              <div className="h-1.5 rounded-full bg-grey-200 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-1/2" />
              </div>
            </div>
          </Link>

          {/* Card 2: Mortgage Credit */}
          <div className="bg-white p-3 flex flex-col justify-between gap-3 rounded-2xl border border-blue-100 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all">
            <div className="flex gap-2 items-center">
              <div className="size-10 rounded-xl bg-blue-50 text-blue-950 flex items-center justify-center shrink-0">
                <WalletIcon className="text-2xl" />
              </div>
              <h4 className="leading-tight font-semibold text-xs text-blue-950">Mortgage credit</h4>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-grey-600 font-medium">
                <span>Postęp</span>
                <span>6/12 lekcji</span>
              </div>
              <div className="h-1.5 rounded-full bg-grey-200 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-1/2" />
              </div>
            </div>
          </div>

          {/* Card 3: Exchange-traded fund */}
          <Link
            href={routes.stock}
            className="bg-white p-3 flex flex-col justify-between gap-3 rounded-2xl border border-blue-100 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all"
          >
            <div className="flex gap-2 items-center">
              <div className="size-10 rounded-xl bg-blue-50 text-blue-950 flex items-center justify-center shrink-0">
                <DollarIcon className="text-2xl" />
              </div>
              <h4 className="leading-tight font-semibold text-xs text-blue-950">Exchange-traded fund</h4>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-grey-600 font-medium">
                <span>Postęp</span>
                <span>6/12 lekcji</span>
              </div>
              <div className="h-1.5 rounded-full bg-grey-200 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-1/2" />
              </div>
            </div>
          </Link>

          {/* Card 4: Deposits */}
          <div className="bg-white p-3 flex flex-col justify-between gap-3 rounded-2xl border border-blue-100 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all">
            <div className="flex gap-2 items-center">
              <div className="size-10 rounded-xl bg-blue-50 text-blue-950 flex items-center justify-center shrink-0">
                <BankIcon className="text-2xl" />
              </div>
              <h4 className="leading-tight font-semibold text-xs text-blue-950">Deposits</h4>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-grey-600 font-medium">
                <span>Postęp</span>
                <span>6/12 lekcji</span>
              </div>
              <div className="h-1.5 rounded-full bg-grey-200 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sharkbot Card & Shark mascot from Figma 5:617 */}
      <div className="relative mt-2 flex items-stretch gap-2">
        {/* Chatbot speech card */}
        <div className="flex-1 bg-white rounded-2xl p-4 border border-blue-100 shadow-sm flex flex-col justify-between relative z-10">
          <div>
            <span className="text-xs text-grey-600 font-medium block">Chatbot?</span>
            <h3 className="text-lg font-bold text-blue-950 leading-tight">Sharkbot!</h3>
            <p className="text-xs text-grey-600 mt-2 leading-relaxed">
              If you have any questions, feel free to ask me, and I’ll answer your hardest questions
            </p>
          </div>
          <button
            onClick={() => setIsChatOpen(true)}
            className="mt-4 w-full py-2 px-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <span>Open chat</span>
            <span className="text-sm">💬</span>
          </button>
        </div>

        {/* Mascot Shark */}
        <div className="w-36 flex items-end justify-center shrink-0 relative overflow-hidden">
          <Image
            src="/img/shark.png"
            alt="Robert Biznesu Shark"
            width={140}
            height={180}
            className="object-contain drop-shadow-md select-none pointer-events-none"
          />
        </div>
      </div>

      {/* Chatbot Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-2 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-blue-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-grey-100 bg-blue-50">
              <div className="flex items-center gap-2">
                <Image src="/img/shark.png" alt="" width={28} height={28} className="object-contain" />
                <div>
                  <h4 className="font-bold text-xs text-blue-950">Sharkbot — Robert Biznesu</h4>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Aktywny
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-8 h-8 rounded-full bg-white text-grey-600 hover:text-blue-950 flex items-center justify-center font-bold text-sm shadow-xs"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              <RobertChatbot />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
