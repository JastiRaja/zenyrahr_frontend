import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Clock, Plus } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

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
  applicants?: number; // Optional field for number of applicants
}

export default function Recruitment() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');

  useEffect(() => {
    fetchJobs();
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/recruitment-details`);
      setJobs(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch job listings');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActiveJobs = () => jobs.filter(job => job.status === 'OPEN').length;
  const getTotalApplicants = () => jobs.reduce((total, job) => total + (job.applicants || 0), 0);
  const getScheduledInterviews = () => jobs.filter(job => job.status === 'IN_PROGRESS').length;
  
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All Departments' || job.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = ['All Departments', ...new Set(jobs.map(job => job.department))];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitment</h1>
          <p className="mt-1 text-sm text-gray-600">
            Post and manage job openings, track applications
          </p>
        </div>
        <button
          onClick={() => navigate('post')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Post New Job
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Jobs</p>
              <p className="text-xl font-semibold text-gray-900">{getActiveJobs()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Applicants</p>
              <p className="text-xl font-semibold text-gray-900">{getTotalApplicants()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Interviews Scheduled</p>
              <p className="text-xl font-semibold text-gray-900">{getScheduledInterviews()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Time to Hire (avg)</p>
              <p className="text-xl font-semibold text-gray-900">0 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Job Listings */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-600 p-4">
          <p>{error}</p>
          <button 
            onClick={fetchJobs}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 truncate">
                    {job.jobTitle}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium
                    ${job.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                      job.status === 'CLOSED' ? 'bg-red-100 text-red-800' :
                      job.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'}`}
                  >
                    {job.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Briefcase className="h-5 w-5 mr-2" />
                    <span>{job.department}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-2" />
                    <span>{job.experienceLevel}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>{job.employmentType}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigate(`/recruitment/jobs/${job.id}`)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredJobs.length === 0 && !loading && (
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || selectedDepartment !== 'All Departments'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by posting a new job.'}
          </p>
        </div>
      )}
    </div>
  );
}