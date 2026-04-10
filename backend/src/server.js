const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const Stripe = require("stripe");
const dayjs = require("dayjs");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = Number(process.env.PORT || 4000);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PAYMENT_BUCKET = process.env.PAYMENT_BUCKET || "payment-screenshots";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  // Fail fast: backend must have valid Supabase credentials.
  throw new Error("Missing Supabase environment variables.");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "8mb" }));

function isMissingTableError(error) {
  return error?.code === "42P01" || /relation .* does not exist/i.test(error?.message || "");
}

function toSafeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.replace("Bearer ", "").trim();
}

async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid auth token" });
    }

    req.user = data.user;
    req.token = token;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Auth middleware failed", details: error.message });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("admins")
      .select("role")
      .eq("email", req.user.email)
      .single();

    if (error || !data) {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.admin = data;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Admin verification failed", details: error.message });
  }
}

async function getSubscriptionForUser(userId) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && isMissingTableError(error)) {
    return {
      user_id: userId,
      plan: "free",
      billing_cycle: "monthly",
      status: "active",
      start_date: new Date().toISOString(),
      end_date: dayjs().add(7, "day").toISOString(),
      approved_by_admin: false,
    };
  }

  if (error) throw error;

  if (data) return data;

  const trialEnd = dayjs().add(7, "day").toISOString();
  const { data: created, error: createError } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan: "free",
      billing_cycle: "monthly",
      status: "active",
      start_date: new Date().toISOString(),
      end_date: trialEnd,
      approved_by_admin: false,
    })
    .select("*")
    .single();

  if (createError) throw createError;
  return created;
}

function computeStreaks(logRows = []) {
  const completedDates = logRows
    .filter((x) => x.status === "completed")
    .map((x) => x.date)
    .sort();

  if (!completedDates.length) {
    return { currentStreak: 0, longestStreak: 0, completionRate: 0 };
  }

  let longest = 1;
  let current = 1;

  for (let i = 1; i < completedDates.length; i += 1) {
    const prev = dayjs(completedDates[i - 1]);
    const next = dayjs(completedDates[i]);
    const diff = next.diff(prev, "day");

    if (diff === 1) {
      current += 1;
    } else if (diff > 1) {
      current = 1;
    }

    longest = Math.max(longest, current);
  }

  const today = dayjs().startOf("day");
  let streakTail = 0;

  for (let i = completedDates.length - 1; i >= 0; i -= 1) {
    const target = dayjs(completedDates[i]).startOf("day");
    const expected = today.subtract(streakTail, "day");
    if (target.isSame(expected, "day")) {
      streakTail += 1;
    } else if (target.isBefore(expected, "day")) {
      break;
    }
  }

  return {
    currentStreak: streakTail,
    longestStreak: longest,
    completionRate: Math.round((completedDates.length / logRows.length) * 100),
  };
}

app.get("/api/health", (_, res) => {
  res.json({ ok: true, service: "habit-tracker-backend" });
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabasePublic.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ user: data.user, session: data.session });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ user: data.user, session: data.session });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/logout", requireAuth, async (req, res) => {
  try {
    const { error } = await supabasePublic.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/habits", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("habits")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error && isMissingTableError(error)) return res.json({ habits: [] });
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ habits: data });
});

app.post("/api/habits", requireAuth, async (req, res) => {
  try {
    const sub = await getSubscriptionForUser(req.user.id);
    const { count, error: countError } = await supabaseAdmin
      .from("habits")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", req.user.id);

    if (countError && isMissingTableError(countError)) {
      return res.status(503).json({ error: "Habits table is not ready yet." });
    }
    if (countError) {
      return res.status(400).json({ error: countError.message });
    }

    const isPremium = sub.plan === "premium" && sub.status === "active";
    if (!isPremium && (count || 0) >= 3) {
      return res.status(403).json({ error: "Free plan allows maximum 3 habits." });
    }

    const payload = {
      user_id: req.user.id,
      title: req.body.title,
      description: req.body.description || "",
      frequency: req.body.frequency || "daily",
    };

    const { data, error } = await supabaseAdmin.from("habits").insert(payload).select("*").single();
    if (error && isMissingTableError(error)) {
      return res.status(503).json({ error: "Habits table is not ready yet." });
    }
    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ habit: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.put("/api/habits/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from("habits")
    .update({
      title: req.body.title,
      description: req.body.description,
      frequency: req.body.frequency,
    })
    .eq("id", id)
    .eq("user_id", req.user.id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ habit: data });
});

app.delete("/api/habits/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin.from("habits").delete().eq("id", id).eq("user_id", req.user.id);
  if (error) return res.status(400).json({ error: error.message });

  return res.json({ success: true });
});

