import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const PendingClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [holdDays, setHoldDays] = useState(7);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingClaims();
  }, []);

  const loadPendingClaims = async () => {
    try {
      const data = await adminAPI.getPendingClaims();
      setClaims(data);
    } catch (error) {
      console.error('Failed to load pending claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (claim) => {
    setSelectedClaim(claim);
    setAction('');
    setReason('');
    setHoldDays(7);
  };

  const handleSubmit = async () => {
    if (!action) {
      alert('Please select an action');
      return;
    }

    if ((action === 'deny' || action === 'request_more_info') && !reason.trim()) {
      alert('Please provide a reason/message');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        action,
        reason: reason || undefined,
        message: reason || undefined,
        hold_days: action === 'hold' ? holdDays : undefined,
      };

      await adminAPI.verifyClaim(selectedClaim.id, payload);

      alert('Claim reviewed successfully!');
      setSelectedClaim(null);
      setAction('');
      setReason('');
      await loadPendingClaims();
    } catch (error) {
      console.error('Failed to verify claim:', error);
      alert('Failed to review claim: ' + (error.response?.data?.detail || error.message));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading pending claims...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Pending Claims</h2>
        <span className="badge-pending text-base px-4 py-2">{claims.length} claims</span>
      </div>

      {claims.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No pending claims to review</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {claims.map((claim) => (
            <div key={claim.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Claim for: {claim.item?.title}
                    </h3>
                    <span className={`badge-${claim.status}`}>{claim.status}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Claimant:</span>
                      <p className="font-medium">
                        {claim.claimant?.firstName} {claim.claimant?.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium">{claim.claimant?.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Claimed:</span>
                      <p className="font-medium">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Item Category:</span>
                      <p className="font-medium">{claim.item?.category}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleReview(claim)} className="btn-primary ml-4">
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Review Claim</h3>
              <button
                onClick={() => setSelectedClaim(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-2 gap-6">
                {/* Reported Details */}
                <div className="card bg-blue-50 border-2 border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    📋 Reported Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Title:</span>
                      <p className="text-gray-900">{selectedClaim.item?.title}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Description:</span>
                      <p className="text-gray-900">{selectedClaim.item?.description}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Category:</span>
                      <p className="text-gray-900">{selectedClaim.item?.category}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Color:</span>
                      <p className="text-gray-900">{selectedClaim.item?.color || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Condition:</span>
                      <p className="text-gray-900">{selectedClaim.item?.condition || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Location:</span>
                      <p className="text-gray-900">{selectedClaim.item?.location}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Date:</span>
                      <p className="text-gray-900">
                        {new Date(selectedClaim.item?.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Claim Details */}
                <div className="card bg-green-50 border-2 border-green-200">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    ✋ Claim Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-green-700 font-medium">Claimant:</span>
                      <p className="text-gray-900">
                        {selectedClaim.claimant?.firstName} {selectedClaim.claimant?.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Verification Details:</span>
                      <p className="text-gray-900">{selectedClaim.verificationDetails}</p>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Claimed Color:</span>
                      <p className="text-gray-900">{selectedClaim.claimedColor || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Claimed Condition:</span>
                      <p className="text-gray-900">{selectedClaim.claimedCondition || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Claimed Location:</span>
                      <p className="text-gray-900">{selectedClaim.claimedLocation || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Claimed Date:</span>
                      <p className="text-gray-900">
                        {selectedClaim.claimedDate
                          ? new Date(selectedClaim.claimedDate).toLocaleDateString()
                          : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Claimant Information */}
              <div className="card bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-3">Claimant Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Student Number:</span>
                    <p className="font-medium">{selectedClaim.claimant?.studentNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{selectedClaim.claimant?.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Year Level:</span>
                    <p className="font-medium">{selectedClaim.claimant?.yearLevel}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Course:</span>
                    <p className="font-medium">{selectedClaim.claimant?.course}</p>
                  </div>
                </div>
              </div>

              {/* Action Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Action
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    onClick={() => setAction('deny')}
                    className={`py-3 px-4 rounded-lg border-2 transition-all ${
                      action === 'deny'
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-red-600'
                    }`}
                  >
                    ❌ Deny
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
                  <button
                    onClick={() => setAction('hold')}
                    className={`py-3 px-4 rounded-lg border-2 transition-all ${
                      action === 'hold'
                        ? 'border-orange-600 bg-orange-50 text-orange-700'
                        : 'border-gray-300 hover:border-orange-600'
                    }`}
                  >
                    ⏸️ Place on Hold
                  </button>
                </div>
              </div>

              {/* Hold Days */}
              {action === 'hold' && (
                <div>
                  <label htmlFor="holdDays" className="block text-sm font-medium text-gray-700 mb-2">
                    Hold Duration (Days)
                  </label>
                  <input
                    id="holdDays"
                    type="number"
                    min="1"
                    value={holdDays}
                    onChange={(e) => setHoldDays(parseInt(e.target.value) || 1)}
                    className="input-field max-w-xs"
                  />
                </div>
              )}

              {/* Reason/Message */}
              {(action === 'deny' || action === 'request_more_info' || action === 'approve') && (
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                    {action === 'deny' ? 'Denial Reason' : action === 'request_more_info' ? 'Message' : 'Notes (Optional)'}
                    {(action === 'deny' || action === 'request_more_info') && (
                      <span className="text-red-500"> *</span>
                    )}
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="input-field h-24"
                    placeholder={
                      action === 'deny'
                        ? 'Explain why this claim is being denied...'
                        : action === 'request_more_info'
                        ? 'What additional information is needed?'
                        : 'Any notes for the approval...'
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
                <button onClick={() => setSelectedClaim(null)} className="btn-secondary">
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

export default PendingClaims;
