import { useState } from "react";
import { Stethoscope, Users, Calendar, FileText, Shield } from "lucide-react";
import { supabase } from "@/react-app/lib/supabaseClient";

export default function AuthPage() {
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/dashboard';
      } else {
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        if (data.session) {
          window.location.href = '/dashboard';
        } else {
          setMessage('Check your email to confirm your account, then sign in.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
      setErrorCode(err?.code || err?.status || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">MediFlow</span>
            </div>
            <div className="hidden md:block text-sm text-gray-500">Secure multi-clinic platform</div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: marketing */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Manage your clinic with confidence
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                MediFlow centralizes patients, appointments, consultations, and billing. Multi-clinic isolation keeps every record private and secure.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="font-medium text-gray-900">Patient management</p>
                  <p className="text-sm text-gray-600 mt-1">Demographics, history, records</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="font-medium text-gray-900">Appointments</p>
                  <p className="text-sm text-gray-600 mt-1">Schedule and track visits</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="font-medium text-gray-900">Consultations</p>
                  <p className="text-sm text-gray-600 mt-1">Visits and prescriptions</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="font-medium text-gray-900">Clinic isolation</p>
                  <p className="text-sm text-gray-600 mt-1">Role-based access and RLS</p>
                </div>
              </div>
            </div>

            {/* Right: auth card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 lg:p-10">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Welcome to</p>
                  <p className="text-xl font-semibold text-gray-900">MediFlow</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">
                  {error}
                  {errorCode === 'email_not_confirmed' && (
                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={async () => { await supabase.auth.resend({ type: 'signup', email }); setMessage('Confirmation email resent. Check your inbox.'); }}
                        className="text-blue-700 hover:underline"
                      >
                        Resend confirmation email
                      </button>
                      <button
                        type="button"
                        onClick={async () => { await supabase.auth.signInWithOtp({ email }); setMessage('Magic link sent. Check your email.'); }}
                        className="text-blue-700 hover:underline"
                      >
                        Send magic link
                      </button>
                    </div>
                  )}
                </div>
              )}
              {message && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg">{message}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Jane Doe"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') : (mode === 'signin' ? 'Sign in' : 'Create account')}
                </button>
              </form>

              <div className="mt-4 text-sm text-gray-600">
                {mode === 'signin' ? (
                  <span>
                    Don&apos;t have an account?{' '}
                    <button onClick={() => setMode('signup')} className="text-blue-600 hover:underline">Create one</button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button onClick={() => setMode('signin')} className="text-blue-600 hover:underline">Sign in</button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white/80 backdrop-blur-sm border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-600">
          © {new Date().getFullYear()} MediFlow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
