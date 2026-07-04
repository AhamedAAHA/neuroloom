"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft2, ArrowRight2, Profile, Sms } from "iconsax-react";
import { api } from "@/lib/api";
import { BrandLogo, CARE_MODE_ICONS } from "@/lib/icons";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

const CARE_MODES = [
  { id: "post_hospital", label: "Post-Hospital", desc: "Discharge recovery & 72h checklist" },
  { id: "dementia", label: "Dementia / Cognitive", desc: "Routine-focused, simple interfaces" },
  { id: "chronic", label: "Chronic Care", desc: "Long-term condition tracking" },
  { id: "long_distance", label: "Long-Distance", desc: "Remote family coordination" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    recipient_name: "",
    recipient_age: "",
    primary_member_name: "",
    primary_member_email: "",
    care_modes: [] as string[],
  });

  const toggleMode = (id: string) => {
    setForm((f) => ({
      ...f,
      care_modes: f.care_modes.includes(id)
        ? f.care_modes.filter((m) => m !== id)
        : [...f.care_modes, id],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const circle = await api.createCircle({
        name: form.name,
        care_modes: form.care_modes,
        recipient_name: form.recipient_name,
        recipient_age: form.recipient_age ? parseInt(form.recipient_age) : undefined,
        primary_member_name: form.primary_member_name,
        primary_member_email: form.primary_member_email,
      });
      localStorage.setItem("neuroloom_circle_id", circle.id);
      router.push(`/dashboard/${circle.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create circle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader solid />
      <div className="max-w-xl mx-auto px-6 pt-28 pb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition"
        >
          <ArrowLeft2 size={18} color="currentColor" />
          Back
        </Link>

        <div className="card p-8">
          <div className="flex items-center gap-3 mb-8">
            <BrandLogo size={44} />
            <div>
              <h1 className="text-2xl font-bold">Create Care Circle</h1>
              <p className="text-muted-foreground text-sm">Set up Neuroloom for your family</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <Field
              icon={<Profile size={18} color="#8b9cb3" />}
              label="Circle name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Mom's Care Team"
              required
            />
            <Field
              icon={<Profile size={18} color="#8b9cb3" />}
              label="Care recipient name"
              value={form.recipient_name}
              onChange={(v) => setForm({ ...form, recipient_name: v })}
              placeholder="Mom"
              required
            />
            <Field
              label="Recipient age (optional)"
              value={form.recipient_age}
              onChange={(v) => setForm({ ...form, recipient_age: v })}
              placeholder="72"
              type="number"
            />
            <Field
              icon={<Profile size={18} color="#8b9cb3" />}
              label="Your name"
              value={form.primary_member_name}
              onChange={(v) => setForm({ ...form, primary_member_name: v })}
              placeholder="Priya"
              required
            />
            <Field
              icon={<Sms size={18} color="#8b9cb3" />}
              label="Your email"
              value={form.primary_member_email}
              onChange={(v) => setForm({ ...form, primary_member_email: v })}
              placeholder="priya@email.com"
              type="email"
              required
            />

            <div>
              <label className="block text-sm text-[#8b9cb3] mb-3">Care modes</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CARE_MODES.map((mode) => {
                  const cfg = CARE_MODE_ICONS[mode.id];
                  const selected = form.care_modes.includes(mode.id);
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => toggleMode(mode.id)}
                      className={`text-left p-4 rounded-xl border transition flex gap-3 ${
                        selected
                          ? "border-[#4ecdc4] bg-[#4ecdc4]/10"
                          : "border-white/10 hover:border-white/20 bg-background"
                      }`}
                    >
                      {cfg && (
                        <cfg.Icon size={28} color={cfg.color} variant={cfg.variant || "Bulk"} />
                      )}
                      <div>
                        <div className="font-medium text-sm">{mode.label}</div>
                        <div className="text-xs text-[#8b9cb3] mt-1">{mode.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-[#ff6b6b] text-sm">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full h-12 rounded-full text-base">
              {loading ? "Creating..." : "Launch Command Center"}
              {!loading && <ArrowRight2 size={20} color="#fff" />}
            </Button>
          </form>

          <p className="text-xs text-[#8b9cb3] mt-6 text-center">
            Neuroloom coordinates care — it does not provide medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-muted-foreground mb-1.5">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full py-3 rounded-xl bg-background border border-white/10 focus:border-[#4ecdc4] focus:outline-none transition ${icon ? "pl-11 pr-4" : "px-4"}`}
        />
      </div>
    </div>
  );
}
