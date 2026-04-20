import React, { useEffect, useState, useRef } from 'react';
import { getPayslips, Payslip } from '../../api/payroll';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import PayslipTemplate from './PayslipTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Modal } from 'antd';
import { FileText } from 'lucide-react';
import api from '../../api/axios';

function payslipStatusUpper(status: string | undefined | null) {
  return (status || '').trim().toUpperCase();
}

/** Approved or paid payslips may be downloaded by the employee. */
function isPayslipDownloadable(status: string | undefined | null) {
  const u = payslipStatusUpper(status);
  return u === 'APPROVED' || u === 'PAID';
}

function formatDateSafe(dateString: string | undefined | null, fmt: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  try {
    return format(date, fmt);
  } catch {
    return '';
  }
}

const Payslips: React.FC = () => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const payslipRef = useRef(null);
  const [employeeProfile, setEmployeeProfile] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState<any>(null);

  useEffect(() => {
    if (user && user.id) {
      fetchPayslips();
      fetchEmployeeProfile();
      fetchBankDetails();
    }
  }, [user]);

  const fetchPayslips = async () => {
    try {
      if (!user || !user.id) return;
      const data = await getPayslips(Number(user.id));
      setPayslips(data);
    } catch (error) {
      console.error('Error fetching payslips:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeProfile = async () => {
    if (!user || !user.id) return;
    const res = await api.get(`/auth/employees/${user.id}`);
    setEmployeeProfile(res.data || {});
  };

  const fetchBankDetails = async () => {
    if (!user || !user.id) return;
    const res = await api.get(`/api/SalaryAndBankDetails/employee/${user.id}`);
    setBankDetails(res.data || {});
  };

  const handleOpenModal = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
    setModalOpen(true);
  };

  const handleDownloadPDF = async () => {
    if (!payslipRef.current) return;
    const element = payslipRef.current;
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: false,
      scale: 2,
      backgroundColor: '#ffffff',
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Payslip_${user?.id}_${(selectedPayslip as any)?.payrollMonthYear || ''}.pdf`);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-600">Loading...</div>;
  }

  const getEmployeeObj = () => ({
    organization: employeeProfile?.organization || null,
    name: (employeeProfile?.firstName || '') + ' ' + (employeeProfile?.lastName || ''),
    employeeCode: employeeProfile?.id || '',
    designation: employeeProfile?.position || '',
    department: employeeProfile?.department || '',
    doj: employeeProfile?.joinDate || '',
    bankName: bankDetails?.bankName || '',
    accountNumber: bankDetails?.accountNumber || '',
    uanNumber: bankDetails?.uanNumber || '',
    panNumber: bankDetails?.panNumber || '',
    companyName: employeeProfile?.organization?.name || bankDetails?.companyName || 'ZenyraHR',
    companyAddress:
      employeeProfile?.organization?.address ||
      bankDetails?.companyAddress ||
      '8-3-224/11/D/5/1(G-127), Second Floor, Madhuranagar, Hyderabad, Telangana – 500038, India.',
    companyLogoUrl: employeeProfile?.organization?.logoUrl || bankDetails?.companyLogoUrl || '',
  });
  const approvedPayslips = payslips.filter((p) => payslipStatusUpper(p.status) === 'APPROVED').length;
  const paidPayslips = payslips.filter((p) => payslipStatusUpper(p.status) === 'PAID').length;
  const pendingPayslips = payslips.filter(
    (p) => !isPayslipDownloadable(p.status)
  ).length;
  const totalNet = payslips.reduce((sum, p) => sum + Number('netPay' in p ? p.netPay || 0 : 0), 0);

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-1 py-2">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">My Payslips</h1>
          <p className="mt-1 text-sm text-sky-50">
            View your payroll history and download approved or paid payslips.
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Total Payslips</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{payslips.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Approved / Paid</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{approvedPayslips} / {paidPayslips}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Pending</p>
            <p className="mt-1 text-xl font-bold text-amber-700">{pendingPayslips}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Total Net</p>
            <p className="mt-1 text-xl font-bold text-sky-700">₹{totalNet.toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="min-w-[980px] divide-y divide-slate-200">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Month/Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Basic Salary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Allowances
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Deductions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Net Salary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200/70">
            {payslips.map((payslip) => (
              <tr key={payslip.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {((payslip as any).payrollMonthYear ?? formatDateSafe(payslip.createdAt, 'MMMM yyyy'))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ₹{(payslip as any).basicPay ?? 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ₹{(payslip as any).otherAllowances ?? 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ₹{(payslip as any).totalDeductions ?? 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ₹{(payslip as any).netPay ?? 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${payslipStatusUpper(payslip.status) === 'PAID' ? 'bg-green-100 text-green-800' : 
                      payslipStatusUpper(payslip.status) === 'APPROVED' ? 'bg-blue-100 text-blue-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {payslip.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleOpenModal(payslip)}
                    className={`text-indigo-600 hover:text-indigo-900 ${!isPayslipDownloadable(payslip.status) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!isPayslipDownloadable(payslip.status)}
                  >
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
            {payslips.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                  No payslips available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </section>
      <Modal
        title="Payslip Preview"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={[
          <button key="download" onClick={handleDownloadPDF} className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60" disabled={!isPayslipDownloadable(selectedPayslip?.status)}>
            Download PDF
          </button>,
          <button key="close" onClick={() => setModalOpen(false)} className="ml-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
        ]}
        width={900}
      >
        <div ref={payslipRef}>
          {selectedPayslip && (
            <PayslipTemplate payslip={selectedPayslip} employee={getEmployeeObj()} />
          )}
          {!selectedPayslip && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <FileText className="h-4 w-4" />
              Select a payslip to preview.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Payslips; 