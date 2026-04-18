import { Hono } from "hono";
import { AppEnv } from "../app";
import { supabaseAdmin } from "../lib/supabase";
import { sendMail } from "../lib/sendMail";

const internal = new Hono<AppEnv>();

internal.get("/reminders/run", async (c) => {
  if (c.req.header("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: issues, error } = await supabaseAdmin
    .from("issues")
    .select(`
      id,
      title,
      status,
      due_date,
      assigned_to,
      reminder_3days_sent_at,
      reminder_due_sent_at,
      assigned_to_profile:profiles!issues_assigned_to_fkey (
        id,
        display_name
      )
    `)
    .eq("status", "open")
    .not("assigned_to", "is", null)
    .not("due_date", "is", null);

  if (error) {
    console.log(error);
    return c.json({ error: "Failed to fetch reminder targets" }, 500);
  }

  if (!issues || issues.length === 0) {
    return c.json({
      message: "No reminder targets",
      targets: [],
    }, 200);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSameDate = (a: Date, b: Date) => {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }

  const targets = issues.map((issue) => {
    const dueDate = new Date(issue.due_date);
    dueDate.setHours(0, 0, 0, 0);

    const threeDaysBefore = new Date(dueDate);
    threeDaysBefore.setDate(dueDate.getDate() - 3);

    const shouldSendDue = isSameDate(today, dueDate) && issue.reminder_due_sent_at === null;

    const shouldSend3Days = isSameDate(today, threeDaysBefore) && issue.reminder_3days_sent_at === null;

    return {
      ...issue,
      shouldSend3Days,
      shouldSendDue,
    }
  }).filter((issue) => issue.shouldSend3Days || issue.shouldSendDue);

  for(const target of targets ) {
    target.reminder_3days_sent_at
    const userResult = await supabaseAdmin.auth.admin.getUserById(target.assigned_to);
    const email = userResult.data.user?.email;

    sendMail({
      to: email ?? "",
      subject: "",
      text: `
      ` 
    })
  }

  return c.json({
    message: "Reminder check completed",
    targets,
  }, 200);
});

export default internal;