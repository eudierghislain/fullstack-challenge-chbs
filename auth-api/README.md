# AuthenticationAPI

## Overview
AuthenticationAPI is a NestJS-based authentication service that provides user authentication, registration, token management, and profile retrieval functionalities using JWT authentication.

## Features
- User registration
- User login
- JWT-based authentication (access and refresh tokens)
- Token refresh
- User logout
- Profile retrieval

## Installation

### Prerequisites
Ensure you have the following installed:
- Node.js (>=16.x)
- npm or yarn
- NestJS CLI

### Setup
1. Install dependencies:
   ```sh
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory and add:
   ```env
    TCP_PORT= 1235
    HTTP_PORT= 1234
    JWT_SECRET="MonSuperSecret"
    JWT_REFRESH_SECRET="MonSuperRefreshSecret"
    TCP_PORT_DB=1237
    DB_HOST=localhost
   ```
4. Start the application:
   ```sh
   npm run start
   ```

## API Endpoints

### Authentication

#### Register User
- **Endpoint:** `POST /auth/register`
- **Description:** Registers a new user.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Response:**
  ```json
  {
    "accessToken": "...",
    "refreshToken": "..."
  }
  ```

#### Login User
- **Endpoint:** `POST /auth/login`
- **Description:** Authenticates a user.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Response:**
  ```json
  {
    "accessToken": "...",
    "refreshToken": "..."
  }
  ```

#### Refresh Tokens
- **Endpoint:** `POST /auth/refresh`
- **Description:** Refreshes authentication tokens.
- **Request Body:**
  ```json
  {
    "userId": "<user_id>",
    "refreshToken": "<refresh_token>"
  }
  ```
- **Response:**
  ```json
  {
    "accessToken": "...",
    "refreshToken": "..."
  }
  ```

#### Logout User
- **Endpoint:** `POST /auth/logout`
- **Description:** Logs out the user and invalidates refresh tokens.
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  ```
- **Response:**
  ```json
  {
    "message": "Logout successful"
  }
  ```

#### Get User Profile
- **Endpoint:** `GET /auth/profile`
- **Description:** Retrieves the authenticated user's profile.
- **Headers:**
  ```
  Authorization: Bearer <access_token>
  ```
- **Response:**
  ```json
  {
    "sub": "...",
    "email": "user@example.com"
  }
  ```

## Security
- Uses JWT for authentication.
- Stores hashed refresh tokens in the database.
- Ensures token versioning to revoke old refresh tokens.

