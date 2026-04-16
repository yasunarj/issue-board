import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_APP_PASSWORD,
  },
});

type SendMailArgs = {
  to: string,
  subject: string;
  text: string;
};

export const sendMail = async ({ to, subject, text }: SendMailArgs) => {
  if (!process.env.NOTIFY_TO) {
    throw new Error("NOTIFY_TO is not set");
  }

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    text,
  })
}

export const sendNotifyMail = async ({
  subject,
  text,
}: Omit<SendMailArgs, "to">) => {
  if (!process.env.NOTIFY_TO) {
    throw new Error("NOTIFY_TO is not set")
  }

  await sendMail({
    to: process.env.NOTIFY_TO,
    subject,
    text,
  })
}