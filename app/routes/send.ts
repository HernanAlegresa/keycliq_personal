import { json } from '@remix-run/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const loader = async () => {
  const { data, error } = await resend.emails.send({
    from: 'KeyCliq <onboarding@resend.dev>',
    to: ['delivered@resend.dev'],
    subject: 'Hello from KeyCliq!',
    html: '<strong>It works! KeyCliq email system is ready.</strong>',
  });

  if (error) {
    return json({ error }, 400);
  }

  return json(data, 200);
};
