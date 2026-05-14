import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSignInAlt,
  faUser,
  faHistory,
  faBell,
  faBars,
  faTimes,
  faInfoCircle,
  faEnvelope,
  faHome,
  faCog,
  faSignOutAlt,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import { useUser, useClerk } from '@clerk/clerk-react';
import WebLogo from '../../assets/images/WebLogo.webp';

const clerkAppearance = {
  elements: {
    // Modal card
    card: "bg-gray-900 border border-green-500/20 shadow-2xl shadow-black/60",
    cardBox: "bg-gray-900",

    // Left navbar
    navbar: "bg-gray-950 border-r border-gray-800",
    navbarButton: "text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg",
    navbarButtonActive: "text-green-400 bg-green-500/10 rounded-lg",
    navbarButtonIcon: "text-current",
    navbarMobileMenuRow: "bg-gray-900 border-b border-gray-800",

    // Page header
    headerTitle: "text-white",
    headerSubtitle: "text-gray-400",
    pageScrollBox: "bg-gray-900",

    // Profile section
    profileSectionTitle: "text-white border-b border-gray-800",
    profileSectionTitleText: "text-white",
    profileSectionContent: "text-gray-300",
    profileSectionPrimaryButton: "text-green-400 hover:text-green-300 hover:bg-green-500/10",

    // Form
    formFieldLabel: "text-gray-400",
    formFieldInput: "bg-gray-800 border-gray-700 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500/30 rounded-lg",
    formFieldInputShowPasswordButton: "text-gray-400 hover:text-white",
    formFieldSuccessText: "text-green-400",
    formFieldErrorText: "text-red-400",
    formFieldHintText: "text-gray-500",

    // Buttons
    formButtonPrimary: "bg-green-500 hover:bg-green-600 text-black font-semibold rounded-lg shadow-none",
    formButtonReset: "text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg",
    formResendCodeLink: "text-green-400 hover:text-green-300",

    // Danger / destructive
    formButtonDanger: "bg-transparent text-red-400 hover:bg-red-500/10 border border-red-500/30 hover:border-red-500/60 rounded-lg",

    // Badges
    badge: "bg-green-500/10 text-green-400 border border-green-500/20",
    badgeDanger: "bg-red-500/10 text-red-400 border border-red-500/20",

    // Avatar
    avatarBox: "border-2 border-green-500/40 hover:border-green-500 transition-colors",
    avatarImageActionsUpload: "text-green-400 hover:text-green-300",

    // Dividers & misc
    dividerLine: "bg-gray-800",
    dividerText: "text-gray-600",
    identityPreview: "bg-gray-800 border border-gray-700 rounded-lg",
    identityPreviewText: "text-white",
    identityPreviewEditButton: "text-green-400 hover:text-green-300",

    // OTP / verification
    otpCodeFieldInput: "bg-gray-800 border-gray-700 text-white focus:border-green-500 rounded-lg",
    verificationLinkStatusText: "text-gray-400",

    // Alert
    alertText: "text-gray-300",
    alertIcon: "text-green-400",

    // Avatar colour inside the modal
userPreviewAvatarBox: "border-2 border-green-500/40",
userPreviewAvatarImage: "bg-gradient-to-br from-green-400 to-green-600",
avatarBox: "border-2 border-green-500/40",

// The initials fallback colour (this is what controls the blue)
avatarInitials: "bg-gradient-to-br from-green-400 to-green-600 text-black",

// Clerk branding - try all known keys
footer: "hidden",
footerPages: "hidden",
footerPagesLink: "hidden",
internal_footerPageLink___clerk: "hidden",
clerkBranding: "hidden",
    footerAction: "hidden",
    footerActionLink: "hidden",
    powerButton: "hidden",
  },
  variables: {
    colorPrimary: "#4ade80",
    colorShimmer: "transparent",
    colorBackground: "#111827",
    colorInputBackground: "#1f2937",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "#9ca3af",
    colorTextOnPrimaryBackground: "#000000",
    colorDanger: "#ef4444",
    colorSuccess: "#4ade80",
    colorWarning: "#f59e0b",
    colorNeutral: "#6b7280",
    borderRadius: "0.75rem",
    fontFamily: "inherit",
    fontSize: "0.875rem",
    spacingUnit: "1rem",
  },
};

