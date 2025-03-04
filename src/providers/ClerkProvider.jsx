import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';

const ClerkProvider = ({ children }) => {
  // Replace with your actual Clerk publishable key
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("Missing Clerk Publishable Key");
  }

  return (
    <BaseClerkProvider publishableKey={publishableKey}>
      {children}
    </BaseClerkProvider>
  );
};

export default ClerkProvider; 