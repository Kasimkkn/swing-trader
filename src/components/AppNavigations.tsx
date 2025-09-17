import React from 'react';
import { Home, BarChart3, Briefcase, Heart, Search, Bell, Settings, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationItem {
    id: string;
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive?: boolean;
}

const AppNavigations: React.FC = () => {
    const pathName = useLocation().pathname;
    const navigationItems: NavigationItem[] = [
        {
            id: 'today',
            label: 'Latest',
            href: '/today',
            icon: Home,
            isActive: true, // Example active state
        },
        {
            id: 'analyse',
            label: 'Search',
            href: '/analyse',
            icon: BarChart3,
        },
        {
            id: 'portfolio',
            label: 'My PR',
            href: '/portfolio',
            icon: Briefcase,
        },
        {
            id: 'wishlist',
            label: 'Heart',
            href: '/wishlist',
            icon: Heart,
        },
    ];

    const NavItem: React.FC<{ item: NavigationItem; className?: string }> = ({ item, className = '' }) => {
        const Icon = item.icon;
        const isActive = pathName === item.href; // <-- check current route

        return (
            <Link
                to={item.href}
                className={`group relative flex md:flex-col items-center py-2 px-2 rounded-md justify-center transition-all duration-200 max-md:gap-2 ${isActive ? 'bg-white/10' : 'text-white hover:text-white/50 hover:bg-white/5'
                    } ${className}`}
                title={item.label}
            >
                <Icon
                    className={`w-5 h-5 md:w-4 md:h-4 md:mb-2 transition-all duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'
                        }`}
                />
                <span className="text-xs">{item.label}</span>
            </Link>
        );
    };


    return (
        <>
            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black backdrop-blur-md border-t border-white/10 z-50">
                <div className="flex items-center justify-around h-16">
                    {navigationItems.map((item) => (
                        <div key={item.id} className="flex-1 flex justify-center">
                            <NavItem item={item} />
                        </div>
                    ))}
                </div>
            </nav>

            {/* Desktop Left Sidebar */}
            <nav className="hidden md:block fixed top-0 left-0 h-screen bg-white/5 backdrop-blur-md border-r border-white/10 z-50 w-16">
                <div className="flex flex-col h-full">
                    {/* Logo/Brand Section */}
                    <div className="flex items-center justify-center p-4 border-b border-white/10">
                        <BarChart3 className="h-7 w-7 text-text-white" />
                    </div>

                    {/* Main Navigation */}
                    <div className="flex-1 flex flex-col items-center py-8 space-y-4">
                        {navigationItems.map((item) => (
                            <NavItem key={item.id} item={item} />
                        ))}
                    </div>

                    {/* Bottom Section */}
                    <div className="flex flex-col items-center pb-6 space-y-4 border-t border-white/10 pt-4">

                        {/* Notifications */}
                        <button className="group relative flex flex-col items-center justify-center p-3 rounded-lg text-white hover:text-white/50 hover:bg-white/5 transition-all duration-200">
                            <Bell className="w-5 h-5 mb-1 group-hover:scale-105 transition-all duration-200" />
                            <span className="text-[10px] font-medium opacity-80">Alerts</span>
                            {/* Notification badge */}
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900"></div>
                        </button>

                        {/* Settings */}
                        <button className="group flex flex-col items-center justify-center p-3 rounded-lg text-white hover:text-white/50 hover:bg-white/5 transition-all duration-200">
                            <Settings className="w-5 h-5 mb-1 group-hover:scale-105 transition-all duration-200" />
                            <span className="text-[10px] font-medium opacity-80">Settings</span>
                        </button>

                    </div>
                </div>
            </nav>
        </>
    );
};

export default AppNavigations;