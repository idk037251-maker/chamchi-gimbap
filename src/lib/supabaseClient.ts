/**
 * Supabase REST / Auth / Storage / Realtime bridge (dependency-free, uses fetch + WebSocket).
 *
 * - If NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set (Vercel env or .env.production),
 *   the app runs in "cloud mode": everything is persisted in Supabase and synced in realtime.
 * - Otherwise it falls back to a local demo mode (localStorage + BroadcastChannel).
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface RealtimeEvent {
  table: string;
  record: any;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (envUrl && envKey && !envUrl.includes("your-project")) {
    return { url: envUrl.replace(/\/$/, ""), anonKey: envKey };
  }

  if (typeof window === "undefined") return null;

  const storedUrl = localStorage.getItem("chamchi_supabase_url");
  const storedKey = localStorage.getItem("chamchi_supabase_anon_key");
  if (storedUrl && storedKey) {
    return { url: storedUrl.replace(/\/$/, ""), anonKey: storedKey };
  }
  return null;
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("chamchi_supabase_url", url.trim());
  localStorage.setItem("chamchi_supabase_anon_key", anonKey.trim());
}

export function clearSupabaseConfig() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("chamchi_supabase_url");
  localStorage.removeItem("chamchi_supabase_anon_key");
}

export class SupabaseBridge {
  private config: SupabaseConfig | null = null;
  private socket: WebSocket | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private realtimeListeners: ((evt: RealtimeEvent) => void)[] = [];
  private manuallyClosed = false;

  constructor() {
    this.config = getSupabaseConfig();
  }

  public isCloudConnected(): boolean {
    return !!this.config && !!this.config.url && !!this.config.anonKey;
  }

  public refreshConfig() {
    this.config = getSupabaseConfig();
  }

  /**
   * Legacy anon keys are JWTs ("eyJ...") and may be sent as Bearer tokens.
   * Newer publishable keys ("sb_publishable_...") are not JWTs, so only the apikey header is sent.
   */
  private headers(extra: Record<string, string> = {}, bearer?: string) {
    if (!this.config) return extra;
    const h: Record<string, string> = { apikey: this.config.anonKey, ...extra };
    const token = bearer || (this.config.anonKey.startsWith("eyJ") ? this.config.anonKey : "");
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }

  // ---------------------------------------------------------------- Auth

  public async signUpWithEmail(
    email: string,
    password: string,
    metadata: { name: string; pronouns: string }
  ) {
    if (!this.config) throw new Error("Supabase is not configured.");
    const res = await fetch(`${this.config.url}/auth/v1/signup`, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ email, password, data: metadata }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error_description || "회원가입 실패");
    return data;
  }

  public async signInWithPassword(email: string, password: string) {
    if (!this.config) throw new Error("Supabase is not configured.");
    const res = await fetch(`${this.config.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error_description || "로그인 실패");
    return data;
  }

  /** Builds the Supabase Google OAuth URL. After login Supabase redirects back with #access_token=... */
  public getGoogleOAuthUrl(redirectTo?: string): string {
    if (!this.config) return "";
    let target = redirectTo;
    if (!target && typeof window !== "undefined") {
      target = `${window.location.origin}${window.location.pathname}`.replace(/\/$/, "");
    }
    const redirect = encodeURIComponent(target || "");
    return `${this.config.url}/auth/v1/authorize?provider=google&redirect_to=${redirect}`;
  }

  /** Resolves the Supabase auth user from an access token (used after the Google OAuth redirect). */
  public async getUserFromAccessToken(accessToken: string): Promise<any | null> {
    if (!this.config) return null;
    try {
      const res = await fetch(`${this.config.url}/auth/v1/user`, {
        headers: this.headers({}, accessToken),
      });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }

  // ------------------------------------------------------------- Storage

  public async uploadFile(
    bucket: "avatars" | "banners",
    file: File | Blob,
    fileName: string
  ): Promise<string> {
    if (!this.config) throw new Error("Supabase is not configured.");
    const cleanName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const res = await fetch(`${this.config.url}/storage/v1/object/${bucket}/${cleanName}`, {
      method: "POST",
      headers: this.headers({ "Content-Type": file.type || "image/png" }),
      body: file,
    });
    if (!res.ok) {
      throw new Error(`이미지 업로드 실패: ${await res.text()}`);
    }
    return `${this.config.url}/storage/v1/object/public/${bucket}/${cleanName}`;
  }

  // ------------------------------------------------------------ Database

  public async fetchProfile(id: string): Promise<any | null> {
    if (!this.config) return null;
    try {
      const res = await fetch(
        `${this.config.url}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
        { headers: this.headers() }
      );
      if (!res.ok) return null;
      const rows = await res.json();
      return rows[0] || null;
    } catch {
      return null;
    }
  }

  public async upsertProfile(profile: any): Promise<boolean> {
    if (!this.config) return false;
    try {
      const res = await fetch(`${this.config.url}/rest/v1/profiles`, {
        method: "POST",
        headers: this.headers({
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        }),
        body: JSON.stringify({ ...profile, updated_at: new Date().toISOString() }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async fetchCommunities(): Promise<any[]> {
    if (!this.config) return [];
    try {
      const res = await fetch(
        `${this.config.url}/rest/v1/communities?select=*&order=created_at.desc`,
        { headers: this.headers() }
      );
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  }

  public async insertCommunity(community: any): Promise<boolean> {
    if (!this.config) return false;
    try {
      const res = await fetch(`${this.config.url}/rest/v1/communities`, {
        method: "POST",
        headers: this.headers({ "Content-Type": "application/json", Prefer: "return=minimal" }),
        body: JSON.stringify(community),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async fetchMessages(communityId: string, channelId: string): Promise<any[]> {
    if (!this.config) return [];
    try {
      const res = await fetch(
        `${this.config.url}/rest/v1/messages?community_id=eq.${encodeURIComponent(
          communityId
        )}&channel_id=eq.${encodeURIComponent(channelId)}&order=created_at.asc&limit=200`,
        { headers: this.headers() }
      );
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  }

  public async insertMessage(message: any): Promise<boolean> {
    if (!this.config) return false;
    try {
      const res = await fetch(`${this.config.url}/rest/v1/messages`, {
        method: "POST",
        headers: this.headers({ "Content-Type": "application/json", Prefer: "return=minimal" }),
        body: JSON.stringify(message),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------ Realtime

  /**
   * Subscribes to INSERTs on `messages` and `communities` via the Supabase Realtime
   * Phoenix protocol. Reconnects automatically if the socket drops.
   */
  public connectRealtime(listener: (evt: RealtimeEvent) => void) {
    if (!this.config) return;
    if (!this.realtimeListeners.includes(listener)) this.realtimeListeners.push(listener);
    this.manuallyClosed = false;
    this.openSocket();
  }

  private openSocket() {
    if (!this.config) return;
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const cfg = this.config;
    const wsUrl =
      cfg.url.replace(/^http/, "ws") +
      `/realtime/v1/websocket?apikey=${encodeURIComponent(cfg.anonKey)}&vsn=1.0.0`;

    try {
      const socket = new WebSocket(wsUrl);
      this.socket = socket;

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            topic: "realtime:chamchi",
            event: "phx_join",
            payload: {
              config: {
                broadcast: { self: false },
                presence: { key: "" },
                postgres_changes: [
                  { event: "INSERT", schema: "public", table: "messages" },
                  { event: "INSERT", schema: "public", table: "communities" },
                ],
              },
              ...(cfg.anonKey.startsWith("eyJ") ? { access_token: cfg.anonKey } : {}),
            },
            ref: "1",
            join_ref: "1",
          })
        );

        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: "hb" })
            );
          }
        }, 25000);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event !== "postgres_changes") return;
          const change = data.payload?.data;
          if (!change?.record) return;
          const evt: RealtimeEvent = { table: change.table, record: change.record };
          this.realtimeListeners.forEach((fn) => fn(evt));
        } catch (e) {
          console.error("Realtime parse error:", e);
        }
      };

      socket.onclose = () => {
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        this.socket = null;
        if (!this.manuallyClosed) {
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.openSocket(), 3000);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    } catch (e) {
      console.warn("Realtime connection failed:", e);
    }
  }

  public disconnectRealtime() {
    this.manuallyClosed = true;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.realtimeListeners = [];
  }
}

export const supabaseBridge = new SupabaseBridge();
