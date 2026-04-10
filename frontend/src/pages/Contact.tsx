import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, MessageSquareText, Phone, Send, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
      toast.success('Thanks for contacting us. We have received your message.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_12%,#0ea5e922_0,transparent_42%),radial-gradient(circle_at_90%_10%,#f9731620_0,transparent_45%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] text-slate-900">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Contact Servify AI</h1>
          <p className="mt-3 text-slate-600 max-w-2xl">
            Share your issues, feature requests, or onboarding questions. We review every message and respond with practical guidance.
          </p>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-slate-200 bg-white/85 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Reach Us</CardTitle>
              <CardDescription>Professional support for setup and operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-sky-700" />
                <span>support@devhaki.com</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-sky-700" />
                <span>+92 (000) 000-0000</span>
              </div>
              <div className="pt-3 border-t">
                <p className="font-semibold">Founder</p>
                <p>Abdullah</p>
                <p className="font-semibold mt-3">Co-Founder</p>
                <p>Huzaifa Tahir</p>
              </div>
              <div className="pt-3">
                <Link to="/" className="text-sky-700 hover:text-sky-800 font-medium">Back to Home</Link>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-slate-200 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Issue Submission Form</CardTitle>
              <CardDescription>Tell us exactly what happened, which role, and which page</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <div className="relative">
                      <UserRound className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input id="name" className="pl-10" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input id="email" type="email" className="pl-10" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Example: Staff login redirect issue" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <div className="relative">
                    <MessageSquareText className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <textarea
                      id="message"
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      rows={7}
                      className="w-full rounded-md border bg-background pl-10 pr-3 py-2 text-sm"
                      placeholder="Describe issue, role used, and steps to reproduce"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full sm:w-auto" disabled={isSending}>
                  <Send className="h-4 w-4 mr-2" />
                  {isSending ? 'Sending...' : 'Submit Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
