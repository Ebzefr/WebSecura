import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTools, faShieldAlt } from '@fortawesome/free-solid-svg-icons';

const Admin = () => {
  return (
    <main className="relative z-10 flex items-start justify-center min-h-screen px-6 pt-8">
      <div className="contact-container w-full max-w-7xl mx-auto">
        <div className="contact-card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="contact-icon mb-4">
              <FontAwesomeIcon icon={faTools} className="text-6xl logo-shield" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Admin <span className="logo-shield">Dashboard</span>
            </h1>
            <p className="text-gray-300 text-lg">
              Monitor users, scans, and system activity
            </p>
            <div className="contact-divider"></div>
          </div>

          {/* Placeholder Content */}
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faShieldAlt} className="text-6xl logo-shield mb-4" />
            <h3 className="text-2xl font-bold mb-4">Admin Dashboard Coming Soon</h3>
            <p className="text-gray-300 mb-6">
              Comprehensive admin features including user management, scan monitoring, and
              system analytics will be available here.
            </p>
            <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="text-lg font-semibold text-blue-400 mb-2">Users</h4>
                <p className="text-3xl font-bold">-</p>
              </div>
              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="text-lg font-semibold text-green-400 mb-2">Scans</h4>
                <p className="text-3xl font-bold">-</p>
              </div>
              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="text-lg font-semibold text-purple-400 mb-2">Messages</h4>
                <p className="text-3xl font-bold">-</p>
              </div>
              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="text-lg font-semibold text-yellow-400 mb-2">Avg Score</h4>
                <p className="text-3xl font-bold">-</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Admin;
