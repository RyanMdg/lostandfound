import { useState } from 'react';

const Returned = () => {
  const [returnedItems, setReturnedItems] = useState([
    {
      id: 1,
      title: 'Student ID Card',
      category: 'documents',
      image: null,
      finder: 'Maria Santos',
      owner: 'Juan Dela Cruz',
      returnedDate: '2024-11-15',
      feedback: 'Thank you so much! This system made it so easy to get my ID back. Highly recommended!',
      rating: 5,
    },
    {
      id: 2,
      title: 'Black Wallet',
      category: 'wallets',
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
      finder: 'Pedro Garcia',
      owner: 'Ana Lopez',
      returnedDate: '2024-11-14',
      feedback: 'So grateful to the finder! The wallet had my allowance and important cards.',
      rating: 5,
    },
    {
      id: 3,
      title: 'MacBook Pro',
      category: 'electronics',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
      finder: 'Lisa Reyes',
      owner: 'Mark Torres',
      returnedDate: '2024-11-12',
      feedback: 'Amazing! I thought I lost my laptop forever. Thanks to this system and the honest finder!',
      rating: 5,
    },
    {
      id: 4,
      title: 'Blue Backpack',
      category: 'bags',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
      finder: 'Carlos Ramos',
      owner: 'Sofia Cruz',
      returnedDate: '2024-11-10',
      feedback: 'The system matched my lost report instantly. Got my bag back within 24 hours!',
      rating: 5,
    },
  ]);

  const stats = {
    totalReturned: returnedItems.length,
    averageReturnTime: '2.5 days',
    satisfactionRate: '98%',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Success Stories</h1>
        <p className="text-gray-600 mt-1">
          Items successfully returned to their owners
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Total Returned</p>
              <h3 className="text-3xl font-bold text-green-900 mt-1">{stats.totalReturned}</h3>
            </div>
            <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Avg. Return Time</p>
              <h3 className="text-3xl font-bold text-blue-900 mt-1">{stats.averageReturnTime}</h3>
            </div>
            <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Satisfaction Rate</p>
              <h3 className="text-3xl font-bold text-purple-900 mt-1">{stats.satisfactionRate}</h3>
            </div>
            <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Success Stories List */}
      <div className="space-y-6">
        {returnedItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="md:flex">
              {/* Image */}
              <div className="md:w-48 h-48">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Returned on {new Date(item.returnedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="badge-claimed text-base px-3 py-1">
                    ✓ Returned
                  </span>
                </div>

                <div className="flex items-center gap-6 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Found by: <span className="font-medium text-gray-900">{item.finder}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Owner: <span className="font-medium text-gray-900">{item.owner}</span></span>
                  </div>
                </div>

                {item.feedback && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(item.rating)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700 text-sm italic">"{item.feedback}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Lost Something?</h2>
        <p className="mb-6">Join these success stories and get your items back!</p>
        <div className="flex gap-4 justify-center">
          <a href="/report-lost" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Report Lost Item
          </a>
          <a href="/report-found" className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors">
            Report Found Item
          </a>
        </div>
      </div>
    </div>
  );
};

export default Returned;