app.post("/api/habit-logs", requireAuth, async (req, res) => {
  const { habit_id, date, status } = req.body;

  const { data: ownedHabit } = await supabaseAdmin
    .from("habits")
    .select("id")
    .eq("id", habit_id)
    .eq("user_id", req.user.id)
    .single();

  if (!ownedHabit) {
    return res.status(403).json({ error: "Invalid habit." });
  }

  const { data, error } = await supabaseAdmin
    .from("habit_logs")
    .upsert({ habit_id, date, status }, { onConflict: "habit_id,date" })
    .select("*")
    .single();

  if (error && isMissingTableError(error)) {
    return res.status(503).json({ error: "Habit logs table is not ready yet." });
  }
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json({ log: data });
});

app.get("/api/habit-logs", requireAuth, async (req, res) => {
  const { data: habits } = await supabaseAdmin
    .from("habits")
    .select("id")
    .eq("user_id", req.user.id);

  if (!habits) return res.json({ logs: [] });

  const habitIds = (habits || []).map((h) => h.id);
  if (!habitIds.length) return res.json({ logs: [] });

  const { data, error } = await supabaseAdmin
    .from("habit_logs")
    .select("*")
    .in("habit_id", habitIds)
    .order("date", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ logs: data });
});

app.get("/api/analytics", requireAuth, async (req, res) => {
  const { data: habits } = await supabaseAdmin
    .from("habits")
    .select("id,title")
    .eq("user_id", req.user.id);

  if (!habits) {
    return res.json({
      overview: { currentStreak: 0, longestStreak: 0, completionRate: 0 },
      weekly: [],
      monthly: [],
    });
  }

  const habitIds = (habits || []).map((h) => h.id);
  if (!habitIds.length) {
    return res.json({
      overview: { currentStreak: 0, longestStreak: 0, completionRate: 0 },
      weekly: [],
      monthly: [],
    });
  }

  const { data: logs, error } = await supabaseAdmin
    .from("habit_logs")
    .select("*")
    .in("habit_id", habitIds)
    .order("date", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });

  const overview = computeStreaks(logs || []);

  const weeklyMap = {};
  const monthlyMap = {};
  for (const row of logs || []) {
    const weekKey = dayjs(row.date).startOf("week").format("YYYY-MM-DD");
    const monthKey = dayjs(row.date).startOf("month").format("YYYY-MM");

    if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { period: weekKey, completed: 0, total: 0 };
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { period: monthKey, completed: 0, total: 0 };

    weeklyMap[weekKey].total += 1;
    monthlyMap[monthKey].total += 1;
    if (row.status === "completed") {
      weeklyMap[weekKey].completed += 1;
      monthlyMap[monthKey].completed += 1;
    }
  }

  return res.json({
    overview,
    weekly: Object.values(weeklyMap),
    monthly: Object.values(monthlyMap),
  });
});

