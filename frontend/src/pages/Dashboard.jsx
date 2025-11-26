import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ItemCard from "../components/ItemCard";
import SearchItem from "../pages/SearchItems";
import { API_BASE_URL } from "../config/api";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalLost: 0,
    totalFound: 0,
    totalReturned: 0,
  });

  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch stats and recent items from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch stats
        const statsResponse = await fetch(`${API_BASE_URL}/api/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        // Fetch recent items (limit to 6)
        const itemsResponse = await fetch(
          `${API_BASE_URL}/api/items?limit=6`
        );
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          setRecentItems(itemsData.slice(0, 6));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening with lost and found items
        </p>
      </div>

      {/* Action Buttons */}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Items Lost
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalLost}
              </h3>
              <p className="text-xs text-gray-500 mt-1">+12% from last month</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Items Found</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalFound}
              </h3>
              <p className="text-xs text-gray-500 mt-1">+8% from last month</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Items Returned
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalReturned}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Successfully reunited
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {<SearchItem />}

      {/* Recent Items */}
      {/* <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Items</h2>
          <Link
            to="/search"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
          >
            View All
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
        <p className="text-gray-600 text-sm mb-6">
          Latest reported lost and found items
        </p>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : recentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentItems.map((item) => (
              <ItemCard
                key={item.id}
                item={{
                  ...item,
                  urgent: item.isUrgent,
                  image: item.imageUrl,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 card">
            <p className="text-gray-600">
              No items found yet. Start by reporting a lost or found item!
            </p>
          </div>
        )}
      </div> */}
    </div>
  );
};

export default Dashboard;
