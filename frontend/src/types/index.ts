export interface Question {
  id: number;
  text: string;
  options: string[];
}

export interface TourRecommendation {
  tour_type: string;
  description: string;
  destination_example: string;
}

export interface QuizState {
  currentStep: number;
  answers: Record<number, string>;
  isComplete: boolean;
  isLoading: boolean;
  recommendation: TourRecommendation | null;
  error: string | null;
}
