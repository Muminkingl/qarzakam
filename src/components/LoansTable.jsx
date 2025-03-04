import React, { useState } from 'react';
import { format, isPast, isToday } from 'date-fns';
import EditLoanModal from './EditLoanModal';
import ViewLoanModal from './ViewLoanModal';
import { supabase } from '../lib/supabase';
import { useLanguage } from "../constants/LanguageContext";

const LoansTable = ({ loans = [], onNewLoanClick, onLoanUpdate }) => {
  const { t } = useLanguage();
  const [sortField, setSortField] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDropdownOpen, setIsDeleteDropdownOpen] = useState(null);
  
  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const getSortedLoans = () => {
    if (!loans || loans.length === 0) return [];
    
    // Filter loans based on search term
    const filteredLoans = searchTerm 
      ? loans.filter(loan => 
          loan?.borrower_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan?.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (loan?.amount?.toString() || '').includes(searchTerm)
        )
      : loans;
      
    // Sort the filtered loans
    return [...filteredLoans].sort((a, b) => {
      if (!a || !b) return 0;
      
      let comparison = 0;
      
      switch (sortField) {
        case 'borrower':
          comparison = (a.borrower_name || '').localeCompare(b.borrower_name || '');
          break;
        case 'amount':
          comparison = (a.amount || 0) - (b.amount || 0);
          break;
        case 'startDate':
          comparison = new Date(a.start_date || 0) - new Date(b.start_date || 0);
          break;
        case 'dueDate':
          comparison = new Date(a.due_date || 0) - new Date(b.due_date || 0);
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };
  
  const sortedLoans = getSortedLoans();
  
  // Get status badge styling
  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap";
    
    switch (status) {
      case 'paid':
        return `${baseClasses} bg-green-900/20 text-green-400 border border-green-500/30`;
      case 'pending':
        return `${baseClasses} bg-yellow-900/20 text-yellow-400 border border-yellow-500/30`;
      case 'overdue':
        return `${baseClasses} bg-red-900/20 text-red-400 border border-red-500/30`;
      default:
        return `${baseClasses} bg-s4/10 text-p3 border border-s4/20`;
    }
  };
  
  // Calculate loan status based on due date
  const calculateStatus = (loan) => {
    if (loan.status === 'paid') return 'paid';
    
    try {
      const dueDate = new Date(loan.due_date);
      if (isPast(dueDate) && !isToday(dueDate)) return 'overdue';
      return loan.status || 'pending';
    } catch (e) {
      return loan.status || 'unknown';
    }
  };
  
  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };
  
  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-10 g5 rounded-xl border border-s4/25 space-y-4">
      <div className="w-16 h-16 flex items-center justify-center rounded-full g4 text-p1 text-2xl relative overflow-hidden">
        <span className="absolute inset-0 bg-gradient-to-r from-p1/10 to-p2/10"></span>
        <span className="relative z-10">💼</span>
      </div>
      <h3 className="text-lg font-medium text-p4">{t("loans.empty.title")}</h3>
      <p className="text-p3 text-center max-w-sm">
        {t("loans.empty.description")}
      </p>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="relative p-0.5 g5 rounded-2xl shadow-500 group"
      >
        <span className="relative flex items-center min-h-[40px] px-6 g4 rounded-2xl inner-before group-hover:before:opacity-100 overflow-hidden">
          <span className="relative z-2 font-medium text-p1">
            {t("loans.empty.action")}
          </span>
        </span>
        <span className="glow-before glow-after"></span>
      </button>
    </div>
  );
  
  // Handle loan deletion
  const handleDelete = async (loanId) => {
    if (!window.confirm('Are you sure you want to delete this loan?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', loanId);

      if (error) throw error;

      // Refresh the loans list (you'll need to implement this in the parent component)
      if (onLoanUpdate) {
        onLoanUpdate();
      }
    } catch (error) {
      console.error('Error deleting loan:', error);
      alert('Failed to delete loan. Please try again.');
    } finally {
      setIsDeleteDropdownOpen(null);
    }
  };

  // Update the actions column in your table
  const renderActions = (loan) => (
    <div className="flex items-center justify-end space-x-2">
      <button 
        onClick={() => {
          setSelectedLoan(loan);
          setIsEditModalOpen(true);
        }}
        className="text-p1 hover:text-p2 p-1 rounded-full hover:bg-s4/10 transition-colors"
        title="Edit loan"
      >
        ✏️
      </button>
      <button 
        onClick={() => {
          setSelectedLoan(loan);
          setIsViewModalOpen(true);
        }}
        className="text-p3 hover:text-p4 p-1 rounded-full hover:bg-s4/10 transition-colors"
        title="View details"
      >
        🔍
      </button>
      <div className="relative">
        <button 
          onClick={() => setIsDeleteDropdownOpen(isDeleteDropdownOpen === loan.id ? null : loan.id)}
          className="text-p3 hover:text-p4 p-1 rounded-full hover:bg-s4/10 transition-colors"
          title="More options"
        >
          •••
        </button>
        
        {isDeleteDropdownOpen === loan.id && (
          <>
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setIsDeleteDropdownOpen(null)}
            />
            <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-s2 border border-s4/25 z-20">
              <button
                onClick={() => handleDelete(loan.id)}
                className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                🗑️ Delete Loan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
  
  if (!loans || loans.length === 0) {
    return <EmptyState />;
  }
  
  return (
    <>
      <div className="rounded-xl border border-s4/25 g5 overflow-hidden shadow-sm">
        {/* Header section */}
        <div className="p-4 border-b border-s4/25 bg-gradient-to-r from-s4/5 to-p1/5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-p4 text-lg font-medium">{t("loans.recent")}</h2>
            
            {/* Search and filters section */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder={t("loans.search")}
                  className="w-full px-4 py-2 rounded-lg bg-s2 border border-s4/25 text-p4 focus:ring-2 focus:ring-p1/30 focus:border-p1 transition-all pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-2.5 top-2.5 text-p3">🔍</span>
              </div>
              
              <button 
                onClick={onNewLoanClick}
                className="relative p-0.5 g5 rounded-2xl shadow-500 group"
              >
                <span className="relative flex items-center min-h-[40px] px-4 g4 rounded-2xl inner-before group-hover:before:opacity-100 overflow-hidden">
                  <span className="relative z-2 font-medium text-p1">
                    {t("loans.new")}
                  </span>
                </span>
                <span className="glow-before glow-after"></span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Table section */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-s4/25 scrollbar-track-s4/5">
          <table className="min-w-full divide-y divide-s4/25">
            <thead className="g4">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-p3 uppercase tracking-wider cursor-pointer hover:bg-s4/10"
                  onClick={() => handleSort('borrower')}
                >
                  <div className="flex items-center">
                    {t("loans.table.borrower")} <span className="ml-1">{getSortIcon('borrower')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-p3 uppercase tracking-wider cursor-pointer hover:bg-s4/10"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    {t("loans.table.amount")} <span className="ml-1">{getSortIcon('amount')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-p3 uppercase tracking-wider cursor-pointer hover:bg-s4/10 hidden md:table-cell"
                  onClick={() => handleSort('startDate')}
                >
                  <div className="flex items-center">
                    {t("loans.table.startDate")} <span className="ml-1">{getSortIcon('startDate')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-p3 uppercase tracking-wider cursor-pointer hover:bg-s4/10"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center">
                    {t("loans.table.dueDate")} <span className="ml-1">{getSortIcon('dueDate')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-p3 uppercase tracking-wider cursor-pointer hover:bg-s4/10"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    {t("loans.table.status")} <span className="ml-1">{getSortIcon('status')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-p3 uppercase tracking-wider">
                  {t("loans.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="g5 divide-y divide-s4/25">
              {sortedLoans.map((loan) => {
                if (!loan) return null;
                
                // Calculate status
                const effectiveStatus = calculateStatus(loan);
                
                return (
                  <tr key={loan.id} className="hover:bg-s4/5 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full relative overflow-hidden mr-3">
                          <div className="absolute inset-0 bg-gradient-to-r from-p1 to-p2"></div>
                          <div className="relative z-10 h-full w-full flex items-center justify-center text-s1 font-medium">
                            {(loan.borrower_name?.charAt(0) || 'B').toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-p4">{loan.borrower_name || 'N/A'}</div>
                          <div className="text-xs text-p3 truncate max-w-[150px]">{loan.borrower_email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-p1">
                        {loan.currency || '$'} {typeof loan.amount === 'number' ? loan.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="text-sm text-p3">
                        {loan.start_date ? format(new Date(loan.start_date), 'MMM d, yyyy') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-p3">
                        {loan.due_date ? format(new Date(loan.due_date), 'MMM d, yyyy') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(effectiveStatus)}>
                        {t(`loans.status.${effectiveStatus}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      {renderActions(loan)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="g4 px-4 py-3 flex items-center justify-between border-t border-s4/25">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-p3">
                Showing <span className="font-medium text-p4">1</span> to <span className="font-medium text-p4">{sortedLoans.length}</span> of{' '}
                <span className="font-medium text-p4">{sortedLoans.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-s4/25 g5 text-sm font-medium text-p3 hover:bg-s4/10">
                  Previous
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-s4/25 g4 text-sm font-medium text-p1 hover:bg-s4/10">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-s4/25 g5 text-sm font-medium text-p3 hover:bg-s4/10">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Reference to your modal component - keeping this as is */}
      {isModalOpen && (
        <NewLoanModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {selectedLoan && (
        <>
          <EditLoanModal
            loan={selectedLoan}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedLoan(null);
            }}
            onUpdate={onLoanUpdate}
          />

          <ViewLoanModal
            loan={selectedLoan}
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedLoan(null);
            }}
          />
        </>
      )}
    </>
  );
};

export default LoansTable;