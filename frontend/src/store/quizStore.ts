import { create } from 'zustand';
import axios from 'axios';
import type { Question, TourRecommendation, QuizState } from '../types';

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Как вы предпочитаете проводить свободное время?",
    options: [
      "Активно: спорт, походы, приключения",
      "Спокойно: чтение, медитация, отдых дома",
      "Познавательно: музеи, выставки, экскурсии",
      "Социально: встречи с друзьями, вечеринки"
    ]
  },
  {
    id: 2,
    text: "Какой темп отдыха вам ближе?",
    options: [
      "Быстрый: много мест за короткое время",
      "Медленный: расслабление в одном месте",
      "Умеренный: баланс активности и отдыха",
      "Спонтанный: без плана, как пойдет"
    ]
  },
  {
    id: 3,
    text: "Что для вас идеальный день в отпуске?",
    options: [
      "Экстрим: прыжки с парашютом, рафтинг",
      "Релакс: спа, массаж, пляж",
      "Культура: осмотр достопримечательностей",
      "Гастрономия: дегустация местной кухни"
    ]
  },
  {
    id: 4,
    text: "Какой бюджет вы готовы выделить на путешествие?",
    options: [
      "Эконом: минимальные расходы",
      "Средний: комфорт без излишеств",
      "Премиум: максимальный комфорт и сервис",
      "Не имеет значения: главное впечатления"
    ]
  },
  {
    id: 5,
    text: "Какую компанию вы предпочитаете в путешествии?",
    options: [
      "Один: самостоятельное путешествие",
      "Пара: романтическая поездка",
      "Друзья: веселая компания",
      "Семья: отдых с детьми или родителями"
    ]
  },
  {
    id: 6,
    text: "Что вас больше привлекает в природе?",
    options: [
      "Горы: вершины, трекинг, альпинизм",
      "Море: пляж, дайвинг, яхтинг",
      "Лес: тишина, грибы, ягоды",
      "Город: архитектура, шум, огни"
    ]
  }
];

interface QuizStore extends QuizState {
  questions: Question[];
  setCurrentStep: (step: number) => void;
  setAnswer: (questionId: number, answer: string) => void;
  submitAnswers: () => Promise<void>;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  currentStep: 0,
  answers: {},
  isComplete: false,
  isLoading: false,
  recommendation: null,
  error: null,
  questions: QUESTIONS,

  setCurrentStep: (step) => set({ currentStep: step }),

  setAnswer: (questionId, answer) => 
    set((state) => ({ 
      answers: { ...state.answers, [questionId]: answer } 
    })),

  submitAnswers: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { answers } = get();
      const answersText = Object.entries(answers)
        .map(([id, answer]) => `Вопрос ${id}: ${answer}`)
        .join('\n');

      const response = await axios.post('/api/analyze', {
        answers: answersText
      });

      set({ 
        recommendation: response.data, 
        isComplete: true, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: 'Ошибка при анализе ответов. Попробуйте снова.', 
        isLoading: false 
      });
      console.error('API Error:', error);
    }
  },

  resetQuiz: () => set({
    currentStep: 0,
    answers: {},
    isComplete: false,
    isLoading: false,
    recommendation: null,
    error: null
  })
}));
