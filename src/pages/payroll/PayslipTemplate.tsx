import { forwardRef } from 'react';
import logo from "../../assets/logo.jpeg";

interface PayslipTemplateProps {
  payslip: any;
  employee: any;
}

function parseMoney(value: unknown): number {
  const n = parseFloat(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Formatted amount for display; legacy payslips may omit DA/health fields. */
function displayDearnessAllowance(p: any): string {
  const explicit = parseMoney(p?.dearnessAllowance);
  if (explicit > 0.001) return String(p.dearnessAllowance);
  const total = parseMoney(p?.totalEarnings);
  const sum =
    parseMoney(p?.basicPay) +
    parseMoney(p?.houseRentAllowance) +
    parseMoney(p?.medicalAllowance) +
    parseMoney(p?.otherAllowances) +
    parseMoney(p?.conveyanceAllowance);
  const residual = Math.round((total - sum) * 100) / 100;
  return residual > 0.001 ? residual.toFixed(2) : '0.00';
}

function displayHealthInsurance(p: any): string {
  const explicit = parseMoney(p?.healthInsuranceDeduction);
  if (explicit > 0.001) return String(p.healthInsuranceDeduction);
  const td = parseMoney(p?.totalDeductions);
  const epf = parseMoney(p?.epfAmount);
  const pt = parseMoney(p?.professionalTax);
  const residual = Math.round((td - epf - pt) * 100) / 100;
  return residual > 0.001 ? residual.toFixed(2) : String(p?.healthInsuranceDeduction ?? '0.00');
}

const PayslipTemplate = forwardRef<HTMLDivElement, PayslipTemplateProps>(({ payslip, employee }, ref) => {
  const companyLogoSrc = employee?.companyLogoUrl || logo;
  const companyName = employee?.companyName || 'ZenyraHR';
  const companyAddress =
    employee?.companyAddress ||
    '8-3-224/11/D/5/1(G-127), Second Floor, Madhuranagar, Hyderabad, Telangana – 500038, India.';

  return (
  <div ref={ref} style={{ background: '#fff', color: '#000', padding: 24, width: 800, fontFamily: 'Arial, sans-serif' }}>
    {/* Header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', marginBottom: 16 }}>
      <div>
        <img src={companyLogoSrc} alt={companyName} style={{ height: 48 }} />
      </div>
      <div style={{ textAlign: 'right' }}>
        <h2 style={{ margin: 0, fontWeight: 'bold' }}>{companyName}</h2>
        <div style={{ fontSize: 12 }}>
          {companyAddress}
        </div>
      </div>
    </div>
    <h3 style={{ textAlign: 'center', margin: 0, letterSpacing: 2 }}>PAY SLIP FOR {payslip.payrollMonthYear}</h3>
    {/* Employee Info Table */}
    <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0' }}>
      <tbody>
        <tr>
          <td>Name of the Employee</td>
          <td>{employee.name}</td>
          <td>UAN</td>
          <td>{employee.uanNumber || ''}</td>
        </tr>
        <tr>
          <td>Employee ID</td>
          <td>{employee.employeeCode}</td>
          <td>Designation</td>
          <td>{employee.designation}</td>
        </tr>
        <tr>
          <td>Department</td>
          <td>{employee.department}</td>
          <td>Bank Name</td>
          <td>{employee.bankName}</td>
        </tr>
        <tr>
          <td>DOJ</td>
          <td>{employee.doj}</td>
          <td>Bank A/C No</td>
          <td>{employee.accountNumber}</td>
        </tr>
        <tr>
          <td>Gross Wage</td>
          <td>{payslip.grossPay}</td>
          <td>Total Working Days</td>
          <td>{payslip.totalWorkingDays}</td>
        </tr>
        <tr>
          <td>Absent Days (LOP Days)</td>
          <td>{payslip.absentDays}</td>
          <td>Paid Days</td>
          <td>{payslip.paidDays}</td>
        </tr>
      </tbody>
    </table>
    {/* Earnings & Deductions — header text and rule are split so html2canvas does not draw a “stitched” line between columns */}
    <table
      style={{
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        margin: '16px 0',
      }}
    >
      <tbody>
        <tr>
          <th
            colSpan={2}
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              padding: '10px 8px 4px',
              border: 'none',
              verticalAlign: 'bottom',
            }}
          >
            Earnings
          </th>
          <th
            colSpan={2}
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              padding: '10px 8px 4px',
              border: 'none',
              verticalAlign: 'bottom',
            }}
          >
            Deductions
          </th>
        </tr>
        <tr>
          <td colSpan={4} style={{ padding: '0 0 10px', border: 'none', lineHeight: 0 }}>
            <div style={{ borderTop: '1px solid #000', width: '100%' }} />
          </td>
        </tr>
        <tr>
          <td>Basic Wage</td>
          <td>₹{payslip.basicPay}</td>
          <td>EPF</td>
          <td>₹{payslip.epfAmount}</td>
        </tr>
        <tr>
          <td>HRA</td>
          <td>₹{payslip.houseRentAllowance}</td>
          <td>Professional Tax</td>
          <td>₹{payslip.professionalTax}</td>
        </tr>
        <tr>
          <td>Dearness Allowance (DA)</td>
          <td>₹{displayDearnessAllowance(payslip)}</td>
          <td>Health Insurance</td>
          <td>₹{displayHealthInsurance(payslip)}</td>
        </tr>
        <tr>
          <td>Medical Allowances</td>
          <td>₹{payslip.medicalAllowance}</td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td>Other Allowances</td>
          <td>₹{payslip.otherAllowances}</td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td style={{ fontWeight: 'bold' }}>Total Earnings</td>
          <td style={{ fontWeight: 'bold' }}>₹{payslip.totalEarnings}</td>
          <td style={{ fontWeight: 'bold' }}>Total Deductions</td>
          <td style={{ fontWeight: 'bold' }}>₹{payslip.totalDeductions}</td>
        </tr>
        <tr>
          <td colSpan={2} style={{ fontWeight: 'bold', textAlign: 'center' }}>Net Salary</td>
          <td colSpan={2} style={{ fontWeight: 'bold', textAlign: 'center' }}>₹{payslip.netPay}</td>
        </tr>
      </tbody>
    </table>
    <div style={{ fontSize: 12, textAlign: 'center', marginTop: 24 }}>
      This is a computer-generated document. No signature is required.
    </div>
  </div>
  );
});

export default PayslipTemplate; 