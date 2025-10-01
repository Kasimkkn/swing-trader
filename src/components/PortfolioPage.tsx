import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ResponsiveModal from '@/components/ui/responsive-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PortfolioStocks, Stock } from '@/types/stock';
import { DollarSign, Edit2, IndianRupee, MoreVertical, PieChart, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import FilterControls from './FilterControls';
import StockSearchInput from './StockSearchInput';
import ConfirmationModal from './ui/confirmation-modal';

interface FormData {
    symbol: string;
    companyName: string;
    quantity: string;
    buyingPrice: string;
    sellingPrice?: string;
    buyDate: string;
    sellDate?: string;
}


const PortfolioPage: React.FC = () => {
    const [stocks, setStocks] = useState<PortfolioStocks[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'sell'>('create');
    const [selectedStock, setSelectedStock] = useState<PortfolioStocks | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [stockToDelete, setStockToDelete] = useState<PortfolioStocks | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionModalStock, setActionModalStock] = useState<PortfolioStocks | null>(null);
    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'symbol' | 'companyName' | 'quantity' | 'buyingPrice' | 'buyDate' | 'profit'>('buyDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [filterStatus, setFilterStatus] = useState<'all' | 'hold' | 'sold'>('all');
    const [priceRangeFilter, setPriceRangeFilter] = useState<{ min: string; max: string }>({ min: '', max: '' }); const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' });
    const { toast } = useToast();
    const [formData, setFormData] = useState<FormData>({
        symbol: '',
        companyName: '',
        quantity: '',
        buyingPrice: '',
        sellingPrice: '',
        buyDate: new Date().toISOString().split('T')[0],
        sellDate: ''
    });

    // Load portfolio data from Supabase on component mount
    useEffect(() => {
        fetchPortfolioStocks();
    }, []);

    const fetchPortfolioStocks = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('portfolio')
                .select(`
                    *,
                    stocks (
                        id,
                        symbol,
                        company_name,
                        current_price
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const portfolioStocks: PortfolioStocks[] = (data || []).map(item => ({
                id: item.id,
                symbol: item.stocks.symbol,
                companyName: item.stocks.company_name,
                quantity: item.quantity,
                buyingPrice: typeof item.buying_price === 'string' ? parseFloat(item.buying_price) : item.buying_price,
                sellingPrice: item.selling_price ? (typeof item.selling_price === 'string' ? parseFloat(item.selling_price) : item.selling_price) : undefined,
                status: item.status as 'hold' | 'sold',
                buyDate: item.buy_date,
                sellDate: item.sell_date
            }));

            setStocks(portfolioStocks);
        } catch (error) {
            console.error('Error fetching portfolio:', error);
            toast({
                title: "Error",
                description: "Failed to load portfolio data",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            symbol: '',
            companyName: '',
            quantity: '',
            buyingPrice: '',
            sellingPrice: '',
            buyDate: new Date().toISOString().split('T')[0],
            sellDate: ''
        });
    };

    // Filter and sort functions
    const getFilteredAndSortedStocks = (stocksToFilter: PortfolioStocks[]) => {
        let filtered = stocksToFilter;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(stock =>
                stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                stock.companyName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(stock => stock.status === filterStatus);
        }

        // Price range filter
        if (priceRangeFilter.min) {
            filtered = filtered.filter(stock => stock.buyingPrice >= parseFloat(priceRangeFilter.min));
        }
        if (priceRangeFilter.max) {
            filtered = filtered.filter(stock => stock.buyingPrice <= parseFloat(priceRangeFilter.max));
        }

        // Date range filter
        if (dateRangeFilter.start) {
            filtered = filtered.filter(stock => new Date(stock.buyDate) >= new Date(dateRangeFilter.start));
        }
        if (dateRangeFilter.end) {
            filtered = filtered.filter(stock => new Date(stock.buyDate) <= new Date(dateRangeFilter.end));
        }

        // Sorting
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case 'symbol':
                    aValue = a.symbol;
                    bValue = b.symbol;
                    break;
                case 'companyName':
                    aValue = a.companyName;
                    bValue = b.companyName;
                    break;
                case 'quantity':
                    aValue = a.quantity;
                    bValue = b.quantity;
                    break;
                case 'buyingPrice':
                    aValue = a.buyingPrice;
                    bValue = b.buyingPrice;
                    break;
                case 'buyDate':
                    aValue = new Date(a.buyDate);
                    bValue = new Date(b.buyDate);
                    break;
                case 'profit':
                    aValue = a.status === 'sold' ? (a.sellingPrice! - a.buyingPrice) * a.quantity : 0;
                    bValue = b.status === 'sold' ? (b.sellingPrice! - b.buyingPrice) * b.quantity : 0;
                    break;
                default:
                    return 0;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }

            if (sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        return filtered;
    };
    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const openCreateModal = () => {
        resetForm();
        setModalMode('create');
        setSelectedStock(null);
        setIsModalOpen(true);
    };

    const openEditModal = (stock: PortfolioStocks) => {
        setFormData({
            symbol: stock.symbol,
            companyName: stock.companyName,
            quantity: stock.quantity.toString(),
            buyingPrice: stock.buyingPrice.toString(),
            sellingPrice: stock.sellingPrice?.toString() || '',
            buyDate: stock.buyDate,
            sellDate: stock.sellDate || ''
        });
        setModalMode('edit');
        setSelectedStock(stock);
        setIsModalOpen(true);
    };

    const openSellModal = (stock: PortfolioStocks) => {
        setFormData({
            symbol: stock.symbol,
            companyName: stock.companyName,
            quantity: stock.quantity.toString(),
            buyingPrice: stock.buyingPrice.toString(),
            sellingPrice: '',
            buyDate: stock.buyDate,
            sellDate: new Date().toISOString().split('T')[0]
        });
        setModalMode('sell');
        setSelectedStock(stock);
        setIsModalOpen(true);
    };

    const handleStockSelect = (stock: Stock) => {
        setFormData(prev => ({
            ...prev,
            symbol: stock.symbol,
            companyName: stock.company_name,
            buyingPrice: stock.current_price?.toString() || prev.buyingPrice
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let stockId: string;

            // First, check if stock exists in stocks table
            const { data: existingStock, error: checkError } = await supabase
                .from('stocks')
                .select('id')
                .eq('symbol', formData.symbol.toUpperCase())
                .maybeSingle();

            if (checkError) throw checkError;

            if (existingStock) {
                stockId = existingStock.id;
            } else {
                // Create new stock if it doesn't exist
                const { data: newStock, error: createError } = await supabase
                    .from('stocks')
                    .insert({
                        symbol: formData.symbol.toUpperCase(),
                        company_name: formData.companyName,
                        current_price: parseFloat(formData.buyingPrice)
                    })
                    .select('id')
                    .single();

                if (createError) throw createError;
                stockId = newStock.id;
            }

            // Now handle portfolio operations
            if (modalMode === 'create') {
                const { error: insertError } = await supabase
                    .from('portfolio')
                    .insert({
                        stock_id: stockId,
                        quantity: parseInt(formData.quantity),
                        buying_price: parseFloat(formData.buyingPrice),
                        buy_date: formData.buyDate,
                        status: 'hold'
                    });

                if (insertError) throw insertError;
            } else if (selectedStock) {
                const updateData: any = {
                    quantity: parseInt(formData.quantity),
                    buying_price: parseFloat(formData.buyingPrice),
                    buy_date: formData.buyDate
                };

                if (modalMode === 'sell') {
                    updateData.selling_price = parseFloat(formData.sellingPrice || '0');
                    updateData.sell_date = formData.sellDate;
                    updateData.status = 'sold';
                }

                const { error: updateError } = await supabase
                    .from('portfolio')
                    .update(updateData)
                    .eq('id', selectedStock.id);

                if (updateError) throw updateError;
            }

            toast({
                title: "Success",
                description: modalMode === 'create' ? "Stock added to portfolio" : "Stock updated successfully"
            });

            setIsModalOpen(false);
            resetForm();
            fetchPortfolioStocks(); // Refresh the data
        } catch (error) {
            console.error('Error:', error);
            toast({
                title: "Error",
                description: "Failed to save stock. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: string) => {
        const stock = stocks.find(s => s.id === id);
        if (stock) {
            setStockToDelete(stock);
            setIsConfirmDeleteOpen(true);
        }
    };

    const handleConfirmDelete = async () => {
        if (stockToDelete) {
            try {
                const { error } = await supabase
                    .from('portfolio')
                    .delete()
                    .eq('id', stockToDelete.id);

                if (error) throw error;

                toast({
                    title: "Success",
                    description: "Stock removed from portfolio"
                });

                setIsConfirmDeleteOpen(false);
                setStockToDelete(null);
                fetchPortfolioStocks(); // Refresh the data
            } catch (error) {
                console.error('Error:', error);
                toast({
                    title: "Error",
                    description: "Failed to delete stock",
                    variant: "destructive"
                });
            }
        }
    };

    const handleCancelDelete = () => {
        setIsConfirmDeleteOpen(false);
        setStockToDelete(null);
    };

    const ActionModal = () => (
        <ResponsiveModal
            isOpen={isActionModalOpen}
            onClose={() => {
                setIsActionModalOpen(false);
                setActionModalStock(null);
            }}
            title=""
        >
            <div className="space-y-2">
                {actionModalStock?.status === 'hold' && (
                    <button
                        onClick={() => {
                            openSellModal(actionModalStock);
                            setIsActionModalOpen(false);
                        }}
                        className="w-full p-3 text-left hover:bg-white/5 rounded-lg transition-colors flex items-center"
                    >
                        <DollarSign className="mr-3 h-5 w-5 text-green-400" />
                        <span className="text-white">Sell</span>
                    </button>
                )}

                <button
                    onClick={() => {
                        openEditModal(actionModalStock);
                        setIsActionModalOpen(false);
                    }}
                    className="w-full p-3 text-left hover:bg-white/5 rounded-lg transition-colors flex items-center"
                >
                    <Edit2 className="mr-3 h-5 w-5 text-blue-400" />
                    <span className="text-white">Edit</span>
                </button>

                <button
                    onClick={() => {
                        handleDelete(actionModalStock.id);
                        setIsActionModalOpen(false);
                    }}
                    className="w-full p-3 text-left hover:bg-red-500/10 rounded-lg transition-colors flex items-center"
                >
                    <Trash2 className="mr-3 h-5 w-5 text-red-400" />
                    <span className="text-red-400">Delete</span>
                </button>
            </div>
        </ResponsiveModal>
    );
    // Calculate portfolio metrics
    const holdingStocks = stocks.filter(stock => stock.status === 'hold');
    const soldStocks = stocks.filter(stock => stock.status === 'sold');

    const totalInvestment = holdingStocks.reduce((sum, stock) => sum + (stock.quantity * stock.buyingPrice), 0);
    const totalRealizedGains = soldStocks.reduce((sum, stock) => {
        const profit = (stock.sellingPrice - stock.buyingPrice) * stock.quantity;
        return sum + profit;
    }, 0);

    const profitableStocks = soldStocks.filter(stock => (stock.sellingPrice - stock.buyingPrice) > 0);

    const getModalTitle = () => {
        switch (modalMode) {
            case 'create': return 'Add New Stock';
            case 'edit': return 'Edit Stock';
            case 'sell': return 'Sell Stock';
            default: return 'Stock Details';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Portfolio Management</h1>
                    <p className="text-gray-400">Track your investments and manage your stock portfolio</p>
                </div>
                <Button
                    onClick={openCreateModal}
                    className="bg-white text-black hover:bg-gray-200 transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stock
                </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <Card key={index} className="bg-white/5 border-white/10 border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                                    <div className="w-4 h-4 mr-2 bg-gray-400 rounded animate-pulse"></div>
                                    <div className="w-20 h-4 bg-gray-400 rounded animate-pulse"></div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="w-16 h-8 bg-gray-400 rounded animate-pulse mb-2"></div>
                                <div className="w-24 h-3 bg-gray-400 rounded animate-pulse"></div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <>
                        <Card className="bg-white/5 border-white/10 border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                                    <PieChart className="w-4 h-4 mr-2" />
                                    Total Holdings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{holdingStocks.length}</div>
                                <p className="text-xs text-gray-400 mt-1">Active positions</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10 border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                                    <IndianRupee className="w-4 h-4 mr-2" />
                                    Total Investment
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(totalInvestment)}</div>
                                <p className="text-xs text-gray-400 mt-1">Current holdings value</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10 border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Realized Gains
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${totalRealizedGains >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatCurrency(totalRealizedGains)}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">From sold positions</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10 border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                                    <TrendingDown className="w-4 h-4 mr-2" />
                                    Win Rate
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-400">
                                    {soldStocks.length > 0 ? Math.round((profitableStocks.length / soldStocks.length) * 100) : 0}%
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Profitable trades</p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            <FilterControls
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                priceRangeFilter={priceRangeFilter}
                setPriceRangeFilter={setPriceRangeFilter}
                dateRangeFilter={dateRangeFilter}
                setDateRangeFilter={setDateRangeFilter}
            />
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full pb-10">
                <TabsList className="grid w-full grid-cols-3 bg-white/5 border-white/10">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-white/10">
                        Holdings
                    </TabsTrigger>
                    <TabsTrigger value="sold" className="data-[state=active]:bg-white/10">
                        Sold Stocks
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-white/10">
                        All History
                    </TabsTrigger>
                </TabsList>

                {/* Holdings Tab */}
                <TabsContent value="overview" className="mt-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <Card key={index} className="bg-white/5 border-white/10 border animate-pulse">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-16 h-6 bg-gray-400 rounded"></div>
                                                    <div className="w-12 h-5 bg-blue-400 rounded"></div>
                                                </div>
                                                <div className="w-32 h-4 bg-gray-400 rounded mb-3"></div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    {Array.from({ length: 4 }).map((_, i) => (
                                                        <div key={i}>
                                                            <div className="w-16 h-3 bg-gray-400 rounded mb-1"></div>
                                                            <div className="w-12 h-4 bg-gray-400 rounded"></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="w-12 h-8 bg-green-400 rounded"></div>
                                                <div className="w-8 h-8 bg-gray-400 rounded"></div>
                                                <div className="w-8 h-8 bg-red-400 rounded"></div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : getFilteredAndSortedStocks(holdingStocks).length === 0 ? (
                            <Card className="bg-white/5 border-white/10 border">
                                <CardContent className="p-8 text-center">
                                    <p className="text-gray-400 mb-4">No holdings found</p>
                                    <Button onClick={openCreateModal} variant="outline" className="border-white/20 hover:bg-white/5">
                                        Add Your First Stock
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            getFilteredAndSortedStocks(holdingStocks).map((stock) => (
                                <Card key={stock.id} className="bg-white/5 border-white/10 border hover:bg-white/10 transition-colors">
                                    <CardContent className="p-6 relative">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold">{stock.symbol}</h3>
                                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                        {stock.status.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <p className="text-gray-400 text-sm mb-3">{stock.companyName}</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-400">Quantity:</span>
                                                        <p className="font-medium">{stock.quantity}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Buy Price:</span>
                                                        <p className="font-medium">{formatCurrency(stock.buyingPrice)}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Investment:</span>
                                                        <p className="font-medium">{formatCurrency(stock.quantity * stock.buyingPrice)}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Buy Date:</span>
                                                        <p className="font-medium">{new Date(stock.buyDate).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='absolute top-4 right-4 z-10'>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 p-0 text-white"
                                                    onClick={() => {
                                                        setActionModalStock(stock);
                                                        setIsActionModalOpen(true);
                                                    }}
                                                >
                                                    <MoreVertical className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Sold Stocks Tab */}
                <TabsContent value="sold" className="mt-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        {getFilteredAndSortedStocks(soldStocks).length === 0 ? (
                            <Card className="bg-white/5 border-white/10 border">
                                <CardContent className="p-8 text-center">
                                    <p className="text-gray-400">No sold stocks found</p>
                                </CardContent>
                            </Card>
                        ) : (
                            getFilteredAndSortedStocks(soldStocks).map((stock) => {
                                const profit = (stock.sellingPrice - stock.buyingPrice) * stock.quantity;
                                const profitPercentage = ((stock.sellingPrice - stock.buyingPrice) / stock.buyingPrice) * 100;
                                const isProfit = profit > 0;

                                return (
                                    <Card key={stock.id} className="bg-white/5 border-white/10 border hover:bg-white/10 transition-colors">
                                        <CardContent className="p-6 relative">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold">{stock.symbol}</h3>
                                                        <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                                                            SOLD
                                                        </Badge>
                                                        <Badge
                                                            variant="secondary"
                                                            className={`${isProfit ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
                                                        >
                                                            {isProfit ? '+' : ''}{profitPercentage.toFixed(2)}%
                                                        </Badge>
                                                    </div>
                                                    <p className="text-gray-400 text-sm mb-3">{stock.companyName}</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-400">Quantity:</span>
                                                            <p className="font-medium">{stock.quantity}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Buy Price:</span>
                                                            <p className="font-medium">{formatCurrency(stock.buyingPrice)}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Sell Price:</span>
                                                            <p className="font-medium">{formatCurrency(stock.sellingPrice)}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">P&L:</span>
                                                            <p className={`font-medium ${profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                {formatCurrency(profit)}

                                                            </p>
                                                        </div>

                                                        <div>
                                                            <span className="text-gray-400">Sell Date:</span>
                                                            <p className="font-medium">{stock.sellDate ? new Date(stock.sellDate).toLocaleDateString() : 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <div className='absolute top-4 right-4 z-10'>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 p-0 text-white"
                                                            onClick={() => {
                                                                setActionModalStock(stock);
                                                                setIsActionModalOpen(true);
                                                            }}
                                                        >
                                                            <MoreVertical className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        {getFilteredAndSortedStocks(stocks).length === 0 ? (
                            <Card className="bg-white/5 border-white/10 border">
                                <CardContent className="p-8 text-center">
                                    <p className="text-gray-400">No transaction history found</p>
                                </CardContent>
                            </Card>
                        ) : (
                            getFilteredAndSortedStocks(stocks).map((stock) => {
                                const profit = stock.status === 'sold' ? (stock.sellingPrice - stock.buyingPrice) * stock.quantity : 0;
                                const profitPercentage = stock.status === 'sold' ? ((stock.sellingPrice - stock.buyingPrice) / stock.buyingPrice) * 100 : 0;
                                const isProfit = profit > 0;

                                return (
                                    <Card key={stock.id} className="bg-white/5 border-white/10 border hover:bg-white/10 transition-colors">
                                        <CardContent className="p-6 relative">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold">{stock.symbol}</h3>
                                                        <Badge
                                                            variant="secondary"
                                                            className={stock.status === 'hold' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}
                                                        >
                                                            {stock.status.toUpperCase()}
                                                        </Badge>
                                                        {stock.status === 'sold' && (
                                                            <Badge
                                                                variant="secondary"
                                                                className={`${isProfit ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
                                                            >
                                                                {isProfit ? '+' : ''}{profitPercentage.toFixed(2)}%
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-400 text-sm mb-3">{stock.companyName}</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-gray-400">Quantity:</span>
                                                            <p className="font-medium">{stock.quantity}</p>
                                                        </div>
                                                        {stock.status === 'sold' && (
                                                            <div>
                                                                <span className="text-gray-400">P&L:</span>
                                                                <p className={`font-medium ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                                                    {formatCurrency(profit)}
                                                                </p>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="text-gray-400">Buy Date:</span>
                                                            <p className="font-medium">{new Date(stock.buyDate).toLocaleDateString()}</p>
                                                        </div>
                                                        {stock.status === 'sold' && stock.sellDate && (
                                                            <div>
                                                                <span className="text-gray-400">Sell Date:</span>
                                                                <p className="font-medium">{new Date(stock.sellDate).toLocaleDateString()}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className='absolute top-4 right-4 z-10'>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 p-0 text-white"
                                                        onClick={() => {
                                                            setActionModalStock(stock);
                                                            setIsActionModalOpen(true);
                                                        }}
                                                    >
                                                        <MoreVertical className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modal */}
            <ResponsiveModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={getModalTitle()}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="symbol" className="text-white">Stock Symbol</Label>
                            {modalMode === 'create' ? (
                                <StockSearchInput
                                    onSearch={(symbol) => setFormData(prev => ({ ...prev, symbol }))}
                                    onStockSelect={handleStockSelect}
                                    isLoading={isSubmitting}
                                    placeholder="Search stock symbol (e.g., RELIANCE, TCS)"
                                    showSearchButton={false}
                                />
                            ) : (
                                <Input
                                    id="symbol"
                                    value={formData.symbol}
                                    onChange={(e) => handleInputChange('symbol', e.target.value)}
                                    placeholder="e.g., AAPL"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                                    required
                                    disabled={modalMode === 'sell'}
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyName" className="text-white">Company Name</Label>
                            <Input
                                id="companyName"
                                value={formData.companyName}
                                onChange={(e) => handleInputChange('companyName', e.target.value)}
                                placeholder="e.g., Apple Inc."
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                                required
                                disabled={modalMode === 'sell' || isSubmitting}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity" className="text-white">Quantity</Label>
                            <Input
                                id="quantity"
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => handleInputChange('quantity', e.target.value)}
                                placeholder="100"
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                                required
                                disabled={modalMode === 'sell'}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="buyingPrice" className="text-white">
                                {modalMode === 'sell' ? 'Buying Price (₹)' : 'Price per Share (₹)'}
                            </Label>
                            <Input
                                id="buyingPrice"
                                type="number"
                                step="0.01"
                                value={formData.buyingPrice}
                                onChange={(e) => handleInputChange('buyingPrice', e.target.value)}
                                placeholder="150.00"
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                                required
                                disabled={modalMode === 'sell'}
                            />
                        </div>
                    </div>

                    {modalMode === 'sell' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sellingPrice" className="text-white">Selling Price (₹)</Label>
                                <Input
                                    id="sellingPrice"
                                    type="number"
                                    step="0.01"
                                    value={formData.sellingPrice}
                                    onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                                    placeholder="160.00"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sellDate" className="text-white">Sell Date</Label>
                                <Input
                                    id="sellDate"
                                    type="date"
                                    value={formData.sellDate}
                                    onChange={(e) => handleInputChange('sellDate', e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {(modalMode === 'create' || modalMode === 'edit') && (
                        <div className="space-y-2">
                            <Label htmlFor="buyDate" className="text-white">Purchase Date</Label>
                            <Input
                                id="buyDate"
                                type="date"
                                value={formData.buyDate}
                                onChange={(e) => handleInputChange('buyDate', e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                                required
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 border-white/20 text-white hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-white text-black hover:bg-gray-200"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' :
                                modalMode === 'create' ? 'Add Stock' :
                                    modalMode === 'edit' ? 'Update Stock' : 'Confirm Sale'}
                        </Button>
                    </div>
                </form>
            </ResponsiveModal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isConfirmDeleteOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                message={`Are you sure you want to delete ${stockToDelete?.symbol} (${stockToDelete?.companyName}) from your portfolio? This action cannot be undone.`}
                type="danger"
                confirmText="Delete"
                cancelText="Cancel"
            />
            <ActionModal />
        </div>
    );
};

export default PortfolioPage;