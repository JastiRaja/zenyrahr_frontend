import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Users, Clock, Building2, IndianRupee, X, Edit2, Check } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import CommonDialog from '../../components/CommonDialog';
import LoadingButton from '../../components/LoadingButton';

// Define recruitment status options
const RECRUITMENT_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  INPROGRESS: 'INPROGRESS',
  SELECTED: 'SELECTED',
  REJECTED: 'REJECTED'
} as const;

interface Recruitment {
  id: number;
  jobTitle: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  salaryRange: string;
  jobDescription: string;
  requirements: string;
  benefits: string;
  status: string;
}

interface ReferralForm {
  candidateName: string;
  email: string;
  mobile: string;
  referredEmployeeId: number;
  referredEmployeeName: string;
  employeeDepartment: string;
  recruitment: Recruitment | null;
}

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [job, setJob] = useState<Recruitment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [submittingReferral, setSubmittingReferral] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    tone: 'default' | 'success' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    tone: 'default',
  });
  const [referralForm, setReferralForm] = useState<ReferralForm>({
    candidateName: '',
    email: '',
    mobile: '',
    referredEmployeeId: user?.id ? parseInt(user.id) : 0,
    referredEmployeeName: user ? `${user.firstName} ${user.lastName}` : '',
    employeeDepartment: user?.department || '',
    recruitment: null
  });

  const isHRAdmin = hasPermission("manage", "recruitment");

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  useEffect(() => {
    if (user) {
      // console.log('Current user data:', user);
      setReferralForm(prev => ({
        ...prev,
        referredEmployeeId: user.id ? parseInt(user.id) : 0,
        referredEmployeeName: `${user.firstName} ${user.lastName}`,
        employeeDepartment: user?.department || ''
      }));
    }
  }, [user]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/recruitment-details/${id}`);
      setJob(response.data);
      setReferralForm(prev => ({ ...prev, recruitment: response.data }));
      setError(null);
    } catch (error) {
      setError('Failed to fetch job details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingReferral) return;
    try {
      setSubmittingReferral(true);
      if (!job?.id) {
        throw new Error('Invalid job ID');
      }

      if (!user?.id) {
        throw new Error('User not logged in or missing ID');
      }

      const referralPayload = {
        ...referralForm,
        referredEmployeeId: parseInt(String(user.id)),
        referredEmployeeName: `${user.firstName} ${user.lastName}`,
        recruitment: {
          id: parseInt(String(job.id))
        }
      };

      // console.log('Sending referral payload:', referralPayload);

      const response = await api.post('/api/referrals', referralPayload);
      
      if (response.data) {
        setShowReferralForm(false);
        setDialogState({
          isOpen: true,
          title: 'Referral Submitted',
          message: 'Referral submitted successfully!',
          tone: 'success',
        });
      }
    } catch (err: any) {
      console.error('Error submitting referral:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit referral. Please try again.';
      setDialogState({
        isOpen: true,
        title: 'Referral Failed',
        message: errorMessage,
        tone: 'error',
      });
    } finally {
      setSubmittingReferral(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReferralForm(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusEdit = () => {
    setSelectedStatus(job?.status || '');
    setEditingStatus(true);
  };

  const handleStatusSave = async () => {
    try {
      if (!job?.id) return;

      const response = await api.patch(`/api/recruitment-details/${job.id}/status`, {
        status: selectedStatus
      });

      if (response.data) {
        setJob({ ...job, status: selectedStatus });
        setEditingStatus(false);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setDialogState({
        isOpen: true,
        title: 'Status Update Failed',
        message: 'Failed to update status. Please try again.',
        tone: 'error',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-red-100 text-red-800';
      case 'INPROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'SELECTED':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Job not found'}</p>
        <button
          onClick={() => navigate('/recruitment')}
          className="mt-4 text-indigo-600 hover:text-indigo-800"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{job.jobTitle}</h1>
          <div className="mt-2 flex items-center gap-4">
            {isHRAdmin ? (
              editingStatus ? (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-1 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.values(RECRUITMENT_STATUS).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleStatusSave}
                    className="p-1 text-green-600 hover:text-green-800"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditingStatus(false)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                  <button
                    onClick={handleStatusEdit}
                    className="p-1 text-gray-600 hover:text-gray-800"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              )
            ) : (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                {job.status}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/recruitment')}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div className="flex items-center text-gray-600">
            <Building2 className="h-5 w-5 mr-2" />
            <span>Department: {job.department}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="h-5 w-5 mr-2" />
            <span>Location: {job.location}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="h-5 w-5 mr-2" />
            <span>Type: {job.employmentType}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center text-gray-600">
            <Users className="h-5 w-5 mr-2" />
            <span>Experience: {job.experienceLevel}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <IndianRupee className="h-5 w-5 mr-2" />
            <span>Salary: {job.salaryRange}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Briefcase className="h-5 w-5 mr-2" />
            <span>Status: {job.status}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Job Description</h2>
          <p className="text-gray-600 whitespace-pre-line">{job.jobDescription}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Requirements</h2>
          <p className="text-gray-600 whitespace-pre-line">{job.requirements}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Benefits</h2>
          <p className="text-gray-600 whitespace-pre-line">{job.benefits}</p>
        </section>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => setShowReferralForm(true)}
          className="btn-primary"
        >
          Refer a Person
        </button>
      </div>

      {/* Referral Form Modal */}
      {showReferralForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Refer a Person</h2>
              <button
                onClick={() => setShowReferralForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReferralSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Candidate Name
                </label>
                <input
                  type="text"
                  name="candidateName"
                  value={referralForm.candidateName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={referralForm.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mobile
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={referralForm.mobile}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowReferralForm(false)}
                  disabled={submittingReferral}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <LoadingButton
                  type="submit"
                  disabled={submittingReferral}
                  loading={submittingReferral}
                  loadingText="Submitting..."
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Submit Referral
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}
      <CommonDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        tone={dialogState.tone}
        confirmText="OK"
        hideCancel
        onClose={() =>
          setDialogState({
            isOpen: false,
            title: '',
            message: '',
            tone: 'default',
          })
        }
      />
    </div>
  );
} 