import React, { useState, useEffect } from "react";
import { axiosInstance } from "../../../../utils/url/config";
import { toast } from "react-toastify";
import ActionButtons from "../../../components/ActionButtons";
import DeleteModal from "../../../components/DeleteModal";
import BankTransactionHistoryModal from "../modals/BankTransactionHistoryModal";

export default function BankMasterTab() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bankId, setBankId] = useState(null); // For edit
  const [deleteModalData, setDeleteModalData] = useState(null);
  const [historyModalBank, setHistoryModalBank] = useState(null);

  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
    account_type: "Current",
    opening_balance: "",
  });

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/accounts/bank-master");
      if (res.data?.success) {
        setBanks(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch bank accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "account_type") {
      if (value === "Cash in Hand") {
        setFormData({
          ...formData,
          [name]: value,
          bank_name: "Cash in Hand",
          account_number: `CASH-${Math.floor(1000 + Math.random() * 9000)}`,
        });
      } else {
        // If switching from Cash in Hand back to normal, clear auto-filled fields
        if (formData.account_type === "Cash in Hand") {
          setFormData({
            ...formData,
            [name]: value,
            bank_name: "",
            account_number: "",
          });
        } else {
          setFormData({ ...formData, [name]: value });
        }
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.account_type !== "Cash in Hand" && (!formData.bank_name || !formData.account_number)) {
      toast.error("Bank name and Account number are required");
      return;
    }
    try {
      if (bankId) {
        const res = await axiosInstance.put(`/accounts/bank-master/${bankId}`, formData);
        if (res.data?.success) {
          toast.success("Bank Account updated successfully");
        }
      } else {
        const res = await axiosInstance.post("/accounts/bank-master", formData);
        if (res.data?.success) {
          toast.success("Bank Account added successfully");
        }
      }
      
      setFormData({
        bank_name: "",
        account_number: "",
        account_type: "Current",
        opening_balance: "",
      });
      setBankId(null);
      fetchBanks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save bank account");
    }
  };

  const handleEdit = (item) => {
    setFormData({
      bank_name: item.bank_name || "",
      account_number: item.last4 || "", 
      account_type: item.account_type || "Current",
      opening_balance: "", 
    });
    setBankId(item._id);
    
    // Fetch full details so we get full account number
    axiosInstance.get(`/accounts/bank-master/${item._id}`).then((res) => {
        if(res.data?.success) {
            setFormData({
                bank_name: res.data.data.bank_name || "",
                account_number: res.data.data.account_number || "",
                account_type: res.data.data.account_type || "Current",
                opening_balance: "",
            });
        }
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = async () => {
    if (!deleteModalData) return;
    try {
      const res = await axiosInstance.delete(`/accounts/bank-master/${deleteModalData._id}`);
      if (res.data?.success) {
        toast.success("Bank Account deleted successfully");
        fetchBanks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete bank account");
    } finally {
      setDeleteModalData(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-[70vh]">
      <div className="container mx-auto px-4 py-6">
        
        {/* CREATE / EDIT FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                name="account_type"
                value={formData.account_type}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Current">Current</option>
                <option value="Savings">Savings</option>
                <option value="Cash in Hand">Cash in Hand</option>
              </select>
            </div>

            {formData.account_type !== "Cash in Hand" && (
              <>
                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    placeholder="e.g. HDFC Bank"
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleChange}
                    placeholder="e.g. 50200012345678"
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* Opening Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opening Balance (₹)
              </label>
              <input
                type="number"
                step="0.01"
                name="opening_balance"
                value={formData.opening_balance}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6 gap-3">
            {bankId && (
              <button
                type="button"
                onClick={() => {
                  setBankId(null);
                  setFormData({
                    bank_name: "",
                    account_number: "",
                    account_type: "Current",
                    opening_balance: "",
                  });
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
            >
              <i className={bankId ? "fa-solid fa-save mr-2" : "fa-solid fa-plus mr-2"}></i>
              {bankId ? "Update Bank" : "Add Bank"}
            </button>
          </div>
        </form>

        {/* TABLE */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">Bank Name</th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">Account No</th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase text-right">Balance</th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : banks.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No bank accounts added yet.
                    </td>
                  </tr>
                ) : (
                  banks.map((b, idx) => (
                    <tr key={b._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {b.bank_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {b.account_number_masked}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {b.account_type}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${b.balance < 0 ? "text-red-500" : "text-emerald-600"}`}>
                        ₹ {b.balance.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center flex items-center justify-center gap-2">
                        <button
                          onClick={() => setHistoryModalBank(b)}
                          className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
                          title="View Ledger History"
                        >
                          <i className="fa-solid fa-file-invoice-dollar"></i>
                        </button>
                        <ActionButtons
                          item={b}
                          onEdit={() => handleEdit(b)}
                          onDelete={() => setDeleteModalData(b)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <DeleteModal
        deleteModalData={deleteModalData}
        onCancel={() => setDeleteModalData(null)}
        confirmDelete={confirmDelete}
      />
      {historyModalBank && (
        <BankTransactionHistoryModal
          bank={historyModalBank}
          onClose={() => setHistoryModalBank(null)}
        />
      )}
    </div>
  );
}
