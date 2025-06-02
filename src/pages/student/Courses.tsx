import React from 'react';
import Card from '../../components/ui/Card';

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed';
}

const Courses = () => {
  // This is a placeholder component - you'll want to fetch actual course data
  const courses: Course[] = [
    {
      id: '1',
      title: 'Introduction Course',
      description: 'Get started with the basics',
      progress: 0,
      status: 'not-started'
    },
    {
      id: '2',
      title: 'Advanced Topics',
      description: 'Deep dive into advanced concepts',
      progress: 0,
      status: 'not-started'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Courses</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {course.title}
              </h3>
              <p className="text-gray-600 mb-4">{course.description}</p>
              
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Progress: {course.progress}%
                </p>
              </div>

              <div className="mt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  course.status === 'completed' ? 'bg-green-100 text-green-800' :
                  course.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {course.status.replace('-', ' ').charAt(0).toUpperCase() + course.status.slice(1)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Courses;