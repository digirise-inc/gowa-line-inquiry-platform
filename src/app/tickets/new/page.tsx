"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    content: "",
    customerName: "",
    channel: "manual",
    category: "inquiry",
    priority: "normal",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const ticket = await res.json();
        router.push(`/tickets/${ticket.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <header className="flex items-center gap-3">
          <Link href="/tickets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              チケット一覧へ戻る
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">新規チケット作成</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">件名 *</label>
            <Input
              required
              placeholder="例：5月分請求書の確認"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">顧客名</label>
            <Input
              placeholder="例：山田商店"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">チャネル</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                <option value="manual">手動</option>
                <option value="line">LINE</option>
                <option value="phone">電話</option>
                <option value="email">メール</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">カテゴリ</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="inquiry">問い合わせ</option>
                <option value="order">注文</option>
                <option value="delivery">配送</option>
                <option value="billing">請求</option>
                <option value="claim">クレーム</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">優先度</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">低</option>
                <option value="normal">通常</option>
                <option value="high">高</option>
                <option value="urgent">緊急</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">内容</label>
            <Textarea
              placeholder="問い合わせ内容を入力してください"
              rows={5}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="ai" disabled={loading}>
              {loading ? "作成中..." : "チケットを作成"}
            </Button>
            <Link href="/tickets">
              <Button type="button" variant="outline">キャンセル</Button>
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
