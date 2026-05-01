import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, MessageSquareText, Phone, Send, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSending, setIsSending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill name, email, and message');
      return;
    }
    setIsSending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      toast.success('Thanks — we have received your message.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <MarketingShell>
      <div className="border-b border-white/10 bg-[#141414] py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
              Contact <span className="text-[#FF6A47]">Servify AI</span>
            </h1>
            <p className="mt-4 max-w-2xl font-sans text-lg text-white/70">
              Share setup questions, feature ideas, or operational issues. We read every message.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="border-white/10 bg-[#1A1A1A] text-white lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Reach us</CardTitle>
              <CardDescription className="font-sans text-white/55">Professional support</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 font-sans text-sm text-white/75">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#3B82F6]" />
                <span>support@devhaki.com</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#3B82F6]" />
                <span>+92 (000) 000-0000</span>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="font-heading text-sm font-semibold text-white">Team</p>
                <p className="mt-1">Founder: Abdullah</p>
                <p className="mt-2 font-heading text-sm font-semibold text-white">Co-founder</p>
                <p>Huzaifa Tahir</p>
              </div>
              <Link to="/" className="inline-block pt-2 font-medium text-[#FF6A47] hover:underline">
                ← Back to home
              </Link>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#1A1A1A] text-white lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Send a message</CardTitle>
              <CardDescription className="font-sans text-white/55">
                Include role, portal context, and steps to reproduce if reporting an issue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-sans text-white/90">
                      Your name
                    </Label>
                    <div className="relative">
                      <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <Input
                        id="name"
                        className="border-white/15 bg-white/5 pl-10 font-sans text-white placeholder:text-white/35"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-sans text-white/90">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <Input
                        id="email"
                        type="email"
                        className="border-white/15 bg-white/5 pl-10 font-sans text-white placeholder:text-white/35"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="font-sans text-white/90">
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    className="border-white/15 bg-white/5 font-sans text-white placeholder:text-white/35"
                    value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="e.g. Staff login issue"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="font-sans text-white/90">
                    Message
                  </Label>
                  <div className="relative">
                    <MessageSquareText className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                    <textarea
                      id="message"
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      rows={7}
                      className="w-full rounded-md border border-white/15 bg-white/5 py-2 pl-10 pr-3 font-sans text-sm text-white placeholder:text-white/35"
                      placeholder="What happened, which page, and what you expected"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="font-sans font-semibold bg-[#FF6A47] text-white hover:bg-[#ff5a38] sm:w-auto"
                  disabled={isSending}
                >
                  <Send className="h-4 w-4" />
                  {isSending ? 'Sending…' : 'Submit'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MarketingShell>
  );
}
