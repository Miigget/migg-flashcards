# REST API Plan

## 1. Resources

- **Users**: Represents system users stored in the `users` table. Managed by Supabase Auth and used for authentication and authorization.
- **Flashcards**: Represents individual flashcards stored in the `flashcards` table. Contains fields for front text, back text, collection name, source (manual or AI), and a reference to a generation (if applicable).
- **Generations**: Represents metadata for AI flashcard generation sessions stored in the `generations` table. Contains details such as model name, generated flashcards count, and duration.
- **Generation Error Logs**: Stores logs for any errors encountered during AI generation in the `generation_error_logs` table.
- **Collections**: Logical grouping of flashcards based on the `collection` field. Although not stored in a separate table, this resource is managed through the API for organizing flashcards.

## 2. Endpoints

### 2.1 Flashcards

- **GET /api/flashcards**
  - Description: List flashcards for the authenticated user with support for pagination, filtering (by collection), and sorting.
  - Query Parameters:
    - `page`: Page number
    - `limit`: Number of flashcards per page
    - `collection`: (Optional) Filter by collection name
    - `sort`: (Optional) Sort criteria (e.g., created_at)
    - `order`: (`asc` or `desc`)
  - Response: Paginated list of flashcards.

- **GET /api/flashcards/{flashcard_id}**
  - Description: Retrieve a single flashcard by its ID.
  - Response: Flashcard details.

- **POST /api/flashcards**
  - Description: Create a new flashcard manually.
  - Request Payload:
    ```json
    {
      "front": "Front text (up to 200 characters)",
      "back": "Back text (up to 500 characters)",
      "collection": "Collection name",
      "source": "manual"
    }
    ```
  - Response: Created flashcard details.

- **PUT /api/flashcards/{flashcard_id}**
  - Description: Update an existing flashcard.
  - Request Payload: Fields to update (e.g., `front`, `back`, `collection`).
  - Response: Updated flashcard details.

- **DELETE /api/flashcards/{flashcard_id}**
  - Description: Delete a flashcard.
  - Response: Confirmation message.

- **POST /api/flashcards/bulk**
  - Description: Bulk create flashcards (for example, after reviewing AI-generated candidates).
  - Request Payload: Array of flashcard objects.
  - Response: List of created flashcards with status messages.

### 2.2 AI Flashcards Generation

- **POST /api/flashcards/generate**
  - Description: Generate flashcard candidates by submitting input text (up to 10,000 characters) to the AI service.
  - Request Payload:
    ```json
    {
      "text": "Input text for flashcard generation"
    }
    ```
  - Response: List of candidate flashcards along with an associated `generation_id` and `generated_count`.

### 2.3 Generations

- **GET /api/generations**
  - Description: Retrieve a list of flashcard generation sessions for the authenticated user.
  - Query Parameters: Pagination parameters can be applied.
  - Response: List of generation sessions with metadata (e.g., model, generated count, duration).

- **GET /api/generations/{generation_id}**
  - Description: Retrieve details of a specific generation session.
  - Response: Generation session details.

### 2.4 Generation Error Logs

*(Typically used internally or by admin users)*

- **GET /api/generation-errors**
  - Description: List generation error logs for the authenticated user.
  - Query Parameters: Optional filters and pagination.
  - Response: List of error logs, including error codes and messages.

### 2.5 Collections (Logical Grouping)

- **GET /api/collections**
  - Description: Retrieve a list of distinct collection names for the authenticated user.
  - Response: Array of collection names.

- **POST /api/collections**
  - Description: Create a new collection.
  - Request Payload:
    ```json
    {
      "name": "New Collection Name"
    }
    ```
  - Response: Confirmation and details of the created collection.

- **PUT /api/collections/{collection_name}**
  - Description: Rename an existing collection.
  - Request Payload:
    ```json
    {
      "new_name": "Updated Collection Name"
    }
    ```
  - Response: Confirmation and updated collection details.

- **DELETE /api/collections/{collection_name}**
  - Description: Delete a collection. Business rules should clarify if associated flashcards are deleted or set as unassigned.
  - Response: Confirmation message.

## 3. Authentication and Authorization

- The API uses JWT-based authentication. Tokens are issued upon successful registration/login and are passed in the `Authorization` header as `Bearer <token>`.
- Endpoints are secured via middleware that validates the JWT and extracts the `user_id` to ensure that only the owner can access or modify their resources.
- Supabase Auth is leveraged for managing user credentials and basic account management, ensuring email verification and secure password handling as described in the PRD.

## 4. Validation and Business Logic

- **Validation Rules (from DB schema and PRD):**
  - *Flashcards*
    - `front`: Maximum of 200 characters.
    - `back`: Maximum of 500 characters.
    - `collection`: Must be a non-empty string.
    - `source`: Must be one of 'ai-full', 'ai-edited', or 'manual'. For AI-generated flashcards ('ai-full' or 'ai-edited'), a valid `generation_id` is required.
  - *AI Generation*
    - Input text must not exceed 10,000 characters.
  - *Users*
    - Email uniqueness and password constraints are enforced by Supabase Auth.

- **Business Logic:**
  - **Bulk Creation:** Endpoint supports batch creation of flashcards after user review of AI-generated candidates.
  - **AI Review Process:** Allows users to accept, modify, or discard AI-generated flashcard candidates before bulk insertion.
  - **AI Generation:** Validate inputs and call the AI service upon POST `/api/flashcards/generate`, record generation metadata (model, generated_count, duration) and send generated flashcard candidates to the user.
  - **Error Logging:** Any errors during the AI generation process are captured and logged via the generation error logs endpoint.
  - All endpoints perform early input validation with appropriate HTTP status codes (e.g., 400 for invalid input, 401 for unauthorized access, 404 for not found).
