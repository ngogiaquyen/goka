interface SendOtpParams {
  email: string;
  code: string;
}

export async function sendOtpEmail({ email, code }: SendOtpParams) {
  // SMTP (e.g. Gmail) support
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM ?? smtpUser ?? "otp@goka.dev";

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    const { default: nodemailer } = await import("nodemailer");

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // 465 = implicit TLS, 587 = STARTTLS
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: "Mã OTP xác thực Goka Wheel",
      text: `Mã xác thực của bạn là ${code}. Mã có hiệu lực trong 10 phút.`,
    });

    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "otp@goka.dev";

  // Fallback to console for local dev without API key
  if (!apiKey) {
    console.log(`[DEV] OTP for ${email}: ${code}`);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Mã OTP xác thực Goka Wheel",
      text: `Mã xác thực của bạn là ${code}. Mã có hiệu lực trong 10 phút.`,
    }),
  });
}
