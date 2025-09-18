import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ResponsiveModal from '@/components/ui/responsive-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit2, IndianRupee, PieChart, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import ConfirmationModal from './ui/confirmation-modal';

interface Stock {
    id: string;
    symbol: string;
    companyName: string;
    quantity: number;
    buyingPrice: number;
    sellingPrice?: number;
    status: 'hold' | 'sold';
    buyDate: string;
    sellDate?: string;
}

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
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'sell'>('create');
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [stockToDelete, setStockToDelete] = useState<Stock | null>(null);
    const [formData, setFormData] = useState<FormData>({
        symbol: '',
        companyName: '',
        quantity: '',
        buyingPrice: '',
        sellingPrice: '',
        buyDate: new Date().toISOString().split('T')[0],
        sellDate: ''
    });

    // Load data from localStorage on component mount
    useEffect(() => {
        const savedStocks = localStorage.getItem('portfolio-stocks');
        if (savedStocks) {
            setStocks(JSON.parse(savedStocks));
        }
    }, []);

    // Save to localStorage whenever stocks change
    useEffect(() => {
        localStorage.setItem('portfolio-stocks', JSON.stringify(stocks));
    }, [stocks]);

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

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const openCreateModal = () => {
        resetForm();
        setModalMode('create');
        setSelectedStock(null);
        setIsModalOpen(true);
    };

    const openEditModal = (stock: Stock) => {
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

    const openSellModal = (stock: Stock) => {
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newStock: Stock = {
            id: selectedStock?.id || Date.now().toString(),
            symbol: formData.symbol.toUpperCase(),
            companyName: formData.companyName,
            quantity: parseInt(formData.quantity),
            buyingPrice: parseFloat(formData.buyingPrice),
            sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : undefined,
            status: modalMode === 'sell' ? 'sold' : (selectedStock?.status || 'hold'),
            buyDate: formData.buyDate,
            sellDate: modalMode === 'sell' ? formData.sellDate : selectedStock?.sellDate
        };

        if (modalMode === 'create') {
            setStocks(prev => [...prev, newStock]);
        } else {
            setStocks(prev => prev.map(stock =>
                stock.id === selectedStock?.id ? newStock : stock
            ));
        }

        setIsModalOpen(false);
        resetForm();
    };

    const handleDelete = (id: string) => {
        const stock = stocks.find(s => s.id === id);
        if (stock) {
            setStockToDelete(stock);
            setIsConfirmDeleteOpen(true);
        }
    };

    const handleConfirmDelete = () => {
        if (stockToDelete) {
            setStocks(prev => prev.filter(stock => stock.id !== stockToDelete.id));
            setIsConfirmDeleteOpen(false);
            setStockToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setIsConfirmDeleteOpen(false);
        setStockToDelete(null);
    };
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
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                    <div className="grid gap-4">
                        {holdingStocks.length === 0 ? (
                            <Card className="bg-white/5 border-white/10 border">
                                <CardContent className="p-8 text-center">
                                    <p className="text-gray-400 mb-4">No holdings found</p>
                                    <Button onClick={openCreateModal} variant="outline" className="border-white/20 hover:bg-white/5">
                                        Add Your First Stock
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            holdingStocks.map((stock) => (
                                <Card key={stock.id} className="bg-white/5 border-white/10 border hover:bg-white/10 transition-colors">
                                    <CardContent className="p-6">
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
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => openSellModal(stock)}
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    Sell
                                                </Button>
                                                <Button
                                                    onClick={() => openEditModal(stock)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-white/20 hover:bg-white/5"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    onClick={() => handleDelete(stock.id)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
                    <div className="grid gap-4">
                        {soldStocks.length === 0 ? (
                            <Card className="bg-white/5 border-white/10 border">
                                <CardContent className="p-8 text-center">
                                    <p className="text-gray-400">No sold stocks found</p>
                                </CardContent>
                            </Card>
                        ) : (
                            soldStocks.map((stock) => {
                                const profit = (stock.sellingPrice - stock.buyingPrice) * stock.quantity;
                                const profitPercentage = ((stock.sellingPrice - stock.buyingPrice) / stock.buyingPrice) * 100;
                                const isProfit = profit > 0;

                                return (
                                    <Card key={stock.id} className="bg-white/5 border-white/10 border hover:bg-white/10 transition-colors">
                                        <CardContent className="p-6">
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
                                                            <p className="font-medium">{formatCurrency(stock.sellingPrice!)}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">P&L:</span>
                                                            <p className={`font-medium ${((parseFloat(formData.sellingPrice) - parseFloat(formData.buyingPrice)) / parseFloat(formData.buyingPrice)) * 100 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                {((parseFloat(formData.sellingPrice) - parseFloat(formData.buyingPrice)) / parseFloat(formData.buyingPrice) * 100).toFixed(2)}%
                                                            </p>
                                                            <div>
                                                                <span className="text-gray-400">Sell Date:</span>
                                                                <p className="font-medium">{stock.sellDate ? new Date(stock.sellDate).toLocaleDateString() : 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => openEditModal(stock)}
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-white/20 hover:bg-white/5"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDelete(stock.id)}
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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
                    <div className="grid gap-4">
                        {stocks.length === 0 ? (
                            <Card className="bg-white/5 border-white/10 border">
                                <CardContent className="p-8 text-center">
                                    <p className="text-gray-400">No transaction history found</p>
                                </CardContent>
                            </Card>
                        ) : (
                            stocks.map((stock) => {
                                const profit = stock.status === 'sold' ? (stock.sellingPrice! - stock.buyingPrice) * stock.quantity : 0;
                                const profitPercentage = stock.status === 'sold' ? ((stock.sellingPrice! - stock.buyingPrice) / stock.buyingPrice) * 100 : 0;
                                const isProfit = profit > 0;

                                return (
                                    <Card key={stock.id} className="bg-white/5 border-white/10 border hover:bg-white/10 transition-colors">
                                        <CardContent className="p-6">
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
                                                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-400">Quantity:</span>
                                                            <p className="font-medium">{stock.quantity}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Buy Price:</span>
                                                            <p className="font-medium">{formatCurrency(stock.buyingPrice)}</p>
                                                        </div>
                                                        {stock.status === 'sold' && (
                                                            <div>
                                                                <span className="text-gray-400">Sell Price:</span>
                                                                <p className="font-medium">{formatCurrency(stock.sellingPrice!)}</p>
                                                            </div>
                                                        )}
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
                                                <div className="flex gap-2">
                                                    {stock.status === 'hold' && (
                                                        <Button
                                                            onClick={() => openSellModal(stock)}
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                        >
                                                            Sell
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => openEditModal(stock)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-white/20 hover:bg-white/5"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDelete(stock.id)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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
                            <Input
                                id="symbol"
                                value={formData.symbol}
                                onChange={(e) => handleInputChange('symbol', e.target.value)}
                                placeholder="e.g., AAPL"
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                                required
                                disabled={modalMode === 'sell'}
                            />
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
                                disabled={modalMode === 'sell'}
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
                        >
                            {modalMode === 'create' ? 'Add Stock' : modalMode === 'edit' ? 'Update Stock' : 'Confirm Sale'}
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
        </div>
    );
};

export default PortfolioPage;