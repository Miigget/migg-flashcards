# AI Flashcard Generator

This feature allows users to automatically generate flashcards from text content using AI.

## Overview

The AI Flashcard Generator provides a three-step process for creating flashcards:

1. **Enter Text**: Paste text content and select a collection
2. **Generate**: AI analyzes the text and creates flashcard candidates
3. **Review**: Review, edit, and save generated flashcards

## Components

The feature is built using the following components:

- `GeneratePageComponent`: Main component coordinating the entire process
- `GenerateSteps`: Navigation between steps
- `SourceTextInput`: Text input and collection selection
- `GenerationProgress`: Progress indicator for generation
- `CandidatesList`: List of generated flashcard candidates
- `CandidateCard`: Individual flashcard display with actions
- `EditCandidateModal`: Modal for editing flashcard content

## API Endpoints

The feature uses the following API endpoints:

- `POST /api/flashcards/generate`: Generate flashcards from text
- `POST /api/flashcards/bulk`: Save multiple flashcards at once
- `GET /api/collections`: Get available collections
- `POST /api/collections`: Create a new collection

## Usage

1. Navigate to `/generate` in the application
2. Paste text content (minimum 100 characters)
3. Select a destination collection or create a new one
4. Click "Generate Flashcards"
5. Wait for the AI to analyze and generate flashcards
6. Review each generated flashcard:
   - Click "Accept" to include it in your collection
   - Click "Edit" to modify the content
   - Click "Discard" to exclude it from your collection
7. Click "Save Flashcards" to save all accepted/edited flashcards

## State Management

Each step in the process has its own state management:

- Text input state: Managed by the main component
- Generation state: Managed by `useFlashcardGeneration` hook
- Review state: Managed by `useCandidatesReview` hook

## Validation

The feature includes the following validation:

- Text must be between 100 and 10,000 characters
- A collection must be selected
- Flashcard front side must be less than 200 characters
- Flashcard back side must be less than 500 characters

## Error Handling

Errors are handled at different steps:

- Input validation errors are displayed inline
- API errors are displayed in alert banners
- Toast notifications provide feedback on actions 