const Header = () => {
  const { isSignedIn, user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSignOut = () => {
    setUserDropdownOpen(false);
    signOut(() => navigate('/'));
  };

  const handleManageAccount = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    openUserProfile({ appearance: clerkAppearance });
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName  = user.lastName  || '';
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (user.username) return user.username[0].toUpperCase();
    return 'U';
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.username) return user.username;
    return 'User';
  };

  return (
    <>
      <header className="relative z-50 pt-4 sm:pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center" onClick={closeMobileMenu}>
              <img
                src={WebLogo}
                alt="WebSecura Logo"
                className="w-32 sm:w-36 md:w-40 h-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link to="/about"   className="text-gray-300 hover:text-green-400 transition-colors font-medium">About Us</Link>
              <Link to="/contact" className="text-gray-300 hover:text-green-400 transition-colors font-medium">Contact Us</Link>
            </nav>

            {/* Desktop Auth Section */}
            <div className="hidden lg:flex items-center gap-4">
              {isSignedIn ? (
                <>
                  <Link to="/history" className="text-gray-300 hover:text-green-400 transition-colors">
                    <FontAwesomeIcon icon={faHistory} className="mr-2" />History
                  </Link>
                  <Link to="/monitoring" className="text-gray-300 hover:text-green-400 transition-colors">
                    <FontAwesomeIcon icon={faBell} className="mr-2" />Monitoring
                  </Link>

                  {/* Custom User Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-sm">
                        {getUserInitials()}
                      </div>
                      <span className="text-white font-medium text-sm">{getUserDisplayName()}</span>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`text-green-400 text-xs transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {userDropdownOpen && (
<div className="absolute right-0 mt-2 w-64 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl shadow-2xl overflow-hidden ring-1 ring-green-500/20">                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                              {getUserInitials()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-sm truncate">{getUserDisplayName()}</p>
                              <p className="text-gray-400 text-xs truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <button
                            onClick={handleManageAccount}
                            className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors"
                          >
                            <FontAwesomeIcon icon={faCog} className="w-4" />
                            <span className="text-sm font-medium">Manage Account</span>
                          </button>
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <FontAwesomeIcon icon={faSignOutAlt} className="w-4" />
                            <span className="text-sm font-medium">Sign Out</span>
                          </button>
                        </div>

                        
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg font-semibold transition-all"
                >
                  <FontAwesomeIcon icon={faSignInAlt} />
                  <span>Login</span>
                </Link>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-12 h-12 flex items-center justify-center rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50 transition-colors"
              aria-label="Toggle menu"
            >
              <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} className="text-green-400 text-xl" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeMobileMenu} />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-black/95 backdrop-blur-xl border-l border-gray-700 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              {isSignedIn && user ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                    {getUserInitials()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{getUserDisplayName()}</p>
                    <p className="text-gray-400 text-xs truncate max-w-[180px]">{user.primaryEmailAddress?.emailAddress}</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Not signed in</span>
                </div>
              )}
            </div>
            <button onClick={closeMobileMenu} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors">
              <FontAwesomeIcon icon={faTimes} className="text-gray-400 text-xl" />
            </button>
          </div>

          {/* Mobile Nav Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-4 space-y-2">
              <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-green-400 transition-colors">
                <FontAwesomeIcon icon={faHome} className="w-5" /><span className="font-medium">Home</span>
              </Link>
              <Link to="/about" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-green-400 transition-colors">
                <FontAwesomeIcon icon={faInfoCircle} className="w-5" /><span className="font-medium">About Us</span>
              </Link>
              <Link to="/contact" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-green-400 transition-colors">
                <FontAwesomeIcon icon={faEnvelope} className="w-5" /><span className="font-medium">Contact Us</span>
              </Link>

              {isSignedIn && (
                <>
                  <div className="h-px bg-gray-800 my-2" />
                  <Link to="/history" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-green-400 transition-colors">
                    <FontAwesomeIcon icon={faHistory} className="w-5" /><span className="font-medium">History</span>
                  </Link>
                  <Link to="/monitoring" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-green-400 transition-colors">
                    <FontAwesomeIcon icon={faBell} className="w-5" /><span className="font-medium">Monitoring</span>
                  </Link>
                  <button
                    onClick={handleManageAccount}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-green-400 transition-colors"
                  >
                    <FontAwesomeIcon icon={faCog} className="w-5" /><span className="font-medium">Manage Account</span>
                  </button>
                  <div className="h-px bg-gray-800 my-2" />
                  <button
                    onClick={() => { closeMobileMenu(); handleSignOut(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="w-5" /><span className="font-medium">Sign Out</span>
                  </button>
                </>
              )}
            </div>
          </nav>

          {/* Mobile Footer */}
          {!isSignedIn && (
            <div className="p-4 border-t border-gray-800">
              <Link
                to="/auth"
                onClick={closeMobileMenu}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg font-semibold transition-all"
              >
                <FontAwesomeIcon icon={faSignInAlt} /><span>Login / Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;