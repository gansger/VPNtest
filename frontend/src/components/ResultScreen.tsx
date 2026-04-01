import React from 'react';
import { useQuizStore } from '../store/quizStore';
import WebApp from '@twa-dev/sdk';

export const ResultScreen: React.FC = () => {
  const { recommendation, resetQuiz } = useQuizStore();

  const handleBook = () => {
    // Отправка данных в Telegram
    if (recommendation) {
      WebApp.sendData(JSON.stringify({
        action: 'book_tour',
        tourType: recommendation.tour_type,
        destination: recommendation.destination_example
      }));
    }
  };

  const handleShare = () => {
    if (recommendation) {
      const text = `Мой идеальный тур: ${recommendation.tour_type}!\n${recommendation.description}\nРекомендуемое направление: ${recommendation.destination_example}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Мой идеальный тур',
          text: text,
        });
      } else {
        navigator.clipboard.writeText(text);
        alert('Результат скопирован в буфер обмена!');
      }
    }
  };

  const handleRestart = () => {
    resetQuiz();
  };

  if (!recommendation) return null;

  const getTourIcon = (tourType: string) => {
    const icons: Record<string, JSX.Element> = {
      'Экстрим-тур': (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      'Релакс & СПА': (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      'Культурно-исторический': (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
      'Гастрономический': (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      'Природа & Эко': (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      'Тусовочный': (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      )
    };
    return icons[tourType] || icons['Природа & Эко'];
  };

  return (
    <div className="flex flex-col min-h-[60vh] px-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white mb-4">
          {getTourIcon(recommendation.tour_type)}
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Ваш идеальный тур
        </h2>
        <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
          {recommendation.tour_type}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
          Рекомендация AI:
        </h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {recommendation.description}
        </p>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-sm">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-600 dark:text-gray-300">
              Рекомендуемое направление: <strong className="text-gray-800 dark:text-gray-100">{recommendation.destination_example}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <button
          onClick={handleBook}
          className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          Забронировать тур
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
          >
            Поделиться
          </button>
          
          <button
            onClick={handleRestart}
            className="flex-1 py-3 px-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Пройти заново
          </button>
        </div>
      </div>
    </div>
  );
};
