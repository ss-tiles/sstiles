# Stock Register - Inventory Management System

A modern inventory management system built with React, TypeScript, and Node.js.

## Features

- **🔐 User Authentication** - Secure login/signup with Supabase
- **📦 Product Management** - Add, edit, and manage inventory items
- **📊 Stock Tracking** - Real-time stock level monitoring
- **📈 Transaction History** - Track sales and purchase history
- **⚠️ Low Stock Alerts** - Get notified when inventory runs low
- **🎨 Modern UI** - Clean, responsive design with Material-UI
- **🔒 Protected Routes** - Only authenticated users can access the system

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn
- Supabase account (for authentication)

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd stock-register
```

2. Install dependencies:
```bash
npm install
```

3. **Set up Supabase:**
   - Create a project at [https://supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key
   - Configure authentication settings (enable email auth)

4. Create a `.env` file in the root directory with the following variables:
```
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

5. Start the development server:
```bash
# Start the backend server
npm run server

# In a new terminal, start the frontend
npm start
```

The application will be available at `http://localhost:3000`

## Authentication

The app now includes secure authentication powered by Supabase:

- **Sign Up**: Create a new account with email and password
- **Sign In**: Login with existing credentials  
- **Protected Routes**: All inventory features require authentication
- **User Management**: View user info and logout from the navbar
- **Session Management**: Automatic session handling and persistence

For detailed authentication setup instructions, see [SETUP_AUTH.md](./SETUP_AUTH.md)

## Project Structure

```
stock-register/
├── src/                    # Frontend source code
│   ├── components/        # React components
│   │   ├── Navbar.tsx    # Navigation with auth menu
│   │   ├── Sidebar.tsx   # App navigation sidebar
│   │   └── ProtectedRoute.tsx # Route protection
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx   # Authentication state management
│   ├── lib/              # Utility libraries
│   │   └── supabase.ts   # Supabase client configuration
│   ├── pages/            # Page components
│   │   ├── Auth.tsx      # Login/Signup page
│   │   ├── Dashboard.tsx # Main dashboard
│   │   ├── Products.tsx  # Product management
│   │   ├── Categories.tsx # Category management
│   │   └── Transactions.tsx # Transaction history
│   └── types/            # TypeScript types
├── server/               # Backend source code
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   └── controllers/     # Route controllers
└── public/              # Static files
```
