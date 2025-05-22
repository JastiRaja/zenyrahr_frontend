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
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

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
  const { user } = useAuth();

  useEffect(() => {
    fetchPayscales();
    fetchEmployees();
  }, []);

  const fetchPayscales = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;
      const response = await axios.get(`${API_BASE_URL}/api/payscale`);
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
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;
      const response = await axios.get(`${API_BASE_URL}/auth/employees`);
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
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;
      await axios.delete(`${API_BASE_URL}/api/payscale/${id}`);
      message.success('Payscale deleted successfully');
      fetchPayscales();
    } catch (error) {
      message.error('Failed to delete payscale');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;
      // Transform values to match backend expectations
      const payload = {
        ...values,
        employee: { id: values.employeeId },
        createdBy: user ? `${user.firstName} ${user.lastName}` : undefined,
      };
      delete payload.employeeId;

      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/payscale/${editingId}`, payload);
        message.success('Payscale updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/payscale`, payload);
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

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Payscale Management</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Add Payscale
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={payscales}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingId ? 'Edit Payscale' : 'Add Payscale'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={onValuesChange}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="employeeId"
              label="Employee"
              rules={[{ required: true }]}
              style={{ gridColumn: '1 / span 2' }}
            >
              <Select>
                {Array.isArray(employees) && employees.map(emp => (
                  <Option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="ctc"
              label="CTC (Monthly)"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `₹ ${value}/month`}
                parser={value => value ? value.replace(/₹\s?|\/month/g, '') : ''}
                readOnly
              />
            </Form.Item>

            <Form.Item
              name="basicSalary"
              label="Basic Salary (Monthly)"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '/month'}
                parser={value => value!.replace(/[^\d.-]/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="hra"
              label="HRA (Monthly)"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '/month'}
                parser={value => value!.replace(/[^\d.-]/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="da"
              label="DA (Monthly)"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '/month'}
                parser={value => value!.replace(/[^\d.-]/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="allowance"
              label="Allowance (Monthly)"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '/month'}
                parser={value => value!.replace(/[^\d.-]/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="medicalAllowance"
              label="Medical Allowance (Monthly)"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '/month'}
                parser={value => value!.replace(/[^\d.-]/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="pfContribution"
              label="PF Contribution (Monthly)"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '/month'}
                parser={value => value!.replace(/[^\d.-]/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="professionalTax"
              label="Professional Tax (Monthly)"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '/month'}
                parser={value => value!.replace(/[^\d.-]/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="healthInsurance"
              label="Health Insurance (Monthly)"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '/month'}
                parser={value => value!.replace(/[^\d.-]/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="effectiveFrom"
              label="Effective From"
              rules={[{ required: true, message: 'Please select the effective from date' }]}
              style={{ gridColumn: '1 / span 2' }}
            >
              <Input type="date" />
            </Form.Item>

            <Form.Item
              name="effectiveTo"
              label="Effective To"
              style={{ gridColumn: '1 / span 2' }}
            >
              <Input type="date" />
            </Form.Item>
          </div>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PayscaleManagement; 