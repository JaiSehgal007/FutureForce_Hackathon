import { createBrowserRouter } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Home from '../pages/Home';
import ChatbotPage from '../pages/ChatbotPage';
import Employee from '../pages/Employee';
import Admin from '../pages/Admin';
import Profile from '../pages/Profile';
import Fraud from '../pages/fraud';
import AdminTransactions from '../pages/AdminTransactions'

const router = createBrowserRouter([
  
  {
    path: '/',
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
  },
  {
    path: '/fraud',
    element: <Fraud />
  },
  {
    path : '/admin/transactions',
    element : <AdminTransactions />
  }
]);

export default router; 