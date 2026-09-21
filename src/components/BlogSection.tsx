import { BookOpen } from 'lucide-react';
import { blogPosts } from '../data/blogPosts';

export default function BlogSection() {
  return (
    <section className="border-t border-white/5">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Section Header */}
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">
              Blog
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1">
            Guides & Tutorials
          </h2>
          <p className="text-gray-500 text-xs">
            Learn how to get the most out of your PDFs.
          </p>
        </div>

        {/* Articles */}
        <div className="space-y-12">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              id={post.slug}
              className="scroll-mt-20"
            >
              {/* Article Header */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-red-400 tracking-wider uppercase">
                    {post.category}
                  </span>
                  <span className="text-[10px] text-gray-600">•</span>
                  <span className="text-[10px] text-gray-500">{post.readTime}</span>
                  <span className="text-[10px] text-gray-600">•</span>
                  <span className="text-[10px] text-gray-500">{post.date}</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight mb-3">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              {/* Article Content */}
              <div
                className="
                  text-sm leading-relaxed
                  [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-3
                  [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-2
                  [&_p]:text-gray-400 [&_p]:leading-relaxed [&_p]:mb-3
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:text-gray-400 [&_ul]:mb-3
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:text-gray-400 [&_ol]:mb-3
                  [&_li]:leading-relaxed
                  [&_strong]:text-white [&_strong]:font-semibold
                  [&_a]:text-red-400 [&_a]:underline
                "
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Divider */}
              <div className="mt-10 border-b border-white/5" />
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}