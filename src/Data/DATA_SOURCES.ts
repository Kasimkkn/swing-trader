// Configuration for various data sources and web scraping targets
// This file contains the URLs and selectors for scraping financial data

export const DATA_SOURCES = {
    // Indian Stock Exchange APIs
    NSE: {
        baseUrl: 'https://www.nseindia.com/api',
        endpoints: {
            quote: '/quote-equity?symbol=',
            marketData: '/market-data-pre-open?key=ALL',
            fiiDii: '/fiidiiTradeReact',
            indices: '/allIndices',
            corporateActions: '/corporate-actions?index=equities'
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.nseindia.com/'
        }
    },

    BSE: {
        baseUrl: 'https://api.bseindia.com',
        endpoints: {
            quote: '/BseIndiaAPI/api/StockReach/getdata/',
            results: '/BseIndiaAPI/api/AnnualReport/w/',
            corporateActions: '/BseIndiaAPI/api/CorporateAnnouncement/w/'
        }
    },

    // Yahoo Finance (backup for Indian stocks)
    YAHOO: {
        baseUrl: 'https://query1.finance.yahoo.com',
        endpoints: {
            chart: '/v8/finance/chart/',
            quoteSummary: '/v10/finance/quoteSummary/',
            news: '/v1/finance/search?q='
        },
        modules: [
            'assetProfile',
            'summaryProfile',
            'summaryDetail',
            'esgScores',
            'price',
            'incomeStatementHistory',
            'incomeStatementHistoryQuarterly',
            'balanceSheetHistory',
            'balanceSheetHistoryQuarterly',
            'cashflowStatementHistory',
            'cashflowStatementHistoryQuarterly',
            'defaultKeyStatistics',
            'financialData',
            'calendarEvents',
            'secFilings',
            'recommendationTrend',
            'upgradeDowngradeHistory',
            'institutionOwnership',
            'fundOwnership',
            'majorDirectHolders',
            'majorHoldersBreakdown',
            'insiderTransactions',
            'insiderHolders',
            'netSharePurchaseActivity',
            'earnings',
            'earningsHistory',
            'earningsTrend',
            'industryTrend'
        ]
    },

    // News Sources for Web Scraping
    NEWS_SOURCES: {
        ECONOMIC_TIMES: {
            baseUrl: 'https://economictimes.indiatimes.com',
            searchUrl: '/markets/stocks/news',
            selectors: {
                headlines: '.eachStory h3',
                summaries: '.eachStory p',
                dates: '.eachStory .time',
                links: '.eachStory a'
            }
        },

        MONEYCONTROL: {
            baseUrl: 'https://www.moneycontrol.com',
            searchUrl: '/news/business/stocks/',
            selectors: {
                headlines: '.news_title a',
                summaries: '.news_desc',
                dates: '.news_date',
                links: '.news_title a'
            }
        },

        BUSINESS_STANDARD: {
            baseUrl: 'https://www.business-standard.com',
            searchUrl: '/markets/stocks',
            selectors: {
                headlines: '.hdg4 a',
                summaries: '.summ',
                dates: '.dateline',
                links: '.hdg4 a'
            }
        },

        LIVEMINT: {
            baseUrl: 'https://www.livemint.com',
            searchUrl: '/market/stock-market-news',
            selectors: {
                headlines: '.headlineSec a',
                summaries: '.summary',
                dates: '.timeAgo',
                links: '.headlineSec a'
            }
        },

        BLOOMBERG_QUINT: {
            baseUrl: 'https://www.bloombergquint.com',
            searchUrl: '/markets/stocks',
            selectors: {
                headlines: '.story-card-headline a',
                summaries: '.story-card-description',
                dates: '.story-card-time',
                links: '.story-card-headline a'
            }
        }
    },

    // Sector and Market Data Sources
    SECTOR_DATA: {
        NSE_SECTORAL: {
            url: 'https://www.nseindia.com/api/equity-stockIndices?index=SECTORAL%20INDICES',
            selectors: {
                sectorName: 'indexName',
                performance: 'pChange',
                trend: 'trend'
            }
        },

        MONEYCONTROL_SECTORS: {
            url: 'https://www.moneycontrol.com/markets/indian-indices/top-sectors/',
            selectors: {
                sectors: '.bl_15 tbody tr',
                names: 'td:nth-child(1) a',
                changes: 'td:nth-child(3)',
                percentages: 'td:nth-child(4)'
            }
        }
    },

    // Global Market Data
    GLOBAL_DATA: {
        DOW_FUTURES: {
            url: 'https://www.investing.com/indices/us-30-futures',
            selector: '[data-test="instrument-price-last"]'
        },

        CRUDE_OIL: {
            url: 'https://www.investing.com/commodities/crude-oil',
            selector: '[data-test="instrument-price-last"]'
        },

        USD_INR: {
            url: 'https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=INR',
            selector: '.result__BigRate-sc-1bsijpp-1'
        },

        VIX: {
            nsePlaceholder: 'https://www.nseindia.com/api/chart-databyindex?index=INDIAVIX&indices=true',
            investingUrl: 'https://www.investing.com/indices/india-vix'
        }
    },

    // Corporate Actions and Events
    CORPORATE_ACTIONS: {
        NSE_EVENTS: {
            url: 'https://www.nseindia.com/companies-listing/corporate-disclosure/disclosures',
            selectors: {
                events: '.disclosure-table tbody tr',
                company: 'td:nth-child(1)',
                subject: 'td:nth-child(2)',
                date: 'td:nth-child(3)'
            }
        },

        BSE_EVENTS: {
            url: 'https://www.bseindia.com/corporates/ann.html',
            selectors: {
                events: '.TTRow',
                company: '.TTData:nth-child(2)',
                subject: '.TTData:nth-child(3)',
                date: '.TTData:nth-child(4)'
            }
        }
    }
};

