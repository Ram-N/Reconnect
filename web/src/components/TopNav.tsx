import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '../lib/api';
import { useState } from 'react';

interface TopNavProps {
    user?: any;
    showBack?: boolean;
    title?: string;
}

export function TopNav({ user, showBack = false, title }: TopNavProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const getLinkClass = (path: string) => {
        const isActive = location.pathname === path;
        return `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`;
    };

    const handleMenuClick = (path: string) => {
        navigate(path);
        setShowMenu(false);
    };

    return (
        <>
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                    <div className="flex justify-between items-center h-14 sm:h-16">
                        {/* Left: Back button or Logo + Title */}
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                            {showBack ? (
                                <button
                                    onClick={() => navigate(-1)}
                                    className="p-1.5 sm:p-2 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
                                    aria-label="Go back"
                                >
                                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            ) : (
                                <Link to="/" className="flex items-center flex-shrink-0">
                                    <span className="text-lg sm:text-xl font-bold text-blue-600">Reconnect</span>
                                </Link>
                            )}
                            {title && <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h1>}
                        </div>

                        {/* Right: Hamburger menu + User profile */}
                        <div className="flex items-center gap-2">
                            {/* Hamburger Menu Button */}
                            {user && (
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                    aria-label="Menu"
                                >
                                    {showMenu ? (
                                        <X className="w-5 h-5" />
                                    ) : (
                                        <Menu className="w-5 h-5" />
                                    )}
                                </button>
                            )}

                            {/* User Profile (Desktop) */}
                            {user && (
                                <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 bg-gray-50 rounded-lg px-2 sm:px-3 py-1.5 flex-shrink-0">
                                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                                    <span className="text-xs sm:text-sm text-gray-700 hidden md:inline max-w-[120px] truncate">{user.email}</span>
                                    <button
                                        onClick={handleLogout}
                                        className="p-1 sm:p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Sign out"
                                    >
                                        <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Dropdown */}
            {showMenu && user && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setShowMenu(false)}>
                    <div
                        className="absolute right-0 top-14 sm:top-16 w-64 bg-white shadow-lg rounded-bl-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* User Info */}
                        <div className="p-4 border-b bg-gray-50">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700 truncate">{user.email}</span>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <nav className="p-2">
                            <button
                                onClick={() => handleMenuClick('/')}
                                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                                    location.pathname === '/'
                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                Home
                            </button>
                            <button
                                onClick={() => handleMenuClick('/contacts')}
                                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                                    location.pathname === '/contacts'
                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                Contacts
                            </button>
                            <button
                                onClick={() => handleMenuClick('/record')}
                                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                                    location.pathname === '/record'
                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                Record Note
                            </button>
                            <button
                                onClick={() => handleMenuClick('/follow-ups')}
                                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                                    location.pathname === '/follow-ups'
                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                Follow-ups
                            </button>
                        </nav>

                        {/* Logout Button */}
                        <div className="p-2 border-t">
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