app.post("/api/motivation", requireAuth, async (req, res) => {
  try {
    const { emotion = "neutral", missedHabit = false } = req.body;

    const prompt = [
      "You are a motivational coach for a daily habits app.",
      `User emotion: ${emotion}`,
      `Missed habit today: ${missedHabit}`,
      "Return JSON with keys: quote, habit_suggestion, insight.",
    ].join("\n");

    const fallback = {
      quote: missedHabit
        ? "Missing one task does not break momentum. Restart with the next action."
        : "Consistency compounds faster than motivation fades.",
      habit_suggestion: missedHabit
        ? "Pick the smallest version of the habit and complete it now."
        : "Keep your current habit stable and add one repeatable cue.",
      insight: emotion === "sad" || emotion === "lazy"
        ? "Lower the difficulty, shorten the session, and protect the streak."
        : "Small wins create durable routines when repeated daily.",
    };

    let parsed = fallback;

    if (GEMINI_API_KEY) {
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          }
        );

        if (geminiResponse.ok) {
          const raw = await geminiResponse.json();
          const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          parsed = JSON.parse(text);
        }
      } catch {
        parsed = fallback;
      }
    }

    const { error: aiError } = await supabaseAdmin.from("ai_insights").insert({
      user_id: req.user.id,
      emotion,
      prompt,
      response_json: parsed,
    });

    if (aiError && !isMissingTableError(aiError)) {
      return res.status(400).json({ error: aiError.message });
    }

    return res.json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/subscription/status", requireAuth, async (req, res) => {
  try {
    const sub = await getSubscriptionForUser(req.user.id);
    return res.json({ subscription: sub });
  } catch (error) {
    if (isMissingTableError(error)) {
      return res.json({
        subscription: {
          user_id: req.user.id,
          plan: "free",
          status: "active",
          start_date: new Date().toISOString(),
          end_date: dayjs().add(7, "day").toISOString(),
          approved_by_admin: false,
        },
      });
    }
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/subscription/stripe", requireAuth, async (req, res) => {
  if (!stripe) return res.status(400).json({ error: "Stripe not configured" });

  try {
    const billingCycle = req.body?.billing_cycle === "yearly" ? "yearly" : "monthly";
    const amount = billingCycle === "yearly" ? 7000 : 700;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: { name: `Habit Tracker Premium (${billingCycle})` },
          },
          quantity: 1,
        },
      ],
      success_url: `${FRONTEND_URL}/dashboard?payment=success`,
      cancel_url: `${FRONTEND_URL}/dashboard?payment=cancelled`,
      metadata: { user_id: req.user.id, billing_cycle: billingCycle },
    });

    return res.json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/subscription/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) return res.status(400).json({ error: "Stripe not configured" });

  let event;
  try {
    if (STRIPE_WEBHOOK_SECRET) {
      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body.toString("utf8"));
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session?.metadata?.user_id;
      if (userId) {
        await supabaseAdmin.from("subscriptions").insert({
          user_id: userId,
          plan: "premium",
          status: "active",
          start_date: new Date().toISOString(),
          end_date: dayjs().add(30, "day").toISOString(),
          approved_by_admin: true,
        });
      }
    }

    return res.json({ received: true });
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

app.post("/api/subscription/manual", requireAuth, upload.single("screenshot"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Screenshot is required." });
    const billingCycle = req.body?.billing_cycle === "yearly" ? "yearly" : "monthly";
    const paymentPhone = req.body?.payment_phone || "";

    const filename = `${req.user.id}/${Date.now()}-${req.file.originalname}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(PAYMENT_BUCKET)
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError && isMissingTableError(uploadError)) {
      return res.status(503).json({ error: "Payment storage bucket is not ready yet." });
    }
    if (uploadError) return res.status(400).json({ error: uploadError.message });

    const { data: publicUrlData } = supabaseAdmin.storage.from(PAYMENT_BUCKET).getPublicUrl(filename);

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id: req.user.id,
        plan: "premium",
        billing_cycle: billingCycle,
        status: "pending",
        payment_phone: paymentPhone,
        screenshot_url: publicUrlData.publicUrl,
        start_date: new Date().toISOString(),
        end_date: dayjs().add(30, "day").toISOString(),
        approved_by_admin: false,
      })
      .select("*")
      .single();

    if (error && isMissingTableError(error)) {
      return res.status(503).json({ error: "Subscriptions table is not ready yet." });
    }
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ subscription: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/approve-payment", requireAuth, requireAdmin, async (req, res) => {
  const { subscription_id, action } = req.body;

  const payload = {
    status: action === "approve" ? "active" : "expired",
    approved_by_admin: action === "approve",
  };

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update(payload)
    .eq("id", subscription_id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });

  await supabaseAdmin.from("notifications").insert({
    user_id: data.user_id,
    message:
      action === "approve"
        ? "Your premium payment has been approved."
        : "Your payment was rejected. Please upload a new screenshot.",
    read: false,
  });

  return res.json({ subscription: data });
});

app.get("/api/admin/users", requireAuth, requireAdmin, async (_, res) => {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id,user_id,plan,billing_cycle,status,start_date,end_date,screenshot_url,payment_phone,approved_by_admin")
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ subscriptions: data });
});

app.post("/api/admin/notify-user", requireAuth, requireAdmin, async (req, res) => {
  const { user_id, message } = req.body;

  if (!user_id || !message) {
    return res.status(400).json({ error: "user_id and message are required" });
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert({ user_id, message, read: false })
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json({ notification: data });
});

app.get("/api/notifications", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ notifications: data });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
