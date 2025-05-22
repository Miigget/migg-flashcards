import { useEffect, useReducer } from "react";
import { Rating } from "ts-fsrs";
import FlashcardView from "./FlashcardView.tsx";
import RatingControls from "./RatingControls.tsx";
import Header from "./Header.tsx";
import StudySummary from "./StudySummary.tsx";
import type { SpacedRepetitionCard, StudySessionState, StudySummaryData } from "@/types";

// Define initial state for the study session
const initialState: StudySessionState = {
  collectionName: "",
  allFlashcards: [],
  currentCard: null,
  currentIndex: 0,
  sessionQueue: [],
  reviewedInSession: [],
  isFrontVisible: true,
  isSessionActive: false,
  isSessionFinished: false,
  studySummaryData: null,
  isLoading: true,
  error: null,
};

// Define actions for the reducer
type Action =
  | { type: "SET_COLLECTION"; payload: string }
  | { type: "LOAD_FLASHCARDS_START" }
  | { type: "LOAD_FLASHCARDS_SUCCESS"; payload: SpacedRepetitionCard[] }
  | { type: "LOAD_FLASHCARDS_FAILURE"; payload: string }
  | { type: "FLIP_CARD" }
  | { type: "RATE_CARD"; payload: { cardId: number; rating: Rating } }
  | { type: "NEXT_CARD" }
  | { type: "END_SESSION" };

// Reducer function for managing complex state logic
function sessionReducer(state: StudySessionState, action: Action): StudySessionState {
  switch (action.type) {
    case "SET_COLLECTION":
      return {
        ...state,
        collectionName: action.payload,
      };

    case "LOAD_FLASHCARDS_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "LOAD_FLASHCARDS_SUCCESS": {
      const allFlashcards = action.payload;
      // Filter cards due for today (in a real app, this would use due date logic)
      // For now, we'll just use all cards
      const sessionQueue = [...allFlashcards];

      return {
        ...state,
        allFlashcards,
        sessionQueue,
        currentCard: sessionQueue.length > 0 ? sessionQueue[0] : null,
        isLoading: false,
        isSessionActive: sessionQueue.length > 0,
        error: null,
      };
    }

    case "LOAD_FLASHCARDS_FAILURE":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case "FLIP_CARD":
      return {
        ...state,
        isFrontVisible: !state.isFrontVisible,
      };

    case "RATE_CARD": {
      const { cardId, rating } = action.payload;

      // Add to reviewed cards
      const reviewedInSession = [...state.reviewedInSession, { cardId, rating }];

      // We're just tracking stats here, actual SRS update happens in the API

      return {
        ...state,
        reviewedInSession,
      };
    }

    case "NEXT_CARD": {
      const currentIndex = state.currentIndex + 1;
      const isSessionFinished = currentIndex >= state.sessionQueue.length;

      // Prepare summary data if the session is finished
      let studySummaryData: StudySummaryData | null = null;

      if (isSessionFinished) {
        const againCount = state.reviewedInSession.filter((r) => r.rating === Rating.Again).length;
        const hardCount = state.reviewedInSession.filter((r) => r.rating === Rating.Hard).length;
        const goodCount = state.reviewedInSession.filter((r) => r.rating === Rating.Good).length;
        const easyCount = state.reviewedInSession.filter((r) => r.rating === Rating.Easy).length;

        studySummaryData = {
          collectionName: state.collectionName,
          cardsReviewed: state.reviewedInSession.length,
          againCount,
          hardCount,
          goodCount,
          easyCount,
        };
      }

      return {
        ...state,
        currentIndex,
        currentCard: isSessionFinished ? null : state.sessionQueue[currentIndex],
        isFrontVisible: true, // Reset to front when moving to next card
        isSessionFinished,
        studySummaryData,
      };
    }

    case "END_SESSION": {
      const againCount = state.reviewedInSession.filter((r) => r.rating === Rating.Again).length;
      const hardCount = state.reviewedInSession.filter((r) => r.rating === Rating.Hard).length;
      const goodCount = state.reviewedInSession.filter((r) => r.rating === Rating.Good).length;
      const easyCount = state.reviewedInSession.filter((r) => r.rating === Rating.Easy).length;

      const studySummaryData: StudySummaryData = {
        collectionName: state.collectionName,
        cardsReviewed: state.reviewedInSession.length,
        againCount,
        hardCount,
        goodCount,
        easyCount,
      };

      return {
        ...state,
        isSessionFinished: true,
        studySummaryData,
      };
    }

    default:
      return state;
  }
}

