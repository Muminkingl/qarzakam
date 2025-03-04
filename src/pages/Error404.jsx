import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../constants/LanguageContext';

const Error404 = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white px-6">
      <div className="text-center animate-fade-in">
        <h1 className="text-9xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500 drop-shadow-lg">
          404
        </h1>
        <h2 className="text-3xl font-bold mt-4">{t('error.pageNotFound')}</h2>
        <p className="text-lg text-gray-400 mt-2 max-w-md mx-auto">{t('error.description')}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 text-lg font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-300 shadow-lg"
          >
            {t('error.goBack')}
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 text-lg font-semibold rounded-lg bg-gradient-to-r from-red-500 to-orange-500 
              hover:from-orange-500 hover:to-red-500 transition-all duration-300 shadow-lg text-white"
          >
            {t('error.goHome')}
          </button>
        </div>

        {/* Floating animation effect */}
        <div className="absolute bottom-10 w-32 h-32 bg-red-500 opacity-20 blur-2xl rounded-full animate-float"></div>
        <div className="absolute top-10 right-10 w-24 h-24 bg-orange-500 opacity-20 blur-2xl rounded-full animate-float delay-500"></div>
      </div>
    </div>
  );
};

export default Error404;
