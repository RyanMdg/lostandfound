import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const ReportLostItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    color: '',
    condition: '',
    location: '',
    dateLost: '',
    isUrgent: false,
    reward: '',
    contactMethod: 'email',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to report an item');
        navigate('/login');
        return;
      }

      const itemData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        color: formData.color,
        condition: formData.condition,
        location: formData.location,
        date: new Date(formData.dateLost).toISOString(),
        status: 'lost',
        isUrgent: formData.isUrgent,
        reward: formData.reward || null,
        contactMethod: formData.contactMethod,
        submittedToSecurity: false
      };

      const response = await fetch(`${API_BASE_URL}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itemData)
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Lost item reported successfully! Reference Number: ${data.referenceNumber}`);
        navigate('/dashboard');
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Failed to report item'}`);
      }
    } catch (error) {
      console.error('Error reporting item:', error);
      alert('Failed to report item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Report Lost Item</h1>
        <p className="text-gray-600 mt-1">
          Fill out the form below to report an item you've lost
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item Photo (Optional)
          </label>
          <div className="flex items-center gap-4">
            {imagePreview ? (
              <div className="relative w-32 h-32">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs text-gray-500 mt-2">Upload Photo</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="input-field"
            placeholder="e.g., Black iPhone 13"
            value={formData.title}
            onChange={handleChange}
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            required
            className="input-field"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">Select a category</option>
            <option value="electronics">Electronics</option>
            <option value="books">Books & Notebooks</option>
            <option value="bags">Bags & Backpacks</option>
            <option value="wallets">Wallets & Purses</option>
            <option value="documents">Documents & IDs</option>
            <option value="clothing">Clothing & Accessories</option>
            <option value="others">Others</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows="4"
            className="input-field"
            placeholder="Describe the item in detail (e.g., color, brand, unique features)..."
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        {/* Color and Condition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="text"
              id="color"
              name="color"
              className="input-field"
              placeholder="e.g., Black, Blue"
              value={formData.color}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
              Condition
            </label>
            <select
              id="condition"
              name="condition"
              className="input-field"
              value={formData.condition}
              onChange={handleChange}
            >
              <option value="">Select condition</option>
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="worn">Worn</option>
            </select>
          </div>
        </div>

        {/* Location and Date Lost */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Last Seen Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              required
              className="input-field"
              placeholder="e.g., Library, Cafeteria"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="dateLost" className="block text-sm font-medium text-gray-700 mb-1">
              Date Lost <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="dateLost"
              name="dateLost"
              required
              className="input-field"
              value={formData.dateLost}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Urgent Checkbox */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="isUrgent"
              name="isUrgent"
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={formData.isUrgent}
              onChange={handleChange}
            />
          </div>
          <div className="ml-3">
            <label htmlFor="isUrgent" className="font-medium text-gray-700">
              Mark as Urgent/Immediate
            </label>
            <p className="text-sm text-gray-500">
              This item requires immediate attention (e.g., IDs, important documents, valuables)
            </p>
          </div>
        </div>

        {/* Reward (if urgent) */}
        {formData.isUrgent && (
          <div>
            <label htmlFor="reward" className="block text-sm font-medium text-gray-700 mb-1">
              Reward (Optional)
            </label>
            <input
              type="text"
              id="reward"
              name="reward"
              className="input-field"
              placeholder="e.g., ₱500 or describe reward"
              value={formData.reward}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              Offering a reward may increase the chances of recovering your item
            </p>
          </div>
        )}

        {/* Contact Method */}
        <div>
          <label htmlFor="contactMethod" className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Contact Method
          </label>
          <select
            id="contactMethod"
            name="contactMethod"
            className="input-field"
            value={formData.contactMethod}
            onChange={handleChange}
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="both">Both</option>
          </select>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex-1 btn-secondary py-3"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportLostItem;
