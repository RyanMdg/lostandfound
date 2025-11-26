import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const ReportFoundItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    color: '',
    condition: '',
    locationFound: '',
    dateFound: '',
    submittedToSecurity: false,
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
        location: formData.locationFound,
        date: new Date(formData.dateFound).toISOString(),
        status: 'found',
        isUrgent: false,
        contactMethod: 'email',
        submittedToSecurity: formData.submittedToSecurity
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
        alert(`Found item reported successfully! Reference Number: ${data.referenceNumber}\n\nPlease remember to submit the physical item to the Security Office.`);
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
        <h1 className="text-3xl font-bold text-gray-900">Report Found Item</h1>
        <p className="text-gray-600 mt-1">
          Fill out the form below to report an item you've found
        </p>
      </div>

      {/* Important Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Important Reminder</h3>
            <p className="text-sm text-blue-800">
              After filling out this form, please bring the physical item to the Security Office for safekeeping.
              The system will generate a reference number that you'll need to show at the office.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item Photo <span className="text-red-500">*</span>
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
          <p className="text-xs text-gray-500 mt-1">
            A photo helps the owner identify their item more easily
          </p>
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
            placeholder="e.g., Black Wallet"
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
            placeholder="Describe the item in detail (e.g., color, brand, unique features, contents)..."
            value={formData.description}
            onChange={handleChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            Be detailed but avoid revealing all identifying information - this helps verify ownership
          </p>
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

        {/* Location Found and Date Found */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="locationFound" className="block text-sm font-medium text-gray-700 mb-1">
              Location Found <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="locationFound"
              name="locationFound"
              required
              className="input-field"
              placeholder="e.g., Library 2nd Floor"
              value={formData.locationFound}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="dateFound" className="block text-sm font-medium text-gray-700 mb-1">
              Date Found <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="dateFound"
              name="dateFound"
              required
              className="input-field"
              value={formData.dateFound}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Submitted to Security Checkbox */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="submittedToSecurity"
              name="submittedToSecurity"
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={formData.submittedToSecurity}
              onChange={handleChange}
            />
          </div>
          <div className="ml-3">
            <label htmlFor="submittedToSecurity" className="font-medium text-gray-700">
              I have already submitted this item to the Security Office
            </label>
            <p className="text-sm text-gray-500">
              Check this if you've already brought the item to the Security Office
            </p>
          </div>
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

export default ReportFoundItem;
