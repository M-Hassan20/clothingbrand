import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/error';
import {
  Search,
  Save,
  Download,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductVariantResponse {
  id: number;
  size: string;
  color: string;
  price: number;
  stockQuantity: number;
  sku: string;
  publicImageUrl: string;
  inStock: boolean;
  productName?: string;
  productId?: number;
}

export default function Inventory() {
  useEffect(() => {
    document.title = 'Stock Inventory | Haus of Hafsah Admin';
  }, []);

  const [variants, setVariants] = useState<ProductVariantResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(10);
  const [search, setSearch] = useState('');
  
  // Local changes state for inline stock editing
  const [localStocks, setLocalStocks] = useState<Record<number, number>>({});
  const [updatingIds, setUpdatingIds] = useState<Record<number, boolean>>({});
  const [exporting, setExporting] = useState(false);

  // Fetch low-stock variants
  const fetchLowStock = async () => {
    try {
      setLoading(true);
      const res = await api.get<ProductVariantResponse[]>(
        `/admin/products/variants/low-stock?threshold=${threshold}`
      );
      setVariants(res || []);
      
      // Initialize local stock inputs
      const stocks: Record<number, number> = {};
      (res || []).forEach((v) => {
        stocks[v.id] = v.stockQuantity;
      });
      setLocalStocks(stocks);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load low stock inventory list'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, [threshold]);

  // Handle inline stock update
  const handleStockUpdate = async (variantId: number) => {
    const newQty = localStocks[variantId];
    if (newQty === undefined || newQty < 0) {
      toast.error('Please enter a valid stock quantity.');
      return;
    }

    try {
      setUpdatingIds((prev) => ({ ...prev, [variantId]: true }));
      await api.patch(`/admin/products/variants/${variantId}/stock?quantity=${newQty}`);
      toast.success('Stock updated successfully!');
      
      // Refresh list to update status
      fetchLowStock();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update stock quantity'));
    } finally {
      setUpdatingIds((prev) => ({ ...prev, [variantId]: false }));
    }
  };

  // Export inventory report
  const handleExport = async () => {
    try {
      setExporting(true);
      await api.download('/admin/excel/export/inventory', 'inventory_status_report.xlsx');
      toast.success('Report downloaded successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to download inventory report'));
    } finally {
      setExporting(false);
    }
  };

  // Filtered and sorted variants
  const filteredVariants = variants
    .filter((v) => {
      const matchSearch =
        (v.productName || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.sku || '').toLowerCase().includes(search.toLowerCase()) ||
        v.color.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    })
    .sort((a, b) => a.stockQuantity - b.stockQuantity); // Sort by stock ascending

  return (
    <div className="space-y-6">
      {/* Overview / Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-border p-6 rounded-md shadow-sm font-sans">
        <div>
          <h1 className="font-serif text-lg font-bold text-text-primary tracking-wide">
            Inventory & Stock Control
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Monitor low stock thresholds, update stock values directly, and export inventory spreadsheets.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-accent text-background hover:bg-accent/90 px-4 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 transition duration-150 shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export Inventory Report
        </button>
      </div>

      {/* Threshold & Filters */}
      <div className="bg-surface border border-border rounded-md shadow-sm p-4 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center font-sans text-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by product, SKU, color..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-xs focus:border-accent focus:outline-none text-text-primary"
            />
          </div>
          <button
            onClick={fetchLowStock}
            className="p-2 border border-border hover:bg-background rounded-md text-text-secondary hover:text-text-primary transition"
            title="Refresh Inventory"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-text-secondary font-semibold uppercase tracking-wider text-[10px]">
            Alert Threshold:
          </span>
          <select
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="bg-background border border-border rounded-md px-3 py-1.5 focus:border-accent focus:outline-none text-text-primary"
          >
            <option value="5">Under 5 units</option>
            <option value="10">Under 10 units</option>
            <option value="20">Under 20 units</option>
            <option value="50">Under 50 units</option>
          </select>
        </div>
      </div>

      {/* Low Stock List */}
      <div className="bg-surface border border-border rounded-md shadow-sm overflow-hidden font-sans">
        {loading ? (
          <div className="p-16 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : filteredVariants.length === 0 ? (
          <div className="p-16 text-center text-xs text-text-secondary flex flex-col items-center justify-center gap-2">
            <CheckCircle className="h-8 w-8 text-success" />
            <span className="font-semibold text-text-primary">All Stock Healthy</span>
            <span>No variants are currently below your threshold of {threshold} units.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-background text-text-secondary uppercase tracking-wider text-[10px] border-b border-border">
                  <th className="p-4 font-semibold">Product Name</th>
                  <th className="p-4 font-semibold w-40">SKU</th>
                  <th className="p-4 font-semibold w-24">Color</th>
                  <th className="p-4 font-semibold w-20">Size</th>
                  <th className="p-4 font-semibold w-28">Current Stock</th>
                  <th className="p-4 font-semibold w-40">Direct Stock Update</th>
                  <th className="p-4 font-semibold w-24 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredVariants.map((v) => {
                  const isLow = v.stockQuantity === 0;
                  const currentLocalVal = localStocks[v.id] ?? v.stockQuantity;
                  const hasChanges = currentLocalVal !== v.stockQuantity;

                  return (
                    <tr key={v.id} className="hover:bg-background/45 transition duration-150">
                      <td className="p-4">
                        <span className="font-semibold text-text-primary block">
                          {v.productName || 'Unnamed Product'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-[11px] text-text-secondary uppercase">
                          {v.sku}
                        </span>
                      </td>
                      <td className="p-4 text-text-secondary">{v.color}</td>
                      <td className="p-4 text-text-secondary">{v.size}</td>
                      <td className="p-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-error font-semibold bg-error/10 px-2 py-0.5 rounded border border-error/20 text-[10px]">
                            <AlertTriangle className="h-3 w-3" />
                            Out of Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-warning font-semibold bg-warning/10 px-2 py-0.5 rounded border border-warning/20 text-[10px]">
                            {v.stockQuantity} remaining
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={currentLocalVal}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10));
                              setLocalStocks((prev) => ({ ...prev, [v.id]: val }));
                            }}
                            className="w-16 bg-background border border-border rounded px-2 py-1 text-center font-semibold text-text-primary focus:outline-none focus:border-accent"
                          />
                          <button
                            onClick={() => handleStockUpdate(v.id)}
                            disabled={!hasChanges || updatingIds[v.id]}
                            className={`p-1.5 rounded transition ${
                              hasChanges
                                ? 'bg-accent text-background hover:bg-accent/90 cursor-pointer shadow-xs'
                                : 'bg-background text-text-secondary/40 border border-border cursor-not-allowed'
                            }`}
                            title="Save stock value"
                          >
                            {updatingIds[v.id] ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right font-semibold text-text-primary">
                        Rs. {v.price.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
