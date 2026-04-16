import React from 'react';
import { Target, TrendingUp, Award, Star, ChevronRight, BarChart2, CheckCircle2, AlertCircle } from 'lucide-react';

const performanceData = {
  overall: 4.2,
  goals: [
    { id: 1, title: 'Improve code quality metrics', progress: 80, status: 'On Track' },
    { id: 2, title: 'Complete advanced React certification', progress: 60, status: 'In Progress' },
    { id: 3, title: 'Mentor junior developers', progress: 90, status: 'On Track' },
  ],
  reviews: [
    {
      id: 1,
      type: 'Quarterly Review',
      date: 'Q1 2024',
      rating: 4.5,
      strengths: ['Technical expertise', 'Team collaboration'],
      improvements: ['Documentation', 'Time management'],
    },
    {
      id: 2,
      type: 'Project Review',
      date: 'Feb 2024',
      rating: 4.8,
      strengths: ['Project delivery', 'Innovation'],
      improvements: ['Knowledge sharing'],
    },
  ],
};

export default function Performance() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Performance Management</h1>
        <p className="mt-2 text-lg text-slate-600">
          Track your performance metrics and development goals
        </p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: 'Overall Rating', value: '4.2/5', icon: Star, trend: '+0.3' },
          { name: 'Goals Completed', value: '8/10', icon: Target, trend: '80%' },
          { name: 'Skills Improved', value: '12', icon: TrendingUp, trend: '+3' },
          { name: 'Achievements', value: '5', icon: Award, trend: 'New' },
        ].map((item) => (
          <div key={item.name} className="stat-card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700">
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500">{item.name}</p>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
                  <span className="ml-2 text-sm font-medium text-green-600">
                    {item.trend}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Current Goals */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Current Goals</h2>
          <button className="btn-secondary text-sm">
            Add New Goal
          </button>
        </div>
        <div className="space-y-4">
          {performanceData.goals.map((goal) => (
            <div key={goal.id} className="bg-white p-4 rounded-xl border border-slate-200/70 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-slate-900">{goal.title}</h3>
                    <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      goal.status === 'On Track' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {goal.status}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                <button className="ml-4 p-2 text-slate-400 hover:text-slate-500">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {performanceData.reviews.map((review) => (
          <div key={review.id} className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{review.type}</h3>
                <p className="text-sm text-slate-500">{review.date}</p>
              </div>
              <div className="flex items-center">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={`h-5 w-5 ${
                      index < Math.floor(review.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-2">Strengths</h4>
                <div className="flex flex-wrap gap-2">
                  {review.strengths.map((strength, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-2">Areas for Improvement</h4>
                <div className="flex flex-wrap gap-2">
                  {review.improvements.map((improvement, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {improvement}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skills Assessment */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Skills Assessment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { skill: 'Technical Skills', rating: 90 },
            { skill: 'Communication', rating: 85 },
            { skill: 'Problem Solving', rating: 88 },
            { skill: 'Leadership', rating: 82 },
          ].map((skill) => (
            <div key={skill.skill} className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-600">{skill.skill}</span>
                <span className="text-sm font-medium text-slate-900">{skill.rating}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${skill.rating}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}