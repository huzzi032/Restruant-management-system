import { Navigate } from 'react-router-dom';

/** @deprecated Use `/signin` — kept for bookmarks and external links */
export default function Login() {
  return <Navigate to="/signin" replace />;
}
