# Lost and Found System

A modern web-based lost and found system for schools built with React, Tailwind CSS, and Python FastAPI.

## Features

- **User Authentication**: Secure registration and login system for students and faculty
- **Report Lost Items**: Easy-to-use forms for reporting lost belongings
- **Report Found Items**: Quick submission of found items with photos
- **Advanced Search**: Filter items by category, status, location, and date
- **Claim System**: Secure verification process for claiming items
- **Notifications**: Real-time alerts for potential matches and claim status
- **Dashboard**: Overview of lost, found, and returned items
- **Success Stories**: Showcase of successfully returned items
- **Urgent/Immediate Section**: Priority highlighting for important items with optional rewards
- **User Profiles**: Manage personal information and track activity
- **Security Office Integration**: Two-step process with physical item submission

## Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Context API** for state management

### Backend
- **FastAPI** (Python)
- **SQLAlchemy** ORM
- **SQLite** (development) / **PostgreSQL** (production)
- **JWT** authentication
- **Pydantic** for data validation

## Project Structure

```
lostAndFound/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React Context providers
│   │   ├── services/        # API service functions
│   │   ├── utils/           # Utility functions
│   │   ├── App.jsx          # Main App component
│   │   └── index.css        # Tailwind CSS configuration
│   ├── package.json
│   └── vite.config.js
│
├── backend/                  # Python FastAPI backend
│   ├── main.py              # FastAPI application & routes
│   ├── models.py            # Database models
│   ├── database.py          # Database configuration
│   ├── auth.py              # Authentication utilities
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variables template
│
└── README.md                # This file
```

## Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **npm** or **yarn**
- **pip** (Python package manager)

## Installation & Setup

### 1. Clone the Repository

```bash
cd /Users/ryanmdg/Documents/lostAndFound
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Edit .env file and update SECRET_KEY (optional for development)
# For production, generate a secure key using:
# openssl rand -hex 32
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

## Running the Application

### Start the Backend Server

```bash
# From the backend directory
cd backend

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows

# Run the FastAPI server
python main.py

# Or use uvicorn directly:
uvicorn main:app --reload --port 5000
```

The backend API will be available at:
- **API**: http://localhost:5000
- **API Docs**: http://localhost:5000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:5000/redoc

### Start the Frontend Development Server

```bash
# From the frontend directory
cd frontend

# Start the Vite development server
npm run dev
```

The frontend application will be available at:
- **App**: http://localhost:5173

## Default Test Account

For testing purposes, you can register a new account or use the registration form at:
http://localhost:5173/register

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/users/me` - Get current user info

### Items
- `GET /api/items` - Get all items (with filters)
- `GET /api/items/{id}` - Get specific item
- `POST /api/items` - Create new item (lost/found)
- `POST /api/items/{id}/claim` - Claim an item

### Statistics
- `GET /api/stats` - Get system statistics

## Usage Guide

### For Students Who Lost Items

1. **Register/Login** to your account
2. Navigate to **Report Lost Item**
3. Fill in the details:
   - Item name and description
   - Category, color, and condition
   - Last seen location and date
   - Mark as urgent if needed (ID cards, important documents)
   - Add optional reward for urgent items
4. Submit the report
5. Check **Notifications** for potential matches

### For Students Who Found Items

1. **Register/Login** to your account
2. Navigate to **Report Found Item**
3. Fill in the details:
   - Item description and photo
   - Location where found and date
   - Category and condition
4. Submit the digital report
5. **Important**: Bring the physical item to the Security Office
6. Show the reference number at the office

### Claiming Items

1. Browse items in **Search Items** or **Dashboard**
2. Click on an item to view full details
3. Click **Claim This Item**
4. Provide verification details (features not shown in photo)
5. Admin will review your claim
6. Once approved, pick up the item at the Security Office

## Features Implemented

✅ User registration and authentication
✅ Report lost items with detailed information
✅ Report found items with image upload
✅ Advanced search and filtering
✅ Item details page with claim functionality
✅ Dashboard with statistics
✅ Notifications system
✅ User profile management
✅ Success stories/Returned items section
✅ Urgent/Immediate items with rewards
✅ Two-step verification process
✅ Responsive design with Tailwind CSS

## Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] Email notifications
- [ ] Admin panel for claim verification
- [ ] Advanced matching algorithm
- [ ] Campus map integration
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard for admins
- [ ] Image compression and optimization
- [ ] Multi-language support

## Development

### Frontend Development

```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend Development

```bash
cd backend
source venv/bin/activate  # Activate virtual environment
python main.py            # Start server with auto-reload
```

### Database Migrations

The application uses SQLAlchemy for database management. Tables are automatically created on first run.

For production with Alembic migrations:

```bash
# Initialize Alembic (one time)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Description"

# Apply migration
alembic upgrade head
```

## Deployment

### Frontend Deployment (Vercel/Netlify)

```bash
cd frontend
npm run build
# Deploy the 'dist' folder
```

### Backend Deployment (Railway/Render/Heroku)

1. Set environment variables:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `SECRET_KEY` (secure random key)

2. Update CORS origins in `main.py` to include your frontend URL

3. Deploy using platform-specific instructions

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- CORS configured for allowed origins
- Input validation with Pydantic
- SQL injection prevention with SQLAlchemy ORM

## Contributing

This is a school project. For suggestions or improvements, please create an issue or pull request.

## License

This project is for educational purposes.

## Support

For issues or questions, please contact the development team or create an issue in the repository.

## Acknowledgments

- Design inspiration from the Lost-and-Found-System-Draft.pdf
- Built as a solution for school lost and found management
- Promotes honesty and community support within the school

---

**Made with ❤️ for the school community**
# lostandfound