// Rate limiting configuration
export const RATE_LIMITS = {
    NSE: {
        requestsPerMinute: 10,
        backoffMs: 6000
    },
    YAHOO: {
        requestsPerMinute: 60,
        backoffMs: 1000
    },
    NEWS_SCRAPING: {
        requestsPerMinute: 30,
        backoffMs: 2000
    }
};

// Retry configuration for failed requests
export const RETRY_CONFIG = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
};

// Caching configuration
export const CACHE_CONFIG = {
    STOCK_DATA: {
        ttlMinutes: 15
    },
    NEWS_DATA: {
        ttlMinutes: 60
    },
    SECTOR_DATA: {
        ttlMinutes: 30
    },
    MARKET_SENTIMENT: {
        ttlMinutes: 20
    },
    RESEARCH_DATA: {
        ttlMinutes: 360 // 6 hours
    }
};

// Helper function to build Yahoo symbol for Indian stocks
export function buildYahooSymbol(symbol: string): string {
    if (symbol.includes('.')) return symbol;

    // Common Indian stock exchanges
    const commonNSEStocks = [
        'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR',
        'HDFC', 'ITC', 'KOTAKBANK', 'LT', 'SBIN', 'BHARTIARTL',
        'ASIANPAINT', 'ICICIBANK', 'MARUTI', 'AXISBANK'
    ];

    // Default to NSE for common stocks, otherwise try both
    return commonNSEStocks.includes(symbol.toUpperCase()) ? `${symbol}.NS` : `${symbol}.NS`;
}

// Helper function to get sector mapping
export const SECTOR_MAPPING = {
    'Information Technology': 'Technology',
    'Financial Services': 'Banking',
    'Oil Gas & Consumable Fuels': 'Energy',
    'Pharmaceuticals & Biotechnology': 'Pharmaceutical',
    'Automobile & Auto Components': 'Automobile',
    'Fast Moving Consumer Goods': 'FMCG',
    'Metals & Mining': 'Metals',
    'Chemicals': 'Chemicals',
    'Construction Materials': 'Construction',
    'Power': 'Power',
    'Textiles': 'Textiles',
    'Media Entertainment & Publication': 'Media'
};

// Error handling configuration
export const ERROR_CODES = {
    RATE_LIMITED: 'RATE_LIMITED',
    BLOCKED: 'BLOCKED',
    NO_DATA: 'NO_DATA',
    PARSE_ERROR: 'PARSE_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR'
};

// User agents for rotation to avoid blocking
export const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
];

export default DATA_SOURCES;