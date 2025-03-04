import { format } from 'date-fns';
import { X } from 'lucide-react';
import { useLanguage } from '../constants/LanguageContext';

const ViewLoanModal = ({ loan, isOpen, onClose }) => {
  const { t } = useLanguage();
  
  if (!isOpen || !loan) return null;
  
  // Determine status badge color
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
      paid: "bg-green-500/20 text-green-600 border-green-500/30",
      overdue: "bg-red-500/20 text-red-600 border-red-500/30"
    };
    
    return `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusMap[status] || "bg-gray-500/20 text-gray-600 border-gray-500/30"}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-s2 rounded-xl w-full max-w-2xl p-6 shadow-xl border border-s4/20 relative">
        <div className="flex justify-between items-center mb-6 border-b border-s4/20 pb-4">
          <h2 className="text-xl font-semibold text-p4">{t("modals.view.title")}</h2>
          <button
            onClick={onClose}
            className="text-p3 hover:text-p4 p-2 rounded-full hover:bg-s4/10 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Borrower Section */}
          <div className="bg-s3 rounded-lg p-5 border border-s4/25 transition-all hover:border-s4/40">
            <h3 className="text-p4 font-medium mb-4 flex items-center">
              <span className="inline-block w-8 h-8 bg-p1/10 rounded-full flex items-center justify-center mr-2">
                <span className="text-p1">👤</span>
              </span>
              {t("modals.view.borrower.title")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm text-p3 block mb-1">{t("modals.view.borrower.name")}</label>
                <p className="text-p4 font-medium">{loan.borrower_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-p3 block mb-1">{t("modals.view.borrower.email")}</label>
                <p className="text-p4 break-all">
                  {loan.borrower_email ? (
                    <a href={`mailto:${loan.borrower_email}`} className="text-p1 hover:underline">
                      {loan.borrower_email}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* Loan Details Section */}
          <div className="bg-s3 rounded-lg p-5 border border-s4/25 transition-all hover:border-s4/40">
            <h3 className="text-p4 font-medium mb-4 flex items-center">
              <span className="inline-block w-8 h-8 bg-p1/10 rounded-full flex items-center justify-center mr-2">
                <span className="text-p1">💰</span>
              </span>
              {t("modals.view.loan.title")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm text-p3 block mb-1">{t("modals.view.loan.amount")}</label>
                <p className="text-p4 font-medium text-lg">
                  {loan.currency} {loan.amount?.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </p>
              </div>
              <div>
                <label className="text-sm text-p3 block mb-1">{t("modals.view.loan.status")}</label>
                <span className={getStatusBadge(loan.status)}>
                  {t(`loans.status.${loan.status}`)}
                </span>
              </div>
              <div>
                <label className="text-sm text-p3 block mb-1">{t("modals.view.loan.startDate")}</label>
                <p className="text-p4">
                  {loan.start_date ? format(new Date(loan.start_date), 'MMM d, yyyy') : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm text-p3 block mb-1">{t("modals.view.loan.dueDate")}</label>
                <p className="text-p4">
                  {loan.due_date ? format(new Date(loan.due_date), 'MMM d, yyyy') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Payment Timeline */}
          <div className="bg-s3 rounded-lg p-5 border border-s4/25 transition-all hover:border-s4/40">
            <h3 className="text-p4 font-medium mb-4 flex items-center">
              <span className="inline-block w-8 h-8 bg-p1/10 rounded-full flex items-center justify-center mr-2">
                <span className="text-p1">📅</span>
              </span>
              {t("modals.view.timeline.title")}
            </h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-s4/30"></div>
              <div className="space-y-4 pl-10 relative">
                <div>
                  <div className="absolute left-3 w-3 h-3 rounded-full bg-green-500 transform -translate-x-1/2"></div>
                  <p className="text-sm font-medium text-p4">{t("modals.view.timeline.created")}</p>
                  <p className="text-xs text-p3">
                    {loan.start_date ? format(new Date(loan.start_date), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <div className="absolute left-3 w-3 h-3 rounded-full bg-yellow-500 transform -translate-x-1/2"></div>
                  <p className="text-sm font-medium text-p4">{t("modals.view.timeline.due")}</p>
                  <p className="text-xs text-p3">
                    {loan.due_date ? format(new Date(loan.due_date), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
                {loan.status === 'paid' && (
                  <div>
                    <div className="absolute left-3 w-3 h-3 rounded-full bg-blue-500 transform -translate-x-1/2"></div>
                    <p className="text-sm font-medium text-p4">{t("modals.view.timeline.paid")}</p>
                    <p className="text-xs text-p3">
                      {loan.updated_at ? format(new Date(loan.updated_at), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Notes Section */}
          {loan.notes && (
            <div className="bg-s3 rounded-lg p-5 border border-s4/25 transition-all hover:border-s4/40">
              <h3 className="text-p4 font-medium mb-4 flex items-center">
                <span className="inline-block w-8 h-8 bg-p1/10 rounded-full flex items-center justify-center mr-2">
                  <span className="text-p1">📝</span>
                </span>
                {t("modals.view.notes.title")}
              </h3>
              <p className="text-p3 whitespace-pre-wrap bg-s4/10 p-3 rounded-md">{loan.notes}</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-s4/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-p1 text-white hover:bg-p2 transition-colors"
          >
            {t("modals.view.close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewLoanModal;