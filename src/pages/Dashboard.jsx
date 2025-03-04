import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Navigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import StatsCard from "../components/StatsCard";
import LoansTable from "../components/LoansTable";
import { supabase } from "../lib/supabase";
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import NewLoanModal from '../components/NewLoanModal';

const Dashboard = () => {
  const { user, isLoaded } = useUser();
  useSupabaseAuth();
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({
    totalLoans: 0,
    pendingLoans: 0,
    paidLoans: 0,
    nextDueDate: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false);

  const fetchLoans = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setLoans(data || []);
      updateStats(data || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
      setError('Failed to load loans. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStats = (loans) => {
    const pendingLoans = loans.filter(l => l.status === 'pending');
    const nextDueDate = pendingLoans.length > 0 
      ? pendingLoans.reduce((min, loan) => 
          new Date(loan.due_date) < new Date(min) ? loan.due_date : min, 
          pendingLoans[0].due_date
        )
      : null;

    setStats({
      totalLoans: loans.length,
      pendingLoans: pendingLoans.length,
      paidLoans: loans.filter(l => l.status === 'paid').length,
      nextDueDate
    });
  };

  const handleLoanCreated = (newLoan) => {
    setLoans((prevLoans) => {
      // Check if loan already exists
      const exists = prevLoans.some(loan => loan.id === newLoan.id);
      if (exists) {
        return prevLoans; // Return unchanged if loan exists
      }
      return [newLoan, ...prevLoans];
    });
    updateStats([...loans, newLoan]);
  };

  const handleLoanUpdate = async () => {
    // Refetch loans after update or delete
    await fetchLoans();
  };

  // Initial fetch when component mounts
  useEffect(() => {
    if (user) {
      fetchLoans();
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('loans')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'loans',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Change received!', payload);
          fetchLoans(); // Refresh the loans list
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen bg-s2">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-r from-p1 to-p2 rounded-full mb-4"></div>
          <div className="text-p3">Loading your account...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-semibold text-p4">My Loans</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard 
            title="Total Loans" 
            value={stats.totalLoans} 
            icon="💰" 
            trend={stats.totalLoans > 0 ? "+1 this month" : "No loans yet"} 
            isLoading={isLoading}
          />
          <StatsCard 
            title="Pending Loans" 
            value={stats.pendingLoans} 
            icon="⏳" 
            trend={stats.pendingLoans > 0 ? `${Math.round(stats.pendingLoans/stats.totalLoans*100)}% of total` : "No pending loans"} 
            isLoading={isLoading}
          />
          <StatsCard 
            title="Next Due Date" 
            value={stats.nextDueDate ? new Date(stats.nextDueDate).toLocaleDateString() : "No due date"} 
            icon="📅" 
            trend={stats.nextDueDate ? `${Math.ceil((new Date(stats.nextDueDate) - new Date()) / (1000 * 60 * 60 * 24))} days left` : "No upcoming payments"} 
            isLoading={isLoading}
          />
        </div>

        {isLoading ? (
          <div className="bg-s3 rounded-xl p-8 animate-pulse">
            <div className="h-6 bg-s4/20 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-s4/20 rounded w-full mb-2"></div>
            <div className="h-4 bg-s4/20 rounded w-full mb-2"></div>
            <div className="h-4 bg-s4/20 rounded w-3/4"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-red-600 font-medium">{error}</p>
            <button 
              onClick={fetchLoans}
              className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : loans.length === 0 ? (
          <div className="bg-s3 border border-s4/20 rounded-xl p-8 text-center">
            <div className="text-p3 text-5xl mb-4">💸</div>
            <h3 className="text-p4 text-xl font-medium mb-2">No loans yet</h3>
            <p className="text-p3 mb-6">Start by creating your first loan to track payments and due dates</p>
            <button
              onClick={() => setIsNewLoanModalOpen(true)}
              className="bg-gradient-to-r from-p1 to-p2 text-white px-5 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300"
            >
              Create Your First Loan
            </button>
          </div>
        ) : (
          <div className="bg-s3 border border-s4/20 rounded-xl overflow-hidden shadow-sm">
            <LoansTable 
              loans={loans} 
              onNewLoanClick={() => setIsNewLoanModalOpen(true)}
              onLoanUpdate={handleLoanUpdate}
            />
          </div>
        )}

        <NewLoanModal
          isOpen={isNewLoanModalOpen}
          onClose={() => setIsNewLoanModalOpen(false)}
          onLoanCreated={handleLoanCreated}
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;