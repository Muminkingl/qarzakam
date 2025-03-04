import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { useUserPlan } from '../hooks/useUserPlan';
import { X, Save } from 'lucide-react';
import { useLanguage } from "../constants/LanguageContext";

const NewLoanModal = ({ isOpen, onClose, onLoanCreated }) => {
  const { user } = useUser();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    borrowerName: '',
    borrowerEmail: '',
    borrowerPhone: '',
    amount: '',
    currency: 'USD',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('borrower'); // 'borrower', 'loan', 'notes'
  const { isPremium, loanCount, maxLoans, canAddMore } = useUserPlan(user?.id);

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'IQD', label: 'IQD - Iraqi Dinar' },
    { value: 'BTC', label: 'BTC - Bitcoin' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Strict check before allowing loan creation
    if (!canAddMore || (!isPremium && loanCount >= maxLoans)) {
      setError('You have reached the maximum number of loans (10) for the free plan. Please upgrade to Premium to add more loans.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Double-check the loan count from the database
      const { data: currentLoans, error: countError } = await supabase
        .from('loans')
        .select('id')
        .eq('user_id', user.id);

      if (countError) throw countError;

      // Final verification before creating the loan
      if (!isPremium && currentLoans.length >= maxLoans) {
        throw new Error('Maximum loan limit reached. Please upgrade to Premium to add more loans.');
      }

      // First ensure user exists in Supabase
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userCheckError || !existingUser) {
        // Create user if doesn't exist
        const { error: createUserError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              full_name: `${user.firstName} ${user.lastName}`.trim(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);

        if (createUserError) {
          throw new Error('Failed to create user profile');
        }
      }

      const newLoan = {
        user_id: user.id,
        borrower_name: formData.borrowerName,
        borrower_email: formData.borrowerEmail,
        borrower_phone: formData.borrowerPhone,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        start_date: formData.startDate,
        due_date: formData.dueDate,
        notes: formData.notes,
        status: 'pending'
      };

      const { data, error: insertError } = await supabase
        .from('loans')
        .insert([newLoan])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      onLoanCreated(data);
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to create loan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Disable the submit button if can't add more loans
  const isSubmitDisabled = !canAddMore || (!isPremium && loanCount >= maxLoans) || isLoading;

  // Modal close handlers
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Tab navigation
  const tabs = [
    { id: 'borrower', label: 'Borrower', icon: 'user' },
    { id: 'loan', label: 'Loan Details', icon: 'money' },
    { id: 'notes', label: 'Notes', icon: 'note' }
  ];

  const renderTabIcon = (iconName) => {
    switch (iconName) {
      case 'user':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'money':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'note':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-s2 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl border border-s4/20 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-s4/20">
          <h2 className="text-xl font-semibold text-p4 flex items-center">
            <span className="inline-block w-8 h-8 bg-p1/10 rounded-full flex items-center justify-center mr-2">
              <span className="text-p1">💰</span>
            </span>
            {t("modals.new.title")}
          </h2>
          <button 
            onClick={onClose} 
            className="text-p3 hover:text-p4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-s4/10 transition-all duration-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation for mobile/small screens */}
        <div className="md:hidden border-b border-s4/20">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 ${
                  activeTab === tab.id 
                    ? 'text-p1 border-b-2 border-p1 font-medium' 
                    : 'text-p3 hover:text-p4 hover:bg-s4/5'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {renderTabIcon(tab.icon)}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-grow">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-lg text-red-500 flex items-center gap-2 animate-fadeIn">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Progress Steps - Desktop */}
            <div className="hidden md:block mb-8">
              <div className="flex items-center justify-between">
                {tabs.map((tab, index) => (
                  <div key={tab.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center ${index === 0 ? 'flex-grow-0' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        activeTab === tab.id ? 'bg-p1 text-white' : 
                        tabs.indexOf({id: activeTab}) > index ? 'bg-green-500 text-white' : 'bg-s4/10 text-p3'
                      }`}>
                        {tabs.indexOf({id: activeTab}) > index ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : renderTabIcon(tab.icon)}
                      </div>
                      <span className={`text-sm ${activeTab === tab.id ? 'text-p4 font-medium' : 'text-p3'}`}>
                        {tab.label}
                      </span>
                    </button>
                    
                    {index < tabs.length - 1 && (
                      <div className="w-full h-1 bg-s4/10 mx-2 flex-grow">
                        <div className={`h-full bg-p1 transition-all duration-300 ${
                          tabs.indexOf({id: activeTab}) > index ? 'w-full' : 'w-0'
                        }`}></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Borrower Information */}
            <div className={activeTab === 'borrower' ? 'animate-fadeIn' : 'hidden md:block md:animate-fadeIn'}>
              <div className="bg-s1/50 rounded-xl p-4 sm:p-5 border border-s4/10 transition-all hover:border-s4/20">
                <h3 className="text-p4 font-medium mb-4 flex items-center text-lg">
                  <svg className="w-5 h-5 mr-2 text-p1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t("modals.new.borrower.title")}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-p3 mb-1">
                      {t("modals.new.borrower.name")}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t("modals.new.borrower.namePlaceholder")}
                      className="w-full px-4 py-2 rounded-lg bg-s2 border border-s4/25 text-p4 focus:border-p1 focus:ring-1 focus:ring-p1 focus:outline-none placeholder-p3/50 transition-colors"
                      value={formData.borrowerName}
                      onChange={(e) => setFormData({...formData, borrowerName: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-p3 mb-1">
                      {t("modals.new.borrower.email")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-p3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        required
                        placeholder={t("modals.new.borrower.emailPlaceholder")}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-s2 border border-s4/25 text-p4 focus:border-p1 focus:ring-1 focus:ring-p1 focus:outline-none placeholder-p3/50 transition-colors"
                        value={formData.borrowerEmail}
                        onChange={(e) => setFormData({...formData, borrowerEmail: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-p3 mb-1">
                      {t("modals.new.borrower.phone")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-p3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        placeholder={t("modals.new.borrower.phonePlaceholder")}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-s2 border border-s4/25 text-p4 focus:border-p1 focus:ring-1 focus:ring-p1 focus:outline-none placeholder-p3/50 transition-colors"
                        value={formData.borrowerPhone}
                        onChange={(e) => setFormData({...formData, borrowerPhone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loan Details */}
            <div className={activeTab === 'loan' ? 'animate-fadeIn' : 'hidden md:block md:animate-fadeIn'}>
              <div className="bg-s1/50 rounded-xl p-4 sm:p-5 border border-s4/10 transition-all hover:border-s4/20">
                <h3 className="text-p4 font-medium mb-4 flex items-center text-lg">
                  <svg className="w-5 h-5 mr-2 text-p1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t("modals.new.loan.title")}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-p3 mb-1">
                      {t("modals.new.loan.amount")}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-p3 bg-s4/10 px-2 py-1 rounded">{formData.currency}</span>
                      </div>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder={t("modals.new.loan.amountPlaceholder")}
                        className="w-full pl-16 pr-4 py-2 rounded-lg bg-s2 border border-s4/25 text-p4 focus:border-p1 focus:ring-1 focus:ring-p1 focus:outline-none placeholder-p3/50 transition-colors"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-p3 mb-1">
                      {t("modals.new.loan.currency")}
                    </label>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-2 rounded-lg bg-s2 border border-s4/25 text-p4 focus:border-p1 focus:ring-1 focus:ring-p1 focus:outline-none appearance-none transition-colors"
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      >
                        {currencies.map(currency => (
                          <option key={currency.value} value={currency.value}>
                            {currency.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-p3">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-p3 mb-1">
                      {t("modals.new.loan.startDate")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-p3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="date"
                        required
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-s2 border border-s4/25 text-p4 focus:border-p1 focus:ring-1 focus:ring-p1 focus:outline-none transition-colors"
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-p3 mb-1">
                      {t("modals.new.loan.dueDate")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-p3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="date"
                        required
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-s2 border border-s4/25 text-p4 focus:border-p1 focus:ring-1 focus:ring-p1 focus:outline-none transition-colors"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className={activeTab === 'notes' ? 'animate-fadeIn' : 'hidden md:block md:animate-fadeIn'}>
              <div className="bg-s1/50 rounded-xl p-4 sm:p-5 border border-s4/10 transition-all hover:border-s4/20">
                <label className="block text-p4 font-medium mb-3 flex items-center text-lg">
                  <svg className="w-5 h-5 mr-2 text-p1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t("modals.new.notes.title")}
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg bg-s2 border border-s4/25 text-p4 focus:border-p1 focus:ring-1 focus:ring-p1 focus:outline-none h-28 resize-none transition-colors"
                  placeholder={t("modals.new.notes.placeholder")}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
                <div className="mt-2 text-xs text-p3 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t("modals.new.notes.instructions")}
                </div>
              </div>
            </div>

            {/* Loan Limit Notification */}
            {!isPremium && loanCount >= maxLoans && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 text-red-500">⚠️</div>
                  <div>
                    <h4 className="text-red-500 font-medium mb-1">{t("modals.new.loanLimit.title")}</h4>
                    <p className="text-sm text-p3">
                      {t("modals.new.loanLimit.message")}
                      <button 
                        onClick={() => {/* Add your upgrade logic */}}
                        className="ml-1 text-p1 hover:underline"
                      >
                        {t("modals.new.loanLimit.upgrade")}
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-s4/20 flex flex-col sm:flex-row justify-between items-center gap-3">
          {/* Mobile Navigation */}
          <div className="flex items-center justify-between w-full sm:hidden">
            <button
              type="button"
              onClick={() => {
                const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                if (currentIndex > 0) {
                  setActiveTab(tabs[currentIndex - 1].id);
                }
              }}
              disabled={activeTab === tabs[0].id}
              className="p-2 rounded-lg border border-s4/25 text-p4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              type="button"
              onClick={() => {
                const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                if (currentIndex < tabs.length - 1) {
                  setActiveTab(tabs[currentIndex + 1].id);
                }
              }}
              disabled={activeTab === tabs[tabs.length - 1].id}
              className="p-2 rounded-lg border border-s4/25 text-p4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 w-full sm:w-auto">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-s4/25 text-p4 hover:bg-s4/10 transition-colors w-full sm:w-auto"
            >
              {t("modals.new.buttons.cancel")}
            </button>
            
           {/* Submit Button */}
<button
  onClick={handleSubmit}
  disabled={isSubmitDisabled}
  className={`px-5 py-2.5 rounded-lg text-white focus:ring-2 focus:ring-p1/50 focus:outline-none transition-all duration-200 flex items-center justify-center gap-2 min-w-28 w-full sm:w-auto ${
    isSubmitDisabled 
      ? 'bg-gray-400 cursor-not-allowed opacity-70' 
      : 'bg-p1 hover:bg-p2'
  }`}
  type="submit"
>
  {isLoading ? (
    <>
      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>{t("modals.new.buttons.creating")}</span>
    </>
  ) : (
    <>
      <Save size={18} className="mr-2" />
      <span>{t("modals.new.buttons.create")}</span>
    </>
  )}
</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default NewLoanModal;