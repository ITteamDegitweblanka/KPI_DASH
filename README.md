# KPI Dashboard

A comprehensive Key Performance Indicator (KPI) tracking and management system built with a modern tech stack.

## 🚀 Features

- **User Authentication** - Secure login and role-based access control
- **Performance Tracking** - Monitor individual and team performance metrics
- **Goal Management** - Set and track progress towards goals
- **Team Analytics** - Visualize team performance with charts and graphs
- **Real-time Notifications** - Stay updated with important alerts
- **Admin Dashboard** - Comprehensive overview for administrators

## 🛠 Tech Stack

### Frontend
- **Framework**: React with TypeScript
- **State Management**: React Context API
- **Styling**: CSS Modules / Styled Components
- **Charts**: Recharts
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **API Documentation**: Swagger/OpenAPI

## 📦 Prerequisites

- Node.js (v16 or later)
- npm or yarn
- PostgreSQL (v12 or later)
- Git

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ITteamDegitweblanka/KPI_DASH.git
cd KPI_DASH
```

### 2. Set Up Backend

```bash
cd backend
npm install

# Create .env file in backend directory with the following variables:
cp .env.example .env

# Update the .env file with your database credentials

# Run migrations
npx prisma migrate dev

# Start the development server
npm run dev
```

### 3. Set Up Frontend

```bash
cd ../frontend
npm install

# Create .env file in frontend directory
cp .env.example .env

# Update the .env file with your API URL

# Start the development server
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

## 📂 Project Structure

```
KPI_DASH/
├── backend/                 # Backend source code
│   ├── prisma/              # Prisma schema and migrations
│   ├── src/                 # Source files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   └── package.json        # Backend dependencies
│
└── frontend/              # Frontend source code
    ├── public/             # Static files
    ├── src/                # Source files
    │   ├── components/     # React components
    │   ├── services/      # API service functions
    │   ├── types/         # TypeScript type definitions
    │   └── utils/         # Utility functions
    └── package.json       # Frontend dependencies
```

## 🔒 Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/kpi_dashboard?schema=public"
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Prisma](https://www.prisma.io/)
- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)

## 📧 Contact

For any questions or feedback, please contact the development team.
