'use client';

import {
  CircleDollarSign,
  Gift,
  Landmark,
  LineChart,
  LockKeyhole,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { ArrowLeftIcon } from '@/icons/arrow-left';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/ui';
import { useTranslations } from 'next-intl';

const assets = [
  { name: 'MSCI World ETF', ticker: 'IWDA', value: '4 862,20 €', change: '+4,2%', color: 'bg-blue-500' },
  { name: 'Europe 600 ETF', ticker: 'EXSA', value: '2 445,80 €', change: '+1,8%', color: 'bg-[#7c5cff]' },
  { name: 'Green Bonds', ticker: 'GBND', value: '1 920,30 €', change: '+0,6%', color: 'bg-green-500' },
];

export const InvestmentPlatformPreview = () => {
  const t = useTranslations('components.investment-platform-preview');
  const router = useRouter();

  return (
    <main className="relative isolate flex-1 px-3 py-5 pb-24">
      <div className="mx-auto mb-3 w-full max-w-5xl">
        <Button
          variant="ghost"
          size="sm"
          className="size-10 border-0 p-0"
          onClick={() => router.back()}
          aria-label={t('back')}
        >
          <ArrowLeftIcon className="text-2xl stroke-[1.5]" />
        </Button>
      </div>
      <section className="relative mx-auto min-h-[690px] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-sm">
        <div aria-hidden="true" className="p-4 sm:p-6">
          <header className="flex items-center justify-between gap-4 border-b border-blue-100 pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white">
                <LineChart className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-grey-600">{t('preview')}</p>
                <p className="truncate text-base font-semibold text-blue-950">{t('portfolio')}</p>
              </div>
            </div>
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-800">
              {t('market-open')}
            </span>
          </header>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(260px,1fr)]">
            <div className="flex flex-col gap-4">
              <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-grey-600">{t('portfolio')}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-blue-950">{t('portfolio-value')}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-xs font-semibold text-green-800">
                    <TrendingUp className="size-3.5" />
                    {t('today')}
                  </span>
                </div>

                <div className="mt-5 rounded-xl border border-blue-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-blue-950">{t('chart-title')}</p>
                      <p className="mt-0.5 text-[11px] text-grey-600">{t('chart-period')}</p>
                    </div>
                    <span className="text-xs font-semibold text-green-800">+1 084,30 €</span>
                  </div>
                  <svg viewBox="0 0 560 210" className="mt-3 h-auto w-full overflow-visible" role="presentation">
                    <defs>
                      <linearGradient id="investment-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b5cff" stopOpacity="0.24" />
                        <stop offset="100%" stopColor="#3b5cff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[42, 91, 140, 189].map((y) => (
                      <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="#d3daff" strokeDasharray="4 6" />
                    ))}
                    <path
                      d="M 0 172 C 28 162, 42 178, 66 154 S 102 130, 127 143 S 159 160, 188 126 S 228 89, 255 108 S 294 132, 324 104 S 365 53, 394 71 S 430 108, 456 76 S 493 45, 520 59 S 544 42, 560 28 L 560 210 L 0 210 Z"
                      fill="url(#investment-area)"
                    />
                    <path
                      d="M 0 172 C 28 162, 42 178, 66 154 S 102 130, 127 143 S 159 160, 188 126 S 228 89, 255 108 S 294 132, 324 104 S 365 53, 394 71 S 430 108, 456 76 S 493 45, 520 59 S 544 42, 560 28"
                      fill="none"
                      stroke="#3b5cff"
                      strokeLinecap="round"
                      strokeWidth="5"
                    />
                    <circle cx="560" cy="28" r="7" fill="#fff" stroke="#3b5cff" strokeWidth="4" />
                  </svg>
                  <div className="mt-1 flex justify-between text-[10px] font-medium text-grey-400">
                    <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-blue-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-blue-950">{t('assets')}</h2>
                  <span className="text-xs font-medium text-grey-600">3</span>
                </div>
                <ul className="mt-3 divide-y divide-blue-50">
                  {assets.map((asset) => (
                    <li key={asset.ticker} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span className={`size-2.5 shrink-0 rounded-full ${asset.color}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-blue-950">{asset.name}</span>
                        <span className="block text-[11px] text-grey-600">{asset.ticker}</span>
                      </span>
                      <span className="text-right">
                        <span className="block text-xs font-semibold text-blue-950">{asset.value}</span>
                        <span className="block text-[11px] font-medium text-green-800">{asset.change}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="flex flex-col gap-4">
              <section className="rounded-2xl border border-blue-100 bg-white p-4">
                <div className="flex items-center gap-2">
                  <WalletCards className="size-4 text-blue-500" />
                  <h2 className="text-sm font-semibold text-blue-950">{t('allocation')}</h2>
                </div>
                <div className="mt-4 space-y-3">
                  <AllocationRow label={t('stock')} value="62%" color="bg-blue-500" width="62%" />
                  <AllocationRow label={t('bonds')} value="23%" color="bg-[#7c5cff]" width="23%" />
                  <AllocationRow label={t('cash')} value="15%" color="bg-amber-500" width="15%" />
                </div>
              </section>

              <section className="rounded-2xl border border-blue-100 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Landmark className="size-4 text-blue-500" />
                  <h2 className="text-sm font-semibold text-blue-950">{t('watchlist')}</h2>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <MarketTile symbol="S&P 500" value="5 418" change="+0,42%" />
                  <MarketTile symbol="DAX" value="18 612" change="+0,18%" />
                  <MarketTile symbol="EUR/USD" value="1,0864" change="+0,09%" />
                  <MarketTile symbol="Gold" value="2 341" change="+0,31%" />
                </div>
              </section>
            </aside>
          </div>
        </div>

        <div aria-hidden="true" className="absolute inset-0 z-10 bg-black/35 backdrop-blur-[2px] backdrop-grayscale" />

        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-8">
          <article className="w-full max-w-md rounded-[2rem] border border-white/50 bg-white p-6 text-center shadow-2xl sm:p-8">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-blue-950 text-white shadow-lg">
              <LockKeyhole className="size-8" />
            </div>
            <span className="mt-5 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-500">
              {t('locked', { level: 50 })}
            </span>
            <h1 className="mt-3 text-2xl font-semibold leading-tight text-blue-950 sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-3 text-sm leading-6 text-grey-600">
              {t('description', { level: 50 })}
            </p>

            <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded-2xl bg-blue-50 p-4">
                <ShieldCheck className="size-5 text-blue-500" />
                <p className="mt-3 text-sm font-semibold text-blue-950">{t('level-title')}</p>
                <p className="mt-1 text-xs leading-5 text-grey-600">{t('level-description')}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <Gift className="size-5 text-amber-500" />
                <p className="mt-3 text-sm font-semibold text-blue-950">{t('bonus')}</p>
                <p className="mt-1 text-xs leading-5 text-grey-600">{t('bonus-description')}</p>
              </div>
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs leading-5 text-grey-600">
              <CircleDollarSign className="size-4 shrink-0 text-blue-500" />
              {t('notice')}
            </p>
          </article>
        </div>
      </section>
    </main>
  );
};

const AllocationRow = ({ label, value, color, width }: { label: string; value: string; color: string; width: string }) => (
  <div>
    <div className="flex items-center justify-between text-xs">
      <span className="font-medium text-grey-600">{label}</span>
      <span className="font-semibold text-blue-950">{value}</span>
    </div>
    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-blue-50">
      <span className={`block h-full rounded-full ${color}`} style={{ width }} />
    </div>
  </div>
);

const MarketTile = ({ symbol, value, change }: { symbol: string; value: string; change: string }) => (
  <div className="rounded-xl bg-blue-50/70 p-2.5">
    <p className="text-[10px] font-medium text-grey-600">{symbol}</p>
    <p className="mt-1 text-xs font-semibold text-blue-950">{value}</p>
    <p className="mt-0.5 text-[10px] font-semibold text-green-800">{change}</p>
  </div>
);
