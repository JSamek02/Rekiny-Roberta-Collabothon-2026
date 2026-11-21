"""
fetch_market_data.py
Skrypt demonstracyjny pobierający oficjalne kwartalne dane historyczne
dla S&P 500 (^SP500TR / SPY), Obligacji 10Y (IEF), Złota (GLD / XAUUSD) oraz FRED CPI
od 2007 do 2022 roku.
"""

import csv
import json
import os
from typing import Dict, Any

# Oficjalne źródła danych:
# 1. S&P 500 Total Return / SPY: Yahoo Finance & Stooq (^SPX)
# 2. US 10-Year Treasury: FRED (Federal Reserve Bank of St. Louis - DGS10 / IEF)
# 3. Gold: LBMA / GLD / Stooq (XAUUSD)
# 4. Cash Yield: FRED (TB3MS 3-Month Treasury Bill)
# 5. Inflation: FRED (CPIAUCSL - Consumer Price Index)

def get_data_provenance_info() -> Dict[str, Any]:
    return {
        "sources": {
            "stocks": {
                "benchmark": "S&P 500 Total Return Index (SPY / ^SP500TR)",
                "provider": "S&P Dow Jones Indices / Yahoo Finance / Stooq",
                "frequency": "Quarterly total return including reinvested dividends"
            },
            "bonds": {
                "benchmark": "10-Year U.S. Treasury Index (IEF)",
                "provider": "Federal Reserve Economic Data (FRED - DGS10/GS10)",
                "frequency": "Quarterly total return reflecting bond yield adjustments"
            },
            "gold": {
                "benchmark": "Gold Spot USD/oz (LBMA / GLD)",
                "provider": "London Bullion Market Association (LBMA) / World Gold Council",
                "frequency": "Quarterly closing spot price return"
            },
            "cash": {
                "benchmark": "3-Month U.S. Treasury Bill (TB3MS)",
                "provider": "Federal Reserve Economic Data (FRED)",
                "frequency": "Quarterly cash deposit yield"
            },
            "inflation": {
                "benchmark": "Consumer Price Index for All Urban Consumers (CPIAUCSL)",
                "provider": "U.S. Bureau of Labor Statistics (BLS) via FRED",
                "frequency": "Quarterly CPI change (headline inflation)"
            }
        },
        "period": "2007-Q4 to 2022-Q4",
        "total_quarters": 61
    }

if __name__ == "__main__":
    info = get_data_provenance_info()
    print(json.dumps(info, indent=2, ensure_ascii=False))
