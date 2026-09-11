import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import {
  Mail,
  Users,
  Download,
  Send,
  Search,
  RefreshCw,
  AlertCircle,
  Bold,
  Italic,
  Heading2,
  List,
  Quote,
  Eye,
  Sliders,
  Code,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface Subscriber {
  id: number;
  email: string;
  active: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

interface SubscribersResponse {
  content: Subscriber[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export default function Newsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [totalActive, setTotalActive] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Composer mode: 'structured' | 'wysiwyg'
  const [composerMode, setComposerMode] = useState<'structured' | 'wysiwyg'>('structured');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Campaign Form State
  const [subject, setSubject] = useState('Journal N° 02 — Quiet Luxury & Autumn Pret');
  const [eyebrow, setEyebrow] = useState('EDITORIAL RELEASE');
  const [mainTitle, setMainTitle] = useState('Some processes are broken. Others simply never evolved.');
  const [subtitle, setSubtitle] = useState('How a simple question became a signature luxury collection.');
  const [leadQuote, setLeadQuote] = useState('Crafted with perfection, designed for the discerning individual.');
  const [pullQuote, setPullQuote] = useState('"The goal was never to add complexity. It was to quietly curate true elegance."');
  const [ctaLabel, setCtaLabel] = useState('Explore Autumn Collection');
  const [ctaUrl, setCtaUrl] = useState('https://hausofhafsah.com/shop');

  // WYSIWYG HTML Content State
  const [contentHtml, setContentHtml] = useState(
    '<p>At Haus of Hafsah, every garment embodies meticulous craftsmanship, premium fabrications, and refined silhouettes designed to seamlessly elevate your wardrobe.</p>'
  );

  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // TipTap Editor Initialization
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-accent underline' },
      }),
      ImageExtension.configure({
        HTMLAttributes: { class: 'max-w-full h-auto rounded border border-border my-4 mx-auto block' },
      }),
    ],
    content: contentHtml,
    onUpdate: ({ editor }) => {
      setContentHtml(editor.getHTML());
    },
  });

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: '10',
        ...(search.trim() ? { search: search.trim() } : {}),
      });

      const res = await api.get<SubscribersResponse>(`/admin/newsletter/subscribers?${queryParams}`);
      setSubscribers(res.content || []);
      setTotalPages(res.totalPages || 0);

      const statsRes = await api.get<{ totalActiveSubscribers: number }>('/admin/newsletter/stats');
      setTotalActive(statsRes.totalActiveSubscribers || 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load newsletter subscribers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [page, search]);

  const handleExportCsv = async () => {
    try {
      await api.download('/admin/newsletter/export', 'newsletter_subscribers.csv');
      toast.success('Subscriber list exported successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    }
  };

  // Compile final HTML payload
  const getCompiledHtml = (): string => {
    if (composerMode === 'structured') {
      let compiled = '';
      if (eyebrow.trim()) {
        compiled += `<div style="font-size: 10px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: #8C6D53; margin-bottom: 12px; text-align: center;">${eyebrow.trim()}</div>`;
      }
      if (mainTitle.trim()) {
        compiled += `<h2 style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 30px; font-weight: 400; color: #1C1917; text-align: center; margin: 0 0 20px 0; line-height: 1.25;">${mainTitle.trim()}</h2>`;
      }
      if (subtitle.trim()) {
        compiled += `<p style="font-size: 13px; color: #78716C; text-align: center; max-width: 460px; margin: 0 auto 28px auto; line-height: 1.6;">${subtitle.trim()}</p>`;
      }
      compiled += `<div style="height: 1px; background-color: #F0EFEF; margin: 28px 0;"></div>`;
      if (leadQuote.trim()) {
        compiled += `<div style="border-left: 3px solid #8C6D53; padding-left: 18px; margin: 24px 0; font-size: 14px; color: #292524;"><strong>${leadQuote.trim()}</strong></div>`;
      }
      compiled += `<div style="font-size: 14px; color: #44403C; line-height: 1.8; margin-bottom: 24px;">${contentHtml}</div>`;
      if (pullQuote.trim()) {
        compiled += `<blockquote style="text-align: center; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 20px; font-style: italic; color: #1C1917; margin: 32px 0;">${pullQuote.trim()}</blockquote>`;
      }
      if (ctaLabel.trim() && ctaUrl.trim()) {
        compiled += `<div style="background-color: #F8F7F5; border: 1px solid #EBE8E3; padding: 24px 28px; margin: 32px 0; text-align: center;"><div style="font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #8C6D53; font-weight: 600; margin-bottom: 6px;">FEATURED COLLECTION</div><a href="${ctaUrl.trim()}" style="font-size: 13px; font-weight: 600; color: #1C1917; text-decoration: none; border-bottom: 1px solid #1C1917; padding-bottom: 2px;">${ctaLabel.trim()} &rarr;</a></div>`;
      }
      return compiled;
    }
    return contentHtml;
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error('Subject line is required');
      return;
    }
    const finalHtml = getCompiledHtml();
    if (!finalHtml.trim()) {
      toast.error('Newsletter content is empty');
      return;
    }
    setShowConfirm(true);
  };

  const confirmSendBroadcast = async () => {
    setShowConfirm(false);
    setSending(true);
    try {
      const finalHtml = getCompiledHtml();
      await api.post('/admin/newsletter/send', {
        subject: subject.trim(),
        contentHtml: finalHtml,
      });
      toast.success('Editorial newsletter broadcast campaign initiated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text-primary">Newsletter & Editorial Journal</h1>
          <p className="text-xs text-text-secondary mt-1">
            Visual campaign builder, subscriber management, and throttled email broadcasts.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded text-xs font-semibold uppercase tracking-wider hover:bg-accent/90 transition-colors shrink-0"
        >
          <Download className="h-4 w-4" />
          <span>Export Subscriber List (CSV)</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-lg p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-text-secondary font-medium">Active Subscribers</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{totalActive}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-text-secondary font-medium">Sender Address</p>
            <p className="text-sm font-semibold text-text-primary mt-1">info@hausofhafsah.com</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-text-secondary font-medium">Editor Mode</p>
            <p className="text-sm font-semibold text-accent mt-1">Structured & WYSIWYG Enabled</p>
          </div>
        </div>
      </div>

      {/* Campaign Composer Section */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-xs">
        {/* Top Composer Bar: Mode Switches & Live Preview Tabs */}
        <div className="p-4 bg-background/50 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-accent" />
            <h2 className="font-serif text-base font-bold text-text-primary">Campaign Composer</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mode selector */}
            <div className="flex bg-surface border border-border rounded p-0.5">
              <button
                type="button"
                onClick={() => setComposerMode('structured')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                  composerMode === 'structured' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Structured Form</span>
              </button>
              <button
                type="button"
                onClick={() => setComposerMode('wysiwyg')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                  composerMode === 'wysiwyg' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>WYSIWYG / HTML</span>
              </button>
            </div>

            {/* View Tab Toggle */}
            <div className="flex bg-surface border border-border rounded p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === 'edit' ? 'bg-border text-text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === 'preview' ? 'bg-border text-text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Eye className="h-3.5 w-3.5 text-accent" />
                <span>Live Preview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Edit or Preview Pane */}
        <form onSubmit={handleSendBroadcast} className="p-6 space-y-6">
          {/* Subject Line */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Campaign Subject Line *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Journal N° 02 — Quiet Luxury & Autumn Pret Edit"
              className="w-full bg-background border border-border rounded px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          {activeTab === 'edit' ? (
            composerMode === 'structured' ? (
              /* Structured Form Mode */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-background/40 border border-border rounded-lg p-6">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    Category / Eyebrow Label
                  </label>
                  <input
                    type="text"
                    value={eyebrow}
                    onChange={(e) => setEyebrow(e.target.value)}
                    placeholder="e.g. EDITORIAL RELEASE"
                    className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    Main Headline Title
                  </label>
                  <input
                    type="text"
                    value={mainTitle}
                    onChange={(e) => setMainTitle(e.target.value)}
                    placeholder="e.g. Timeless elegance. Crafted for the discerning."
                    className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    Subtitle Description
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. How a question about luxury pret became a signature collection."
                    className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    Lead Highlight Sentence (Left Border Accent)
                  </label>
                  <input
                    type="text"
                    value={leadQuote}
                    onChange={(e) => setLeadQuote(e.target.value)}
                    placeholder="e.g. Your invitation is confirmed. Priority access to limited releases."
                    className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Body Paragraph Editor */}
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                    Story Body Content (Visual Editor)
                  </label>

                  {/* WYSIWYG Toolbar */}
                  {editor && (
                    <div className="flex flex-wrap items-center gap-1 bg-background border border-border rounded-t p-1.5">
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-1.5 rounded hover:bg-border/60 ${editor.isActive('bold') ? 'bg-accent text-white' : 'text-text-secondary'}`}
                        title="Bold"
                      >
                        <Bold className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-1.5 rounded hover:bg-border/60 ${editor.isActive('italic') ? 'bg-accent text-white' : 'text-text-secondary'}`}
                        title="Italic"
                      >
                        <Italic className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`p-1.5 rounded hover:bg-border/60 ${editor.isActive('heading', { level: 2 }) ? 'bg-accent text-white' : 'text-text-secondary'}`}
                        title="Heading"
                      >
                        <Heading2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-1.5 rounded hover:bg-border/60 ${editor.isActive('bulletList') ? 'bg-accent text-white' : 'text-text-secondary'}`}
                        title="Bullet List"
                      >
                        <List className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`p-1.5 rounded hover:bg-border/60 ${editor.isActive('blockquote') ? 'bg-accent text-white' : 'text-text-secondary'}`}
                        title="Blockquote"
                      >
                        <Quote className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="bg-background border border-border rounded-b p-3 min-h-[120px] text-xs text-text-primary focus-within:border-accent">
                    <EditorContent editor={editor} />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    Featured Pull Quote (Italicized Blockquote)
                  </label>
                  <input
                    type="text"
                    value={pullQuote}
                    onChange={(e) => setPullQuote(e.target.value)}
                    placeholder="e.g. 'The goal was never to add complexity...'"
                    className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      placeholder="e.g. Explore Collection"
                      className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                      Button Target URL
                    </label>
                    <input
                      type="text"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="https://hausofhafsah.com/shop"
                      className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Pure WYSIWYG / HTML Mode */
              <div className="space-y-3 bg-background/40 border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Visual Editorial Content Editor
                  </label>
                </div>

                {editor && (
                  <div className="flex flex-wrap items-center gap-1.5 bg-background border border-border rounded-t p-2">
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`p-1.5 rounded hover:bg-border/60 ${editor.isActive('bold') ? 'bg-accent text-white' : 'text-text-secondary'}`}
                      title="Bold"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`p-1.5 rounded hover:bg-border/60 ${editor.isActive('italic') ? 'bg-accent text-white' : 'text-text-secondary'}`}
                      title="Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`p-1.5 rounded hover:bg-border/60 ${editor.isActive('heading', { level: 2 }) ? 'bg-accent text-white' : 'text-text-secondary'}`}
                      title="Heading 2"
                    >
                      <Heading2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={`p-1.5 rounded hover:bg-border/60 ${editor.isActive('bulletList') ? 'bg-accent text-white' : 'text-text-secondary'}`}
                      title="Bullet List"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBlockquote().run()}
                      className={`p-1.5 rounded hover:bg-border/60 ${editor.isActive('blockquote') ? 'bg-accent text-white' : 'text-text-secondary'}`}
                      title="Blockquote"
                    >
                      <Quote className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="bg-background border border-border rounded-b p-4 min-h-[220px] text-xs text-text-primary focus-within:border-accent">
                  <EditorContent editor={editor} />
                </div>
              </div>
            )
          ) : (
            /* Live Email Preview Pane */
            <div className="bg-[#ECEEEF] p-6 rounded-lg border border-border flex justify-center">
              <div className="w-full max-w-[580px] bg-white border border-[#DCDFE2] shadow-md overflow-hidden text-[#1C1917]">
                {/* Header */}
                <div className="p-6 border-b border-[#1C1917] text-center">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-[#78716C] mb-3">
                    <span>JOURNAL N° 02</span>
                    <span>HAUS SOCIETY</span>
                  </div>
                  <h1 className="font-serif text-xl tracking-[4px] uppercase font-semibold text-[#1C1917]">
                    HAUS OF HAFSAH
                  </h1>
                  <div className="w-9 h-0.5 bg-[#8C6D53] mx-auto mt-2"></div>
                </div>

                {/* Content */}
                <div
                  className="p-8 text-xs text-[#292524] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: getCompiledHtml() }}
                />

                {/* Signature */}
                <div className="p-6 border-t border-[#F0EFEF] grid grid-cols-2 text-left">
                  <div className="border-r border-[#F0EFEF] pr-4">
                    <p className="font-semibold text-xs text-[#1C1917]">Haus of Hafsah</p>
                    <p className="text-[10px] text-[#8C6D53]">Editorial Team</p>
                  </div>
                  <div className="pl-4">
                    <p className="font-semibold text-xs text-[#1C1917]">Client Care</p>
                    <p className="text-[10px] text-[#8C6D53]">info@hausofhafsah.com</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-[#F8F7F5] border-t border-[#DCDFE2] p-6 text-center space-y-2">
                  <img
                    src="/favicon.png"
                    alt="Logo"
                    className="h-12 w-auto mx-auto block opacity-80"
                  />
                  <p className="text-[10px] italic text-[#78716C]">Minimal Design. Refined Luxury.</p>
                  <p className="text-[10px] text-[#908A84]">Haus of Hafsah • Karachi, Pakistan</p>
                  <div className="text-[9px] uppercase tracking-wider text-[#8C6D53] space-x-2">
                    <span>Storefront</span> • <span>Contact</span> • <span>Unsubscribe</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-end gap-4 pt-2">
            <button
              type="submit"
              disabled={sending || totalActive === 0}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded text-xs font-semibold uppercase tracking-wider hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{sending ? 'Sending Broadcast...' : `Send Broadcast to ${totalActive} Active Subscribers`}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Subscribers Roster Table */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
          <h2 className="font-serif text-lg font-bold text-text-primary flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <span>Active Subscriber Roster</span>
          </h2>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-text-secondary absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search subscriber..."
                className="bg-background border border-border rounded pl-8 pr-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent w-56"
              />
            </div>

            <button
              onClick={fetchSubscribers}
              className="p-2 border border-border rounded hover:bg-background text-text-secondary"
              title="Refresh list"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-text-secondary">Loading subscribers...</div>
        ) : subscribers.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-secondary">No subscribers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-secondary uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Email Address</th>
                  <th className="pb-3 font-semibold">Subscription Status</th>
                  <th className="pb-3 font-semibold">Subscribed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-background/50">
                    <td className="py-3 font-medium text-text-primary">{sub.email}</td>
                    <td className="py-3">
                      {sub.active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-600">
                          Unsubscribed
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-text-secondary">
                      {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
            <span className="text-text-secondary">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 border border-border rounded text-text-primary disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-border rounded text-text-primary disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Broadcast Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="font-serif text-lg font-bold text-text-primary">Confirm Campaign Broadcast</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to send this editorial campaign to <strong>{totalActive} active subscribers</strong> via Hostinger SMTP (<code className="text-text-primary">info@hausofhafsah.com</code>)?
            </p>
            <div className="bg-background border border-border rounded p-3 text-xs space-y-1">
              <p className="font-semibold text-text-primary">Subject:</p>
              <p className="text-text-secondary">{subject}</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-border rounded text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={confirmSendBroadcast}
                className="px-4 py-2 bg-accent text-white rounded text-xs font-semibold hover:bg-accent/90"
              >
                Confirm & Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
