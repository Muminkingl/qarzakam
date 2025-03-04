import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save, AlertCircle } from 'lucide-react';
import { useLanguage } from "../constants/LanguageContext";

const EditLoanModal = ({ loan, isOpen, onClose, onUpdate }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    borrower_name: loan?.borrower_name || '',
    borrower_email: loan?.borrower_email || '',
    amount: loan?.amount || '',
    currency: loan?.currency || 'USD',
    start_date: loan?.start_date || '',
    due_date: loan?.due_date || '',
    status: loan?.status || 'pending',
    notes: loan?.notes || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('loans')
        .update({
          borrower_name: formData.borrower_name,
          borrower_email: formData.borrower_email,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          start_date: formData.start_date,
          due_date: formData.due_date,
          status: formData.status,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', loan.id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      onUpdate(data);
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get status badge style
  const getStatusStyle = (status) => {
    const statusMap = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      paid: "bg-green-500/10 text-green-600 border-green-500/20",
      overdue: "bg-red-500/10 text-red-600 border-red-500/20"
    };
    
    return statusMap[status] || "bg-gray-500/10 text-gray-600 border-gray-500/20";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-s2 rounded-xl w-full max-w-2xl p-6 shadow-xl border border-s4/20 relative">
        <div className="flex justify-between items-center mb-6 border-b border-s4/20 pb-4">
          <h2 className="text-xl font-semibold text-p4 flex items-center">
            <span className="inline-block w-8 h-8 bg-p1/10 rounded-full flex items-center justify-center mr-2">
              <span className="text-p1">✏️</span>
            </span>
            {t("modals.edit.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-p3 hover:text-p4 p-2 rounded-full hover:bg-s4/10 transition-colors"
            aria-label={t("modals.edit.buttons.cancel")}
          >
            <X size={20} />
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-center">
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Borrower Information */}
          <div className="bg-s3 rounded-lg p-5 border border-s4/25">
            <h3 className="text-p4 font-medium mb-4">{t("modals.edit.borrower.title")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-p3 mb-1">
                  {t("modals.edit.borrower.name")}
                </label>
                <input
                  type="text"
                  value={formData.borrower_name}
                  onChange={(e) => setFormData({ ...formData, borrower_name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-s2 border border-s4/25 text-p4 focus:ring-2 focus:ring-p1/30 focus:border-p1 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-p3 mb-1">
                  {t("modals.edit.borrower.email")}
                </label>
                <input
                  type="email"
                  value={formData.borrower_email}
                  onChange={(e) => setFormData({ ...formData, borrower_email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-s2 border border-s4/25 text-p4 focus:ring-2 focus:ring-p1/30 focus:border-p1 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Loan Details */}
          <div className="bg-s3 rounded-lg p-5 border border-s4/25">
            <h3 className="text-p4 font-medium mb-4">{t("modals.edit.loan.title")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-p3 mb-1">
                  {t("modals.edit.loan.amount")}
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-s2 border border-s4/25 text-p4 focus:ring-2 focus:ring-p1/30 focus:border-p1 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-p3 mb-1">
                  {t("modals.edit.loan.currency")}
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-s2 border border-s4/25 text-p4 focus:ring-2 focus:ring-p1/30 focus:border-p1 transition-all"
                  required
                >
                  <option value="USD">USD ($)</option>
                  <option value="IQD">IQD (د.ع)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-p3 mb-1">
                  {t("modals.edit.loan.startDate")}
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-s2 border border-s4/25 text-p4 focus:ring-2 focus:ring-p1/30 focus:border-p1 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-p3 mb-1">
                  {t("modals.edit.loan.dueDate")}
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-s2 border border-s4/25 text-p4 focus:ring-2 focus:ring-p1/30 focus:border-p1 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-s3 rounded-lg p-5 border border-s4/25">
            <h3 className="text-p4 font-medium mb-4">{t("modals.edit.loan.status")}</h3>
            <div className="grid grid-cols-3 gap-3">
              {['pending', 'paid', 'overdue'].map((status) => (
                <label 
                  key={status}
                  className={`
                    border rounded-lg p-3 flex items-center justify-center cursor-pointer transition-all 
                    ${formData.status === status ? getStatusStyle(status) : 'border-s4/25 hover:border-s4/50'}
                  `}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={formData.status === status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="sr-only"
                  />
                  <span className="capitalize">{t(`loans.status.${status}`)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-s3 rounded-lg p-5 border border-s4/25">
            <h3 className="text-p4 font-medium mb-4">{t("modals.edit.notes.title")}</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-s2 border border-s4/25 text-p4 focus:ring-2 focus:ring-p1/30 focus:border-p1 transition-all h-32 resize-none"
              placeholder={t("modals.edit.notes.placeholder")}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-s4/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-s4/25 text-p4 hover:bg-s4/10 transition-colors"
            >
              {t("modals.edit.buttons.cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-p1 text-white hover:bg-p2 disabled:opacity-50 transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⊙</span>
                  {t("modals.edit.buttons.saving")}
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  {t("modals.edit.buttons.save")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLoanModal;