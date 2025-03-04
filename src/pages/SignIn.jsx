import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-s1">
      <div className="max-w-md w-full p-6">
        <ClerkSignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'g4 text-white hover:opacity-80',
              card: 'bg-s2 border-2 border-s4/25',
              headerTitle: 'text-p4',
              headerSubtitle: 'text-p5',
              socialButtonsBlockButton: 'border-s4/25 text-p4',
              formFieldLabel: 'text-p4',
              formFieldInput: 'bg-s1 border-s4/25 text-p4',
              footerActionLink: 'text-p3 hover:text-p1',
            },
          }}
          routing="path"
          path="/sign-in"
          afterSignInUrl="/dashboard"
          redirectUrl="/dashboard"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
};

export default SignIn; 