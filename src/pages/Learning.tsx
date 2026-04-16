import { GraduationCap, BookOpen, Play, Award, Clock, Users, CheckCircle, ArrowRight } from 'lucide-react';

const courses = [
  {
    id: 1,
    title: 'Leadership Fundamentals',
    category: 'Management',
    progress: 75,
    duration: '4 hours',
    enrolled: 128,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80',
  },
  {
    id: 2,
    title: 'Project Management Essentials',
    category: 'Professional Skills',
    progress: 30,
    duration: '6 hours',
    enrolled: 95,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80',
  },
];

const achievements = [
  { name: 'Courses Completed', value: '12', icon: CheckCircle },
  { name: 'Hours Learned', value: '48', icon: Clock },
  { name: 'Certificates Earned', value: '5', icon: Award },
];

export default function Learning() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Learning & Development</h1>
        <p className="mt-2 text-lg text-slate-600">
          Enhance your skills with our learning resources
        </p>
      </div>

      {/* Learning Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((item) => (
          <div key={item.name} className="stat-card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700">
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500">{item.name}</p>
                <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Course Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'Technical Skills', count: '24 courses', icon: BookOpen },
          { name: 'Soft Skills', count: '18 courses', icon: Users },
          { name: 'Leadership', count: '12 courses', icon: GraduationCap },
        ].map((category) => (
          <div key={category.name} className="card p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-indigo-50">
                  <category.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
                  <p className="text-sm text-slate-500">{category.count}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        ))}
      </div>

      {/* In Progress Courses */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">In Progress Courses</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="flex flex-col md:flex-row bg-white rounded-xl overflow-hidden border border-slate-200/70 hover:shadow-md transition-shadow duration-200">
              <div className="w-full md:w-48 h-48 md:h-auto relative">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <Play className="h-12 w-12 text-white opacity-80 hover:opacity-100 cursor-pointer" />
                </div>
              </div>
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {course.category}
                  </span>
                  <div className="flex items-center text-sm text-slate-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {course.duration}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{course.title}</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-slate-600 mb-1">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-slate-500">
                    <Users className="h-4 w-4 mr-1" />
                    {course.enrolled} enrolled
                  </div>
                  <button className="btn-primary text-sm">
                    Continue Learning
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Courses */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Recommended for You</h2>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Advanced Data Analytics',
              category: 'Technical',
              duration: '8 hours',
              level: 'Advanced',
              image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80',
            },
            {
              title: 'Effective Communication',
              category: 'Soft Skills',
              duration: '4 hours',
              level: 'Intermediate',
              image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80',
            },
            {
              title: 'Strategic Planning',
              category: 'Management',
              duration: '6 hours',
              level: 'Advanced',
              image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80',
            },
          ].map((course, index) => (
            <div key={index} className="group relative rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-4">
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  {course.category}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{course.title}</h3>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {course.duration}
                  </span>
                  <span>{course.level}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}