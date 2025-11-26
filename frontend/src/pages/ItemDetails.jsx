import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimDetails, setClaimDetails] = useState('');
  const [claimForm, setClaimForm] = useState({
    color: '',
    condition: '',
    location: '',
    date: ''
  });

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/items/${id}`);
        if (response.ok) {
          const data = await response.json();
          // Transform API data to match component structure
          setItem({
            id: data.id,
            title: data.title,
            description: data.description,
            status: data.status,
            category: data.category,
            color: data.color,
            condition: data.condition,
            location: data.location,
            date: data.date,
            image: data.imageUrl,
            reporter: {
              name: `${data.reporter.firstName} ${data.reporter.lastName}`,
              studentNumber: data.reporter.studentNumber,
              yearLevel: data.reporter.yearLevel,
              course: data.reporter.course,
            },
            urgent: data.isUrgent,
            reward: data.reward,
            referenceNumber: data.referenceNumber
          });
        } else {
          console.error('Failed to fetch item');
          navigate('/search');
        }
      } catch (error) {
        console.error('Error fetching item:', error);
        navigate('/search');
      }
    };

    fetchItem();
  }, [id, navigate]);

  const handleMarkFound = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to mark an item as found');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/items/${id}/mark-found`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Item marked as found! The owner will be notified.');
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Failed to mark item as found'}`);
      }
    } catch (error) {
      console.error('Error marking item as found:', error);
      alert('Failed to mark item as found. Please try again.');
    }
  };

  const handleClaim = async () => {
    if (claimDetails.trim().length < 20) {
      alert('Please provide more details to verify your claim (at least 20 characters)');
      return;
    }

    // Validate that all verification fields are filled
    if (!claimForm.color || !claimForm.condition || !claimForm.location || !claimForm.date) {
      alert('Please fill in all verification fields (Color, Condition, Location, and Date)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to claim an item');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/items/${id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemId: parseInt(id),
          verificationDetails: claimDetails,
          color: claimForm.color,
          condition: claimForm.condition,
          location: claimForm.location,
          date: claimForm.date
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Claim submitted successfully!\n\nClaim ID: ${data.claimId}\n\nYour claim is now pending admin approval. You will receive a notification once it has been reviewed.`);
        setShowClaimModal(false);
        navigate('/dashboard');
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Failed to submit claim'}`);
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert('Failed to submit claim. Please try again.');
    }
  };

  if (!item) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="md:flex">
          {/* Image Section */}
          <div className="md:w-1/2">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="md:w-1/2 p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{item.title}</h1>
                <p className="text-gray-600 mt-1">{item.category}</p>
              </div>
              {item.status === 'found' && (
                <span className="badge-found text-base px-3 py-1">Found</span>
              )}
              {item.status === 'lost' && (
                <span className="badge-lost text-base px-3 py-1">Lost</span>
              )}
            </div>

            {item.urgent && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800 text-sm font-medium">⚠️ Urgent Item</p>
                {item.reward && (
                  <p className="text-red-700 text-sm mt-1">Reward: {item.reward}</p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {item.color && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Color</h3>
                    <p className={`text-gray-600 ${item.status === 'found' ? 'filter blur-sm select-none' : ''}`}>
                      {item.color}
                    </p>
                    {item.status === 'found' && (
                      <p className="text-xs text-gray-500 mt-1">Hidden for verification</p>
                    )}
                  </div>
                )}

                {item.condition && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Condition</h3>
                    <p className={`text-gray-600 ${item.status === 'found' ? 'filter blur-sm select-none' : ''}`}>
                      {item.condition}
                    </p>
                    {item.status === 'found' && (
                      <p className="text-xs text-gray-500 mt-1">Hidden for verification</p>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    {item.status === 'found' ? 'Found At' : 'Last Seen'}
                  </h3>
                  <p className={`text-gray-600 ${item.status === 'found' ? 'filter blur-sm select-none' : ''}`}>
                    {item.location}
                  </p>
                  {item.status === 'found' && (
                    <p className="text-xs text-gray-500 mt-1">Hidden for verification</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Date</h3>
                  <p className={`text-gray-600 ${item.status === 'found' ? 'filter blur-sm select-none' : ''}`}>
                    {new Date(item.date).toLocaleDateString()}
                  </p>
                  {item.status === 'found' && (
                    <p className="text-xs text-gray-500 mt-1">Hidden for verification</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  {item.status === 'found' ? 'Found By' : 'Reported By'}
                </h3>
                <div className="text-sm text-gray-600">
                  <p>{item.reporter.name}</p>
                  <p>{item.reporter.course} - {item.reporter.yearLevel}th Year</p>
                  <p>Student No: {item.reporter.studentNumber}</p>
                </div>
              </div>

              <div className="pt-4">
                {item.status === 'found' ? (
                  <button
                    onClick={() => setShowClaimModal(true)}
                    className="w-full btn-primary py-3 text-base font-semibold"
                  >
                    Claim This Item
                  </button>
                ) : (
                  <button
                    onClick={handleMarkFound}
                    className="w-full btn-primary py-3 text-base font-semibold"
                  >
                    I Found This Item
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Claim Item</h2>
            <p className="text-gray-600 mb-4">
              To verify ownership, please provide the following details about your item:
            </p>

            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Black, Blue"
                    value={claimForm.color}
                    onChange={(e) => setClaimForm({...claimForm, color: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input-field"
                    value={claimForm.condition}
                    onChange={(e) => setClaimForm({...claimForm, condition: e.target.value})}
                  >
                    <option value="">Select condition</option>
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="worn">Worn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location (Where it was found) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Library, Cafeteria"
                    value={claimForm.location}
                    onChange={(e) => setClaimForm({...claimForm, location: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date (When it was found) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={claimForm.date}
                    onChange={(e) => setClaimForm({...claimForm, date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Describe unique features, contents, or other identifying information (min 20 characters)..."
                  value={claimDetails}
                  onChange={(e) => setClaimDetails(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Your claim details must match exactly with the item information to be approved.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClaim}
                className="flex-1 btn-primary"
              >
                Submit Claim
              </button>
              <button
                onClick={() => {
                  setShowClaimModal(false);
                  setClaimForm({ color: '', condition: '', location: '', date: '' });
                  setClaimDetails('');
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetails;
