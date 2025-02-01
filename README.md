# Backend for PennyWise

### Note : A previous version of this backend was written in JS by me in this repo : [JS Backend Repo](https://github.com/apurvdugar/PennyWise)

A robust TypeScript-based backend service for the PennyWise expense tracking application. This service provides APIs for user authentication, expense management, and AI-powered financial insights.

## Features

- **User Authentication**

  - Secure signup and signin endpoints
  - JWT-based authentication
  - Password hashing with bcrypt

- **Expense Management**

  - CRUD operations for expenses
  - Category-based expense tracking
  - Input validation using Zod

- **Financial Insights**
  - AI-powered expense analysis using Google's Gemini Pro
  - Statistical breakdowns of spending patterns
  - Monthly and category-wise expense tracking

## Tech Stack

- Node.js & Express.js
- TypeScript
- MongoDB with Mongoose
- Google Gemini AI
- JWT for authentication
- Zod for validation
- CORS enabled

## Prerequisites

- Node.js (v14 or higher)
- MongoDB instance
- Google Gemini API key

## Environment Variables

Create a `.env` file in the root directory with:

```
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

## Installation

1. Clone the repository
2. Install dependencies:

```
npm install
```

3. Build the project:

```
npm run build
```

4. Start the development server:

```
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/signup` - Register a new user
- `POST /api/v1/auth/signin` - Login user

### Expenses

- `GET /api/v1/expenses` - Get all expenses
- `POST /api/v1/expenses` - Create new expense
- `PUT /api/v1/expenses/:id` - Update expense
- `DELETE /api/v1/expenses/:id` - Delete expense

### Insights

- `GET /api/v1/insights/ai-analysis` - Get AI-powered expense analysis
- `GET /api/v1/insights/statistics` - Get expense statistics

## Data Models

### User

- name: String
- email: String (unique)
- passwordHash: String

### Expense

- amount: Number
- category: String
- description: String
- user: ObjectId (reference to User)
- timestamps: true

### Insights

- user: ObjectId (reference to User)
- type: String
- data: Object
- generatedAt: Date

## Security Features

- Password hashing
- JWT authentication
- Input validation
- Error handling
- CORS protection

## Error Handling

The API implements comprehensive error handling for:

- Invalid inputs
- Authentication failures
- Database errors
- AI service errors

## Development

The project uses TypeScript for type safety and better developer experience. The source code is organized into:

- `/src/routes` - API route handlers
- `/src/models` - Database models
- `/src/middlewares` - Custom middlewares
- `/src/config` - Configuration files

