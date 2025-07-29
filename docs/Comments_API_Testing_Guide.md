# SI3 Comments API Testing Guide

## Overview
This guide provides comprehensive instructions for testing all comment-related features using Postman.

## Base URL
```
http://localhost:8080
```

## Authentication
All comment endpoints require authentication. You must first login to get an auth token.

### Login Request
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "roles": ["guide"]
    }
  }
}
```

## Content Types
Valid content types for comments:
- `guide_session`
- `guide_ideas_lab`
- `scholar_session`
- `scholar_ideas_lab`

## API Endpoints

### 1. Create Comment

#### Create Top-Level Comment
```http
POST /api/comments
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "contentId": "test-content-123",
  "contentType": "guide_session",
  "content": "This is a test comment for the guide session content."
}
```

#### Create Reply Comment
```http
POST /api/comments
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "contentId": "test-content-123",
  "contentType": "guide_session",
  "content": "This is a reply to the previous comment.",
  "parentCommentId": "comment_id_here"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "comment": {
      "_id": "comment_id",
      "contentId": "test-content-123",
      "contentType": "guide_session",
      "content": "This is a test comment...",
      "userId": "user_id",
      "parentCommentId": null,
      "isReply": false,
      "replyCount": 0,
      "reactions": [],
      "likeCount": 0,
      "dislikeCount": 0,
      "isEdited": false,
      "isDeleted": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "_id": "user_id",
        "email": "user@example.com",
        "roles": ["guide"]
      }
    }
  }
}
```

### 2. Get Comments

#### Get Comments by Content
```http
GET /api/comments/content?contentId=test-content-123&contentType=guide_session&page=1&limit=20&includeReplies=true
Authorization: Bearer {{authToken}}
```

**Query Parameters:**
- `contentId` (required): The content identifier
- `contentType` (required): One of the valid content types
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `includeReplies` (optional): Include reply comments (default: false)

#### Get Threaded Comments (Optimized)
```http
GET /api/comments/content/threaded?contentId=test-content-123&contentType=guide_session&page=1&limit=20
Authorization: Bearer {{authToken}}
```

#### Get Single Comment
```http
GET /api/comments/{commentId}
Authorization: Bearer {{authToken}}
```

#### Get Comment Replies
```http
GET /api/comments/{commentId}/replies?page=1&limit=20
Authorization: Bearer {{authToken}}
```

#### Get My Comments
```http
GET /api/comments/my-comments?page=1&limit=20
Authorization: Bearer {{authToken}}
```

**Response Format:**
```json
{
  "status": "success",
  "results": 5,
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "totalComments": 5,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "data": {
    "comments": [
      {
        "_id": "comment_id",
        "contentId": "test-content-123",
        "contentType": "guide_session",
        "content": "Comment content...",
        "userId": "user_id",
        "parentCommentId": null,
        "isReply": false,
        "replyCount": 2,
        "reactions": [],
        "likeCount": 3,
        "dislikeCount": 1,
        "isEdited": false,
        "isDeleted": false,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "_id": "user_id",
          "email": "user@example.com",
          "roles": ["guide"]
        },
        "replies": [
          {
            "_id": "reply_id",
            "content": "Reply content...",
            "user": {
              "_id": "user_id",
              "email": "user@example.com"
            }
          }
        ]
      }
    ]
  }
}
```

### 3. Update Comment

```http
PUT /api/comments/{commentId}
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "content": "This is an updated comment content."
}
```

**Note:** Only the comment owner or admin can update comments.

### 4. Delete Comment (Soft Delete)

```http
DELETE /api/comments/{commentId}
Authorization: Bearer {{authToken}}
```

**Note:** Only the comment owner or admin can delete comments. This is a soft delete.

### 5. Comment Reactions

#### Add Like Reaction
```http
POST /api/comments/{commentId}/react
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "type": "like"
}
```

#### Add Dislike Reaction
```http
POST /api/comments/{commentId}/react
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "type": "dislike"
}
```

#### Remove Reaction
```http
DELETE /api/comments/{commentId}/react
Authorization: Bearer {{authToken}}
```

#### Get My Reaction
```http
GET /api/comments/{commentId}/my-reaction
Authorization: Bearer {{authToken}}
```

#### Get Reaction Statistics
```http
GET /api/comments/{commentId}/reactions
Authorization: Bearer {{authToken}}
```

**Reaction Stats Response:**
```json
{
  "status": "success",
  "data": {
    "commentId": "comment_id",
    "likeCount": 5,
    "dislikeCount": 2,
    "totalReactions": 7,
    "breakdown": {
      "like": 5,
      "dislike": 2
    }
  }
}
```

### 6. Comment Statistics

#### Get Content Comment Statistics
```http
GET /api/comments/content/stats?contentId=test-content-123&contentType=guide_session
Authorization: Bearer {{authToken}}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "analytics": {
      "totalComments": 15,
      "totalReplies": 8,
      "totalTopLevel": 7,
      "uniqueUserCount": 5,
      "latestComment": "2024-01-01T12:00:00.000Z",
      "oldestComment": "2024-01-01T08:00:00.000Z"
    }
  }
}
```

## Testing Scenarios

### 1. Basic Comment Flow
1. Login to get auth token
2. Create a top-level comment
3. Create a reply to the comment
4. Get comments for the content
5. Update the comment
6. Add reactions (like/dislike)
7. Get reaction statistics

### 2. Permission Testing
1. Test with different user roles (guide, scholar, admin)
2. Try accessing content types not allowed for user role
3. Try updating/deleting comments from other users

### 3. Pagination Testing
1. Create multiple comments
2. Test pagination with different page sizes
3. Test with includeReplies parameter

### 4. Error Scenarios
1. Invalid content IDs
2. Invalid content types
3. Missing required fields
4. Invalid comment IDs
5. Unauthorized access attempts

## Error Responses

### Validation Error
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "content",
      "message": "Comment content is required"
    }
  ]
}
```

### Not Found Error
```json
{
  "status": "error",
  "message": "Comment not found"
}
```

### Unauthorized Error
```json
{
  "status": "error",
  "message": "You are not authorized to access this resource"
}
```

## Postman Collection

Import the provided `Comments_API_Collection.json` file into Postman for automated testing. The collection includes:

1. **Variables**: Pre-configured base URL and dynamic variables
2. **Authentication**: Automatic token extraction and usage
3. **Test Scripts**: Automatic variable updates for chaining requests
4. **Complete Coverage**: All endpoints with sample data

### Collection Variables
- `baseUrl`: http://localhost:8080
- `authToken`: Automatically set after login
- `commentId`: Automatically set after creating comments
- `contentId`: test-content-123 (can be modified)

### Usage Tips
1. Run the "Login" request first to set the auth token
2. Use the "Create Top-Level Comment" to get a comment ID
3. All subsequent requests will use the stored variables
4. Modify the `contentId` variable to test with different content
5. Change content types to test role-based access control
