import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const PendingItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [action, setAction] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingItems();
  }, []);

  const loadPendingItems = async () => {
    try {
      const data = await adminAPI.getPendingItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to load pending items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (item) => {
    try {
      const fullDetails = await adminAPI.getFullItemDetails(item.id);
      setSelectedItem(fullDetails);
      setAction('');
      setNotes('');
    } catch (error) {
      console.error('Failed to load item details:', error);
      alert('Failed to load item details');
    }
  };

  const handleSubmit = async () => {
    if (!action) {
      alert('Please select an action');
      return;
    }

    if ((action === 'reject' || action === 'request_more_info') && !notes.trim()) {
      alert('Please provide a reason/message');
      return;
    }

    setProcessing(true);
    try {
      await adminAPI.verifyItem(selectedItem.id, {
        action,
        notes: notes || undefined,
        reason: notes || undefined,
        message: notes || undefined,
      });

      alert('Item reviewed successfully!');
      setSelectedItem(null);
      setAction('');
      setNotes('');
      await loadPendingItems();
    } catch (error) {
      console.error('Failed to verify item:', error);
      alert('Failed to review item: ' + (error.response?.data?.detail || error.message));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading pending items...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Pending Items</h2>
        <span className="badge-pending text-base px-4 py-2">{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No pending items to review</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => (
            <div key={item.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <span className={`badge-${item.status}`}>{item.status}</span>
                  </div>
                  <p className="text-gray-600 mb-3">{item.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <p className="font-medium">{item.category}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <p className="font-medium">{item.location}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <p className="font-medium">{new Date(item.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Reporter:</span>
                      <p className="font-medium">
                        {item.reporter?.firstName} {item.reporter?.lastName}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleReview(item)}
                  className="btn-primary ml-4"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Review Item</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Item Details (Unblurred) */}
              <div className="card bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-3">Item Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Title:</span>
                    <p className="font-medium">{selectedItem.title}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <p className="font-medium">{selectedItem.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Color:</span>
                    <p className="font-medium">{selectedItem.color || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Condition:</span>
                    <p className="font-medium">{selectedItem.condition || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <p className="font-medium">{selectedItem.location}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <p className="font-medium">{new Date(selectedItem.date).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Description:</span>
                    <p className="font-medium">{selectedItem.description}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Reference Number:</span>
                    <p className="font-medium">{selectedItem.referenceNumber}</p>
                  </div>
                </div>
              </div>

              {/* Reporter Info */}
              <div className="card bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-3">Reporter Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="font-medium">
                      {selectedItem.reporter?.firstName} {selectedItem.reporter?.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{selectedItem.reporter?.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Student Number:</span>
                    <p className="font-medium">{selectedItem.reporter?.studentNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Contact Method:</span>
                    <p className="font-medium">{selectedItem.contactMethod}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {selectedItem.timeline && selectedItem.timeline.length > 0 && (
                <div className="card bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-3">Timeline</h4>
                  <div className="space-y-2">
                    {selectedItem.timeline.map((event, index) => (
                      <div key={index} className="flex items-start gap-3 text-sm">
                        <span className="text-gray-500 whitespace-nowrap">
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                        <p className="text-gray-900">{event.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Action
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setAction('approve')}
                    className={`py-3 px-4 rounded-lg border-2 transition-all ${
                      action === 'approve'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-green-600'
                    }`}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => setAction('reject')}
                    className={`py-3 px-4 rounded-lg border-2 transition-all ${
                      action === 'reject'
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-red-600'
                    }`}
                  >
                    ❌ Reject
                  </button>
                  <button
                    onClick={() => setAction('request_more_info')}
                    className={`py-3 px-4 rounded-lg border-2 transition-all ${
                      action === 'request_more_info'
                        ? 'border-yellow-600 bg-yellow-50 text-yellow-700'
                        : 'border-gray-300 hover:border-yellow-600'
                    }`}
                  >
                    ℹ️ Request Info
                  </button>
                </div>
              </div>

              {/* Notes/Reason */}
              {(action === 'reject' || action === 'request_more_info' || action === 'approve') && (
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    {action === 'reject' ? 'Rejection Reason' : action === 'request_more_info' ? 'Message' : 'Admin Notes (Optional)'}
                    {(action === 'reject' || action === 'request_more_info') && (
                      <span className="text-red-500"> *</span>
                    )}
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-field h-24"
                    placeholder={
                      action === 'reject'
                        ? 'Explain why this item is being rejected...'
                        : action === 'request_more_info'
                        ? 'What additional information is needed?'
                        : 'Any notes for internal reference...'
                    }
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={!action || processing}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Submit Review'}
                </button>
                <button onClick={() => setSelectedItem(null)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingItems;
