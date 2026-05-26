import { z } from "zod";

export const PostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  content: z.string().min(10),
  excerpt: z.string().max(500).optional(),
  cover_image: z.string().url().or(z.literal("")).optional(),
  published: z.boolean().optional(),
  language: z.string().optional(),
  category_ids: z.array(z.number().int().positive()).optional(),
  tag_ids: z.array(z.number().int().positive()).optional(),
  seo_title: z.string().max(80).optional(),
  seo_description: z.string().max(300).optional(),
});

export const CommentSchema = z.object({
  post_id: z.number().int().positive(),
  author_name: z.string().min(1).max(50),
  author_email: z.string().email(),
  content: z.string().min(1).max(2000),
});

export const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(50),
});
