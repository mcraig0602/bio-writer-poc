# Biography POC - API Documentation

## Base URL
- Development: `http://localhost:3001/api`
- Docker: `http://localhost:3001/api`

## Authentication
Currently no authentication is required.

**TODO**: Future versions will require an `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Biography Endpoints

### Generate Biography
Generate a new structured biography from form fields. Optionally generate a mentor-focused summary.

**Endpoint**: `POST /api/biography/generate`

**Request Body**:
```json
{
  "title": "string (optional)",
  "jobTitle": "string (required)",
  "department": "string (required)",
  "businessFunction": "Developer | UI/UX | Product Specialist | Product Manager | Other (required)",
  "businessFunctionOther": "string (required when businessFunction=Other)",
  "location": "string (optional)",
  "yearsExperience": "number (optional)",
  "contactInfo": {
    "email": "string (optional)",
    "phone": "string (optional)",
    "linkedin": "string (optional)"
  },
  "summary": "string (optional) - used as context; the API may replace it with an AI-generated summary",

  "generateMentorSummary": "boolean (optional) - when true, generates mentorSummary on creation",
  "mentorSummary": "string (optional) - manual mentor summary; if provided it takes precedence over generation",

  "experience": [
    {
      "title": "string",
      "company": "string",
      "years": "string (optional)",
      "description": "string (optional)"
    }
  ],
  "skills": ["string"],
  "education": [
    {
      "degree": "string",
      "university": "string",
      "year": "number (optional)"
    }
  ],
  "certifications": ["string"],
  "notableAchievements": ["string"]
}
```

**Response**: `200 OK`
```json
{
  "id": "string",
  "title": "string",
  "jobTitle": "string",
  "department": "string",
  "businessFunction": "string",
  "businessFunctionOther": "string | null",
  "location": "string | null",
  "yearsExperience": "number | null",
  "contactInfo": {
    "email": "string | null",
    "phone": "string | null",
    "linkedin": "string | null"
  },
  "summary": "string",
  "mentorSummary": "string | null",
  "experience": [],
  "skills": [],
  "education": [],
  "certifications": [],
  "notableAchievements": [],
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

**Errors**:
- `400` - Validation error (missing required fields)
- `500` - Failed to create biography (check if Ollama/MongoDB are running)

---

### List Biographies
List saved biographies (most recently updated first).

**Endpoint**: `GET /api/biography/list`

**Response**: `200 OK`
```json
{
  "count": 1,
  "biographies": [
    {
      "id": "string",
      "title": "string",
      "jobTitle": "string",
      "department": "string",
      "location": "string | null",
      "yearsExperience": "number | null",
      "skills": ["string"],
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ]
}
```

---

### Get Current Biography
Retrieve the current biography data.

**Endpoint**: `GET /api/biography/current`

**Response**: `200 OK`
```json
{
  "id": "string",
  "title": "string",
  "jobTitle": "string",
  "department": "string",
  "businessFunction": "string",
  "businessFunctionOther": "string | null",
  "location": "string | null",
  "yearsExperience": "number | null",
  "contactInfo": {},
  "summary": "string",
  "mentorSummary": "string | null",
  "experience": [],
  "skills": [],
  "education": [],
  "certifications": [],
  "notableAchievements": [],
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

**Errors**:
- `404` - No biography exists yet
- `500` - Database error

---

### Get Biography By ID
Retrieve a specific biography.

**Endpoint**: `GET /api/biography/:id`

**Response**: `200 OK`
Same shape as `GET /api/biography/current`.

**Errors**:
- `404` - Biography not found
- `500` - Database error

---

### Edit Biography
Bulk update a structured biography.

**Endpoint**: `PUT /api/biography/:id/edit`

**Request Body**:
```json
{
  "title": "string (optional)",
  "jobTitle": "string (required)",
  "department": "string (required)",
  "businessFunction": "string (required)",
  "businessFunctionOther": "string (optional)",
  "location": "string (optional)",
  "yearsExperience": "number (optional)",
  "contactInfo": {},
  "summary": "string (optional)",
  "mentorSummary": "string (optional)",
  "experience": [],
  "skills": [],
  "education": [],
  "certifications": [],
  "notableAchievements": []
}
```

**Response**: `200 OK`
```json
{
  "id": "string",
  "title": "string",
  "jobTitle": "string",
  "department": "string",
  "businessFunction": "string",
  "businessFunctionOther": "string | null",
  "location": "string | null",
  "yearsExperience": "number | null",
  "contactInfo": {},
  "summary": "string",
  "mentorSummary": "string | null",
  "experience": [],
  "skills": [],
  "education": [],
  "certifications": [],
  "notableAchievements": []
}
```

**Errors**:
- `400` - Validation error
- `404` - Biography not found
- `500` - Update failed

---

### Get Change History
Retrieve all historical versions of a biography.

**Endpoint**: `GET /api/biography/:id/history`

**Response**: `200 OK`
```json
{
  "history": [
    {
      "biography": "string",
      "tags": ["string"],
      "skills": ["string"],
      "timestamp": "ISO date string",
      "source": "initial | chat | manual | field-update | regenerate-keywords",
      "field": "string | null"
    }
  ]
}
```

**Errors**:
- `404` - No biography exists
- `500` - Database error

---

### Update Title
Update the biography title.

**Endpoint**: `PUT /api/biography/:id/title`

**Request Body**:
```json
{ "title": "string (required)" }
```

**Response**: `200 OK`
```json
{ "title": "string", "id": "string" }
```

---

### Update Single Field
Update a single simple field.

**Endpoint**: `PUT /api/biography/:id/field/:fieldName`

Allowed `fieldName` values:
- `jobTitle`, `department`, `businessFunction`, `businessFunctionOther`, `location`, `yearsExperience`, `summary`, `mentorSummary`, `skills`, `certifications`, `notableAchievements`

**Request Body**:
```json
{ "value": "any" }
```

**Response**: `200 OK`
```json
{ "<fieldName>": "updatedValue" }
```

---

### Update Contact Info
Update contact info.

**Endpoint**: `PUT /api/biography/:id/contact`

**Request Body**:
```json
{ "contactInfo": { "email": "string", "phone": "string", "linkedin": "string" } }
```

**Response**: `200 OK`
```json
{ "contactInfo": {} }
```

---

### Regenerate Field
Regenerate supported AI-derived fields.

**Endpoint**: `POST /api/biography/:id/regenerate/:key`

Allowed `key` values:
- `summary`
- `mentorSummary`
- `skills`

**Response**: `200 OK`

When `key=summary`:
```json
{ "summary": "string" }
```

When `key=mentorSummary`:
```json
{ "mentorSummary": "string" }
```

When `key=skills`:
```json
{ "skills": ["string"] }
```

---

### Update Tags (Manual)
Manually manage tags.

**Endpoint**: `PUT /api/biography/:id/tags`

**Request Body**:
```json
{ "tags": ["string"] }
```

**Response**: `200 OK`
```json
{ "tags": ["string"], "userAddedTags": ["string"] }
```

---

### Delete Biography
Delete a biography and its associated chat messages.

**Endpoint**: `DELETE /api/biography/:id`

**Response**: `200 OK`
```json
{ "message": "Biography deleted successfully", "id": "string" }
```

## Chat Endpoints

### Refine Biography
Send a conversational message to refine the biography.

**Endpoint**: `POST /api/chat/:biographyId/refine`

**Request Body**:
```json
{
  "message": "string (required) - The refinement instruction"
}
```

**Example messages**:
- "Make it more formal"
- "Add emphasis on technical skills"
- "Shorten to 3 sentences"

**Response**: `200 OK`
```json
{
  "biography": "string - Updated biography",
  "tags": ["string"],
  "skills": ["string"],
  "message": "string - Assistant response"
}
```

**Errors**:
- `400` - Missing message
- `404` - No biography exists (generate one first)
- `500` - Refinement failed

**Note**: The chat maintains full conversation context, so you can reference previous messages.

---

### Get Chat Messages
Retrieve chat conversation history for a biography.

**Endpoint**: `GET /api/chat/:biographyId/messages`

**Response**: `200 OK`
```json
{
  "messages": [
    {
      "_id": "string",
      "role": "user | assistant",
      "content": "string",
      "timestamp": "ISO date string",
      "biographyId": "string"
    }
  ]
}
```

**Errors**:
- `500` - Database error

---

### Clear Chat History
Delete all chat messages for a biography.

**Endpoint**: `DELETE /api/chat/:biographyId/clear`

**Response**: `200 OK`
```json
{
  "message": "Chat history cleared successfully"
}
```

**Errors**:
- `404` - No biography exists
- `500` - Clear operation failed

---

## Health Check

**Endpoint**: `GET /health`

**Response**: `200 OK`
```json
{
  "status": "ok"
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "string - Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Data Models

### Biography Schema
```javascript
{
  title: String,
  jobTitle: String,
  department: String,
  businessFunction: String,
  businessFunctionOther: String,
  location: String,
  yearsExperience: Number,
  contactInfo: { email: String, phone: String, linkedin: String },
  summary: String,
  mentorSummary: String,
  experience: [{ title: String, company: String, years: String, description: String }],
  skills: [String],
  education: [{ degree: String, university: String, year: Number }],
  certifications: [String],
  notableAchievements: [String],

  // legacy/compatibility fields
  rawInput: String,
  currentBiography: String,
  tags: [String],
  userAddedTags: [String],

  history: [{ biography: String, tags: [String], skills: [String], timestamp: Date, source: String, field: String }],
  createdAt: Date,
  updatedAt: Date
}
```

### ChatMessage Schema
```javascript
{
  role: 'user' | 'assistant',
  content: String,
  timestamp: Date,
  biographyId: ObjectId
}
```

---

## Example Workflow

1. **Generate initial biography**:
   ```bash
   curl -X POST http://localhost:3001/api/biography/generate \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Biography",
       "jobTitle": "Senior Software Engineer",
       "department": "Engineering",
       "businessFunction": "Developer",
       "location": "San Francisco, CA",
       "yearsExperience": 5,
       "generateMentorSummary": true,
       "skills": ["React", "Node.js"]
     }'
   ```

2. **Refine through chat**:
   ```bash
  curl -X POST http://localhost:3001/api/chat/<BIOGRAPHY_ID>/refine \
     -H "Content-Type: application/json" \
     -d '{"message": "Make it more formal"}'
   ```

3. **Get current biography**:
   ```bash
   curl http://localhost:3001/api/biography/current
   ```

4. **View history**:
   ```bash
  curl http://localhost:3001/api/biography/<BIOGRAPHY_ID>/history
   ```
