import React, { forwardRef } from 'react';
import logo from '../../assets/Practio Logo Transparent.png';

interface PayslipTemplateProps {
  payslip: any;
  employee: any;
}

const PayslipTemplate = forwardRef<HTMLDivElement, PayslipTemplateProps>(({ payslip, employee }, ref) => (
  <div ref={ref} style={{ background: '#fff', color: '#000', padding: 24, width: 800, fontFamily: 'Arial, sans-serif' }}>
    {/* Header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', marginBottom: 16 }}>
      <div>
        <img src={logo} alt="Practio Logo" style={{ height: 48 }} />
      </div>
      <div style={{ textAlign: 'right' }}>
        <h2 style={{ margin: 0, fontWeight: 'bold' }}>Practio</h2>
        <div style={{ fontSize: 12 }}>
          8-3-224/11/D/5/1(G-127), Second Floor, Madhuranagar, Hyderabad, Telangana – 500038, India.
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
    {/* Earnings & Deductions */}
    <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0' }}>
      <thead>
        <tr>
          <th colSpan={2} style={{ textAlign: 'center', borderBottom: '1px solid #000' }}>Earnings</th>
          <th colSpan={2} style={{ textAlign: 'center', borderBottom: '1px solid #000' }}>Deductions</th>
        </tr>
      </thead>
      <tbody>
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
));

export default PayslipTemplate; 