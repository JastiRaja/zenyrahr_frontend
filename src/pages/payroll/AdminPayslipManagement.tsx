import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { getAllEmployees, Employee } from '../../api/payroll';
import dayjs from 'dayjs';
import axios from 'axios';
import { Modal } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import LoadingButton from '../../components/LoadingButton';

interface Payroll {
  id: number;
  employeeId: number;
  payrollDate: string;
  payrollMonthYear: string;
  status: string;
  basicPay: string;
  houseRentAllowance: string;
  medicalAllowance: string;
  otherAllowances: string;
  grossPay: string;
  totalEarnings: string;
  epfAmount: string;
  professionalTax: string;
  healthInsuranceDeduction: string;
  totalDeductions: string;
  netPay: string;
  netPayInWords: string;
}

const AdminPayslipManagement: React.FC = () => {
  const [payslips, setPayslips] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bankDetails, setBankDetails] = useState<{[key: number]: any}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generateMonth, setGenerateMonth] = useState(dayjs().format('YYYY-MM'));
  const [generating, setGenerating] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankModalEmployeeId, setBankModalEmployeeId] = useState<number | null>(null);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    paymentMethod: '',
    uanNumber: '',
    panNumber: '',
    companyName: '',
    companyAddress: '',
    companyLogoUrl: '',
  });
  const [bankFormError, setBankFormError] = useState<string | null>(null);
  const [savingBankDetails, setSavingBankDetails] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceModalData, setAttendanceModalData] = useState<any>(null);
  const [editingPayslipId, setEditingPayslipId] = useState<number | null>(null);
  const [editedDeductions, setEditedDeductions] = useState<{ [id: number]: any }>({});

  useEffect(() => {
    fetchPayslips();
    fetchEmployees();
    // fetchBankDetails();
  }, []);

  const fetchPayslips = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all employees first
      const employeesRes = await axiosInstance.get('/auth/employees');
      const employees = employeesRes.data;
      // Fetch payslips for each employee
      const allPayslips = [];
      for (const emp of employees) {
        const payslipsRes = await axiosInstance.get(`/api/payroll/payslips?employeeId=${emp.id}`);
        allPayslips.push(...payslipsRes.data);
      }
      setPayslips(allPayslips);
    } catch {
      setError('Failed to fetch payslips');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await getAllEmployees();
      setEmployees(data);
    } catch {
      setError('Failed to fetch employees');
    }
  };

  const fetchBankDetails = async (employeeId: number) => {
    const response = await axiosInstance.get(`/api/SalaryAndBankDetails/employee/${employeeId}`);
    return response.data;
  };

  const getEmployeeName = (id: number) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : id;
  };
  const getEmployeeEmail = (id: number) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.email : '';
  };

  const handleFieldChange = (id: number, field: keyof Payroll, value: string) => {
    setPayslips(prev =>
      prev.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      )
    );
    setEditingPayslipId(id);
    setEditedDeductions(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleApprove = async (id: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const payslip = payslips.find(p => p.id === id);
    if (!payslip) return;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const approvedBy = encodeURIComponent(user.firstName || '');
      await axiosInstance.put(`/api/payroll/payslips/${id}/approve?approvedBy=${approvedBy}`);
      setSuccess('Payslip approved!');
      fetchPayslips();
    } catch {
      setError('Failed to approve payslip');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    setGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      await axiosInstance.post(`/api/payroll/generate-batch?month=${generateMonth}`);
      setSuccess('Payroll generated for all employees!');
      fetchPayslips();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (typeof data === 'string' && data.trim()) {
          setError(data);
        } else if (data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()) {
          setError(data.message);
        } else if (err.response?.status === 400) {
          setError('Payscale is not added for one or more employees. Please add payscale and try again.');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to generate payroll.');
        } else {
          setError('Failed to generate payroll');
        }
      } else {
        setError('Failed to generate payroll');
      }
    } finally {
      setGenerating(false);
    }
  };

  // Helper to check if employee has bank details
  const hasBankDetails = (employeeId: number) => {
    return !!bankDetails[employeeId];
  };

  const getBankDetailsDisplay = (employeeId: number) => {
    const details = bankDetails[employeeId];
    if (!details) return null;
    return `${details.bankName} - ${details.accountNumber}`;
  };

  // Open modal for adding/editing bank details
  const openBankModal = async (employeeId: number) => {
    setBankModalEmployeeId(employeeId);
    setBankFormError(null);
    setBankModalOpen(true);
    try {
      const response = await axiosInstance.get(`/api/SalaryAndBankDetails/employee/${employeeId}`);
      const details = response.data;
      setBankForm({
        bankName: details.bankName || '',
        accountNumber: details.accountNumber || '',
        ifscCode: details.ifscCode || '',
        accountHolderName: details.accountHolderName || '',
        paymentMethod: details.paymentMethod || '',
        uanNumber: details.uanNumber || '',
        panNumber: details.panNumber || '',
        companyName: details.companyName || '',
        companyAddress: details.companyAddress || '',
        companyLogoUrl: details.companyLogoUrl || '',
      });
    } catch {
      setBankForm({
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
        paymentMethod: '',
        uanNumber: '',
        panNumber: '',
        companyName: '',
        companyAddress: '',
        companyLogoUrl: '',
      });
    }
  };

  // Submit bank details (add or edit)
  const handleBankFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankModalEmployeeId) return;
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.ifscCode || !bankForm.accountHolderName || !bankForm.paymentMethod) {
      setBankFormError('All fields are required');
      return;
    }
    setSavingBankDetails(true);
    try {
      let existingDetails;
      try {
        const res = await axiosInstance.get(`/api/SalaryAndBankDetails/employee/${bankModalEmployeeId}`);
        existingDetails = res.data;
      } catch {
        existingDetails = null;
      }
      if (existingDetails && existingDetails.id) {
        // Update (PUT)
        await axiosInstance.put(`/api/SalaryAndBankDetails/${existingDetails.id}`, {
          ...existingDetails,
          ...bankForm,
          employee: { id: bankModalEmployeeId },
          ctc: 0,
          basic: 0,
          allowances: 0,
          effectiveDate: new Date().toISOString().split('T')[0]
        });
      } else {
        // Create (POST)
        await axiosInstance.post('/api/SalaryAndBankDetails', {
          employee: { id: bankModalEmployeeId },
          ...bankForm,
          ctc: 0,
          basic: 0,
          allowances: 0,
          effectiveDate: new Date().toISOString().split('T')[0]
        });
      }
      setBankModalOpen(false);
      setBankModalEmployeeId(null);
      setBankFormError(null);
      if (bankModalEmployeeId) {
        await fetchBankDetails(bankModalEmployeeId);
      }
      await fetchPayslips();
    } catch {
      setBankFormError('Failed to save bank details');
    } finally {
      setSavingBankDetails(false);
    }
  };

  const fetchAttendanceStats = async (employeeId: number, month: string, year: string) => {
    try {
      const response = await axiosInstance.get('/api/payroll/attendance', {
        params: { employeeId, month, year }
      });
      const records = response.data;
      let present = 0, absent = 0, half = 0;
      records.forEach((r: any) => {
        if (r.status === 'PRESENT' || (r.status && r.status.startsWith('LEAVE'))) present++;
        else if (r.status === 'ABSENT') absent++;
        else if (r.status === 'HALF_DAY') half++;
      });
      return { present, absent, half, total: records.length };
    } catch {
      return { present: 0, absent: 0, half: 0, total: 0 };
    }
  };

  const handleShowAttendanceModal = async (employeeId: number, payrollMonthYear: string) => {
    const [year, month] = payrollMonthYear.split('-');
    const stats = await fetchAttendanceStats(employeeId, month, year);
    setAttendanceModalData({ employeeId, payrollMonthYear, ...stats });
    setAttendanceModalOpen(true);
  };

  // Add API call for updating deductions
  const updatePayrollDeductions = async (payrollId: number, data: any) => {
    return axiosInstance.put(`/api/payroll/payslips/${payrollId}/deductions`, data);
  };

  const handleUpdateDeductions = async (p: Payroll) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updatePayrollDeductions(p.id, {
        epfAmount: p.epfAmount,
        healthInsuranceDeduction: p.healthInsuranceDeduction,
        professionalTax: p.professionalTax,
        otherDeductions: p.otherAllowances // Adjust if you have a different field for other deductions
      });
      setSuccess('Deductions updated!');
      setEditingPayslipId(null);
      setEditedDeductions(prev => {
        const newEdits = { ...prev };
        delete newEdits[p.id];
        return newEdits;
      });
      fetchPayslips();
    } catch {
      setError('Failed to update deductions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-3 py-6">
      <div className="bg-white rounded-lg shadow p-5 max-w-1xl mx-auto text-sm">
        <h2 className="text-xl font-bold mb-3">Payslip Approval & Deductions</h2>
        <div className="flex items-center mb-3 gap-3">
          <label className="font-medium text-sm">Month:</label>
          <input
            type="month"
            value={generateMonth}
            onChange={e => setGenerateMonth(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
            style={{ maxWidth: 160 }}
          />
          <button
            className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={handleGeneratePayroll}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Payroll'}
          </button>
        </div>
        {loading && <div className="text-center py-3 text-sm">Loading...</div>}
        {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}
        {success && <div className="text-green-600 mb-3 text-sm">{success}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 border-b">Employee</th>
                <th className="px-2 py-1 border-b">Bank Details</th>
                <th className="px-2 py-1 border-b">Month</th>
                <th className="px-2 py-1 border-b">Gross Pay</th>
                <th className="px-2 py-1 border-b">EPF</th>
                <th className="px-2 py-1 border-b">Health Insurance</th>
                <th className="px-2 py-1 border-b">Prof. Tax</th>
                <th className="px-2 py-1 border-b">Other Deductions</th>
                <th className="px-2 py-1 border-b">Total Deductions</th>
                <th className="px-2 py-1 border-b">Net Pay</th>
                <th className="px-2 py-1 border-b">Status</th>
                <th className="px-2 py-1 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map(p => (
                <tr key={p.id} className="even:bg-gray-50">
                  <td className="px-2 py-1 border-b">{getEmployeeName(p.employeeId)}</td>
                  <td className="px-2 py-1 border-b">
                    {!hasBankDetails(p.employeeId) ? (
                      <button
                        className="bg-yellow-500 text-white px-2 py-1 text-xs rounded"
                        onClick={() => openBankModal(p.employeeId)}
                      >
                        Add Bank Details
                      </button>
                    ) : (
                      <div className="text-sm">
                        <div>{getBankDetailsDisplay(p.employeeId)}</div>
                        <div className="text-gray-500 text-xs">{getEmployeeEmail(p.employeeId)}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1 border-b">{p.payrollMonthYear}</td>
                  <td className="px-2 py-1 border-b">{p.grossPay}</td>
                  <td className="px-2 py-1 border-b">
                    <input
                      type="text"
                      value={p.epfAmount || ''}
                      onChange={e => handleFieldChange(p.id, 'epfAmount', e.target.value)}
                      className="border rounded px-1 py-0.5 w-20 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1 border-b">
                    <input
                      type="text"
                      value={p.healthInsuranceDeduction || ''}
                      onChange={e => handleFieldChange(p.id, 'healthInsuranceDeduction', e.target.value)}
                      className="border rounded px-1 py-0.5 w-20 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1 border-b">
                    <input
                      type="text"
                      value={p.professionalTax || ''}
                      onChange={e => handleFieldChange(p.id, 'professionalTax', e.target.value)}
                      className="border rounded px-1 py-0.5 w-20 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1 border-b">
                    <input
                      type="text"
                      value={p.otherAllowances || ''}
                      onChange={e => handleFieldChange(p.id, 'otherAllowances', e.target.value)}
                      className="border rounded px-1 py-0.5 w-20 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1 border-b">{p.totalDeductions}</td>
                  <td className="px-2 py-1 border-b">
                    <input
                      type="text"
                      value={p.netPay || ''}
                      onChange={e => handleFieldChange(p.id, 'netPay', e.target.value)}
                      className="border rounded px-1 py-0.5 w-20 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1 border-b">{p.status}</td>
                  <td className="px-2 py-1 border-b">
                    {p.status !== 'APPROVED' && (
                      <button
                        className="bg-green-600 text-white px-2.5 py-1 text-xs rounded hover:bg-green-700"
                        onClick={() => handleApprove(p.id)}
                        disabled={loading}
                      >
                        Approve
                      </button>
                    )}
                    {editingPayslipId === p.id && (
                      <button
                        className="bg-blue-600 text-white px-2.5 py-1 text-xs rounded hover:bg-blue-700 ml-2"
                        onClick={() => handleUpdateDeductions(p)}
                        disabled={loading}
                      >
                        Update
                      </button>
                    )}
                  </td>
                  <td className="px-2 py-1 border-b">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      title="View Attendance Calculation"
                      onClick={() => handleShowAttendanceModal(p.employeeId, p.payrollMonthYear)}
                    >
                      <InfoCircleOutlined />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Bank Details Modal */}
      {bankModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Bank Details</h3>
            <form onSubmit={handleBankFormSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Bank Name"
                value={bankForm.bankName}
                onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })}
                className="w-full border rounded px-2 py-1"
                required
              />
              <input
                type="text"
                placeholder="Account Number"
                value={bankForm.accountNumber}
                onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                className="w-full border rounded px-2 py-1"
                required
              />
              <input
                type="text"
                placeholder="IFSC Code"
                value={bankForm.ifscCode}
                onChange={e => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                className="w-full border rounded px-2 py-1"
                required
              />
              <input
                type="text"
                placeholder="Account Holder Name"
                value={bankForm.accountHolderName}
                onChange={e => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                className="w-full border rounded px-2 py-1"
                required
              />
              <input
                type="text"
                placeholder="Payment Method"
                value={bankForm.paymentMethod}
                onChange={e => setBankForm({ ...bankForm, paymentMethod: e.target.value })}
                className="w-full border rounded px-2 py-1"
                required
              />
              <input
                type="text"
                placeholder="UAN Number"
                value={bankForm.uanNumber}
                onChange={e => setBankForm({ ...bankForm, uanNumber: e.target.value })}
                className="w-full border rounded px-2 py-1"
              />
              <input
                type="text"
                placeholder="PAN Number"
                value={bankForm.panNumber}
                onChange={e => setBankForm({ ...bankForm, panNumber: e.target.value })}
                className="w-full border rounded px-2 py-1"
              />
              <input
                type="text"
                placeholder="Organization Name (optional)"
                value={bankForm.companyName}
                onChange={e => setBankForm({ ...bankForm, companyName: e.target.value })}
                className="w-full border rounded px-2 py-1"
              />
              <input
                type="text"
                placeholder="Organization Logo URL (optional)"
                value={bankForm.companyLogoUrl}
                onChange={e => setBankForm({ ...bankForm, companyLogoUrl: e.target.value })}
                className="w-full border rounded px-2 py-1"
              />
              <textarea
                placeholder="Organization Address (optional)"
                value={bankForm.companyAddress}
                onChange={e => setBankForm({ ...bankForm, companyAddress: e.target.value })}
                className="w-full border rounded px-2 py-1"
                rows={2}
              />
              {bankFormError && <div className="text-red-600 text-sm">{bankFormError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => setBankModalOpen(false)}>Cancel</button>
                <LoadingButton
                  type="submit" 
                  loading={savingBankDetails}
                  loadingText="Saving..."
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  Save
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Attendance Calculation Modal */}
      <Modal
        title="Attendance-based Salary Calculation"
        open={attendanceModalOpen}
        onCancel={() => setAttendanceModalOpen(false)}
        footer={null}
      >
        {attendanceModalData && (
          <div>
            <div><b>Employee ID:</b> {attendanceModalData.employeeId}</div>
            <div><b>Month:</b> {attendanceModalData.payrollMonthYear}</div>
            <div><b>Total Working Days:</b> {attendanceModalData.total}</div>
            <div><b>Present Days:</b> {attendanceModalData.present}</div>
            <div><b>Absent Days:</b> {attendanceModalData.absent}</div>
            <div><b>Half Days:</b> {attendanceModalData.half}</div>
            <div><b>Payable Days:</b> {attendanceModalData.present} + 0.5 × {attendanceModalData.half} = {attendanceModalData.present + 0.5 * attendanceModalData.half}</div>
            <div className="mt-2"><b>Pro-rata Formula:</b> (Payable Days / Total Working Days) × Monthly Salary</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminPayslipManagement; 