import { Resend } from 'resend';

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { name, email, phone, message } = await request.json();

  try {
    await resend.emails.send({
      from: 'Astana Go <onboarding@resend.dev>',
      to: 'kapkaz595@gmail.com',
      subject: `新留言来自 ${name}`,
      html: `<p>姓名: ${name}</p><p>邮箱: ${email}</p><p>电话: ${phone || '未填写'}</p><p>留言: ${message}</p>`,
    });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
