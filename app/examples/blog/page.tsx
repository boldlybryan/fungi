// This page is SAFE TO MODIFY in prototypes
// You can change the layout, styling, and content as needed

import Link from 'next/link';

const blogPosts = [
  {
    slug: 'getting-started',
    title: 'Getting Started with Fungi',
    excerpt: 'Learn how to create your first AI-powered prototype in minutes',
    date: '2025-01-15',
    image: '🚀',
  },
  {
    slug: 'best-practices',
    title: 'Best Practices for Prototyping',
    excerpt: 'Tips and tricks for making the most of your prototyping workflow',
    date: '2025-01-10',
    image: '💡',
  },
  {
    slug: 'case-study',
    title: 'Case Study: Building a Landing Page',
    excerpt: 'How one team used Fungi to rapidly iterate on their product landing page',
    date: '2025-01-05',
    image: '📊',
  },
  {
    slug: 'ai-collaboration',
    title: 'Collaborating with AI',
    excerpt: 'Understanding how to effectively communicate with AI assistants',
    date: '2025-01-01',
    image: '🤖',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Fungi
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/examples/blog" className="text-gray-700 hover:text-gray-900">
                Blog
              </Link>
              <Link href="/examples/contact" className="text-gray-700 hover:text-gray-900">
                Contact
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-gray-900">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Blog</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/examples/blog/${post.slug}`}
              className="bg-white rounded-lg border hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="text-6xl mb-4">{post.image}</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {post.title}
                </h2>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <p className="text-sm text-gray-500">{post.date}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

