# Flashcards API

## POST /api/flashcards

Creates a new flashcard manually by an authenticated user. These flashcards are stored in the `flashcards` table with the `source` parameter set to "manual".

### Request

- **Method**: POST
- **URL**: `/api/flashcards`
- **Authentication**: Not required during development (uses DEFAULT_USER_ID)

### Request Body

```json
{
  "front": "Front text (up to 200 characters)",
  "back": "Back text (up to 500 characters)",
  "collection": "Collection name",
  "source": "manual"
}
```

#### Required Parameters

| Parameter | Type | Description | Constraints |
|-----------|------|-------------|------------|
| `front` | string | Text on the front of the flashcard | 1-200 characters |
| `back` | string | Text on the back of the flashcard | 1-500 characters |
| `collection` | string | Name of the collection | Non-empty |
| `source` | string | Source of the flashcard | Must be "manual" |

### Response

**Status Code**: 201 Created

```json
{
  "flashcard_id": 1,
  "user_id": "user_uuid",
  "front": "Front text",
  "back": "Back text",
  "collection": "Collection name",
  "source": "manual",
  "generation_id": null,
  "created_at": "2023-09-01T12:00:00.000Z",
  "updated_at": "2023-09-01T12:00:00.000Z"
}
```

### Error Codes

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Bad Request | Missing required fields, text exceeding maximum length, empty collection name, or source not set to "manual" |
| 500 | Internal Server Error | Database connection issues or other unexpected errors |

### Example Usage

#### cURL

```bash
curl -X POST https://your-domain.com/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is the capital of France?",
    "back": "Paris",
    "collection": "Geography",
    "source": "manual"
  }'
```

#### JavaScript Fetch

```javascript
const response = await fetch('https://your-domain.com/api/flashcards', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    front: 'What is the capital of France?',
    back: 'Paris',
    collection: 'Geography',
    source: 'manual'
  })
});

const data = await response.json();
console.log(data);
``` 