import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Tag,
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  Trash2,
} from "react-feather";
import { useAuth } from "../../contexts/AuthContext"; // Import the useAuth hook
import { IndianRupee } from "lucide-react";
import api from "../../api/axios";
import LoadingButton from "../../components/LoadingButton";

export default function SubmitExpense() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // Use the useAuth hook to get the user and authentication status
  interface Expense {
    id: number;
    date: string;
    category: string;
    amount: string;
    description: string;
    documents: File[];
    firstLevelApprovalStatus: string;
    secondLevelApprovalStatus: string;
  }

  const [formEntries, setFormEntries] = useState<Expense[]>([
    {
      id: Date.now(),
      date: "",
      category: "",
      amount: "",
      description: "",
      documents: [],
      firstLevelApprovalStatus: "PENDING",
      secondLevelApprovalStatus: "PENDING",
    },
  ]);
  const [notification, setNotification] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [lastMonthAmount, setLastMonthAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExpenses = async () => {
    try {
      const response = await api.get(`/api/expenses`);
      const data = Array.isArray(response.data) ? response.data : [];
      // Ensure documents property is always an array
      const expensesWithDocuments = data.map((expense: any) => ({
        ...expense,
        documents: expense.documents || [],
      }));

      // Calculate summary data
      const total: number = expensesWithDocuments.reduce(
        (sum: number, expense: Expense) =>
          sum + parseFloat(expense.amount || "0"),
        0
      );
      setTotalAmount(total);

      const pending: number = expensesWithDocuments
        .filter(
          (expense: Expense) =>
            expense.firstLevelApprovalStatus === "PENDING" ||
            expense.secondLevelApprovalStatus === "PENDING"
        )
        .reduce(
          (sum: number, expense: Expense) =>
            sum + parseFloat(expense.amount || "0"),
          0
        );
      setPendingAmount(pending);

      const lastMonth: number = expensesWithDocuments
        .filter((expense: Expense) => {
          const expenseDate: Date = new Date(expense.date);
          const now: Date = new Date();
          return (
            expenseDate.getMonth() === now.getMonth() - 1 &&
            expenseDate.getFullYear() === now.getFullYear()
          );
        })
        .reduce(
          (sum: number, expense: Expense) =>
            sum + parseFloat(expense.amount || "0"),
          0
        );
      setLastMonthAmount(lastMonth);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const addExpense = () => {
    setFormEntries([
      ...formEntries,
      {
        id: Date.now(),
        date: "",
        category: "",
        amount: "",
        description: "",
        documents: [],
        firstLevelApprovalStatus: "PENDING",
        secondLevelApprovalStatus: "PENDING",
      },
    ]);
  };

  const removeExpense = (id: number) => {
    setFormEntries(formEntries.filter((expense) => expense.id !== id));
  };

  const handleRemoveFile = (expenseId: number, fileIndex: number) => {
    setFormEntries((prevExpenses) =>
      prevExpenses.map((expense) =>
        expense.id === expenseId
          ? {
              ...expense,
              documents: expense.documents.filter(
                (_, idx) => idx !== fileIndex
              ),
            }
          : expense
      )
    );
  };

  const handleInputChange = (id: number, field: string, value: string) => {
    setFormEntries((prevExpenses) =>
      prevExpenses.map((expense) =>
        expense.id === id ? { ...expense, [field]: value } : expense
      )
    );
  };

  const handleFileChange = (
    id: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      const uploadedFiles = Array.from(e.target.files);
      setFormEntries((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense.id === id
            ? {
                ...expense,
                documents: [...expense.documents, ...uploadedFiles],
              }
            : expense
        )
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!isAuthenticated || !user) {
      setNotification("User not authenticated. Please log in again.");
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      setIsSubmitting(true);
      for (const expense of formEntries) {
        const formData = new FormData();

        const payload = {
          date: expense.date,
          category: expense.category,
          amount: parseFloat(expense.amount) || 0,
          description: expense.description,
          employee: { id: user.id }, // Use the user ID from the context
        };

        formData.append("expense", JSON.stringify(payload));

        expense.documents.forEach((file) => {
          formData.append("files", file);
        });

        await api.post(`/api/expenses`, formData);
      }

      setNotification("Successfully submitted");
      setTimeout(() => setNotification(null), 3000);
      navigate("/travel");
    } catch (error) {
      console.error("Error submitting form:", error);
      setNotification("Submission failed");
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Submit Expense</h1>
          <p className="mt-1 text-sm text-sky-50">
            Record and submit your business expenses.
          </p>
        </div>
      </section>

      {/* Expense Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            label: "Total Amount",
            value: `₹${totalAmount.toFixed(2)}`,
            type: "This Report",
          },
          {
            label: "Pending",
            value: `₹${pendingAmount.toFixed(2)}`,
            type: "All Reports",
          },
          {
            label: "Last Month",
            value: `₹${lastMonthAmount.toFixed(2)}`,
            type: "Approved",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h3 className="text-xs font-semibold uppercase text-slate-500">
              {stat.label}
            </h3>
            <p className="mt-2 flex items-baseline">
              <span className="text-xl font-semibold text-slate-900">
                {stat.value}
              </span>
              <span className="ml-2 text-xs text-slate-500">{stat.type}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Notification Section */}
      {notification && (
        <div
          className={`rounded-md border p-4 text-sm ${
            notification.includes("Successfully")
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {notification.includes("Successfully") ? (
            <CheckCircle className="h-6 w-6 mr-2" />
          ) : (
            <XCircle className="h-6 w-6 mr-2" />
          )}
          <span>{notification}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {formEntries.map((expense) => (
          <div
            key={expense.id}
            className="mb-6 rounded-md border border-slate-300 bg-white p-4 shadow-sm"
          >
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Expense Details
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 items-start border-b border-slate-200 pb-6 last:border-0 last:pb-0">
                {/* Date Field */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-purple-400" />
                    </div>
                    <input
                      type="date"
                      className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                      value={expense.date}
                      onChange={(e) =>
                        handleInputChange(expense.id, "date", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                {/* Category Field */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-5 w-5 text-purple-400" />
                    </div>
                    <select
                      className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                      value={expense.category}
                      onChange={(e) =>
                        handleInputChange(
                          expense.id,
                          "category",
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Travel">Travel</option>
                      <option value="Meals">Meals</option>
                      <option value="Accommodation">Accommodation</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Amount Field */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {/* <IndianRupee className="h-5 w-5 text-purple-400" /> */}
                      <IndianRupee className="h-5 w-5 text-purple-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                      value={expense.amount}
                      onChange={(e) =>
                        handleInputChange(expense.id, "amount", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                {/* Description Field */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                    value={expense.description}
                    onChange={(e) =>
                      handleInputChange(
                        expense.id,
                        "description",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                {/* File Upload */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Upload Receipts (Optional)
                  </label>
                  <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-sky-200 px-6 pb-6 pt-5 transition-colors duration-300 hover:border-sky-300">
                    <div className="space-y-1 text-center">
                      <FileText className="mx-auto h-12 w-12 text-sky-400" />
                      <div className="flex text-sm text-slate-600">
                        <label className="relative cursor-pointer rounded-md bg-white font-medium text-sky-700 hover:text-sky-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2">
                          <span>Upload files</span>
                          <input
                            type="file"
                            onChange={(e) => handleFileChange(expense.id, e)}
                            className="sr-only"
                            multiple
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-slate-500">
                        PDF, DOC up to 10MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Files List */}
                {expense.documents.length > 0 && (
                  <div className="sm:col-span-2">
                    <h4 className="text-sm font-medium text-slate-700">
                      Uploaded Files
                    </h4>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      {expense.documents.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between"
                        >
                          <span>{file.name}</span>
                          <span className="text-xs text-slate-500">
                            ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(expense.id, index)}
                            className="text-red-500 hover:text-red-700 flex items-center"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Remove Expense Button */}
              {formEntries.length > 1 && (
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeExpense(expense.id)}
                    className="text-red-500 hover:text-red-700 flex items-center"
                  >
                    <Trash2 className="h-5 w-5 mr-1" />
                    Remove Expense
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={addExpense}
            disabled={isSubmitting}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </button>
          <LoadingButton
            type="submit"
            loading={isSubmitting}
            loadingText="Submitting..."
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Submit Expenses
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
