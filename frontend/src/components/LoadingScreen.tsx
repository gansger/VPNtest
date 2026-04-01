import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="relative mb-8">
        <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
      </div>
      
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
        Анализируем ваши ответы...
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 max-w-xs">
        Наш AI-помощник подбирает идеальный тур специально для вас
      </p>
      
      <div className="mt-8 flex space-x-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};
