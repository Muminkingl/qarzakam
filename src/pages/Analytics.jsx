import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { format, parseISO, subMonths } from 'date-fns';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useLanguage } from '../constants/LanguageContext';

// Currency options
const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar' },
  BTC: { symbol: '₿', name: 'Bitcoin' },
  IQD: { symbol: 'ع.د', name: 'Iraqi Dinar' },
  EUR: { symbol: '€', name: 'Euro' },
};

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const STATUS_COLORS = {
  paid: '#10B981',
  active: '#3B82F6',
  dueSoon: '#F59E0B',
  overdue: '#EF4444'
};

const Analytics = () => {
  const { user } = useUser();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalLoans: 0,
    totalAmount: 0,
    totalReceived: 0,
    totalSent: 0,
    repaymentRate: 0,
    upcomingDue: [],
    loanDistribution: {
      paid: 0,
      active: 0,
      dueSoon: 0,
      overdue: 0
    },
    monthlyData: [],
    currencyDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({
    USD: 1,
    BTC: 0.000016,
    IQD: 1300,
    EUR: 0.85
  });
  const [timeRange, setTimeRange] = useState('6m'); // 1m, 3m, 6m, 1y, all

  // Fetch exchange rates from API
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        // Use ExchangeRate-API (free tier)
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        
        if (data && data.rates) {
          // Create a rates object with the formats we need
          const newRates = {
            USD: 1, // Base currency is always 1
            EUR: data.rates.EUR || 0.85,
            IQD: data.rates.IQD || 1300
          };
          
          // For BTC we'd need a dedicated crypto API, but using a placeholder for now
          // In a real app, you might use CoinGecko or similar: https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd
          
          // Fetch BTC price separately if needed
          try {
            const btcResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
            const btcData = await btcResponse.json();
            if (btcData && btcData.bitcoin && btcData.bitcoin.usd) {
              // Convert USD/BTC price to BTC/USD rate (inverse)
              newRates.BTC = 1 / btcData.bitcoin.usd;
            }
          } catch (btcError) {
            console.error('Error fetching BTC rate:', btcError);
            // Fallback to our hardcoded rate
            newRates.BTC = 0.000016;
          }
          
          setExchangeRates(newRates);
        }
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Keep the fallback rates in case of API failure
      }
    };

    fetchExchangeRates();
  }, []);

  // Memoized currency conversion function
  const convertCurrency = useMemo(() => {
    return (amount, fromCurrency, toCurrency = selectedCurrency) => {
      // Convert to USD first
      const amountInUSD = fromCurrency === 'USD' 
        ? amount 
        : amount / exchangeRates[fromCurrency];
      
      // Then convert from USD to target currency
      return toCurrency === 'USD' 
        ? amountInUSD 
        : amountInUSD * exchangeRates[toCurrency];
    };
  }, [exchangeRates, selectedCurrency]);

  // Format currency for display
  const formatCurrency = (amount, currency = selectedCurrency) => {
    const symbol = CURRENCIES[currency]?.symbol || '$';
    
    if (currency === 'BTC') {
      return `${symbol}${amount.toFixed(8)}`;
    }
    
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange, selectedCurrency]); // Added selectedCurrency as dependency

  const getDateRangeFilter = () => {
    const now = new Date();
    
    switch(timeRange) {
      case '1m':
        return subMonths(now, 1).toISOString();
      case '3m':
        return subMonths(now, 3).toISOString();
      case '6m':
        return subMonths(now, 6).toISOString();
      case '1y':
        return subMonths(now, 12).toISOString();
      case 'all':
      default:
        return null;
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id);
      
      const dateFilter = getDateRangeFilter();
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }
      
      const { data: loans, error } = await query;

      if (error) throw error;

      // Calculate statistics
      const now = new Date();
      let totalAmount = 0;
      let totalReceived = 0;
      let totalSent = 0;
      let paidLoans = 0;
      let activeLoans = 0;
      let dueSoonLoans = 0;
      let overdueLoans = 0;
      
      // For currency distribution
      const currencyAmounts = {};
      
      // For monthly trends
      const monthlyData = {};

      loans?.forEach(loan => {
        // Calculate basic stats and loan status
        const amount = loan.amount || 0;
        const currency = loan.currency || 'USD';
        const dueDate = new Date(loan.due_date);
        const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
        const createdAt = new Date(loan.created_at);
        const monthYear = format(createdAt, 'MMM yyyy');
        
        // Convert to selected currency for total
        const convertedAmount = convertCurrency(amount, currency);
        totalAmount += convertedAmount;
        
        // Track by currency for distribution chart
        if (!currencyAmounts[currency]) {
          currencyAmounts[currency] = 0;
        }
        currencyAmounts[currency] += amount;
        
        // FIX: Track sent vs received based on loan_type
        // When loan_type is 'sent', it means you've sent money (you're the lender)
        // When loan_type is 'received', it means you've borrowed money (you're the borrower)
        if (loan.loan_type === 'sent') {
          totalSent += convertedAmount;
        } else if (loan.loan_type === 'received') {
          // Only count as received if it's a loan you've borrowed
          totalReceived += convertedAmount;
        }
        
        // Track monthly data
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            name: monthYear,
            sent: 0,
            received: 0,
            total: 0
          };
        }
        
        // FIX: Update monthly data tracking based on loan_type as well
        if (loan.loan_type === 'sent') {
          monthlyData[monthYear].sent += convertedAmount;
        } else if (loan.loan_type === 'received') {
          monthlyData[monthYear].received += convertedAmount;
        }
        monthlyData[monthYear].total += convertedAmount;
        
        // Calculate loan status
        if (loan.status === 'paid') {
          paidLoans++;
        } else if (daysUntilDue < 0) {
          overdueLoans++;
        } else if (daysUntilDue <= 7) {
          dueSoonLoans++;
        } else {
          activeLoans++;
        }
      });

      // Calculate repayment rate
      const repaymentRate = loans?.length > 0 
        ? Math.round((paidLoans / loans.length) * 100) 
        : 0;

      // Prepare currency distribution data for chart
      const currencyDistribution = Object.keys(currencyAmounts).map(currency => ({
        name: currency,
        value: currencyAmounts[currency],
        displayValue: formatCurrency(currencyAmounts[currency], currency)
      }));
      
      // Sort monthly data and convert to array
      const sortedMonthlyData = Object.values(monthlyData)
        .sort((a, b) => new Date(a.name) - new Date(b.name));

      // Get upcoming due dates
      const upcomingDue = loans
        ?.filter(loan => loan.status !== 'paid')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 3);

      setStats({
        totalLoans: loans?.length || 0,
        totalAmount,
        totalReceived,
        totalSent,
        repaymentRate,
        upcomingDue,
        loanDistribution: {
          paid: loans?.length ? (paidLoans / loans.length) * 100 : 0,
          active: loans?.length ? (activeLoans / loans.length) * 100 : 0,
          dueSoon: loans?.length ? (dueSoonLoans / loans.length) * 100 : 0,
          overdue: loans?.length ? (overdueLoans / loans.length) * 100 : 0
        },
        monthlyData: sortedMonthlyData,
        currencyDistribution
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
  
    return percent > 0.05 ? (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="medium"
      >
        {name} ({`${(percent * 100).toFixed(0)}%`})
      </text>
    ) : null;
  };

  const statusData = [
    { name: t("analytics.charts.performance.status.paid"), value: stats.loanDistribution.paid, color: STATUS_COLORS.paid },
    { name: t("analytics.charts.performance.status.active"), value: stats.loanDistribution.active, color: STATUS_COLORS.active },
    { name: t("analytics.charts.performance.status.overdue"), value: stats.loanDistribution.overdue, color: STATUS_COLORS.overdue }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with timeframe selection */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h2 className="text-xl md:text-2xl font-semibold text-p4 mb-2 sm:mb-0">
            {t("analytics.title")}
          </h2>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-1">
              {['1m', '3m', '6m', '1y', 'all'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm font-medium rounded-lg transition-all duration-200 ${
                    timeRange === range 
                      ? 'bg-gradient-to-r from-p1 to-p2 text-white' 
                      : 'bg-s3 text-p3 hover:bg-s4/30'
                  }`}
                >
                  {t(`analytics.timeRanges.${range}`)}
                </button>
              ))}
            </div>
            
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-s3 text-p4 text-sm rounded-lg py-1 px-3 border border-s4/25 focus:ring-p1 focus:border-p1"
            >
              {Object.keys(CURRENCIES).map(code => (
                <option key={code} value={code}>
                  {CURRENCIES[code].symbol} {CURRENCIES[code].name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-p1/10 to-p2/10 p-5 rounded-xl border border-p1/10 hover:border-p1/20 transition-all duration-300">
            <h3 className="text-p3 text-sm mb-2">{t("analytics.overview.totalLoans.title")}</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-p1 to-p2 bg-clip-text text-transparent">
              {loading ? '...' : stats.totalLoans}
            </p>
            <div className="mt-2 flex justify-between text-p3 text-sm">
              <span>{t("analytics.overview.totalLoans.subtitle")}</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-p1/10 to-p2/10 p-5 rounded-xl border border-p1/10 hover:border-p1/20 transition-all duration-300">
            <h3 className="text-p3 text-sm mb-2">{t("analytics.overview.totalAmount.title")}</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-p1 to-p2 bg-clip-text text-transparent">
              {loading ? '...' : formatCurrency(stats.totalAmount)}
            </p>
            <div className="mt-2 flex justify-between text-p3 text-sm">
              <span>{t("analytics.overview.totalAmount.subtitle")}</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-p1/10 to-p2/10 p-5 rounded-xl border border-p1/10 hover:border-p1/20 transition-all duration-300">
            <h3 className="text-p3 text-sm mb-2">{t("analytics.overview.repaymentRate.title")}</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-p1 to-p2 bg-clip-text text-transparent">
              {loading ? '...' : `${stats.repaymentRate}%`}
            </p>
            <div className="mt-2 flex justify-between text-p3 text-sm">
              <span>{t("analytics.overview.repaymentRate.subtitle")}</span>
            </div>
          </div>
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Trend Chart */}
          <div className="bg-s3 p-6 rounded-xl border border-s4/25 shadow-sm">
            <h3 className="text-p4 font-medium mb-4">{t("analytics.charts.monthlyActivity.title")}</h3>
            {loading ? (
              <div className="animate-pulse h-64 bg-s2/50 rounded-lg"></div>
            ) : stats.monthlyData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.monthlyData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), t("analytics.charts.monthlyActivity.amount")]}
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.5rem' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="sent" stroke="#F87171" strokeWidth={2} activeDot={{ r: 6 }} name={t("analytics.charts.monthlyActivity.sent")} />
                    <Line type="monotone" dataKey="received" stroke="#60A5FA" strokeWidth={2} activeDot={{ r: 6 }} name={t("analytics.charts.monthlyActivity.received")} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border border-dashed border-s4/50 rounded-lg bg-s2/50">
                <p className="text-p3">{t("analytics.charts.monthlyActivity.noData")}</p>
              </div>
            )}
          </div>
          
          {/* Loan Status Distribution */}
          <div className="bg-s3 p-6 rounded-xl border border-s4/25 shadow-sm">
            <h3 className="text-p4 font-medium mb-4">{t("analytics.charts.status.title")}</h3>
            {loading ? (
              <div className="animate-pulse h-64 bg-s2/50 rounded-lg"></div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData.filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, "Percentage"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
        
        {/* Additional Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Currency Distribution */}
          <div className="bg-s3 p-6 rounded-xl border border-s4/25 shadow-sm">
            <h3 className="text-p4 font-medium mb-4">Currency Distribution</h3>
            {loading ? (
              <div className="animate-pulse h-64 bg-s2/50 rounded-lg"></div>
            ) : stats.currencyDistribution.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.currencyDistribution}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      formatter={(value, name, props) => [props.payload.displayValue, "Amount"]}
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.5rem' }}
                    />
                    <Legend />
                    <Bar dataKey="value" name="Amount" fill="#8884d8">
                      {stats.currencyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border border-dashed border-s4/50 rounded-lg bg-s2/50">
                <p className="text-p3">No currency data available</p>
              </div>
            )}
          </div>
          
          {/* Upcoming Payments */}
          <div className="bg-s3 p-6 rounded-xl border border-s4/25 shadow-sm">
            <h3 className="text-p4 font-medium mb-4">{t("analytics.upcoming.title")}</h3>
            <div className="space-y-4">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-s2/50 rounded-lg"></div>
                  ))}
                </div>
              ) : stats.upcomingDue.length > 0 ? (
                stats.upcomingDue.map(loan => {
                  const dueDate = parseISO(loan.due_date);
                  const now = new Date();
                  const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
                  let statusColor = "";
                  let statusMessage = "";
                  
                  if (daysUntilDue < 0) {
                    statusColor = "text-red-500";
                    statusMessage = t("analytics.upcoming.status.overdue");
                  } else if (loan.status === 'paid') {
                    statusColor = "text-green-500";
                    statusMessage = t("analytics.upcoming.status.paid");
                  } else {
                    statusColor = "text-blue-500";
                    statusMessage = t("analytics.upcoming.status.active");
                  }
                  
                  return (
                    <div key={loan.id} className="p-4 bg-s2/50 rounded-lg space-y-2 hover:bg-s2/80 transition-all duration-200">
                      <div className="flex justify-between items-center">
                        <span className="text-p4 font-medium">{loan.borrower_name}</span>
                        <span className="text-p3">
                          {formatCurrency(loan.amount, loan.currency || 'USD')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className={`text-sm ${statusColor}`}>
                          {t("analytics.upcoming.due")}: {format(dueDate, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-p3">
                          {loan.loan_type === 'sent' 
                            ? t("analytics.upcoming.type.sent")
                            : t("analytics.upcoming.type.received")
                          }
                        </div>
                      </div>
                      <div className={`text-sm ${statusColor}`}>
                        {statusMessage}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center">
                  <p className="text-p3 text-lg mb-2">{t("analytics.upcoming.empty.title")}</p>
                  <p className="text-p3 text-sm">{t("analytics.upcoming.empty.subtitle")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Repayment Rate Card */}
        <div className="bg-s3 p-6 rounded-xl border border-s4/25 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h3 className="text-p4 font-medium">{t("analytics.charts.performance.title")}</h3>
            <div className="mt-2 md:mt-0 text-lg font-semibold">
              <span className="bg-gradient-to-r from-p1 to-p2 bg-clip-text text-transparent">
                {loading ? '...' : `${stats.repaymentRate}% ${t("analytics.charts.performance.rate")}`}
              </span>
            </div>
          </div>
          
          <div className="h-6 bg-s4/25 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-p1 to-p2 rounded-full transition-all duration-1000"
              style={{ width: `${loading ? 0 : stats.repaymentRate}%` }}
            />
          </div>
          
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t("analytics.charts.performance.status.paid"), color: STATUS_COLORS.paid, value: stats.loanDistribution.paid },
              { label: t("analytics.charts.performance.status.active"), color: STATUS_COLORS.active, value: stats.loanDistribution.active },
              { label: t("analytics.charts.performance.status.overdue"), color: STATUS_COLORS.overdue, value: stats.loanDistribution.overdue }
            ].map(item => (
              <div 
                key={item.label} 
                className="p-4 rounded-lg" 
                style={{ backgroundColor: `${item.color}20` }}
              >
                <h4 className="text-sm text-p3 mb-1">{item.label}</h4>
                <p className="text-2xl font-bold" style={{ color: item.color }}>
                  {loading ? '...' : `${Math.round(item.value)}%`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;