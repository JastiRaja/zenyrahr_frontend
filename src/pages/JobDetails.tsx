import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Clock, IndianRupee, Users, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import LoadingButton from '../components/LoadingButton';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

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

interface JobPosting {
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
  recruitment: any;
}

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [referralForm, setReferralForm] = useState<ReferralForm>({
    candidateName: '',
    email: '',
    mobile: '',
    referredEmployeeId: user?.id ? parseInt(user.id) : 0,
    referredEmployeeName: user ? `${user.firstName} ${user.lastName}` : '',
    employeeDepartment: user?.department || '',
    recruitment: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Determine if user is HR/admin or regular employee
  const isHRorAdmin = hasPermission("read", "employees");

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  useEffect(() => {
    if (user) {
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
      const response = await axios.get(`${API_BASE_URL}/api/recruitment-details/${id}`);
      if (response.data.status !== 'OPEN' && !isHRorAdmin) {
        navigate('/job-openings');
        return;
      }
      setJob(response.data);
      setReferralForm(prev => ({ ...prev, recruitment: response.data }));
      setError(null);
    } catch (err) {
      setError('Failed to fetch job details');
      console.error('Error fetching job details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Navigate based on user role
    if (isHRorAdmin) {
      navigate('/recruitment');
    } else {
      navigate('/job-openings');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReferralForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const referralPayload = {
        ...referralForm,
        referredEmployeeId: user?.id ? parseInt(user.id) : 0,
        referredEmployeeName: user ? `${user.firstName} ${user.lastName}` : '',
        employeeDepartment: user?.department || '',
        recruitment: job ? { id: job.id } : null
      };
      await axios.post(`${API_BASE_URL}/api/referrals`, referralPayload);
      setSubmitSuccess(true);
      setShowReferralForm(false);
      setReferralForm({
        candidateName: '',
        email: '',
        mobile: '',
        referredEmployeeId: user?.id ? parseInt(user.id) : 0,
        referredEmployeeName: user ? `${user.firstName} ${user.lastName}` : '',
        employeeDepartment: user?.department || '',
        recruitment: job ? { id: job.id } : null
      });
    } catch (err) {
      setError('Failed to submit referral');
      console.error('Error submitting referral:', err);
    } finally {
      setSubmitting(false);
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
          onClick={() => navigate('/job-openings')}
          className="mt-4 text-indigo-600 hover:text-indigo-800"
        >
          Back to Job Openings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <button
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{job.jobTitle}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
            {job.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center text-gray-600">
            <Briefcase className="h-5 w-5 mr-2" />
            <span>{job.department}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="h-5 w-5 mr-2" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="h-5 w-5 mr-2" />
            <span>{job.employmentType}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <IndianRupee className="h-5 w-5 mr-2" />
            <span>{job.salaryRange}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="h-5 w-5 mr-2" />
            <span>{job.experienceLevel}</span>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{job.jobDescription}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Requirements</h2>
            <p className="text-gray-700 whitespace-pre-line">{job.requirements}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Benefits</h2>
            <p className="text-gray-700 whitespace-pre-line">{job.benefits}</p>
          </section>
        </div>

        <div className="mt-8 border-t pt-6">
          {submitSuccess ? (
            <div className="text-center text-green-600 p-4 bg-green-50 rounded-md">
              Referral submitted successfully!
            </div>
          ) : (
            <button
              onClick={() => setShowReferralForm(true)}
              className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Refer a Candidate
            </button>
          )}
        </div>
      </div>

      {showReferralForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Refer a Candidate</h2>
            <form onSubmit={handleSubmitReferral}>
              <div className="space-y-4">
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
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Referred Employee ID
                  </label>
                  <input
                    type="text"
                    name="referredEmployeeId"
                    value={referralForm.referredEmployeeId.toString()}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Referred Employee Name
                  </label>
                  <input
                    type="text"
                    name="referredEmployeeName"
                    value={referralForm.referredEmployeeName}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employee Department
                  </label>
                  <input
                    type="text"
                    name="employeeDepartment"
                    value={referralForm.employeeDepartment}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowReferralForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <LoadingButton
                  type="submit"
                  disabled={submitting}
                  loading={submitting}
                  loadingText="Submitting..."
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Submit Referral
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 