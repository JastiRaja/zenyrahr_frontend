import React from 'react';
import { Heart, Activity, Brain, Smile, Calendar, Users, ArrowRight, Clock } from 'lucide-react';

const wellnessPrograms = [
  {
    id: 1,
    title: 'Mindfulness Meditation',
    category: 'Mental Health',
    schedule: 'Every Tuesday & Thursday',
    participants: 45,
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80',
  },
  {
    id: 2,
    title: 'Virtual Yoga Sessions',
    category: 'Physical Health',
    schedule: 'Every Monday & Wednesday',
    participants: 32,
    image: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80',
  },
];

export default function Wellness() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Employee Wellness</h1>
        <p className="mt-2 text-lg text-slate-600">
          Take care of your physical and mental well-being
        </p>
      </div>

      {/* Wellness Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: 'Wellness Score', value: '85/100', icon: Heart, trend: '+5' },
          { name: 'Active Programs', value: '8', icon: Activity, trend: 'New' },
          { name: 'Mental Health Index', value: '92%', icon: Brain, trend: '+2%' },
          { name: 'Satisfaction Rate', value: '4.8/5', icon: Smile, trend: '+0.3' },
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'Book Counseling', desc: 'Schedule a confidential session', icon: Brain },
          { name: 'Fitness Classes', desc: 'Join virtual workout sessions', icon: Activity },
          { name: 'Health Resources', desc: 'Access wellness materials', icon: Heart },
        ].map((action) => (
          <div key={action.name} className="card p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-indigo-50">
                  <action.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-slate-900">{action.name}</h3>
                  <p className="text-sm text-slate-500">{action.desc}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Active Programs */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Active Wellness Programs</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {wellnessPrograms.map((program) => (
            <div key={program.id} className="flex flex-col md:flex-row bg-white rounded-xl overflow-hidden border border-slate-200/70 hover:shadow-md transition-shadow duration-200">
              <div className="w-full md:w-48 h-48 md:h-auto relative">
                <img
                  src={program.image}
                  alt={program.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {program.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{program.title}</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-slate-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {program.schedule}
                  </div>
                  <div className="flex items-center text-sm text-slate-500">
                    <Users className="h-4 w-4 mr-2" />
                    {program.participants} participants
                  </div>
                </div>
                <button className="mt-4 btn-primary text-sm">
                  Join Program
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming Wellness Events</h2>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View All
          </button>
        </div>
        <div className="space-y-4">
          {[
            {
              title: 'Stress Management Workshop',
              date: 'March 20, 2024',
              time: '2:00 PM - 3:30 PM',
              instructor: 'Dr. Sarah Wilson',
            },
            {
              title: 'Healthy Cooking Demonstration',
              date: 'March 22, 2024',
              time: '12:00 PM - 1:00 PM',
              instructor: 'Chef Michael Brown',
            },
          ].map((event, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                <div className="mt-1 flex items-center text-sm text-slate-500">
                  <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                  {event.date}
                </div>
                <div className="mt-1 flex items-center text-sm text-slate-500">
                  <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                  {event.time}
                </div>
                <div className="mt-1 flex items-center text-sm text-slate-500">
                  <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                  {event.instructor}
                </div>
              </div>
              <button className="flex-shrink-0 btn-secondary text-sm">
                Register
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}