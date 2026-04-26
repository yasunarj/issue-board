import { Hono } from "hono";
import { AppEnv } from "../app";
import OpenAI from "openai";

const ai = new Hono<AppEnv>();

ai.get("/test", async (c) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return c.json({ ok: false, message: "OPENAI_KEY is not set" }, 500);
  }

  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: "Issue Boardへの一言応援メッセージをください。",
  });

  return c.json({
    ok: true,
    text: response.output_text,
  });
});

ai.post("/format-text", async (c) => {

  try {
    const body = await c.req.json();
    const text = body.text;

    if (!text || typeof text !== "string") {
      return c.json(
        { ok: false, message: "text is required", },
        400
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return c.json({ ok: false, message: "OPENAI_API_KEY is not set" }, 500);
    }

    const client = new OpenAI({ apiKey });

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

export default ai;