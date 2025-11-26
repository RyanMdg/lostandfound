import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const data = await adminAPI.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Pending Items',
      value: stats?.pendingItems || 0,
      icon: '📦',
      color: 'bg-yellow-500',
      link: '/pending-items',
    },
    {
      label: 'Pending Claims',
      value: stats?.pendingClaims || 0,
      icon: '✋',
      color: 'bg-orange-500',
      link: '/pending-claims',
    },
    {
      label: 'Items on Hold',
      value: stats?.itemsOnHold || 0,
      icon: '⏸️',
      color: 'bg-blue-500',
    },
    {
      label: 'Ready for Release',
      value: stats?.readyForRelease || 0,
      icon: '✅',
      color: 'bg-green-500',
    },
    {
      label: 'Approved Items',
      value: stats?.approvedItems || 0,
      icon: '✔️',
      color: 'bg-green-600',
    },
    {
      label: 'Approved Claims',
      value: stats?.approvedClaims || 0,
      icon: '🤝',
      color: 'bg-green-700',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: '👥',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Admin Dashboard</h2>
        <p className="text-gray-600">
          Manage pending items, verify claims, and configure system settings.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            {stat.link ? (
              <Link to={stat.link} className="block">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                    {stat.icon}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                  {stat.icon}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Items */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Items</h3>
          {stats?.recentItems && stats.recentItems.length > 0 ? (
            <div className="space-y-3">
              {stats.recentItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <span className={`badge-${item.verificationStatus}`}>
                    {item.verificationStatus}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recent items</p>
          )}
          <Link to="/pending-items" className="block mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
            View all items →
          </Link>
        </div>

        {/* Recent Claims */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Claims</h3>
          {stats?.recentClaims && stats.recentClaims.length > 0 ? (
            <div className="space-y-3">
              {stats.recentClaims.slice(0, 5).map((claim) => (
                <div key={claim.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{claim.item?.title || 'Unknown Item'}</p>
                    <p className="text-sm text-gray-500">
                      by {claim.claimant?.firstName} {claim.claimant?.lastName}
                    </p>
                  </div>
                  <span className={`badge-${claim.status}`}>
                    {claim.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recent claims</p>
          )}
          <Link to="/pending-claims" className="block mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
            View all claims →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/pending-items" className="btn-primary text-center">
            Review Pending Items
          </Link>
          <Link to="/pending-claims" className="btn-primary text-center">
            Review Pending Claims
          </Link>
          <Link to="/settings" className="btn-secondary text-center">
            System Settings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