interface FlashcardPlayerProps {
  collection: string;
}

export default function FlashcardPlayer({ collection }: FlashcardPlayerProps) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  // Set collection name when component mounts
  useEffect(() => {
    dispatch({ type: "SET_COLLECTION", payload: collection });
  }, [collection]);

  // Load flashcards for the collection
  useEffect(() => {
    if (!state.collectionName) return;

    const fetchFlashcards = async () => {
      try {
        dispatch({ type: "LOAD_FLASHCARDS_START" });

        const response = await fetch(`/api/collections/${state.collectionName}/study`);

        if (!response.ok) {
          throw new Error(`Failed to fetch flashcards: ${response.status}`);
        }

        const data = await response.json();
        dispatch({ type: "LOAD_FLASHCARDS_SUCCESS", payload: data });
      } catch (err) {
        dispatch({
          type: "LOAD_FLASHCARDS_FAILURE",
          payload: err instanceof Error ? err.message : "Failed to load flashcards",
        });
      }
    };

    fetchFlashcards();
  }, [state.collectionName]);

  // Handle flipping the card
  const handleFlip = () => {
    dispatch({ type: "FLIP_CARD" });
  };

  // Handle rating a card
  const handleRate = async (rating: Rating) => {
    if (!state.currentCard) return;

    try {
      // First, dispatch the local action to update the UI state
      dispatch({
        type: "RATE_CARD",
        payload: { cardId: state.currentCard.flashcard_id, rating },
      });

      // Then send the rating to the API
      const response = await fetch(`/api/flashcards/${state.currentCard.flashcard_id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        // Failed to update flashcard review
      }

      // Move to the next card regardless of API response
      dispatch({ type: "NEXT_CARD" });
    } catch {
      // Error updating flashcard review
      // Still move to the next card even if there was an error
      dispatch({ type: "NEXT_CARD" });
    }
  };

  // Handle ending the session
  const handleEndSession = () => {
    dispatch({ type: "END_SESSION" });
  };

  // Handle starting a new session
  const handleStudyAgain = () => {
    window.location.reload();
  };

  // Handle going back to the collection page
  const handleGoToCollection = () => {
    window.location.href = `/collections/${state.collectionName}`;
  };

  // Show loading state
  if (state.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-lg">Loading flashcards...</p>
      </div>
    );
  }

  // Show error state
  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>
            <strong>Error:</strong> {state.error}
          </p>
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show empty state
  if (state.sessionQueue.length === 0 && !state.isSessionFinished) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4">No Flashcards to Study</h2>
        <p className="text-lg mb-6">This collection doesn&apos;t have any flashcards yet.</p>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
          onClick={() => (window.location.href = `/collections/${state.collectionName}`)}
        >
          Go to Collection
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => (window.location.href = "/collections")}
        >
          Choose Another Collection
        </button>
      </div>
    );
  }

  // Show session summary when finished
  if (state.isSessionFinished && state.studySummaryData) {
    return (
      <StudySummary
        summary={state.studySummaryData}
        onStudyAgain={handleStudyAgain}
        onGoToCollection={() => handleGoToCollection()}
      />
    );
  }

  // Show the study session
  return (
    <div className="flex flex-col items-center">
      <Header
        collectionName={state.collectionName}
        currentCardIndex={state.currentIndex + 1}
        totalCardsInSession={state.sessionQueue.length}
        onEndSession={handleEndSession}
      />

      {state.currentCard && (
        <div className="flex flex-col items-center w-full max-w-xl">
          <FlashcardView flashcard={state.currentCard} isFrontVisible={state.isFrontVisible} onFlip={handleFlip} />

          {!state.isFrontVisible && (
            <div className="mt-6 w-full">
              <RatingControls onRate={handleRate} disabled={state.isFrontVisible} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
