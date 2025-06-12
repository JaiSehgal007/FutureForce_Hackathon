import { createBrowserRouter } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Home from '../pages/Home';
import ChatbotPage from '../pages/ChatbotPage';
import Employee from '../pages/Employee';
import Admin from '../pages/Admin';
import Profile from '../pages/Profile';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/home',
    element: <Home />
  },
  {
    path: '/chatbot',
    element: <ChatbotPage />
  },
  {
    path : '/employee',
    element : <Employee />
  },
  {
    path : '/admin',
    element : <Admin />
  },
  {
    path: '/profile',
    element: <Profile />
  }
]);

export default router; 