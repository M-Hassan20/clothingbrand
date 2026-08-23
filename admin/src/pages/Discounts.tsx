import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/error';
import {
  Tag,
  Plus,
  Search,
  Loader2,
  X,
  Calendar,
  Percent,
  DollarSign,
  CheckCircle2,
  XCircle,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';

interface Discount {
  id: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validUntil?: string;
  maxUsageCount?: number;
  currentUsageCount?: number;
  isActive: boolean;
}

interface DiscountFormData {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  validFrom: string;
  validUntil: string;
  maxUsageCount: string;
  isActive: boolean;
}

export default function Discounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<DiscountFormData>({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    validFrom: '',
    validUntil: '',
    maxUsageCount: '',
    isActive: true,
  });

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const data = await api.get<Discount[]>('/admin/discounts');
      setDiscounts(data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load discount promotions'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.discountValue) {
      toast.error('Code and discount value are required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        validFrom: formData.validFrom ? `${formData.validFrom}T00:00:00` : null,
        validUntil: formData.validUntil ? `${formData.validUntil}T23:59:59` : null,
        maxUsageCount: formData.maxUsageCount ? parseInt(formData.maxUsageCount, 10) : null,
        isActive: formData.isActive,
      };

      await api.post('/admin/discounts', payload);
      toast.success(`Discount code ${payload.code} created successfully!`);
      setShowCreateModal(false);
      setFormData({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minOrderAmount: '',
        maxDiscountAmount: '',
        validFrom: '',
        validUntil: '',
        maxUsageCount: '',
        isActive: true,
      });
      fetchDiscounts();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create discount promotion'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: number, code: string) => {
    if (!confirm(`Are you sure you want to deactivate discount code ${code}?`)) return;
    try {
      await api.patch(`/admin/discounts/${id}/deactivate`, {});
      toast.success(`Discount ${code} deactivated`);
      fetchDiscounts();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to deactivate discount'));
    }
  };

  const filteredDiscounts = discounts.filter((d) =>
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = discounts.filter((d) => d.isActive).length;
  const totalUses = discounts.reduce((sum, d) => sum + (d.currentUsageCount || 0), 0);

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-text-primary">
            Promotions & Discounts
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Manage promotional coupon codes, discounts, and order threshold rules.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Create Promotion</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border p-6 rounded-md space-y-2">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Coupons</span>
            <Tag className="h-4 w-4 text-accent" />
          </div>
          <p className="text-2xl font-serif font-bold text-text-primary">{discounts.length}</p>
        </div>

        <div className="bg-surface border border-border p-6 rounded-md space-y-2">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Campaigns</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <p className="text-2xl font-serif font-bold text-text-primary">{activeCount}</p>
        </div>

        <div className="bg-surface border border-border p-6 rounded-md space-y-2">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Uses</span>
            <Hash className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-serif font-bold text-text-primary">{totalUses}</p>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface p-4 border border-border rounded-md">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border pl-9 pr-4 py-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-primary font-mono"
          />
        </div>
      </div>

      {/* Discounts Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-surface border border-border rounded-md">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : filteredDiscounts.length === 0 ? (
        <div className="bg-surface border border-border rounded-md p-12 text-center text-text-secondary space-y-3">
          <Tag className="h-10 w-10 mx-auto text-text-secondary/50" />
          <p className="font-semibold text-sm">No promotional codes found</p>
          <p className="text-xs max-w-sm mx-auto">
            Create your first promo code to boost customer engagement and sales.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-background border-b border-border text-[10px] uppercase font-semibold tracking-wider text-text-secondary">
                  <th className="py-3.5 px-6">Promo Code</th>
                  <th className="py-3.5 px-6">Discount Type & Value</th>
                  <th className="py-3.5 px-6">Min Order</th>
                  <th className="py-3.5 px-6">Max Cap</th>
                  <th className="py-3.5 px-6">Usage Count</th>
                  <th className="py-3.5 px-6">Valid Dates</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredDiscounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-background/30 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-accent">
                      <span className="inline-flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 rounded border border-accent/20">
                        <Tag className="h-3 w-3" />
                        {discount.code}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-text-primary">
                      {discount.discountType === 'PERCENTAGE' ? (
                        <span className="flex items-center gap-1 text-indigo-400 font-bold">
                          {discount.discountValue}% OFF
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-success font-bold">
                          ${discount.discountValue.toFixed(2)} OFF
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-text-secondary font-semibold">
                      {discount.minOrderAmount ? `$${discount.minOrderAmount.toFixed(2)}` : 'No Min'}
                    </td>
                    <td className="py-4 px-6 text-text-secondary font-semibold">
                      {discount.maxDiscountAmount ? `$${discount.maxDiscountAmount.toFixed(2)}` : 'No Cap'}
                    </td>
                    <td className="py-4 px-6 text-text-primary font-mono font-semibold">
                      {discount.currentUsageCount || 0}{' '}
                      <span className="text-text-secondary font-normal">
                        / {discount.maxUsageCount || '∞'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-text-secondary">
                      {discount.validFrom || discount.validUntil ? (
                        <div className="space-y-0.5 text-[11px]">
                          {discount.validFrom && (
                            <div>From: {new Date(discount.validFrom).toLocaleDateString()}</div>
                          )}
                          {discount.validUntil && (
                            <div>Until: {new Date(discount.validUntil).toLocaleDateString()}</div>
                          )}
                        </div>
                      ) : (
                        <span>Always Valid</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {discount.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold bg-success/15 text-success border-success/20">
                          <CheckCircle2 className="h-3 w-3" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold bg-error/15 text-error border-error/20">
                          <XCircle className="h-3 w-3" />
                          INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {discount.isActive && (
                        <button
                          onClick={() => handleDeactivate(discount.id, discount.code)}
                          className="text-[11px] font-semibold text-error hover:underline"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-primary/40 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-md shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-text-primary">
                Create New Promotion
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-background"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-semibold uppercase text-text-secondary">
                  Promo Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME10"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-background border border-border px-3 py-2 rounded font-mono font-semibold uppercase focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-semibold uppercase text-text-secondary">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT',
                      })
                    }
                    className="w-full bg-background border border-border px-3 py-2 rounded font-semibold focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold uppercase text-text-secondary">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder={formData.discountType === 'PERCENTAGE' ? '10 (for 10%)' : '20 (for $20)'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full bg-background border border-border px-3 py-2 rounded font-semibold focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-semibold uppercase text-text-secondary">
                    Min Order Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Optional threshold"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full bg-background border border-border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold uppercase text-text-secondary">
                    Max Discount Cap ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Optional max cap"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    className="w-full bg-background border border-border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-semibold uppercase text-text-secondary">
                    Valid From Date
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full bg-background border border-border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold uppercase text-text-secondary">
                    Valid Until Date
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full bg-background border border-border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold uppercase text-text-secondary">
                  Max Usage Limit
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100 (leave blank for unlimited)"
                  value={formData.maxUsageCount}
                  onChange={(e) => setFormData({ ...formData, maxUsageCount: e.target.value })}
                  className="w-full bg-background border border-border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-border hover:bg-background rounded text-text-primary font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded font-semibold transition-colors flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Create Promotion</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
