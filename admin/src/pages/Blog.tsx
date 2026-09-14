import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../stores/auth';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/error';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import {
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  Upload,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
} from 'lucide-react';
import { toast } from 'sonner';

interface BlogPostAdminResponse {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  contentHtml: string;
  authorName: string;
  category: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ImageUploadResponse {
  fileUrl: string;
  thumbnailUrl: string;
}

interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
}

export default function Blog() {
  const { user, token } = useAuth();

  useEffect(() => {
    document.title = 'Journal & Blog CMS | Haus of Hafsah Admin';
  }, []);
  
  // View State: list or edit
  const [editingPost, setEditingPost] = useState<BlogPostAdminResponse | null>(null);
  
  // List States
  const [posts, setPosts] = useState<BlogPostAdminResponse[]>([]);
  const [loadingList, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deletingPost, setDeletingPost] = useState<BlogPostAdminResponse | null>(null);
  
  // Editor States
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [category, setCategory] = useState('');
  
  // Loading flags
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingContent, setUploadingContent] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  
  const coverInputRef = useRef<HTMLInputElement>(null);
  const contentImageInputRef = useRef<HTMLInputElement>(null);

  // Initialize Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-accent underline cursor-pointer',
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded border border-border my-4 mx-auto block',
        },
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setContentHtml(editor.getHTML());
    },
  });

  // Sync contentHtml changes to editor when editingPost changes
  useEffect(() => {
    if (editor && editingPost && contentHtml !== editor.getHTML()) {
      editor.commands.setContent(contentHtml || '<p></p>');
    }
  }, [editingPost, editor]);

  // Fetch posts for list
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get<PaginatedResponse<BlogPostAdminResponse>>(
        `/admin/blog?page=${page}&size=10`
      );
      setPosts(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load blog posts'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!editingPost) {
      fetchPosts();
    }
  }, [editingPost, page]);

  // Handle post creation (creates raw draft and routes to editor)
  const handleCreateDraft = async () => {
    try {
      setSaving(true);
      const newDraft = await api.post<BlogPostAdminResponse>('/admin/blog', {
        title: 'Untitled Draft',
        contentHtml: '<p></p>',
        excerpt: '',
        authorName: user?.fullName || 'Hafsah',
        category: 'Style Guide',
        coverImageUrl: '',
      });
      
      setEditingPost(newDraft);
      setTitle(newDraft.title);
      setExcerpt(newDraft.excerpt || '');
      setCoverImageUrl(newDraft.coverImageUrl || '');
      setContentHtml(newDraft.contentHtml || '');
      setAuthorName(newDraft.authorName || user?.fullName || 'Hafsah');
      setCategory(newDraft.category || 'Style Guide');
      
      toast.success('New draft initialized!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create new blog draft'));
    } finally {
      setSaving(false);
    }
  };

  // Switch to editor for existing post
  const handleStartEdit = (post: BlogPostAdminResponse) => {
    setEditingPost(post);
    setTitle(post.title);
    setExcerpt(post.excerpt || '');
    setCoverImageUrl(post.coverImageUrl || '');
    setContentHtml(post.contentHtml || '');
    setAuthorName(post.authorName || user?.fullName || 'Hafsah');
    setCategory(post.category || 'Style Guide');
  };

  // Perform save request
  const handleSave = async (silent = false) => {
    if (!editingPost) return null;
    if (!title.trim() || title === 'Untitled Draft') {
      toast.error('Please enter a descriptive post title.');
      return null;
    }

    try {
      setSaving(true);
      const updated = await api.put<BlogPostAdminResponse>(`/admin/blog/${editingPost.id}`, {
        title,
        excerpt,
        coverImageUrl,
        contentHtml,
        authorName,
        category,
      });
      setEditingPost(updated);
      if (!silent) {
        toast.success(updated.isPublished ? 'Changes saved and published live!' : 'Draft saved successfully!');
      }
      return updated;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save post'));
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Publish post
  const handlePublish = async () => {
    const saved = await handleSave(true);
    if (!saved) return;
    
    try {
      setPublishing(true);
      const published = await api.patch<BlogPostAdminResponse>(`/admin/blog/${saved.id}/publish`);
      setEditingPost(published);
      toast.success('Blog post is now live!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to publish post'));
    } finally {
      setPublishing(false);
    }
  };

  // Unpublish post
  const handleUnpublish = async () => {
    if (!editingPost) return;
    try {
      setPublishing(true);
      const unpublished = await api.patch<BlogPostAdminResponse>(`/admin/blog/${editingPost.id}/unpublish`);
      setEditingPost(unpublished);
      setShowUnpublishConfirm(false);
      toast.success('Post unpublished (returned to draft status).');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to unpublish post'));
    } finally {
      setPublishing(false);
    }
  };

  // Delete post
  const handleDeletePost = async () => {
    if (!deletingPost) return;
    try {
      await api.delete(`/admin/blog/${deletingPost.id}`);
      toast.success('Blog post deleted successfully.');
      setDeletingPost(null);
      fetchPosts();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete blog post'));
    }
  };

  // Preview Post
  const handlePreview = async () => {
    const previewWindow = window.open('about:blank', '_blank');
    const saved = await handleSave(true);
    if (!saved) {
      if (previewWindow) previewWindow.close();
      return;
    }
    
    try {
      const res = await api.get<{ previewToken: string }>('/admin/homepage/preview-token');
      const previewTok = res?.previewToken || token || '';
      const storefrontBase = import.meta.env.VITE_STOREFRONT_URL
        ? import.meta.env.VITE_STOREFRONT_URL.replace(/\/$/, '')
        : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:3000'
            : 'https://hausofhafsah.com');
      const previewUrl = `${storefrontBase}/blog/${saved.slug}?token=${encodeURIComponent(previewTok)}`;
      if (previewWindow) {
        previewWindow.location.href = previewUrl;
      } else {
        window.open(previewUrl, '_blank');
      }
    } catch (err) {
      if (previewWindow) previewWindow.close();
      toast.error(getErrorMessage(err));
    }
  };

  // Handle Cover Image Upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPost) return;

    try {
      setUploadingCover(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post<ImageUploadResponse>(
        `/admin/blog/${editingPost.id}/cover-image`,
        formData
      );
      setCoverImageUrl(res.fileUrl);
      toast.success('Cover image uploaded!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Cover image upload failed'));
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle Content Image Upload from Tiptap toolbar
  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPost || !editor) return;

    try {
      setUploadingContent(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post<ImageUploadResponse>(
        `/admin/blog/${editingPost.id}/content-image`,
        formData
      );
      
      // Insert image in editor
      editor.chain().focus().setImage({ src: res.fileUrl }).run();
      toast.success('Image inserted successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to upload editor image'));
    } finally {
      setUploadingContent(false);
    }
  };

  // Set link in editor
  const setLinkPrompt = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL link:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  // Filter posts
  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.category && post.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Styles for Tiptap Editor */}
      <style>{`
        .tiptap-editor .ProseMirror {
          outline: none;
          min-height: 400px;
          font-size: 15px;
          line-height: 1.7;
          color: #2b2622;
          padding: 1.5rem;
          background-color: #ffffff;
        }
        .tiptap-editor .ProseMirror h2 {
          font-size: 1.45rem;
          font-weight: 700;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
          font-family: 'Playfair Display', serif;
          color: #2b2622;
        }
        .tiptap-editor .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          font-family: 'Playfair Display', serif;
          color: #2b2622;
        }
        .tiptap-editor .ProseMirror p {
          margin-bottom: 1.25rem;
        }
        .tiptap-editor .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .tiptap-editor .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .tiptap-editor .ProseMirror blockquote {
          border-left: 3px solid #b08968;
          padding-left: 1.25rem;
          font-style: italic;
          margin-bottom: 1.25rem;
          color: #8a7b6c;
          background-color: #faf7f2;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
        }
        .tiptap-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 1.5rem auto;
          display: block;
        }
      `}</style>

      {!editingPost ? (
        /* ================= LIST VIEW ================= */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-border p-6 rounded-md shadow-sm">
            <div>
              <h1 className="font-serif text-lg font-bold text-text-primary tracking-wide">
                Blog Posts
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                Manage your storefront editorial articles, news, and guides.
              </p>
            </div>
            <button
              onClick={handleCreateDraft}
              disabled={saving}
              className="bg-accent text-background hover:bg-accent/90 px-4 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 transition duration-150 shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <Plus className="h-4.5 w-4.5" />
              )}
              New Post
            </button>
          </div>

          {/* Filters & Listing */}
          <div className="bg-surface border border-border rounded-md shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search posts by title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-xs focus:border-accent focus:outline-none text-text-primary"
                />
              </div>
            </div>

            {loadingList ? (
              <div className="p-16 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="p-16 text-center text-xs text-text-secondary">
                No blog posts found. Initialize your first draft to get started!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="bg-background text-text-secondary uppercase tracking-wider text-[10px] border-b border-border">
                      <th className="p-4 font-semibold w-24">Cover</th>
                      <th className="p-4 font-semibold">Title</th>
                      <th className="p-4 font-semibold">Category</th>
                      <th className="p-4 font-semibold w-32">Status</th>
                      <th className="p-4 font-semibold w-40">Publish Date</th>
                      <th className="p-4 font-semibold w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-background/45 transition duration-150">
                        <td className="p-4">
                          {post.coverImageUrl ? (
                            <img
                              src={post.coverImageUrl}
                              alt=""
                              className="w-16 h-10 object-cover rounded border border-border/80"
                            />
                          ) : (
                            <div className="w-16 h-10 bg-background border border-border rounded flex items-center justify-center text-[10px] text-text-secondary font-semibold uppercase">
                              No image
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleStartEdit(post)}
                            className="font-serif text-sm font-semibold text-text-primary hover:text-accent text-left transition duration-150 block cursor-pointer"
                          >
                            {post.title}
                          </button>
                          <span className="text-[10px] text-text-secondary mt-0.5 block">
                            By {post.authorName || 'Hafsah'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-background border border-border text-[10px] rounded-full text-text-secondary font-medium">
                            {post.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="p-4">
                          {post.isPublished ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-success/10 text-success border border-success/20">
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-draft/10 text-draft border border-draft/25">
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-text-secondary">
                          {post.isPublished && post.publishedAt ? (
                            new Date(post.publishedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          ) : (
                            <span className="italic">Not yet published</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEdit(post)}
                              className="p-1.5 hover:bg-background border border-transparent hover:border-border rounded text-text-secondary hover:text-text-primary transition"
                              title="Edit post"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingPost(post)}
                              className="p-1.5 hover:bg-error/5 border border-transparent hover:border-error/20 rounded text-text-secondary hover:text-error transition"
                              title="Delete post"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between font-sans text-xs">
                <span className="text-text-secondary">
                  Page {page + 1} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 border border-border rounded-md hover:bg-background disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 border border-border rounded-md hover:bg-background disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= EDITOR VIEW ================= */
        <div className="space-y-6 pb-24 relative">
          {/* Editor Header Navigation */}
          <div className="flex items-center gap-3 bg-surface border border-border p-4 rounded-md shadow-sm">
            <button
              onClick={() => setEditingPost(null)}
              className="p-1.5 hover:bg-background border border-border rounded-md text-text-secondary hover:text-text-primary transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="text-xs font-sans text-text-secondary flex items-center gap-1.5">
              <span className="hover:underline cursor-pointer" onClick={() => setEditingPost(null)}>
                Blog
              </span>
              <span>/</span>
              <span className="text-text-primary font-semibold truncate max-w-[200px]">
                {editingPost.isPublished ? 'Edit Published Post' : 'Edit Draft'}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
                Status:
              </span>
              {editingPost.isPublished ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30">
                  Published
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-draft/15 text-draft border border-draft/30">
                  Draft
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Main Editing Panels */}
            <div className="lg:col-span-8 space-y-6">
              {/* Title & Metadata fields */}
              <div className="bg-surface border border-border p-6 rounded-md shadow-sm space-y-4">
                <input
                  type="text"
                  placeholder="Enter Title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full font-serif text-3xl font-bold border-b border-border/40 focus:border-accent py-2 outline-none bg-transparent text-text-primary"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                      Author Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hafsah"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full bg-background border border-border rounded-md px-3 py-2 focus:border-accent focus:outline-none text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-background border border-border rounded-md px-3 py-2 focus:border-accent focus:outline-none text-text-primary"
                    >
                      <option value="Style Guide">Style Guide</option>
                      <option value="Collection">Collection</option>
                      <option value="Announcements">Announcements</option>
                      <option value="Behind the Scenes">Behind the Scenes</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs font-sans">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                    Excerpt / Teaser Text
                  </label>
                  <textarea
                    placeholder="Provide a one-two sentence teaser for the post summary display..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 focus:border-accent focus:outline-none text-text-primary"
                  />
                  <p className="text-[10px] text-text-secondary mt-1">
                    Keep under 500 characters. Shown on list cards.
                  </p>
                </div>
              </div>

              {/* Tiptap Rich Text Editor */}
              <div className="bg-surface border border-border rounded-md shadow-sm overflow-hidden flex flex-col">
                {/* Minimal Tiptap Toolbar */}
                {editor && (
                  <div className="bg-background border-b border-border p-2 flex flex-wrap gap-1 items-center">
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`p-1.5 rounded transition ${editor.isActive('bold') ? 'bg-accent/15 text-accent' : 'hover:bg-surface text-text-secondary'}`}
                      title="Bold"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`p-1.5 rounded transition ${editor.isActive('italic') ? 'bg-accent/15 text-accent' : 'hover:bg-surface text-text-secondary'}`}
                      title="Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <span className="w-[1px] h-6 bg-border mx-1"></span>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`px-2.5 py-1 text-xs font-semibold rounded transition ${editor.isActive('heading', { level: 2 }) ? 'bg-accent/15 text-accent' : 'hover:bg-surface text-text-secondary'}`}
                      title="Heading 2"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`px-2.5 py-1 text-xs font-semibold rounded transition ${editor.isActive('heading', { level: 3 }) ? 'bg-accent/15 text-accent' : 'hover:bg-surface text-text-secondary'}`}
                      title="Heading 3"
                    >
                      H3
                    </button>
                    <span className="w-[1px] h-6 bg-border mx-1"></span>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={`p-1.5 rounded transition ${editor.isActive('bulletList') ? 'bg-accent/15 text-accent' : 'hover:bg-surface text-text-secondary'}`}
                      title="Bullet List"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={`p-1.5 rounded transition ${editor.isActive('orderedList') ? 'bg-accent/15 text-accent' : 'hover:bg-surface text-text-secondary'}`}
                      title="Numbered List"
                    >
                      <ListOrdered className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBlockquote().run()}
                      className={`p-1.5 rounded transition ${editor.isActive('blockquote') ? 'bg-accent/15 text-accent' : 'hover:bg-surface text-text-secondary'}`}
                      title="Blockquote"
                    >
                      <Quote className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={setLinkPrompt}
                      className={`p-1.5 rounded transition ${editor.isActive('link') ? 'bg-accent/15 text-accent' : 'hover:bg-surface text-text-secondary'}`}
                      title="Add Link"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </button>
                    
                    {/* Embedded Content Image Upload */}
                    <input
                      type="file"
                      ref={contentImageInputRef}
                      onChange={handleContentImageUpload}
                      className="hidden"
                      accept="image/*"
                    />
                    <button
                      type="button"
                      onClick={() => contentImageInputRef.current?.click()}
                      disabled={uploadingContent}
                      className="p-1.5 rounded hover:bg-surface text-text-secondary disabled:opacity-50 flex items-center justify-center relative"
                      title="Insert Image"
                    >
                      {uploadingContent ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImageIcon className="h-4 w-4" />
                      )}
                    </button>
                    
                    <span className="w-[1px] h-6 bg-border mx-1"></span>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().undo().run()}
                      disabled={!editor.can().undo()}
                      className="p-1.5 rounded hover:bg-surface text-text-secondary disabled:opacity-30"
                      title="Undo"
                    >
                      <Undo className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().redo().run()}
                      disabled={!editor.can().redo()}
                      className="p-1.5 rounded hover:bg-surface text-text-secondary disabled:opacity-30"
                      title="Redo"
                    >
                      <Redo className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                {/* Editor Content Area */}
                <div className="tiptap-editor border-t border-border bg-white">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>

            {/* Sidebar: Cover Image Upload */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-surface border border-border p-6 rounded-md shadow-sm space-y-4">
                <h3 className="font-serif text-sm font-bold text-text-primary">Cover Image</h3>
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverUpload}
                  className="hidden"
                  accept="image/*"
                />
                
                {coverImageUrl ? (
                  <div className="relative group rounded border border-border overflow-hidden">
                    <img
                      src={coverImageUrl}
                      alt="Cover Preview"
                      className="w-full aspect-[16/10] object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition duration-200">
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingCover}
                        className="bg-white/90 hover:bg-white text-text-primary font-sans text-xs px-3 py-1.5 rounded shadow flex items-center gap-1 transition"
                      >
                        {uploadingCover ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        Replace
                      </button>
                      <button
                        onClick={() => setCoverImageUrl('')}
                        className="bg-error hover:bg-error/95 text-white font-sans text-xs px-3 py-1.5 rounded shadow transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="w-full aspect-[16/10] border-2 border-dashed border-border hover:border-accent rounded flex flex-col items-center justify-center gap-2 text-text-secondary hover:text-text-primary transition duration-150 bg-background cursor-pointer"
                  >
                    {uploadingCover ? (
                      <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                    <span className="text-[11px] font-semibold">Upload Cover Image</span>
                    <span className="text-[9px] text-text-secondary/80">Recommended aspect ratio: 16:10</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* STICKY BOTTOM ACTION BAR */}
          <div className="fixed bottom-0 left-0 right-0 sm:left-64 bg-surface border-t border-border px-6 py-4 flex items-center justify-between z-10 shadow-lg font-sans">
            <button
              onClick={() => setEditingPost(null)}
              className="border border-border text-text-secondary hover:text-text-primary hover:bg-background px-4 py-2 text-xs font-semibold rounded-md transition cursor-pointer"
            >
              Back to List
            </button>
            <div className="flex gap-3">
              <button
                onClick={handlePreview}
                className="border border-border text-text-primary hover:bg-background px-4 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              
              {editingPost.isPublished ? (
                <>
                  <button
                    onClick={() => setShowUnpublishConfirm(true)}
                    className="border border-error/30 text-error hover:bg-error/5 px-4 py-2 text-xs font-semibold rounded-md transition cursor-pointer"
                  >
                    Unpublish
                  </button>
                  <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="bg-accent text-background hover:bg-accent/90 px-5 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="border border-border text-text-primary hover:bg-background px-4 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Draft
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={publishing || saving}
                    className="bg-accent text-background hover:bg-accent/90 px-6 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {(publishing || saving) && <Loader2 className="h-4 w-4 animate-spin" />}
                    Publish Post
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETION CONFIRMATION DIALOG */}
      {deletingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-error">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="font-serif text-base font-bold text-text-primary tracking-wide">
                Delete Blog Post
              </h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              This will remove the blog post &quot;{deletingPost.title}&quot; from your store. Customers won&apos;t be able to see or buy it anymore.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingPost(null)}
                className="border border-border hover:bg-background px-4 py-2 text-xs font-semibold rounded-md text-text-secondary hover:text-text-primary transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="bg-error hover:bg-error/95 text-white px-4 py-2 text-xs font-semibold rounded-md transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNPUBLISH CONFIRMATION DIALOG */}
      {showUnpublishConfirm && editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-warning">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="font-serif text-base font-bold text-text-primary tracking-wide">
                Unpublish Blog Post
              </h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              This will hide the blog post &quot;{editingPost.title}&quot; from your store. Customers won&apos;t be able to see or read it anymore.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowUnpublishConfirm(false)}
                className="border border-border hover:bg-background px-4 py-2 text-xs font-semibold rounded-md text-text-secondary hover:text-text-primary transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUnpublish}
                disabled={publishing}
                className="bg-accent text-background hover:bg-accent/90 px-4 py-2 text-xs font-semibold rounded-md transition cursor-pointer"
              >
                Confirm Unpublish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
