import React, { useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faLock,
  faUser,
  faSpinner,
  faExclamationCircle,
  faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', firstName: '', lastName: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: loginData.email,
        password: loginData.password,
      });

      if (result.status === 'complete') {
        await setActiveSignIn({ session: result.createdSessionId });
        navigate('/');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signUp.create({
        emailAddress: signupData.email,
        password: signupData.password,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      if (result.status === 'complete') {
        await setActiveSignUp({ session: result.createdSessionId });
        navigate('/');
      } else {
        setError('Please check your email to verify your account');
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (strategy) => {
    try {
      await signIn.authenticateWithRedirect({
        strategy: strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/'
      });
    } catch (err) {
      setError('OAuth login failed. Please try again.');
    }
  };

  return (
    <main className="relative z-10 flex items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-md">
        
        {/* Auth Container */}
        <div 
          className="relative rounded-2xl border border-green-500/30 shadow-2xl p-8 overflow-hidden"
          style={{ 
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Green Glow Beam at Top */}
          <div 
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"
            style={{ boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)' }}
          ></div>
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mb-3">
              <FontAwesomeIcon icon={faShieldAlt} className="text-4xl logo-shield" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              <span className="logo-shield">{isLogin ? 'Welcome Back' : 'Join WebSecura'}</span>
            </h1>
            <p className="text-gray-400 text-sm">
              {isLogin ? 'Sign in to access your security dashboard' : 'Create your account to get started'}
            </p>
            {/* Green divider */}
            <div className="mt-3 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <FontAwesomeIcon icon={faExclamationCircle} />
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-xs" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all text-sm"
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(107, 114, 128, 0.5)',
                    backdropFilter: 'blur(4px)'
                  }}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  <FontAwesomeIcon icon={faLock} className="mr-2 text-xs" />
                  Password
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all text-sm"
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(107, 114, 128, 0.5)',
                    backdropFilter: 'blur(4px)'
                  }}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSignup} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <FontAwesomeIcon icon={faUser} className="mr-2 text-xs" />
                    First Name
                  </label>
                  <input
                    type="text"
                    value={signupData.firstName}
                    onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all text-sm"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(107, 114, 128, 0.5)',
                      backdropFilter: 'blur(4px)'
                    }}
                    placeholder="John"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={signupData.lastName}
                    onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all text-sm"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(107, 114, 128, 0.5)',
                      backdropFilter: 'blur(4px)'
                    }}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-xs" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all text-sm"
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(107, 114, 128, 0.5)',
                    backdropFilter: 'blur(4px)'
                  }}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  <FontAwesomeIcon icon={faLock} className="mr-2 text-xs" />
                  Password
                </label>
                <input
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all text-sm"
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(107, 114, 128, 0.5)',
                    backdropFilter: 'blur(4px)'
                  }}
                  placeholder="Create a password"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 text-gray-400" style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => handleOAuth('oauth_google')}
              className="w-full py-2.5 px-4 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 hover:brightness-110 text-sm"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(107, 114, 128, 0.5)',
                backdropFilter: 'blur(4px)'
              }}
            >
              <FontAwesomeIcon icon={faGoogle} />
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('oauth_github')}
              className="w-full py-2.5 px-4 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 hover:brightness-110 text-sm"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(107, 114, 128, 0.5)',
                backdropFilter: 'blur(4px)'
              }}
            >
              <FontAwesomeIcon icon={faGithub} />
              Continue with GitHub
            </button>
          </div>

          {/* Toggle Auth Mode */}
          <div className="mt-5 text-center">
            <p className="text-gray-400 text-sm">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              {' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-green-400 hover:text-green-300 font-semibold transition-colors"
              >
                {isLogin ? 'Create Account' : 'Sign In'}
              </button>
            </p>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-4">
          By signing in, you agree to our{' '}
          <a href="/terms" className="text-green-400 hover:text-green-300">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="text-green-400 hover:text-green-300">Privacy Policy</a>
        </p>
      </div>
    </main>
  );
};

export default Auth;