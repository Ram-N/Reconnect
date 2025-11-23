import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { RecordPage } from './pages/Record';
import { LoginPage } from './pages/Login';
import { ContactsPage } from './pages/Contacts';
import { HomePage } from './pages/Home';
import { ContactDetailPage } from './pages/ContactDetail';
import { FollowUpsPage } from './pages/FollowUps';
import { Home, Mic, CheckSquare, Phone } from 'lucide-react';

function NavBar() {
  const location = useLocation();
  if (location.pathname === '/login') return null;

  const getLinkClass = (path: string) =>
    `flex flex-col items-center text-xs ${location.pathname === path ? 'text-blue-600' : 'text-gray-400'}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-4 pb-6 z-50">
      <Link to="/" className={getLinkClass('/')}>
        <Home className="w-6 h-6 mb-1" />
        Home
      </Link>
      <Link to="/record" className={getLinkClass('/record')}>
        <Mic className="w-6 h-6 mb-1" />
        Record
      </Link>
      <Link to="/follow-ups" className={getLinkClass('/follow-ups')}>
        <CheckSquare className="w-6 h-6 mb-1" />
        Follow-ups
      </Link>
      <Link to="/contacts" className={getLinkClass('/contacts')}>
        <Phone className="w-6 h-6 mb-1" />
        Contacts
      </Link>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/record" element={<RecordPage />} />
          <Route path="/record/:contactId" element={<RecordPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/follow-ups" element={<FollowUpsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/:contactId" element={<ContactDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <NavBar />
      </div>
    </BrowserRouter>
  );
}

export default App;
