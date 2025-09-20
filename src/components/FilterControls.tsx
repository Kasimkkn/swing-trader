import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, X, Filter, SortAsc, Search, RotateCcw, Sliders } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import ResponsiveModal from './ui/responsive-modal';

interface FilterControlsProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    sortBy: string;
    setSortBy: (value: any) => void;
    sortOrder: 'asc' | 'desc';
    setSortOrder: (value: 'asc' | 'desc') => void;
    filterStatus: string;
    setFilterStatus: (value: any) => void;
    priceRangeFilter: { min: string; max: string };
    setPriceRangeFilter: (value: { min: string; max: string }) => void;
    dateRangeFilter: { start: string; end: string };
    setDateRangeFilter: (value: { start: string; end: string }) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filterStatus,
    setFilterStatus,
    priceRangeFilter,
    setPriceRangeFilter,
    dateRangeFilter,
    setDateRangeFilter,
}) => {
    const [startDate, setStartDate] = useState<Date | undefined>(
        dateRangeFilter.start ? new Date(dateRangeFilter.start) : undefined
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
        dateRangeFilter.end ? new Date(dateRangeFilter.end) : undefined
    );
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const handleStartDateSelect = (date: Date | undefined) => {
        setStartDate(date);
        setDateRangeFilter({
            ...dateRangeFilter,
            start: date ? format(date, 'yyyy-MM-dd') : ''
        });
    };

    const handleEndDateSelect = (date: Date | undefined) => {
        setEndDate(date);
        setDateRangeFilter({
            ...dateRangeFilter,
            end: date ? format(date, 'yyyy-MM-dd') : ''
        });
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setPriceRangeFilter({ min: '', max: '' });
        setDateRangeFilter({ start: '', end: '' });
        setFilterStatus('all');
        setSortBy('buyDate');
        setSortOrder('desc');
        setStartDate(undefined);
        setEndDate(undefined);
    };

    const hasActiveFilters = searchTerm ||
        priceRangeFilter.min ||
        priceRangeFilter.max ||
        dateRangeFilter.start ||
        dateRangeFilter.end ||
        filterStatus !== 'all' ||
        sortBy !== 'buyDate' ||
        sortOrder !== 'desc';

    return (
        <>
            {/* Main Filter Bar - Only Search and Filter Toggle */}
            <Card className="bg-white/5 border-white/10 border mb-6">
                <CardContent className="p-3">
                    <div className="flex gap-2 justify-between">
                        {/* Search Input */}
                        <div className="relative w-full">
                            <Input
                                placeholder="Symbol or company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 pr-8"
                            />
                            {searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        <Button
                            onClick={() => setIsFilterModalOpen(true)}
                            variant="outline"
                            className="border-white/20 hover:bg-white/5 text-white"
                        >
                            <Sliders className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Filter Modal */}
            <ResponsiveModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                title="Filter & Sort Options"
            >
                <div className="space-y-6 relative">
                    {/* Sort & Status Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Sort By */}
                        <div className="space-y-2">
                            <Label className="text-white flex items-center gap-2">
                                <SortAsc className="w-4 h-4" />
                                Sort By
                            </Label>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select sort by" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-white/20">
                                    <SelectItem value="buyDate">Buy Date</SelectItem>
                                    <SelectItem value="symbol">Symbol</SelectItem>
                                    <SelectItem value="companyName">Company</SelectItem>
                                    <SelectItem value="quantity">Quantity</SelectItem>
                                    <SelectItem value="buyingPrice">Price</SelectItem>
                                    <SelectItem value="profit">Profit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sort Order */}
                        <div className="space-y-2">
                            <Label className="text-white">Order</Label>
                            <Select value={sortOrder} onValueChange={(val) => setSortOrder(val as "asc" | "desc")}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select order" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-white/20">
                                    <SelectItem value="desc">Newest First</SelectItem>
                                    <SelectItem value="asc">Oldest First</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-2">
                            <Label className="text-white">Status</Label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-white/20">
                                    <SelectItem value="all">All Stocks</SelectItem>
                                    <SelectItem value="hold">Current Holdings</SelectItem>
                                    <SelectItem value="sold">Sold Positions</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    <div className="space-y-6">
                        <div className="border-t border-white/10 pt-6">
                            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                Advanced Filters
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Price Range */}
                                <div className="space-y-3">
                                    <Label className="text-white font-medium">Price Range (₹)</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-gray-400 text-xs">Min Price</Label>
                                            <Input
                                                placeholder="0.00"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={priceRangeFilter.min}
                                                onChange={(e) => setPriceRangeFilter({ ...priceRangeFilter, min: e.target.value })}
                                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-gray-400 text-xs">Max Price</Label>
                                            <Input
                                                placeholder="999999.99"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={priceRangeFilter.max}
                                                onChange={(e) => setPriceRangeFilter({ ...priceRangeFilter, max: e.target.value })}
                                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div className="space-y-3">
                                    <Label className="text-white font-medium">Date Range</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-gray-400 text-xs">Start Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10"
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {startDate ? format(startDate, 'MMM dd, yyyy') : 'Pick start date'}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-gray-900 border-white/20" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={startDate}
                                                        onSelect={handleStartDateSelect}
                                                        disabled={(date) => endDate && date > endDate}
                                                        initialFocus
                                                        className="bg-gray-900 text-white"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-gray-400 text-xs">End Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10"
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {endDate ? format(endDate, 'MMM dd, yyyy') : 'Pick end date'}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-gray-900 border-white/20" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={endDate}
                                                        onSelect={handleEndDateSelect}
                                                        disabled={(date) => startDate && date < startDate}
                                                        initialFocus
                                                        className="bg-gray-900 text-white"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="fixed bottom-0 left-0 w-full bg-black border-t border-white/20 p-4 flex items-center justify-between gap-3">
                        <Button
                            onClick={clearAllFilters}
                            variant="outline"
                            className="border-white/20 hover:bg-white/5 text-white"
                            disabled={!hasActiveFilters}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Clear All
                        </Button>

                        <Button
                            onClick={() => setIsFilterModalOpen(false)}
                            className=""
                        >
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </ResponsiveModal>
        </>
    );
};

export default FilterControls;