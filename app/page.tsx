import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Fungi
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Build Prototypes with AI
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Describe your idea, iterate with AI, and submit for review. No code required.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/signup"
                className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg text-lg font-semibold"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg text-lg font-semibold"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Natural Language Prototyping</h3>
              <p className="text-gray-600">Describe changes in plain English</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Previews</h3>
              <p className="text-gray-600">See your changes live in seconds</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Isolated Environments</h3>
              <p className="text-gray-600">Each prototype has its own database and deployment</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Reviews</h3>
              <p className="text-gray-600">Submit as Pull Requests for team review</p>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mt-24">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="space-y-8 max-w-3xl mx-auto">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Sign up and create prototype</h3>
                  <p className="text-gray-600">
                    Create an account and describe what you want to build in plain language
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Chat with AI to build your idea</h3>
                  <p className="text-gray-600">
                    Iterate on your prototype by chatting with AI - no code needed
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Preview changes in real-time</h3>
                  <p className="text-gray-600">
                    See your prototype come to life with instant deployments
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Submit for review</h3>
                  <p className="text-gray-600">
                    When ready, submit your prototype as a Pull Request for team review
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24 bg-blue-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to start prototyping?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join and start building your ideas with AI today
            </p>
            <Link
              href="/signup"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-semibold inline-block"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2025 Fungi. A proof-of-concept prototype builder.
          </p>
        </div>
      </footer>
    </div>
  );
}

