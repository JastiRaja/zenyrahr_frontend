import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Clock, Plus, Search } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase();
  const canPostJob = role === "hr";
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
      const response = await api.get('/api/recruitment-details');
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
  const getStatusClass = (status: string) => {
    if (status === 'OPEN') return 'bg-emerald-50 text-emerald-700';
    if (status === 'CLOSED') return 'bg-rose-50 text-rose-700';
    if (status === 'IN_PROGRESS') return 'bg-amber-50 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };
  const stats = [
    {
      label: 'Active Jobs',
      value: getActiveJobs(),
      icon: Briefcase,
      iconClass: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Total Applicants',
      value: getTotalApplicants(),
      icon: Users,
      iconClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Interviews Scheduled',
      value: getScheduledInterviews(),
      icon: Clock,
      iconClass: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Time to Hire (avg)',
      value: '0 days',
      icon: Clock,
      iconClass: 'bg-violet-100 text-violet-700',
    },
  ];

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Recruitment</h1>
              <p className="mt-1 text-sm text-sky-50">
                Post and manage job openings, track applications.
              </p>
            </div>
            {canPostJob && (
              <button
                onClick={() => navigate('post')}
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Post New Job
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2.5 ${item.iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500">{item.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div className="w-full md:w-60">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex h-52 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-700 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm text-rose-700">{error}</p>
            <button
              onClick={fetchJobs}
              className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Try Again
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-14 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900">No jobs found</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery || selectedDepartment !== 'All Departments'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by posting a new job.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-md border border-slate-200 bg-white p-4 transition hover:shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="truncate text-lg font-semibold text-slate-900">
                    {job.jobTitle}
                  </h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(job.status)}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center text-slate-600">
                    <Briefcase className="mr-2 h-4 w-4" />
                    <span>{job.department}</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <Users className="mr-2 h-4 w-4" />
                    <span>{job.experienceLevel}</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{job.employmentType}</span>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-3">
                  <button
                    onClick={() => navigate(`/recruitment/jobs/${job.id}`)}
                    className="inline-flex w-full items-center justify-center rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}