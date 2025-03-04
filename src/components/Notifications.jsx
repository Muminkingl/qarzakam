import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useLanguage } from "../constants/LanguageContext";

const Notifications = ({ user }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [groupedNotifications, setGroupedNotifications] = useState({});
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Fetch loans and process notifications
  useEffect(() => {
    const fetchUpcomingDueDates = async () => {
      if (!user) return;
      
      const { data: loans, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true });
        
      if (error) {
        console.error('Error fetching loans:', error);
        return;
      }
      
      // Process loans to create notifications
      const now = new Date();
      const notifs = loans
        .map(loan => {
          const dueDate = new Date(loan.due_date);
          const daysLeft = differenceInDays(dueDate, now);
          
          // Only create notifications for loans due within 7 days
          if (daysLeft <= 7 && daysLeft >= 0) {
            return {
              id: loan.id,
              borrowerName: loan.borrower_name,
              dueDate: loan.due_date,
              amount: loan.amount,
              daysLeft,
              type: daysLeft <= 1 ? 'urgent' : 'warning'
            };
          }
          return null;
        })
        .filter(Boolean); // Remove null values
        
      setNotifications(notifs);
      setNotificationCount(notifs.length);
      
      // Group notifications by type
      const grouped = notifs.reduce((acc, notif) => {
        const key = notif.daysLeft === 0 ? 'today' : 
                   notif.daysLeft === 1 ? 'tomorrow' : 
                   'upcoming';
                   
        if (!acc[key]) {
          acc[key] = [];
        }
        
        acc[key].push(notif);
        return acc;
      }, {});
      
      setGroupedNotifications(grouped);
    };
    
    fetchUpcomingDueDates();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('loans')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'loans',
          filter: `user_id=eq.${user.id}`
        }, 
        () => {
          fetchUpcomingDueDates();
        }
      )
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleClearAll = () => {
    setNotifications([]);
    setGroupedNotifications({});
    setNotificationCount(0);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.notification-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'due_today':
        return t("notifications.due_today");
      case 'upcoming':
        return t("notifications.upcoming");
      case 'overdue':
        return t("notifications.overdue");
      default:
        return type;
    }
  };

  return (
    <div className="relative notification-container">
      <button 
        className="p-2.5 rounded-full hover:bg-s4/15 text-p4 relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"></path>
        </svg>
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 min-w-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 rounded-xl border border-s4/25 bg-s2 shadow-xl z-50 transition-all duration-200 transform origin-top-right animate-slideDown">
          <div className="p-4 border-b border-s4/25 flex justify-between items-center">
            <h3 className="text-p4 font-semibold">{t("notifications.title")}</h3>
            {notificationCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded-full">
                {notificationCount}
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-s4/25 scrollbar-track-s4/5">
            {notificationCount > 0 ? (
              <div className="divide-y divide-s4/25">
                {/* Today's notifications */}
                {groupedNotifications.today && groupedNotifications.today.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/10">
                    <h4 className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wider px-2">Due Today</h4>
                    {groupedNotifications.today.map((notif) => (
                      <div 
                        key={notif.id} 
                        className="mt-2 p-3 rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex-shrink-0">
                            <span className="flex h-3 w-3">
                              <span className="animate-ping absolute h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-p4">
                                {notif.borrowerName}
                              </p>
                              <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                                DUE TODAY
                              </span>
                            </div>
                            <p className="text-sm text-p3 mt-1 font-semibold">
                              ${notif.amount.toLocaleString()}
                            </p>
                            <div className="flex items-center mt-2 text-xs text-p3">
                              <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {format(new Date(notif.dueDate), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tomorrow's notifications */}
                {groupedNotifications.tomorrow && groupedNotifications.tomorrow.length > 0 && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/10">
                    <h4 className="text-xs font-medium text-orange-700 dark:text-orange-400 uppercase tracking-wider px-2">Due Tomorrow</h4>
                    {groupedNotifications.tomorrow.map((notif) => (
                      <div 
                        key={notif.id} 
                        className="mt-2 p-3 rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex-shrink-0">
                            <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-p4">
                                {notif.borrowerName}
                              </p>
                              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                                TOMORROW
                              </span>
                            </div>
                            <p className="text-sm text-p3 mt-1 font-semibold">
                              ${notif.amount.toLocaleString()}
                            </p>
                            <div className="flex items-center mt-2 text-xs text-p3">
                              <svg className="w-4 h-4 mr-1 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {format(new Date(notif.dueDate), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upcoming notifications */}
                {groupedNotifications.upcoming && groupedNotifications.upcoming.length > 0 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10">
                    <h4 className="text-xs font-medium text-yellow-700 dark:text-yellow-400 uppercase tracking-wider px-2">Upcoming</h4>
                    {groupedNotifications.upcoming.map((notif) => (
                      <div 
                        key={notif.id} 
                        className="mt-2 p-3 rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex-shrink-0">
                            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-p4">
                                {notif.borrowerName}
                              </p>
                              <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full">
                                {notif.daysLeft} DAYS
                              </span>
                            </div>
                            <p className="text-sm text-p3 mt-1 font-semibold">
                              ${notif.amount.toLocaleString()}
                            </p>
                            <div className="flex items-center mt-2 text-xs text-p3">
                              <svg className="w-4 h-4 mr-1 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {format(new Date(notif.dueDate), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="flex justify-center mb-4 opacity-60">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                  </svg>
                </div>
                <p className="text-p3 text-sm font-medium">{t("notifications.empty")}</p>
                <p className="text-p2 text-xs mt-1">{t("notifications.all_up_to_date")}</p>
              </div>
            )}
          </div>

          {notificationCount > 0 && (
            <div className="p-3 border-t border-s4/25 flex justify-center">
              <button 
                className="py-2 px-4 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                onClick={handleClearAll}
              >
                {t("notifications.mark_all")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;