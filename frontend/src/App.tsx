import { useQuizStore } from './store/quizStore';
import { useTelegramTheme } from './hooks/useTelegramTheme';
import { QuizScreen } from './components/QuizScreen';
import { ResultScreen } from './components/ResultScreen';
import { LoadingScreen } from './components/LoadingScreen';

function App() {
  const { isComplete, isLoading } = useQuizStore();
  const { isDark } = useTelegramTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''} bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {isLoading ? (
          <LoadingScreen />
        ) : isComplete ? (
          <ResultScreen />
        ) : (
          <QuizScreen />
        )}
      </div>
    </div>
  );
}

export default App;
