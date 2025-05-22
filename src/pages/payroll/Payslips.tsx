import React, { useEffect, useState, useRef } from 'react';
import { getPayslips, Payslip } from '../../api/payroll';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import PayslipTemplate from './PayslipTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Modal } from 'antd';
import axios from 'axios';

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
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;
    if (!user || !user.id) return;
    const res = await axios.get(`${API_BASE_URL}/auth/employees/${user.id}`);
    setEmployeeProfile(res.data || {});
  };

  const fetchBankDetails = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;
    if (!user || !user.id) return;
    const res = await axios.get(`${API_BASE_URL}/api/SalaryAndBankDetails/employee/${user.id}`);
    setBankDetails(res.data || {});
  };

  const handleOpenModal = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
    setModalOpen(true);
  };

  const handleDownloadPDF = async () => {
    if (!payslipRef.current) return;
    const element = payslipRef.current;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Payslip_${user?.id}_${(selectedPayslip as any)?.payrollMonthYear || ''}.pdf`);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const getEmployeeObj = () => ({
    name: (employeeProfile?.firstName || '') + ' ' + (employeeProfile?.lastName || ''),
    employeeCode: employeeProfile?.id || '',
    designation: employeeProfile?.position || '',
    department: employeeProfile?.department || '',
    doj: employeeProfile?.joinDate || '',
    bankName: bankDetails?.bankName || '',
    accountNumber: bankDetails?.accountNumber || '',
    uanNumber: bankDetails?.uanNumber || '',
    panNumber: bankDetails?.panNumber || '',
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Payslips</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Month/Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Basic Salary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Allowances
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deductions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Salary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payslips.map((payslip) => (
              <tr key={payslip.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {('payrollMonthYear' in payslip ? payslip.payrollMonthYear : formatDateSafe(payslip.createdAt, 'MMMM yyyy'))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ₹{('basicPay' in payslip ? payslip.basicPay : 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ₹{('otherAllowances' in payslip ? payslip.otherAllowances : 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ₹{('totalDeductions' in payslip ? payslip.totalDeductions : 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ₹{('netPay' in payslip ? payslip.netPay : 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${payslip.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                      payslip.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {payslip.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleOpenModal(payslip)}
                    className={`text-indigo-600 hover:text-indigo-900 ${payslip.status !== 'APPROVED' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={payslip.status !== 'APPROVED'}
                  >
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        title="Payslip Preview"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={[
          <button key="download" onClick={handleDownloadPDF} className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={selectedPayslip?.status !== 'APPROVED'}>
            Download PDF
          </button>,
          <button key="close" onClick={() => setModalOpen(false)} className="ml-2 px-4 py-2 rounded border">Close</button>
        ]}
        width={900}
      >
        <div ref={payslipRef}>
          {selectedPayslip && (
            <PayslipTemplate payslip={selectedPayslip} employee={getEmployeeObj()} />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Payslips; 