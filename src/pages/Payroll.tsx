import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { Download, FileText, CreditCard, Wallet, PieChart } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

type PayrollRecord = {
  id: number;
  employeeId: number;
  payrollDate: string;
  payrollMonthYear: string;
  grossPay: number;
  netPay: number;
  basicPay: number;
  houseRentAllowance: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  otherAllowances: number;
  epfAmount: number;
  professionalTax: number;
  healthInsuranceDeduction: number;
  totalEarnings: number;
  totalDeductions: number;
  status: string;
};

export default function Payroll() {
  const { user } = useAuth();
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [latestPayroll, setLatestPayroll] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchPayrollData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/payroll`);

        // ✅ Filter payroll records for logged-in employee
        const employeePayrolls = response.data.filter(
          (p: any) => p.employeeId == user.id
        );

        if (employeePayrolls.length === 0) {
          setError("No payroll data found for this employee.");
          return;
        }

        // ✅ Sort by most recent payroll first
        const sortedPayrolls: PayrollRecord[] = employeePayrolls.sort(
          (a: PayrollRecord, b: PayrollRecord) =>
            new Date(b.payrollDate).getTime() -
            new Date(a.payrollDate).getTime()
        );

        setLatestPayroll(sortedPayrolls[0]); // Most recent payroll
        setPayrollRecords(sortedPayrolls.slice(1)); // Past payrolls
      } catch (err) {
        console.error("❌ Error fetching payroll data:", err);
        setError("Failed to fetch payroll data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollData();
  }, [user?.id]);

  const handleGeneratePayslip = async () => {
    if (!latestPayroll) return;

    setGenerating(true);
    try {
      const payload = {
        employeeId: latestPayroll.employeeId,
        payrollDate: latestPayroll.payrollDate,
        grossPay: latestPayroll.grossPay.toString(),
        netPay: latestPayroll.netPay.toString(),
        netPayInWords: "Forty Five Thousand", // You can use a library to convert numbers to words dynamically
        totalEarnings: latestPayroll.totalEarnings.toString(),
        basicPay: latestPayroll.basicPay.toString(),
        houseRentAllowance: latestPayroll.houseRentAllowance.toString(),
        conveyanceAllowance: latestPayroll.conveyanceAllowance.toString(),
        medicalAllowance: latestPayroll.medicalAllowance.toString(),
        otherAllowances: latestPayroll.otherAllowances.toString(),
        totalDeductions: latestPayroll.totalDeductions.toString(),
        epfAmount: latestPayroll.epfAmount.toString(),
        professionalTax: latestPayroll.professionalTax.toString(),
        healthInsuranceDeduction:
          latestPayroll.healthInsuranceDeduction.toString(),
      };

      // Dynamically insert employeeId into API endpoint
      const apiEndpoint = `${API_BASE_URL}/api/payroll/generate/${latestPayroll.employeeId}`;

      const response = await axios.post(apiEndpoint, payload);

      if (response.status === 200) {
        alert("Payslip generated successfully!");
      }
    } catch (err) {
      console.error("❌ Error generating payslip:", err);
      alert("Failed to generate payslip.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading)
    return (
      <div className="text-center text-gray-500">Loading payroll data...</div>
    );
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!latestPayroll)
    return (
      <div className="text-center text-gray-500">
        No payroll data available.
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
        <p className="mt-2 text-lg text-gray-600">
          View your salary and compensation details
        </p>
      </div>

      {/* 🔹 Salary Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            name: "Base Salary",
            value: `₹${latestPayroll.basicPay}`,
            icon: Wallet,
          },
          {
            name: "Total Earnings",
            value: `₹${latestPayroll.totalEarnings}`,
            icon: Wallet,
          },
          {
            name: "Tax Deductions",
            value: `₹${latestPayroll.totalDeductions}`,
            icon: CreditCard,
          },
          {
            name: "Net Pay",
            value: `₹${latestPayroll.netPay}`,
            icon: PieChart,
          },
        ].map((item) => (
          <div
            key={item.name}
            className="stat-card p-6 shadow-md bg-white rounded-lg"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700">
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{item.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {item.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🔹 Payslips */}
      <div className="card bg-white shadow-md rounded-lg">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Payslips</h2>
          <button
            onClick={handleGeneratePayslip}
            disabled={generating}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {generating ? "Generating..." : "Generate Payslip"}
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {[latestPayroll, ...payrollRecords].map((payslip) => (
            <div
              key={payslip.id}
              className="p-6 hover:bg-gray-50 transition-colors duration-200 flex justify-between items-center"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-indigo-50">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {payslip.payrollMonthYear}
                  </h3>
                  <div className="mt-1 flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      Salary: ₹{payslip.grossPay}
                    </span>
                    <span className="text-sm text-gray-500">
                      Date: {payslip.payrollDate}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payslip.status === "Paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {payslip.status}
                    </span>
                  </div>
                </div>
              </div>
              <button className="btn-secondary flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 🔹 Compensation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Earnings Breakdown */}
        <div className="card p-6 shadow-md bg-white rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Earnings Breakdown
          </h2>
          <div className="space-y-4">
            {[
              {
                label: "House Rent Allowance",
                value: `₹${latestPayroll.houseRentAllowance}`,
                percentage: "20%",
              },
              {
                label: "Conveyance Allowance",
                value: `₹${latestPayroll.conveyanceAllowance}`,
                percentage: "5%",
              },
              {
                label: "Medical Allowance",
                value: `₹${latestPayroll.medicalAllowance}`,
                percentage: "10%",
              },
              {
                label: "Other Allowances",
                value: `₹${latestPayroll.otherAllowances}`,
                percentage: "15%",
              },
            ].map((item) => (
              <div key={item.label} className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Deductions */}
        <div className="card p-6 shadow-md bg-white rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Deductions
          </h2>
          <div className="space-y-4">
            {[
              { label: "EPF Amount", value: `₹${latestPayroll.epfAmount}` },
              {
                label: "Professional Tax",
                value: `₹${latestPayroll.professionalTax}`,
              },
              {
                label: "Health Insurance",
                value: `₹${latestPayroll.healthInsuranceDeduction}`,
              },
            ].map((item) => (
              <div key={item.label} className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
