import React from 'react';
import { useParams } from 'react-router-dom';

const CourseView = () => {
  const { courseId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Course Content</h1>
        
        {/* Course information section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Course #{courseId}</h2>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              In Progress
            </span>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Welcome to the course view page. This page will display the course content,
              materials, and progress tracking for the selected course.
            </p>
            
            {/* Progress section */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Your Progress</h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full w-1/3"></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">33% Complete</p>
            </div>
          </div>
        </div>

        {/* Course modules section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Course Modules</h3>
          <div className="space-y-4">
            {/* Example module items */}
            {[1, 2, 3].map((module) => (
              <div 
                key={module}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-800">Module {module}</h4>
                    <p className="text-sm text-gray-600">Description for module {module}</p>
                  </div>
                  <span className="text-sm text-gray-500">20 min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseView;