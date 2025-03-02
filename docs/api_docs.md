# MuhasabAI Profile API Documentation

## Overview

This document provides documentation for the Profile API endpoints in MuhasabAI. These endpoints are designed to manage user profiles with a focus on privacy and security.

Base URL: `/api`

## Authentication

Authentication is not yet fully implemented. Current endpoints accept a `userId` parameter without authentication. Future versions will require proper authentication.

## Profile Endpoints

### Get Current User Profile

Retrieves the profile for the currently authenticated user.

```
GET /profile
```

#### Response

```json
{
  "userId": "string",
  "createdAt": "2023-03-01T12:00:00Z",
  "updatedAt": "2023-03-01T12:00:00Z",
  "generalPreferences": {
    "inputMethod": "text",
    "reflectionFrequency": "daily",
    "languagePreferences": "english"
  },
  "privacySettings": {
    "localStorageOnly": false,
    "allowPersonalization": true,
    "enableSync": false
  },
  "usageStats": {
    "reflectionCount": 0,
    "lastActiveDate": "2023-03-01T12:00:00Z",
    "streakDays": 0
  }
}
```

### Get User Profile by ID

Retrieves a user profile by ID.

```
GET /profile/:userId
```

#### Parameters

| Name   | Type   | Description                  |
|--------|--------|------------------------------|
| userId | string | The ID of the user to fetch  |

#### Response

```json
{
  "userId": "string",
  "createdAt": "2023-03-01T12:00:00Z",
  "updatedAt": "2023-03-01T12:00:00Z",
  "generalPreferences": {
    "inputMethod": "text",
    "reflectionFrequency": "daily",
    "languagePreferences": "english"
  },
  "privacySettings": {
    "localStorageOnly": false,
    "allowPersonalization": true,
    "enableSync": false
  },
  "usageStats": {
    "reflectionCount": 0,
    "lastActiveDate": "2023-03-01T12:00:00Z",
    "streakDays": 0
  }
}
```

### Create User Profile

Creates a new user profile.

```
POST /profile
```

#### Request Body

```json
{
  "userId": "string",
  "generalPreferences": {
    "inputMethod": "text",
    "reflectionFrequency": "daily",
    "languagePreferences": "english"
  },
  "privacySettings": {
    "localStorageOnly": false,
    "allowPersonalization": true,
    "enableSync": false
  },
  "usageStats": {
    "reflectionCount": 0,
    "lastActiveDate": "2023-03-01T12:00:00Z",
    "streakDays": 0
  }
}
```

#### Response

```json
{
  "userId": "string",
  "createdAt": "2023-03-01T12:00:00Z",
  "updatedAt": "2023-03-01T12:00:00Z",
  "generalPreferences": {
    "inputMethod": "text",
    "reflectionFrequency": "daily",
    "languagePreferences": "english"
  },
  "privacySettings": {
    "localStorageOnly": false,
    "allowPersonalization": true,
    "enableSync": false
  },
  "usageStats": {
    "reflectionCount": 0,
    "lastActiveDate": "2023-03-01T12:00:00Z",
    "streakDays": 0
  }
}
```

### Update User Profile

Updates an existing user profile.

```
PUT /profile
```

#### Request Body

```json
{
  "userId": "string",
  "generalPreferences": {
    "inputMethod": "voice",
    "reflectionFrequency": "weekly",
    "languagePreferences": "arabic"
  },
  "privacySettings": {
    "localStorageOnly": true,
    "allowPersonalization": false,
    "enableSync": false
  },
  "usageStats": {
    "reflectionCount": 10,
    "lastActiveDate": "2023-03-01T12:00:00Z",
    "streakDays": 5
  }
}
```

#### Response

```json
{
  "userId": "string",
  "createdAt": "2023-03-01T12:00:00Z",
  "updatedAt": "2023-03-02T12:00:00Z",
  "generalPreferences": {
    "inputMethod": "voice",
    "reflectionFrequency": "weekly",
    "languagePreferences": "arabic"
  },
  "privacySettings": {
    "localStorageOnly": true,
    "allowPersonalization": false,
    "enableSync": false
  },
  "usageStats": {
    "reflectionCount": 10,
    "lastActiveDate": "2023-03-01T12:00:00Z",
    "streakDays": 5
  }
}
```

### Delete User Profile

Deletes a user profile and related data.

```
DELETE /profile?userId=string
```

#### Parameters

| Name   | Type   | Description                  |
|--------|--------|------------------------------|
| userId | string | The ID of the user to delete |

#### Response

Status: 204 No Content

## Encrypted Data Endpoints

These endpoints handle the encrypted private profile data. The data is encrypted client-side before transmission.

### Get Encrypted Profile Data

Retrieves encrypted profile data for a user.

```
GET /profile/:userId/encrypted
```

#### Parameters

| Name   | Type   | Description                      |
|--------|--------|----------------------------------|
| userId | string | The ID of the user to fetch data |

#### Response

```json
{
  "data": "base64EncodedEncryptedData",
  "iv": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
}
```

### Update Encrypted Profile Data

Updates encrypted profile data for a user.

```
PUT /profile/:userId/encrypted
```

#### Parameters

| Name   | Type   | Description                      |
|--------|--------|----------------------------------|
| userId | string | The ID of the user to update     |

#### Request Body

```json
{
  "data": "base64EncodedEncryptedData",
  "iv": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
}
```

#### Response

```json
{
  "success": true
}
```

### Delete Encrypted Profile Data

Deletes encrypted profile data for a user.

```
DELETE /profile/:userId/encrypted
```

#### Parameters

| Name   | Type   | Description                      |
|--------|--------|----------------------------------|
| userId | string | The ID of the user to delete     |

#### Response

Status: 204 No Content

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "Error message describing the issue"
}
```

### 401 Unauthorized

```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": "Unauthorized access to profile"
}
```

### 404 Not Found

```json
{
  "error": "Profile not found"
}
```

### 409 Conflict

```json
{
  "error": "Profile already exists"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to process request"
}
```

## Testing the API

You can test the API using the provided test script:

```
npm run test:profile-api
```

This script tests all endpoints by creating, fetching, updating, and deleting profiles. 