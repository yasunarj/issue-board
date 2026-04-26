import { User } from "@supabase/supabase-js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import auditLogs from "./routes/auditLogs.js";
import issues from "./routes/issues.js";
import me from "./routes/me.js";
import internal from "./routes/internal.js";
import OpenAI from "openai";

export type Role = "member" | "admin" | "viewer";

export type AppEnv = {
  Variables: {
    user: User;
    role: Role;
  };
};

export const createApp = () => {
  const app = new Hono<AppEnv>();

  app.use(
    "*",
    cors({
      origin: [
        "http://localhost:3000",
        "https://issue-board-web-umber.vercel.app",
      ],
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.get("/health", (c) => c.json({ ok: true }));
  app.get("/ai/test", async (c) => {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: "Issue Boardへの一言応援メッセージをください。",
    });

    return c.json({
      ok: true,
      text: response.output_text,
    });
  });
  
  app.get("/ai/format-text", async (c) => {
    try {
      const body = await c.req.json();
      const text = body.text;

      if (!text || typeof text !== "string") {
        return c.json(
          { ok: false, message: "text is required", },
          400
        );
      }

      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await client.responses.create({
        model: "gpt-4.1-mini",
        input: `
        あなたは社内Issue管理ツールの文章整形AIです。

        以下の文章を、意味を変えずに、簡潔で丁寧で伝わりやすい業務文章へ整えてください。

        勝手な事実追加は禁止です。
        長くしすぎないでください。

        文章: 
        ${text}
        `,
      });

      return c.json({
        ok: true,
        text: response.output_text,
      });
    } catch (error) {
      console.error(error);

      return c.json({
        ok: false,
        message: "AI formatting failed",
      }, 500);
    }
  })

  app.route("/me", me);
  app.route("/issues", issues);
  app.route("/audit-logs", auditLogs);
  app.route("/internal", internal);

  return app;
};

const app = createApp();

export default app;
