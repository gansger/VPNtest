import React from 'react';
import { useQuizStore } from '../store/quizStore';

export const QuizScreen: React.FC = () => {
  const { 
    questions, 
    currentStep, 
    answers, 
    setCurrentStep, 
    setAnswer,
    submitAnswers 
  } = useQuizStore();

  const question = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleOptionSelect = (option: string) => {
    setAnswer(question.id, option);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitAnswers();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isCurrentQuestionAnswered = !!answers[question.id];

  return (
    <div className="flex flex-col min-h-[60vh] px-4">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>Вопрос {currentStep + 1} из {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
          {question.text}
        </h2>

        <div className="space-y-3 mb-8">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(option)}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                answers[question.id] === option
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  answers[question.id] === option
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {answers[question.id] === option && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-700 dark:text-gray-200">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-auto flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 px-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Назад
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={!isCurrentQuestionAnswered}
            className={`flex-1 py-3 px-4 font-medium rounded-xl transition-all duration-200 ${
              isCurrentQuestionAnswered
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {currentStep === questions.length - 1 ? 'Получить результат' : 'Далее'}
          </button>
        </div>
      </div>
    </div>
  );
};
