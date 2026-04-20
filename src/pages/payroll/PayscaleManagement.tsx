import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Space,
  Popconfirm,
  Divider,
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { useOrganizationScope } from '../../hooks/useOrganizationScope';

const { Option } = Select;

interface Payscale {
  id: number;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
  };
  ctc: number;
  basicSalary: number;
  hra: number;
  da: number;
  allowance: number;
  medicalAllowance: number;
  pfContribution: number;
  professionalTax: number;
  healthInsurance: number;
  status: string;
}

const PayscaleManagement: React.FC = () => {
  const [payscales, setPayscales] = useState<Payscale[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const {
    organizationId,
    setSelectedOrganizationId,
    organizations,
    needsOrganizationSelection,
  } = useOrganizationScope();
  const watchedEmployeeId = Form.useWatch('employeeId', form);
  const watchedCtc = Form.useWatch('ctc', form);
  const watchedBasicSalary = Form.useWatch('basicSalary', form);
  const watchedHra = Form.useWatch('hra', form);
  const watchedDa = Form.useWatch('da', form);
  const watchedAllowance = Form.useWatch('allowance', form);
  const watchedMedicalAllowance = Form.useWatch('medicalAllowance', form);
  const watchedPfContribution = Form.useWatch('pfContribution', form);
  const watchedProfessionalTax = Form.useWatch('professionalTax', form);
  const watchedHealthInsurance = Form.useWatch('healthInsurance', form);

  useEffect(() => {
    if (organizationId == null) {
      setPayscales([]);
      return;
    }
    fetchPayscales();
    fetchEmployees();
  }, [organizationId]);

  const fetchPayscales = async () => {
    if (organizationId == null) {
      return;
    }
    try {
      setLoading(true);
      const response = await api.get(`/api/payscale`, {
        params: { organizationId },
      });
      setPayscales(Array.isArray(response.data) ? response.data.filter(ps => ps.employee) : []);
    } catch (error) {
      message.error('Failed to fetch payscales');
      setPayscales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get(`/auth/employees`);
      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      message.error('Failed to fetch employees');
      setEmployees([]);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Payscale) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      employeeId: record.employee?.id ?? null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/payscale/${id}`);
      message.success('Payscale deleted successfully');
      fetchPayscales();
    } catch (error) {
      message.error('Failed to delete payscale');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Transform values to match backend expectations
      const payload = {
        ...values,
        employee: { id: values.employeeId },
        createdBy: user ? `${user.firstName} ${user.lastName}` : undefined,
      };
      delete payload.employeeId;

      if (editingId) {
        await api.put(`/api/payscale/${editingId}`, payload);
        message.success('Payscale updated successfully');
      } else {
        await api.post(`/api/payscale`, payload);
        message.success('Payscale created successfully');
      }
      setModalVisible(false);
      fetchPayscales();
    } catch (error) {
      message.error('Failed to save payscale');
    }
  };

  const calculateCTC = (values: any) => {
    const basic = Number(values.basicSalary) || 0;
    const hra = Number(values.hra) || 0;
    const da = Number(values.da) || 0;
    const allowance = Number(values.allowance) || 0;
    const med = Number(values.medicalAllowance) || 0;
    return basic + hra + da + allowance + med;
  };

  const onValuesChange = (changed: any, allValues: any) => {
    const ctc = calculateCTC(allValues);
    form.setFieldsValue({ ctc });
  };
  const formatCurrency = (value?: number) => `₹${Number(value || 0).toLocaleString()}/month`;
  const moneyFormatter = (value?: string | number) =>
    value !== undefined && value !== null && value !== ''
      ? `₹ ${Number(value).toLocaleString()}`
      : '';
  const moneyParser = (value?: string) => (value ? value.replace(/[^\d.-]/g, '') : '');
  const selectedEmployee = employees.find((emp) => emp.id === watchedEmployeeId);
  const toAmount = (value: unknown) => Number(value || 0);
  const totalEarningsPreview =
    toAmount(watchedBasicSalary) +
    toAmount(watchedHra) +
    toAmount(watchedDa) +
    toAmount(watchedAllowance) +
    toAmount(watchedMedicalAllowance);
  const totalDeductionsPreview =
    toAmount(watchedPfContribution) +
    toAmount(watchedProfessionalTax) +
    toAmount(watchedHealthInsurance);
  const estimatedNetPreview = totalEarningsPreview - totalDeductionsPreview;

  const columns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'firstName'],
      key: 'employee',
      render: (_: any, record: Payscale) => 
        `${record.employee.firstName} ${record.employee.lastName}`,
    },
    {
      title: 'CTC (Monthly)',
      dataIndex: 'ctc',
      key: 'ctc',
      render: (value: number) => value != null ? `₹${value.toLocaleString()}/month` : '-',
    },
    {
      title: 'Basic Salary (Monthly)',
      dataIndex: 'basicSalary',
      key: 'basicSalary',
      render: (value: number) => value != null ? `₹${value.toLocaleString()}/month` : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
          value?.toLowerCase() === 'active'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-slate-100 text-slate-700'
        }`}>
          {value || 'N/A'}
        </span>
      ),
    },
    {
      title: 'Allowance (Monthly)',
      dataIndex: 'allowance',
      key: 'allowance',
      render: (value: number) => value != null ? `₹${value.toLocaleString()}/month` : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Payscale) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this payscale?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  const filteredPayscales = payscales.filter((item) => {
    const employeeName = `${item.employee?.firstName || ''} ${item.employee?.lastName || ''}`.toLowerCase();
    return employeeName.includes(searchTerm.toLowerCase());
  });
  const totalCtc = filteredPayscales.reduce((sum, item) => sum + (item.ctc || 0), 0);
  const activeCount = filteredPayscales.filter((item) => item.status?.toLowerCase() === 'active').length;

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-1 py-2">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Payscale Management</h1>
              <p className="mt-1 text-sm text-sky-50">
                Manage monthly compensation structures for employees.
              </p>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              disabled={organizationId == null}
            >
              Add Payscale
            </Button>
          </div>
          {needsOrganizationSelection && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-sky-50">
              <span>Organization</span>
              <Select
                className="min-w-[220px]"
                placeholder="Select organization"
                value={organizationId ?? undefined}
                onChange={(v) => setSelectedOrganizationId(v)}
                options={organizations.map((o) => ({ label: o.name, value: o.id }))}
              />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Payscale Records</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{filteredPayscales.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Active</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{activeCount}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Employees</p>
            <p className="mt-1 text-xl font-bold text-sky-700">{employees.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Total Monthly CTC</p>
            <p className="mt-1 text-xl font-bold text-indigo-700">₹{totalCtc.toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        <Input
          placeholder="Search by employee name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </section>

      <Table
        columns={columns}
        dataSource={filteredPayscales}
        loading={loading}
        rowKey="id"
        className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm"
        pagination={{ pageSize: 10, showSizeChanger: false }}
      />

      <Modal
        title={
          <div>
            <p className="text-xl font-semibold text-slate-900">
              {editingId ? 'Edit Payscale' : 'Add Payscale'}
            </p>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Configure monthly salary components
            </p>
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={1040}
        centered
        destroyOnHidden
      >
        <div className="mb-4 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <p className="text-xs uppercase text-slate-500">Employee</p>
            <p className="text-sm font-semibold text-slate-900">
              {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : 'Not selected'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Monthly CTC</p>
            <p className="text-sm font-semibold text-sky-700">{formatCurrency(watchedCtc)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Mode</p>
            <p className="text-sm font-semibold text-slate-900">{editingId ? 'Update' : 'Create'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Earnings</p>
            <p className="text-sm font-semibold text-emerald-700">{formatCurrency(totalEarningsPreview)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Deductions</p>
            <p className="text-sm font-semibold text-rose-700">{formatCurrency(totalDeductionsPreview)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Est. Net</p>
            <p className="text-sm font-semibold text-indigo-700">{formatCurrency(estimatedNetPreview)}</p>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={onValuesChange}
          requiredMark={false}
        >
          <div className="max-h-[62vh] space-y-4 overflow-y-auto pr-1">
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employee & CTC</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  Step 1
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Form.Item
                  name="employeeId"
                  label="Employee"
                  rules={[{ required: true, message: 'Please select an employee' }]}
                  className="sm:col-span-2"
                >
                  <Select
                    showSearch
                    placeholder="Select employee"
                    optionFilterProp="label"
                    options={(employees || []).map((emp) => ({
                      value: emp.id,
                      label: `${emp.firstName} ${emp.lastName}`,
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  name="ctc"
                  label="CTC (Monthly, Auto-calculated)"
                  rules={[{ required: true, message: 'CTC is required' }]}
                  className="sm:col-span-2"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    readOnly
                    controls={false}
                    formatter={(value) => (value !== undefined && value !== null && value !== '' ? `${moneyFormatter(value)}/month` : '')}
                    parser={moneyParser}
                    placeholder="Auto-calculated from salary components"
                  />
                </Form.Item>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Monthly Earnings</p>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  Step 2
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Form.Item
                  name="basicSalary"
                  label="Basic Salary"
                  rules={[{ required: true, message: 'Enter basic salary' }]}
                >
                  <InputNumber
                    min={0}
                    controls={false}
                    style={{ width: '100%' }}
                    formatter={(value) => (value !== undefined && value !== null && value !== '' ? `${moneyFormatter(value)}/month` : '')}
                    parser={moneyParser}
                    placeholder="Enter amount"
                  />
                </Form.Item>

                <Form.Item
                  name="hra"
                  label="HRA"
                  rules={[{ required: true, message: 'Enter HRA amount' }]}
                >
                  <InputNumber
                    min={0}
                    controls={false}
                    style={{ width: '100%' }}
                    formatter={(value) => (value !== undefined && value !== null && value !== '' ? `${moneyFormatter(value)}/month` : '')}
                    parser={moneyParser}
                    placeholder="Enter amount"
                  />
                </Form.Item>

                <Form.Item
                  name="da"
                  label="DA"
                  rules={[{ required: true, message: 'Enter DA amount' }]}
                >
                  <InputNumber
                    min={0}
                    controls={false}
                    style={{ width: '100%' }}
                    formatter={(value) => (value !== undefined && value !== null && value !== '' ? `${moneyFormatter(value)}/month` : '')}
                    parser={moneyParser}
                    placeholder="Enter amount"
                  />
                </Form.Item>

                <Form.Item
                  name="allowance"
                  label="Allowance"
                  rules={[{ required: true, message: 'Enter allowance amount' }]}
                >
                  <InputNumber
                    min={0}
                    controls={false}
                    style={{ width: '100%' }}
                    formatter={(value) => (value !== undefined && value !== null && value !== '' ? `${moneyFormatter(value)}/month` : '')}
                    parser={moneyParser}
                    placeholder="Enter amount"
                  />
                </Form.Item>

                <Form.Item
                  name="medicalAllowance"
                  label="Medical Allowance"
                  rules={[{ required: true, message: 'Enter medical allowance amount' }]}
                  className="md:col-span-3"
                >
                  <InputNumber
                    min={0}
                    controls={false}
                    style={{ width: '100%' }}
                    formatter={(value) => (value !== undefined && value !== null && value !== '' ? `${moneyFormatter(value)}/month` : '')}
                    parser={moneyParser}
                    placeholder="Enter amount"
                  />
                </Form.Item>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deductions & Benefits</p>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                  Step 3
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Form.Item
                  name="pfContribution"
                  label="PF Contribution"
                  rules={[{ required: true, message: 'Enter PF contribution amount' }]}
                >
                  <InputNumber
                    min={0}
                    controls={false}
                    style={{ width: '100%' }}
                    formatter={(value) => (value !== undefined && value !== null && value !== '' ? `${moneyFormatter(value)}/month` : '')}
                    parser={moneyParser}
                    placeholder="Enter amount"
                  />
                </Form.Item>

                <Form.Item
                  name="professionalTax"
                  label="Professional Tax"
                  rules={[{ required: true, message: 'Enter professional tax amount' }]}
                >
                  <InputNumber
                    min={0}
                    controls={false}
                    style={{ width: '100%' }}
                    formatter={(value) => (value !== undefined && value !== null && value !== '' ? `${moneyFormatter(value)}/month` : '')}
                    parser={moneyParser}
                    placeholder="Enter amount"
                  />
                </Form.Item>

                <Form.Item
                  name="healthInsurance"
                  label="Health Insurance"
                  rules={[{ required: true, message: 'Enter health insurance amount' }]}
                  className="md:col-span-3"
                >
                  <InputNumber
                    min={0}
                    controls={false}
                    style={{ width: '100%' }}
                    formatter={(value) => (value !== undefined && value !== null && value !== '' ? `${moneyFormatter(value)}/month` : '')}
                    parser={moneyParser}
                    placeholder="Enter amount"
                  />
                </Form.Item>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Effective Dates</p>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                  Step 4
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Form.Item
                  name="effectiveFrom"
                  label="Effective From"
                  rules={[{ required: true, message: 'Please select the effective from date' }]}
                >
                  <Input type="date" />
                </Form.Item>

                <Form.Item
                  name="effectiveTo"
                  label="Effective To"
                >
                  <Input type="date" />
                </Form.Item>
              </div>
            </section>

            <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Compensation Summary
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-md bg-white p-3">
                  <p className="text-xs uppercase text-slate-500">Total Earnings</p>
                  <p className="text-sm font-semibold text-emerald-700">{formatCurrency(totalEarningsPreview)}</p>
                </div>
                <div className="rounded-md bg-white p-3">
                  <p className="text-xs uppercase text-slate-500">Total Deductions</p>
                  <p className="text-sm font-semibold text-rose-700">{formatCurrency(totalDeductionsPreview)}</p>
                </div>
                <div className="rounded-md bg-white p-3">
                  <p className="text-xs uppercase text-slate-500">Estimated Net Salary</p>
                  <p className="text-sm font-semibold text-indigo-700">{formatCurrency(estimatedNetPreview)}</p>
                </div>
              </div>
            </section>
          </div>

          <Divider className="my-4" />
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingId ? 'Update Payscale' : 'Create Payscale'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PayscaleManagement; 