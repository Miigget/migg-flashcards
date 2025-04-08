# Migg Flashcards

## Description
Migg Flashcards is a web application that allows users to create and manage sets of flashcards. It provides both manual creation of flashcards and AI-assisted generation from text input. The application supports spaced repetition learning and detailed session statistics.

## Table of Contents
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack
**Frontend:**
- Astro 5
- React 19
- TypeScript 5
- Tailwind CSS 4
- Shadcn/ui

**Backend:**
- Supabase (PostgreSQL)
- Openrouter.ai for AI integration

**CI/CD & Hosting:**
- GitHub Actions
- DigitalOcean

## Getting Started Locally
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd migg-flashcards
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Ensure correct Node version**
   The project requires the Node version specified in `.nvmrc` **(22.14.0)**.
   You can use [nvm](https://github.com/nvm-sh/nvm) to switch Node versions:
   ```bash
   nvm use
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Preview the production build**
   ```bash
   npm run preview
   ```

## Available Scripts
- `npm run dev` - Starts the Astro development server.
- `npm run build` - Builds the project for production.
- `npm run preview` - Previews the production build.
- `npm run lint` - Lints the codebase.
- `npm run lint:fix` - Fixes linting errors.
- `npm run format` - Formats the codebase using Prettier.

## Project Scope
The project aims to provide:
- **User Authentication:** Secure registration, login, and account management.
- **Flashcard Creation:** Both manual creation with character limits (front up to 200 characters, back up to 500 characters) and AI-assisted generation from pasted text (limit of 10,000 characters).
- **AI-Assisted Flashcard Generation:**
  - Users can paste text and receive AI-generated flashcard candidates.
  - Flashcards generated by AI can be reviewed with options to Accept, Edit, or Discard.
- **Bulk Saving:** Ability to save multiple approved flashcards at once.
- **Flashcard Collections Management:**
  - Create, edit, view, and delete collections.
  - Each flashcard must belong to at least one collection.
- **Spaced Repetition Learning:** 
  - Start study sessions using an external spaced repetition algorithm.
  - Display session statistics, including total flashcards reviewed and percentage of correct answers.

## Project Status
This project is currently an MVP, under active development. New features and improvements are planned based on user feedback and testing.

## License
This project is licensed under the MIT License.
