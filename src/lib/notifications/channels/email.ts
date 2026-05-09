// Stub. Real provider (Resend) will be wired here when NOTIFICATIONS_EMAIL_PROVIDER != 'off'.
export async function sendEmail(_to: string, _subject: string, _html: string): Promise<void> {
  return;
}
