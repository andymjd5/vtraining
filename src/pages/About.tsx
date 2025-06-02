import React from 'react';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About Us</h1>
        
        <div className="prose prose-lg">
          <p className="text-gray-700 mb-6">
            Welcome to our learning management system, where we empower organizations 
            and their employees with comprehensive training solutions. Our platform 
            combines cutting-edge technology with effective learning methodologies to 
            deliver exceptional educational experiences.
          </p>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700">
              To provide accessible, engaging, and effective learning solutions that 
              help organizations develop their talent and achieve their training objectives.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">For Companies</h3>
              <p className="text-gray-700">
                We offer customizable training programs, detailed analytics, and 
                comprehensive reporting tools to help you track and improve your 
                team's development.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">For Learners</h3>
              <p className="text-gray-700">
                Access engaging content, track your progress, and earn certificates 
                through our intuitive learning platform designed with your success 
                in mind.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get Started</h2>
            <p className="text-gray-700 mb-4">
              Ready to transform your organization's learning experience? Contact us 
              to learn more about how we can help you achieve your training goals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;