import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import Notifications from './Notifications';
import { useUserPlan } from '../hooks/useUserPlan';
import { useLanguage } from "../constants/LanguageContext";

const DashboardLayout = ({ children }) => {
  const { t } = useLanguage();
  const { user } = useUser();
  const [isDark, setIsDark] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const { isPremium, loanCount, maxLoans, loading } = useUserPlan(user?.id);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { signOut } = useClerk();
  const [isHeaderProfileMenuOpen, setIsHeaderProfileMenuOpen] = useState(false);

  // Calculate progress percentage
  const progressPercentage = loading 
    ? 0 
    : isPremium 
      ? 100 
      : (loanCount / maxLoans) * 100;
  
  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileMenuOpen && !event.target.closest('.profile-menu')) {
        setIsProfileMenuOpen(false);
      }
      if (isHeaderProfileMenuOpen && !event.target.closest('.header-profile-menu')) {
        setIsHeaderProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen, isHeaderProfileMenuOpen]);

  const navItems = [
    { path: "/dashboard", icon: "💰", label: t("dashboard.sidebar.loans") },
    { path: "/analytics", icon: "📊", label: t("dashboard.sidebar.analytics") },
    { path: "/settings", icon: "⚙️", label: t("dashboard.sidebar.settings") },
  ];
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const isActivePath = (path) => {
    if (path === "/dashboard" && location.pathname === "/") return true;
    return location.pathname === path;
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    if (location.pathname === "/") return "Loans";
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : 'Dashboard';
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className={`flex min-h-screen bg-s1 transition-colors duration-300 ${isDark ? 'dark' : 'light'}`}>
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-screen ${isSidebarCollapsed ? 'w-20' : 'w-72'} 
                   border-r border-s4/25 bg-s2 shadow-lg z-50 transition-all duration-300 ease-in-out
                   lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className={`flex h-16 items-center ${isSidebarCollapsed ? 'justify-center' : 'px-6'} border-b border-s4/25`}>
          {isSidebarCollapsed ? (
            <Link to="/" className="text-p1 text-2xl font-bold">Q</Link>
          ) : (
            <Link to="/" className="text-p4 text-xl font-bold flex items-center">
              <span className="bg-gradient-to-r from-p1 to-p2 bg-clip-text text-transparent mr-2">Q</span>
              <span className="text-p4">Qarzakam</span>
            </Link>
          )}
          
          <button 
            onClick={toggleSidebar}
            className="absolute right-3 top-4 p-1 rounded-lg hover:bg-s4/10 text-p3 hidden lg:block"
            aria-label={isSidebarCollapsed ? t("dashboard.sidebar.expand") : t("dashboard.sidebar.collapse")}
          >
            {isSidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className={`p-4 ${isSidebarCollapsed ? 'px-2' : ''}`}>
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : ''} gap-3 px-4 py-3 rounded-xl 
                           ${isActivePath(item.path) 
                             ? 'bg-gradient-to-r from-p1/20 to-p2/20 text-p1 font-medium' 
                             : 'hover:bg-s4/10 text-p4'} 
                           transition-all duration-200`}
                aria-current={isActivePath(item.path) ? 'page' : undefined}
              >
                <span className="text-xl">{item.icon}</span>
                {!isSidebarCollapsed && (
                  <span className={isActivePath(item.path) ? 'bg-gradient-to-r from-p1 to-p2 bg-clip-text text-transparent' : ''}>
                    {item.label}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className={`absolute bottom-0 left-0 w-full p-4 space-y-4 ${isSidebarCollapsed ? 'px-2' : ''}`}>
          {/* Plan Card - Improved design */}
          {!isSidebarCollapsed && (
            <div className="rounded-xl bg-gradient-to-r from-p1/10 to-p2/10 p-4 border border-p1/10 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-p4 font-medium flex items-center">
                  {isPremium ? t("dashboard.plan.premium") : t("dashboard.plan.free")}
                </span>
                {!isPremium && (
                  <button 
                    onClick={() => {/* Add your upgrade logic here */}}
                    className="text-sm font-medium px-3 py-1 rounded-full bg-gradient-to-r from-p1 to-p2 text-white hover:opacity-90 transition-opacity"
                  >
                    {t("dashboard.plan.upgrade")}
                  </button>
                )}
              </div>
              <div className="h-2 bg-s4/25 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-p1 to-p2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              <p className="text-sm text-p3 mt-2">
                {loading ? (
                  <span className="animate-pulse">{t("dashboard.plan.loading")}</span>
                ) : isPremium ? (
                  t("dashboard.plan.unlimited")
                ) : (
                  t("dashboard.plan.usage")
                    .replace('{{used}}', loanCount)
                    .replace('{{total}}', maxLoans)
                )}
              </p>
            </div>
          )}

          {/* User profile in sidebar - hidden on mobile as requested */}
          {!isSidebarCollapsed ? (
            <div className="relative profile-menu hidden lg:block">
              <div 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-s4/10 mt-2 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-p1 to-p2 flex items-center justify-center text-white font-medium shadow-sm">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-p4 font-medium truncate">{user?.firstName || 'User'}</p>
                  <p className="text-sm text-p3 truncate">{user?.primaryEmailAddress?.emailAddress || 'user@example.com'}</p>
                </div>
                <svg 
                  className={`w-4 h-4 text-p3 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-s2 rounded-xl border border-s4/25 shadow-lg overflow-hidden">
                  <Link 
                    to="/settings" 
                    className="flex items-center gap-2 px-4 py-3 hover:bg-s4/10 text-p4"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t("dashboard.profile.settings")}
                  </Link>
                  <div className="h-px bg-s4/25"></div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-s4/10 text-red-500 w-full text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t("dashboard.profile.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative profile-menu hidden lg:block">
              <div 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex justify-center mt-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-p1 to-p2 flex items-center justify-center text-white font-medium cursor-pointer shadow-sm">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
              </div>

              {/* Dropdown Menu for collapsed sidebar */}
              {isProfileMenuOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-48 mb-2 bg-s2 rounded-xl border border-s4/25 shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-s4/25">
                    <p className="text-p4 font-medium truncate">{user?.firstName || 'User'}</p>
                    <p className="text-sm text-p3 truncate">{user?.primaryEmailAddress?.emailAddress || 'user@example.com'}</p>
                  </div>
                  <Link 
                    to="/settings" 
                    className="flex items-center gap-2 px-4 py-3 hover:bg-s4/10 text-p4"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t("dashboard.profile.settings")}
                  </Link>
                  <div className="h-px bg-s4/25"></div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-s4/10 text-red-500 w-full text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t("dashboard.profile.logout")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 lg:ml-72 transition-all duration-300">
        {/* Top Bar - Modified to only show profile button on mobile/zoomed view */}
        <header className="h-16 border-b border-s4/25 bg-s2 px-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-s4/10 text-p4 lg:hidden mr-2"
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <h1 className="text-p4 font-medium hidden sm:block">{getCurrentPageTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Notifications user={user} />
            
            {/* Header profile - only show on small screens or when zoomed */}
            <div className="relative header-profile-menu lg:hidden">
              <div 
                onClick={() => setIsHeaderProfileMenuOpen(!isHeaderProfileMenuOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-p1 to-p2 flex items-center justify-center text-white font-medium shadow-sm cursor-pointer"
              >
                {user?.firstName?.charAt(0) || 'U'}
              </div>

              {/* Dropdown Menu */}
              {isHeaderProfileMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-s2 rounded-xl border border-s4/25 shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-s4/25">
                    <p className="text-p4 font-medium truncate">{user?.firstName || 'User'}</p>
                    <p className="text-sm text-p3 truncate">{user?.primaryEmailAddress?.emailAddress || 'user@example.com'}</p>
                  </div>
                  <Link 
                    to="/settings" 
                    className="flex items-center gap-2 px-4 py-3 hover:bg-s4/10 text-p4"
                    onClick={() => setIsHeaderProfileMenuOpen(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t("dashboard.profile.settings")}
                  </Link>
                  <div className="h-px bg-s4/25"></div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-s4/10 text-red-500 w-full text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t("dashboard.profile.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Page Content - Improved with better spacing and card design */}
        <div className="p-4 md:p-6 lg:p-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-p1 to-p2 bg-clip-text text-transparent">
              {t("dashboard.welcome", { name: user?.firstName || 'User' }).replace('{{name}}', user?.firstName || 'User')}
            </h1>
            <p className="text-p3 mt-1">{t("dashboard.overview")}</p>
          </div>
          
          <div className="bg-s2 rounded-xl border border-s4/25 shadow-sm p-4 md:p-6 min-h-[calc(100vh-220px)] hover:shadow-md transition-shadow">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;