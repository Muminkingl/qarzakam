import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Moon, Sun, Shield, Download, Trash2, Save, Globe, Clock } from 'lucide-react';
import { useLanguage } from '../constants/LanguageContext';


const Settings = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { language, changeLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [accountActivity, setAccountActivity] = useState([]);
  const [timeFormat, setTimeFormat] = useState('12h');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [tempLanguage, setTempLanguage] = useState(language);

  // Fetch user activity on load
  useEffect(() => {
    
    // Load saved preferences
    const savedPrefs = localStorage.getItem('userPreferences');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setTimeFormat(prefs.timeFormat || '12h');
      setDarkMode(prefs.darkMode !== undefined ? prefs.darkMode : true);
    }
  }, [user?.id]);

  // Update theme when darkMode changes
  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !darkMode);
    document.documentElement.classList.toggle('dark-mode', darkMode);
    
    // Apply additional theme-specific styles
    if (darkMode) {
      document.body.style.backgroundColor = '#121212';
      document.body.style.color = '#e0e0e0';
    } else {
      document.body.style.backgroundColor = '#f5f5f5';
      document.body.style.color = '#333333';
    }
  }, [darkMode]);

  // Function to fetch recent account activity
  const fetchRecentActivity = async () => {
    try {
      // In a real implementation, this would be fetched from your database
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      setAccountActivity(data || [
        { id: 1, action: 'Logged in', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, action: 'Updated password', created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 3, action: 'Created new loan', created_at: new Date(Date.now() - 172800000).toISOString() }
      ]);
    } catch (error) {
      console.error('Error fetching activity:', error);
      showErrorMessage('Unable to fetch recent activity');
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(language === 'kd' ? 'ar-IQ' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: timeFormat === '12h' ? 'numeric' : '2-digit',
      minute: '2-digit',
      hour12: timeFormat === '12h'
    });
  };

  // Function to export loan data
  const handleExportData = async () => {
    try {
      setExportLoading(true);

      // Fetch all loans for the user
      const { data: loans, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Define CSV headers
      const headers = [
        'Loan ID',
        'Borrower Name',
        'Amount',
        'Currency',
        'Status',
        'Created Date',
        'Due Date',
        'Paid Date',
        'Notes'
      ];

      // Format loan data for CSV
      const csvData = loans.map(loan => [
        loan.id,
        loan.borrower_name,
        loan.amount,
        loan.currency,
        loan.status,
        formatDate(loan.created_at),
        formatDate(loan.due_date),
        loan.paid_date ? formatDate(loan.paid_date) : 'Not paid',
        loan.notes || ''
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Set download attributes
      link.setAttribute('href', url);
      link.setAttribute('download', `loan_data_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccessMessage('Data exported successfully!');

    } catch (error) {
      console.error('Error exporting data:', error);
      showErrorMessage('Failed to export data');
    } finally {
      setExportLoading(false);
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showErrorMessage = (message) => {
    setErrorMessage(message);
    setSuccessMessage('');
    setTimeout(() => setErrorMessage(''), 4000);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Save preferences to localStorage first
      const preferences = {
        darkMode,
        language: tempLanguage,
      };
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      
      // Apply the language change
      changeLanguage(tempLanguage);
      
      // Only try to save to Supabase if we have a user
      if (user?.id) {
        // First, check if the user preferences exist
        const { data: existingPrefs, error: fetchError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Fetch error:', fetchError);
          throw new Error('Failed to check existing preferences');
        }

        // If preferences exist, update them. If not, insert new ones
        const { error: upsertError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            preferences: {
              dark_mode: darkMode,
              language: tempLanguage,
            },
            updated_at: new Date().toISOString()
          });

        if (upsertError) {
          console.error('Upsert error:', upsertError);
          throw new Error('Failed to save preferences');
        }
      }
      
      setSuccessMessage(t('settings.saveSuccess'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
      // Continue with the UI updates even if database save fails
      changeLanguage(tempLanguage);
      setSuccessMessage(t('settings.saveSuccess'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation === 'DELETE') {
      setLoading(true);
      try {
        // First delete all user data from Supabase
        const { error: loansError } = await supabase
          .from('loans')
          .delete()
          .eq('user_id', user?.id);

        if (loansError) {
          console.error('Error deleting loans:', loansError);
        }

        const { error: prefsError } = await supabase
          .from('user_preferences')
          .delete()
          .eq('user_id', user?.id);

        if (prefsError) {
          console.error('Error deleting preferences:', prefsError);
        }

        // Show success message
        setSuccessMessage(t('settings.deleteSuccess'));
        
        // Clear local storage
        localStorage.clear();
        
        // Close modal
        setIsDeleteModalOpen(false);

        // Sign out the user first
        await signOut();
        
        // Redirect to landing page
        window.location.href = '/';
        
      } catch (error) {
        console.error('Delete error:', error);
        setErrorMessage(t('settings.deleteError'));
      } finally {
        setLoading(false);
      }
    }
  };

  const PrivacyModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-s2 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-s4/25">
          <h3 className="text-xl font-semibold text-p4">Privacy Policy - Qarzakam</h3>
        </div>
        <div className="p-6 space-y-4 text-p3">
          <section>
            <h4 className="text-lg font-medium text-p4 mb-2">Data Collection</h4>
            <p>At Qarzakam, we collect and store only essential information needed to manage your loans:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Basic profile information (name, email)</li>
              <li>Loan details (amounts, dates, status)</li>
              <li>Transaction history</li>
            </ul>
          </section>

          <section>
            <h4 className="text-lg font-medium text-p4 mb-2">How We Use Your Data</h4>
            <p>Your data is used exclusively for:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Managing your loan records</li>
              <li>Sending important notifications</li>
              <li>Improving our services</li>
            </ul>
          </section>

          <section>
            <h4 className="text-lg font-medium text-p4 mb-2">Data Security</h4>
            <p>We implement strong security measures to protect your data:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>End-to-end encryption for sensitive data</li>
              <li>Regular security audits</li>
              <li>Secure data storage practices</li>
            </ul>
          </section>
        </div>
        <div className="p-6 border-t border-s4/25 flex justify-end">
          <button
            onClick={() => setIsPrivacyModalOpen(false)}
            className="px-4 py-2 bg-s4/10 hover:bg-s4/20 rounded-lg text-p4 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  const DeleteAccountModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-s2 rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-s4/25">
          <h3 className="text-xl font-semibold text-red-500">{t('settings.deleteTitle')}</h3>
          <p className="mt-2 text-p3">{t('settings.deleteWarning')}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-500/10 p-4 rounded-lg">
            <h4 className="text-red-500 font-medium mb-2">{t('settings.deleteEffects')}</h4>
            <ul className="text-red-400 space-y-2 text-sm">
              <li>• {t('settings.deleteEffect1')}</li>
              <li>• {t('settings.deleteEffect2')}</li>
              <li>• {t('settings.deleteEffect3')}</li>
              <li>• {t('settings.deleteEffect4')}</li>
            </ul>
          </div>
          <div className="bg-s4/10 p-4 rounded-lg">
            <p className="text-p3 text-sm">{t('settings.deleteConfirmation')}</p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="mt-2 w-full bg-s3 border border-s4/25 rounded-lg px-3 py-2 text-p4"
              placeholder="DELETE"
              dir="ltr"
            />
          </div>
        </div>
        <div className="p-6 border-t border-s4/25 flex justify-end gap-3">
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            className="px-4 py-2 bg-s4/10 hover:bg-s4/20 rounded-lg text-p4 transition-colors"
          >
            {t('settings.cancelButton')}
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirmation !== 'DELETE' || loading}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 
              disabled:hover:bg-red-500 rounded-lg text-white transition-colors 
              flex items-center gap-2"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-white"></span>
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {t('settings.deleteButton')}
          </button>
        </div>
      </div>
    </div>
  );

  const NotificationToast = ({ message, type }) => (
    <div className={`fixed top-20 right-4 p-4 mb-4 rounded shadow-md z-50 animate-fade-in-out
      ${type === 'success' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <p className={`text-sm ${type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message}</p>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification toasts */}
        {successMessage && <NotificationToast message={successMessage} type="success" />}
        {errorMessage && <NotificationToast message={errorMessage} type="error" />}

        {/* Page Header */}
        <div className="border-b border-s4/25 pb-5 mb-6">
          <h2 className="text-3xl font-bold text-p4">{t('settings.title')}</h2>
          <p className="mt-1 text-p3">{t('settings.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Preferences */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Section */}
            <div className="bg-s3 p-6 rounded-xl border border-s4/25 shadow-sm transition-all hover:shadow-md">
              <h3 className="text-xl font-semibold text-p4 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-p1" />
                {t('profileInfo')}
              </h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative group">
                  <img
                    src={user?.imageUrl || 'https://via.placeholder.com/100'}
                    alt="Profile"
                    className="h-20 w-20 rounded-full border-2 border-p1/20 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                    <button className="text-white text-xs bg-p1 rounded-full px-2 py-1">
                      {t('change')}
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-p4 font-medium text-lg">{user?.fullName || 'User Name'}</p>
                  <p className="text-p3">{user?.primaryEmailAddress?.emailAddress || 'email@example.com'}</p>
                </div>
              </div>
            </div>

            {/* Appearance Section */}
            <div className="bg-s3 p-6 rounded-xl border border-s4/25 shadow-sm transition-all hover:shadow-md">
              <h3 className="text-xl font-semibold text-p4 mb-4">
                {t('settings.appearance')}
              </h3>
              
              <div className="space-y-6">
                {/* Theme Toggle */}
                <div className="p-4 bg-s2/50 rounded-lg">
                  <p className="text-p4 font-medium mb-2">{t('settings.theme')}</p>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setDarkMode(false)}
                      className={`flex-1 p-3 rounded-lg flex items-center justify-center space-x-2 transition-all ${!darkMode ? 'bg-white shadow-md ring-2 ring-p1' : 'bg-s2/70 hover:bg-s2'}`}
                    >
                      <Sun className="w-4 h-4" />
                      <span>{t('settings.light')}</span>
                    </button>
                    <button 
                      onClick={() => setDarkMode(true)}
                      className={`flex-1 p-3 rounded-lg flex items-center justify-center space-x-2 transition-all ${darkMode ? 'bg-s4 text-white shadow-md ring-2 ring-p1' : 'bg-s2/70 hover:bg-s2'}`}
                    >
                      <Moon className="w-4 h-4" />
                      <span>{t('settings.dark')}</span>
                    </button>
                  </div>
                </div>

                {/* Language Selection */}
                <div className="p-4 bg-s2/50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Globe className="w-4 h-4 mr-2 text-p1" />
                    <p className="text-p4 font-medium">{t('settings.language')}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setTempLanguage('en')}
                      className={`flex-1 p-3 rounded-lg flex items-center justify-center transition-all ${tempLanguage === 'en' ? 'bg-white shadow-md ring-2 ring-p1' : 'bg-s2/70 hover:bg-s2'}`}
                    >
                      English
                    </button>
                    <button 
                      onClick={() => setTempLanguage('kd')}
                      className={`flex-1 p-3 rounded-lg flex items-center justify-center transition-all ${tempLanguage === 'kd' ? 'bg-white shadow-md ring-2 ring-p1' : 'bg-s2/70 hover:bg-s2'}`}
                    >
                      کوردی
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Security & Data */}
          <div className="space-y-6">
            {/* Data & Privacy */}
            <div className="bg-s3 p-6 rounded-xl border border-s4/25 shadow-sm transition-all hover:shadow-md">
              <h3 className="text-xl font-semibold text-p4 mb-4">
                Data & Privacy
              </h3>
              <div className="space-y-4">
                <button 
                  onClick={() => setIsPrivacyModalOpen(true)}
                  className="w-full text-left p-3 bg-s2/50 rounded-lg hover:bg-s2/70 transition-colors flex flex-col"
                >
                  <p className="text-p4 font-medium">
                    Privacy Policy
                  </p>
                  <p className="text-sm text-p3">
                    View our privacy policy
                  </p>
                </button>
                <button 
                  onClick={handleExportData}
                  disabled={exportLoading}
                  className="w-full text-left p-3 bg-s2/50 rounded-lg hover:bg-s2/70 transition-colors flex flex-col"
                >
                  <p className="text-p4 font-medium flex items-center">
                    <Download className="w-4 h-4 mr-2 inline-block" />
                    Export Data
                  </p>
                  <p className="text-sm text-p3">
                    Download a copy of your loan data
                  </p>
                </button>
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full text-left p-3 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors flex flex-col"
                >
                  <p className="text-red-500 font-medium flex items-center">
                    <Trash2 className="w-4 h-4 mr-2 inline-block" />
                    Delete Account
                  </p>
                  <p className="text-sm text-red-400">
                    Permanently remove your account and data
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end py-6 mt-6 border-t border-s4/25">
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-p1 to-p2 text-white rounded-lg 
              hover:from-p2 hover:to-p1 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-white"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>

        {/* Modals */}
        {isPrivacyModalOpen && <PrivacyModal onClose={() => setIsPrivacyModalOpen(false)} />}
        {isDeleteModalOpen && <DeleteAccountModal onClose={() => setIsDeleteModalOpen(false)} />}
      </div>
    </DashboardLayout>
  );
};

export default Settings;