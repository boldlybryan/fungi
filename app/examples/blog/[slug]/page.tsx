// This page is SAFE TO MODIFY in prototypes

import Link from 'next/link';

const blogPostsData: Record<string, any> = {
  'getting-started': {
    title: 'Getting Started with Fungi',
    date: '2025-01-15',
    author: 'Fungi Team',
    image: '🚀',
    content: `
      <h2>Welcome to Fungi</h2>
      <p>Fungi is a revolutionary platform that enables non-technical users to create working prototypes using natural language. This guide will help you get started.</p>
      
      <h3>Step 1: Sign Up</h3>
      <p>Create your free account in seconds. No credit card required.</p>
      
      <h3>Step 2: Describe Your Idea</h3>
      <p>Simply describe what you want to build in plain English. For example:</p>
      <ul>
        <li>"Add a contact form to the landing page"</li>
        <li>"Create a blog with grid layout"</li>
        <li>"Add a dark mode toggle"</li>
      </ul>
      
      <h3>Step 3: Iterate with AI</h3>
      <p>Chat with our AI assistant to refine your prototype. Make changes, try new ideas, and see results instantly.</p>
      
      <h3>Step 4: Submit for Review</h3>
      <p>When you're happy with your prototype, submit it as a Pull Request for your team to review.</p>
    `,
  },
  'best-practices': {
    title: 'Best Practices for Prototyping',
    date: '2025-01-10',
    author: 'Fungi Team',
    image: '💡',
    content: `
      <h2>Maximize Your Prototyping Success</h2>
      <p>Here are some best practices we've learned from thousands of successful prototypes.</p>
      
      <h3>Be Specific</h3>
      <p>The more specific you are in your descriptions, the better results you'll get. Instead of "make it better", try "add more spacing between sections and use a softer color scheme".</p>
      
      <h3>Iterate Incrementally</h3>
      <p>Make small changes one at a time rather than requesting everything at once. This makes it easier to track what works and what doesn't.</p>
      
      <h3>Use Visual References</h3>
      <p>If you have examples of what you want, describe them in detail. "Like the hero section on Apple.com" is more helpful than "make it look modern".</p>
    `,
  },
  'case-study': {
    title: 'Case Study: Building a Landing Page',
    date: '2025-01-05',
    author: 'Guest Author',
    image: '📊',
    content: `
      <h2>From Idea to Launch in 24 Hours</h2>
      <p>This is the story of how one startup used Fungi to rapidly prototype and launch their product landing page.</p>
      
      <h3>The Challenge</h3>
      <p>The team needed to validate their product idea quickly with a professional landing page, but they didn't have a designer or frontend developer available.</p>
      
      <h3>The Solution</h3>
      <p>Using Fungi, they described their vision: "A modern SaaS landing page with a hero section, feature cards, pricing table, and contact form."</p>
      
      <h3>The Results</h3>
      <p>Within hours, they had a working prototype. After a few iterations with the AI assistant, they had exactly what they needed and were able to launch the same day.</p>
    `,
  },
  'ai-collaboration': {
    title: 'Collaborating with AI',
    date: '2025-01-01',
    author: 'Fungi Team',
    image: '🤖',
    content: `
      <h2>Working Effectively with AI Assistants</h2>
      <p>Understanding how to communicate with AI can dramatically improve your results.</p>
      
      <h3>Think in Steps</h3>
      <p>Break down complex changes into smaller steps. This helps the AI understand exactly what you want.</p>
      
      <h3>Provide Context</h3>
      <p>Explain why you want something changed. This helps the AI make better decisions about implementation details.</p>
      
      <h3>Give Feedback</h3>
      <p>If something isn't quite right, explain what you'd like to be different. The AI learns from your feedback.</p>
    `,
  },
};

export default function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = blogPostsData[params.slug];

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <Link href="/examples/blog" className="text-blue-600 hover:underline">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

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
            </div>
          </div>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/examples/blog" className="text-blue-600 hover:underline mb-8 inline-block">
          ← Back to Blog
        </Link>
        
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{post.image}</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            <div className="text-gray-600">
              <span>{post.author}</span>
              <span className="mx-2">•</span>
              <span>{post.date}</span>
            </div>
          </div>
          
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>
    </div>
  );
}

