import { SignIn } from "@clerk/clerk-react";

const AuthModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-w-md w-full mx-4 animate-fadeIn">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'g4 text-white hover:opacity-80',
              card: 'bg-s2 border-2 border-s4/25 shadow-2xl',
              headerTitle: 'text-p4',
              headerSubtitle: 'text-p5',
              socialButtonsBlockButton: 'border-s4/25 text-p4',
              formFieldLabel: 'text-p4',
              formFieldInput: 'bg-s1 border-s4/25 text-p4',
              footerActionLink: 'text-p3 hover:text-p1',
              rootBox: 'shadow-xl',
            },
          }}
          routing="virtual"
          afterSignInUrl="/dashboard"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
};

export default AuthModal; 