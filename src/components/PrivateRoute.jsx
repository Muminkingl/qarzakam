import { useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
};

export default PrivateRoute; 