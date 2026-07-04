"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Add,
  ArrowRight2,
  Category,
  Cpu,
  DocumentUpload,
  Health,
  Heart,
  People,
  Profile2User,
  TaskSquare,
  TickCircle,
  Warning2,
  Setting2,
} from "iconsax-react";
import { api, AgentRun, ActivityItem, AgentStats, getWsUrl, Medication } from "@/lib/api";
import {
  BRAND,
  BrandLogo,
  Category as CategoryIcon,
  DocumentText,
  Flash as FlashIcon,
  Health as HealthIcon,
} from "@/lib/icons";
import AgentFeed from "@/components/AgentFeed";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import { GemmaHealthBadge } from "@/components/dashboard/GemmaHealthBadge";
import { DashboardSettings } from "@/components/dashboard/DashboardSettings";
import dynamic from "next/dynamic";
import { ControlAction } from "@/lib/control-settings";
import { saveCircleSession } from "@/lib/circle-session";
import { getAuthSession, roleLabel } from "@/lib/auth-session";

const DashboardInteractiveControls = dynamic(
  () =>
    import("@/components/dashboard/DashboardInteractiveControls").then(
      (m) => m.DashboardInteractiveControls
    ),
  { ssr: false }
);

type Tab = "overview" | "meds" | "documents" | "handoffs" | "checkins" | "tasks" | "emergency" | "settings";

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const [circleId, setCircleId] = useState<string>("");
  const [circle, setCircle] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [agents, setAgents] = useState<AgentRun[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [medText, setMedText] = useState(
    "Metformin 500mg twice daily with meals. Lisinopril 10mg every morning."
  );
  const [handoffFrom, setHandoffFrom] = useState("Priya");
  const [handoffTo, setHandoffTo] = useState("Raj");
  const [handoffs, setHandoffs] = useState<
    Array<{ id: string; briefing?: string; from_member: string; to_member: string; acknowledged: boolean }>
  >([]);
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [newTask, setNewTask] = useState("");
  const [checkInMood, setCheckInMood] = useState(4);
  const [checkInNotes, setCheckInNotes] = useState("");
  const [emergencyPack, setEmergencyPack] = useState<{
    share_token: string;
    content: string;
    pin: string;
  } | null>(null);
  const [documents, setDocuments] = useState<Array<{ id: string; filename: string; summary?: string }>>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [authUser] = useState(() => (typeof window !== "undefined" ? getAuthSession() : null));

  useEffect(() => {
    params.then((p) => {
      setCircleId(p.id);
      saveCircleSession(p.id);
    });
  }, [params]);

  const refresh = useCallback(async () => {
    if (!circleId) return;
    const [c, m, a, h, t, d, act, stats] = await Promise.all([
      api.getCircle(circleId),
      api.getMedications(circleId),
      api.getAgents(circleId),
      api.getHandoffs(circleId),
      api.getTasks(circleId),
      api.getDocuments(circleId),
      api.getActivity(circleId),
      api.getAgentStats(circleId),
    ]);
    setCircle(c);
    setMeds(m);
    setAgents(a);
    setHandoffs(h as typeof handoffs);
    setTasks(t as typeof tasks);
    setDocuments(d as typeof documents);
    setActivity(act);
    setAgentStats(stats);
  }, [circleId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!circleId) return;
    const ws = new WebSocket(getWsUrl(circleId));
    ws.onmessage = (ev) => {
      const event = JSON.parse(ev.data);
      setAgents((prev) => [
        {
          id: Date.now().toString(),
          agent_name: event.agent,
          status: event.status,
          message: event.message,
          model_route: event.route,
          created_at: event.timestamp,
          metadata: event.metadata || {},
        },
        ...prev,
      ]);
    };
    return () => ws.close();
  }, [circleId]);

  const extractMeds = async () => {
    setLoading(true);
    try {
      await api.extractMedications(circleId, medText);
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const createHandoff = async () => {
    setLoading(true);
    try {
      await api.createHandoff(circleId, handoffFrom, handoffTo);
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    await api.createTask(circleId, newTask);
    setNewTask("");
    await refresh();
  };

  const submitCheckIn = async () => {
    await api.createCheckIn(circleId, { mood: checkInMood, notes: checkInNotes });
    setCheckInNotes("");
    await refresh();
  };

  const genEmergency = async () => {
    setLoading(true);
    try {
      const pack = await api.generateEmergency(circleId);
      setEmergencyPack(pack as typeof emergencyPack);
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const uploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      await api.uploadDocument(circleId, file, file.name.includes("discharge") ? "discharge" : "other");
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleControlAction = async (action: Exclude<ControlAction, `tab_${Tab}`>) => {
    switch (action) {
      case "action_analyze_meds":
        setTab("meds");
        await extractMeds();
        break;
      case "action_handoff":
        setTab("handoffs");
        await createHandoff();
        break;
      case "action_checkin":
        setTab("checkins");
        await submitCheckIn();
        break;
      case "action_emergency":
        setTab("emergency");
        await genEmergency();
        break;
      case "action_help":
        setTab("overview");
        break;
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Command Center", icon: <Category size={20} color="currentColor" variant="Bulk" /> },
    { id: "meds", label: "MedGuard", icon: <Health size={20} color="currentColor" variant="Bulk" /> },
    { id: "documents", label: "Vault", icon: <DocumentText size={20} color="currentColor" variant="Bulk" /> },
    { id: "handoffs", label: "Handoffs", icon: <People size={20} color="currentColor" variant="Bulk" /> },
    { id: "checkins", label: "Check-ins", icon: <Heart size={20} color="currentColor" variant="Bulk" /> },
    { id: "tasks", label: "Family Sync", icon: <TaskSquare size={20} color="currentColor" variant="Bulk" /> },
    { id: "emergency", label: "Emergency", icon: <Warning2 size={20} color="currentColor" variant="Bold" /> },
    { id: "settings", label: "Settings", icon: <Setting2 size={20} color="currentColor" variant="Bulk" /> },
  ];

  if (!circleId)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center gap-3">
        <Cpu size={24} color={BRAND.teal} className="animate-pulse" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r border-white/10 p-4 flex flex-col gap-1 hidden md:flex bg-card">
        <Link href="/" className="flex items-center gap-2 mb-6 px-2 hover:opacity-90">
          <BrandLogo size={32} />
          <span className="font-semibold">Neuroloom</span>
        </Link>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
              tab === t.id ? "bg-[#4ecdc4]/15 text-[#4ecdc4]" : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
        <Link
          href="/onboarding?new=1"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-500 hover:bg-white/5 transition"
        >
          <Add size={20} color="currentColor" />
          New care circle
        </Link>
        <Link
          href={`/senior?circle=${circleId}`}
          className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#ff8e8e] hover:bg-white/5 transition"
        >
          <Heart size={20} color="#ff8e8e" variant="Bulk" />
          Senior View
        </Link>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen">
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-card">
          <div>
            <h1 className="text-xl font-bold">{(circle?.name as string) || "Care Circle"}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Profile2User size={14} color="#8b9cb3" />
              {(circle?.recipient as { name?: string })?.name || "—"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {authUser && (
              <span className="hidden sm:inline text-xs text-muted-foreground">
                {authUser.name} · {roleLabel(authUser.role)}
              </span>
            )}
            <GemmaHealthBadge />
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex gap-2 overflow-x-auto mb-6 md:hidden pb-2">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs whitespace-nowrap ${
                    tab === t.id ? "bg-[#4ecdc4]/20 text-[#4ecdc4]" : "card"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={<HealthIcon size={24} color={BRAND.teal} variant="Bulk" />} label="Medications" value={meds.length} />
                  <StatCard icon={<DocumentText size={24} color="#a78bfa" variant="Bulk" />} label="Documents" value={documents.length} />
                  <StatCard icon={<People size={24} color="#ff8e8e" variant="Bulk" />} label="Handoffs" value={handoffs.length} />
                  <StatCard icon={<CategoryIcon size={24} color="#60a5fa" variant="Bulk" />} label="Agent runs" value={agentStats?.total_runs ?? agents.length} />
                </div>
                {agentStats && agentStats.recent_pipelines.length > 0 && (
                  <div className="card p-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Cpu size={16} color={BRAND.coral} variant="Bulk" />
                      Recent Agent Pipelines
                    </h3>
                    <div className="space-y-2">
                      {agentStats.recent_pipelines.slice(0, 5).map((p, i) => (
                        <div key={`${p.at}-${i}`} className="text-xs font-mono text-[#4ecdc4] bg-white/5 rounded-lg px-3 py-2">
                          <span className="text-muted-foreground mr-2">{p.action}</span>
                          {(p.pipeline || []).join(" → ")}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <ActivityTimeline items={activity} />
                <KnowledgeGraph circleId={circleId} />
              </div>
            )}

            {tab === "meds" && (
              <div className="space-y-6 max-w-2xl">
                <div className="card p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Health size={22} color={BRAND.teal} variant="Bulk" />
                    Extract Medications
                  </h2>
                  <textarea
                    value={medText}
                    onChange={(e) => setMedText(e.target.value)}
                    className="w-full h-32 px-4 py-3 rounded-xl bg-background border border-white/10 focus:border-[#4ecdc4] focus:outline-none text-sm"
                    placeholder="Paste prescription text..."
                  />
                  <button
                    onClick={extractMeds}
                    disabled={loading}
                    className="mt-4 px-6 py-3 rounded-xl bg-[#4ecdc4] text-[#0b1426] font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? "MedGuard analyzing..." : "Analyze with MedGuard"}
                  </button>
                </div>
                {meds.map((m) => (
                  <div key={m.id} className="card p-4 flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      <Health size={20} color={BRAND.teal} variant="Bulk" className="shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {m.dose} · {m.schedule}
                        </div>
                        {m.instructions && <div className="text-xs text-muted-foreground mt-1">{m.instructions}</div>}
                      </div>
                    </div>
                    {!m.confirmed ? (
                      <button
                        onClick={() => api.confirmMedication(circleId, m.id).then(refresh)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[#ff6b6b]/20 text-[#ff8e8e] shrink-0"
                      >
                        Confirm
                      </button>
                    ) : (
                      <span className="text-xs text-[#4ecdc4] flex items-center gap-1 shrink-0">
                        <TickCircle size={14} color={BRAND.teal} variant="Bold" />
                        Confirmed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === "documents" && (
              <div className="space-y-6 max-w-2xl">
                <div className="card p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <DocumentUpload size={22} color="#a78bfa" variant="Bulk" />
                    Upload Care Document
                  </h2>
                  <input type="file" accept=".pdf,.txt" onChange={uploadDoc} className="text-sm" />
                  <p className="text-xs text-muted-foreground mt-2">PDF discharge papers, insurance cards, POA</p>
                </div>
                {documents.map((d) => (
                  <div key={d.id} className="card p-4 flex gap-3">
                    <DocumentText size={20} color="#a78bfa" variant="Bulk" className="shrink-0" />
                    <div>
                      <div className="font-medium">{d.filename}</div>
                      <p className="text-sm text-muted-foreground mt-2">{d.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "handoffs" && (
              <div className="space-y-6 max-w-2xl">
                <div className="card p-6 grid grid-cols-2 gap-4">
                  <input
                    value={handoffFrom}
                    onChange={(e) => setHandoffFrom(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-background border border-white/10"
                    placeholder="From"
                  />
                  <input
                    value={handoffTo}
                    onChange={(e) => setHandoffTo(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-background border border-white/10"
                    placeholder="To"
                  />
                  <button
                    onClick={createHandoff}
                    disabled={loading}
                    className="col-span-2 py-3 rounded-xl bg-[#ff6b6b] font-semibold flex items-center justify-center gap-2 hover:bg-[#ff8e8e] transition"
                  >
                    <People size={20} color="#fff" variant="Bulk" />
                    Generate Handoff Briefing
                  </button>
                </div>
                {handoffs.map((h) => (
                  <div key={h.id} className="card p-6">
                    <div className="text-sm text-[#4ecdc4] mb-2 flex items-center gap-2">
                      <ArrowRight2 size={16} color={BRAND.teal} />
                      {h.from_member} → {h.to_member}
                    </div>
                    <pre className="text-sm whitespace-pre-wrap text-muted-foreground font-sans">{h.briefing}</pre>
                  </div>
                ))}
              </div>
            )}

            {tab === "checkins" && (
              <div className="max-w-md space-y-6">
                <div className="card p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Heart size={22} color="#f472b6" variant="Bulk" />
                    Daily Check-in
                  </h2>
                  <label className="text-sm text-muted-foreground">Mood (1-5)</label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={checkInMood}
                    onChange={(e) => setCheckInMood(+e.target.value)}
                    className="w-full mt-2"
                  />
                  <div className="text-center text-2xl my-2">{checkInMood}/5</div>
                  <textarea
                    value={checkInNotes}
                    onChange={(e) => setCheckInNotes(e.target.value)}
                    placeholder="How are you feeling today?"
                    className="w-full h-24 px-4 py-3 rounded-xl bg-background border border-white/10 mt-4 text-sm"
                  />
                  <button
                    onClick={submitCheckIn}
                    className="w-full mt-4 py-3 rounded-xl bg-[#4ecdc4] text-[#0b1426] font-semibold"
                  >
                    Submit Check-in
                  </button>
                </div>
              </div>
            )}

            {tab === "tasks" && (
              <div className="max-w-md space-y-4">
                <div className="flex gap-2">
                  <input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="New family task..."
                    className="flex-1 px-4 py-3 rounded-xl bg-background border border-white/10"
                  />
                  <button
                    onClick={addTask}
                    className="px-4 py-3 rounded-xl bg-[#4ecdc4] text-[#0b1426] font-semibold flex items-center gap-1"
                  >
                    <Add size={20} color="#0b1426" />
                    Add
                  </button>
                </div>
                {tasks.map((t) => (
                  <div key={t.id} className="card p-4 flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                      <TaskSquare size={18} color="#34d399" variant="Bulk" />
                      <span className={t.completed ? "line-through text-muted-foreground" : ""}>{t.title}</span>
                    </div>
                    {!t.completed && (
                      <button
                        onClick={() => api.completeTask(circleId, t.id).then(refresh)}
                        className="text-xs text-[#4ecdc4] flex items-center gap-1"
                      >
                        <TickCircle size={14} color={BRAND.teal} variant="Bold" />
                        Done
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === "emergency" && (
              <div className="max-w-2xl space-y-6">
                <button
                  onClick={genEmergency}
                  disabled={loading}
                  className="px-8 py-4 rounded-xl bg-[#ff6b6b] font-bold text-lg hover:bg-[#ff8e8e] transition flex items-center gap-3"
                >
                  <Warning2 size={24} color="#fff" variant="Bold" />
                  {loading ? "Compiling..." : "Generate Emergency Pack"}
                </button>
                {emergencyPack && (
                  <div className="card p-6 border-[#ff6b6b]/40">
                    <div className="text-sm text-[#ff8e8e] mb-4 flex items-center gap-2">
                      <FlashIcon size={16} color="#ff8e8e" variant="Bold" />
                      Share: /emergency?token={emergencyPack.share_token}&pin={emergencyPack.pin}
                    </div>
                    <pre className="text-sm whitespace-pre-wrap text-muted-foreground font-sans">{emergencyPack.content}</pre>
                  </div>
                )}
              </div>
            )}

            {tab === "settings" && (
              <DashboardSettings
                circleName={(circle?.name as string) || undefined}
                careModes={(circle?.care_modes as string[]) || []}
              />
            )}
          </div>

          <div className="w-80 border-l border-white/10 hidden lg:block">
            <AgentFeed agents={agents} />
          </div>
        </div>
      </main>

      {tab !== "emergency" && (
        <button
          onClick={() => setTab("emergency")}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#ff6b6b] shadow-lg shadow-[#ff6b6b]/30 flex items-center justify-center hover:scale-105 transition z-40 lg:hidden"
          aria-label="Emergency"
        >
          <Warning2 size={28} color="#fff" variant="Bold" />
        </button>
      )}

      <DashboardInteractiveControls
        activeTab={tab}
        onTabChange={setTab}
        onAction={handleControlAction}
      />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
