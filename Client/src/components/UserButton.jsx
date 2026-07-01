import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { Link, useNavigate } from 'react-router-dom';

const UserButton = ({ appearance = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) return null;

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.name) {
      return user.name;
    }
    return user.email;
  };

  const avatarBoxClasses = appearance?.elements?.avatarBox || 'w-8 h-8 ring-2 ring-gray-200 hover:ring-gray-300 transition-all';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${avatarBoxClasses} rounded-full bg-black text-white font-semibold flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        {user.imageUrl ? (
          <img 
            src={user.imageUrl} 
            alt={getUserDisplayName()} 
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-sm">
            {getInitials(getUserDisplayName())}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 backdrop-blur-sm z-50 ${appearance?.elements?.userButtonPopoverCard || ''}`}>
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-black text-white font-semibold flex items-center justify-center">
                {user.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt={getUserDisplayName()} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm">
                    {getInitials(getUserDisplayName())}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-2">
            <Link
              to="/profile"
              className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center ${appearance?.elements?.userButtonPopoverActionButton || ''}`}
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Manage account
            </Link>
            
            <button
              onClick={() => {
                signOut(navigate);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center ${appearance?.elements?.userButtonPopoverActionButton || ''}`}
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserButton;
