-- 管理员密码: Admin123 (PBKDF2-SHA256, 100000 iterations)
INSERT INTO users (email, password_hash, name, role)
VALUES ('admin@noanblog.com', '$pbkdf2$100000$GQCMLb7dN5iLhGS2CVq6Sw==$R31Dexnxx/GwlBLZLTmW2OFy88ChFRKGe0hBYq5PnNA=', 'Admin', 'admin');

INSERT INTO categories (name, slug) VALUES
  ('Technology',   'technology'),
  ('Tutorial',     'tutorial'),
  ('News',         'news');

INSERT INTO tags (name, slug) VALUES
  ('JavaScript',   'javascript'),
  ('Next.js',      'nextjs'),
  ('Database',     'database'),
  ('Serverless',   'serverless'),
  ('Edge Computing', 'edge-computing');

INSERT INTO posts (title, slug, content, excerpt, cover_image, published, author_id)
VALUES (
  'Getting Started with Turso and libSQL',
  'getting-started-with-turso-and-libsql',
  'Turso is a SQLite-compatible database designed for the edge. It uses libSQL, an open-source fork of SQLite, to provide modern features like replication, branching, and serverless access via HTTP.\n\n## Why Turso?\n\n- **Edge-ready**: Deploy databases close to your users\n- **SQLite-compatible**: Familiar syntax, low overhead\n- **Branching**: Instant database branches for development\n- **Serverless**: Connect via HTTP without managing connections\n\n## Getting Started\n\nTo create a Turso database, use the CLI:\n\n```bash\nturso db create my-blog\nturso db shell my-blog\n```\n\nThen you can run standard SQL to create tables and insert data.',
  'A beginner-friendly guide to setting up and using Turso with libSQL for modern edge applications.',
  '/images/turso-intro.jpg',
  1,
  1
);

INSERT INTO posts (title, slug, content, excerpt, cover_image, published, author_id)
VALUES (
  'Building a Blog with Next.js App Router',
  'building-a-blog-with-nextjs-app-router',
  'Next.js 16 introduces the App Router as the default routing paradigm. It provides a powerful file-system based router with support for layouts, loading states, and error boundaries.\n\n## Key Features\n\n- **Layouts**: Share UI across pages with nested layouts\n- **Server Components**: Render on the server by default\n- **Streaming**: Progressive rendering for faster page loads\n- **Route Handlers**: Build API endpoints in the same project\n\n## Project Structure\n\n```\n/app\n  layout.tsx    # Root layout\n  page.tsx      # Home page\n  /posts\n    page.tsx    # Posts list\n    /[slug]\n      page.tsx  # Single post\n/lib\n  db.ts         # Database client\n```\n\nCombined with Turso for storage, this stack is perfect for a high-performance blog.',
  'How to structure a modern blog using Next.js App Router patterns.',
  '/images/nextjs-blog.jpg',
  1,
  1
);

INSERT INTO post_categories (post_id, category_id) VALUES
  ((SELECT id FROM posts WHERE slug = 'getting-started-with-turso-and-libsql'), (SELECT id FROM categories WHERE slug = 'technology')),
  ((SELECT id FROM posts WHERE slug = 'getting-started-with-turso-and-libsql'), (SELECT id FROM categories WHERE slug = 'tutorial')),
  ((SELECT id FROM posts WHERE slug = 'building-a-blog-with-nextjs-app-router'), (SELECT id FROM categories WHERE slug = 'tutorial'));

INSERT INTO post_tags (post_id, tag_id) VALUES
  ((SELECT id FROM posts WHERE slug = 'getting-started-with-turso-and-libsql'), (SELECT id FROM tags WHERE slug = 'database')),
  ((SELECT id FROM posts WHERE slug = 'getting-started-with-turso-and-libsql'), (SELECT id FROM tags WHERE slug = 'serverless')),
  ((SELECT id FROM posts WHERE slug = 'getting-started-with-turso-and-libsql'), (SELECT id FROM tags WHERE slug = 'edge-computing')),
  ((SELECT id FROM posts WHERE slug = 'building-a-blog-with-nextjs-app-router'), (SELECT id FROM tags WHERE slug = 'nextjs')),
  ((SELECT id FROM posts WHERE slug = 'building-a-blog-with-nextjs-app-router'), (SELECT id FROM tags WHERE slug = 'javascript'));
