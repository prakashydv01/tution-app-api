export const metadata = { title: "Privacy Policy — Tuition Finder" };

// Standalone page: no shared root layout exists in this API-only project (only
// /admin has its own layout), so this page provides its own <html><body>, same
// pattern as src/app/admin/layout.tsx. Plain inline styles — no Tailwind
// dependency, so this page has zero risk of affecting the admin dashboard.
export default function PrivacyPolicyPage() {
  return (
    <html lang="en">
      <body style={styles.body}>
        <main style={styles.main}>
          <h1 style={styles.h1}>Privacy Policy</h1>
          <p style={styles.updated}>Last updated: [DATE]</p>

          <p style={styles.p}>
            Tuition Finder ("the App", "we", "us") helps students and parents ("Seekers") find
            tutors, and helps tutors find students, in [YOUR CITY/COUNTRY]. This policy explains
            what information we collect, how we use it, and your choices.
          </p>

          <h2 style={styles.h2}>Information we collect</h2>
          <ul style={styles.ul}>
            <li style={styles.li}><strong>Account information:</strong> name, email address, phone number (optional), and your chosen password (stored only as a secure hash — we never see or store your actual password).</li>
            <li style={styles.li}><strong>Tutor profile information:</strong> if you register as a tutor, the subjects and levels you teach, your city and locality, fees, teaching mode, and a short bio.</li>
            <li style={styles.li}><strong>Activity information:</strong> inquiries you send or receive, reviews you post, and tutoring requests you post.</li>
            <li style={styles.li}><strong>Push notification token:</strong> a device identifier used only to deliver notifications to your device, if you allow notifications.</li>
          </ul>

          <h2 style={styles.h2}>How we use this information</h2>
          <ul style={styles.ul}>
            <li style={styles.li}>To create and manage your account, and verify your email address.</li>
            <li style={styles.li}>To show Seekers relevant tutors, and tutors relevant requests, based on city, subject, and level.</li>
            <li style={styles.li}>To let Seekers and tutors contact each other through the app.</li>
            <li style={styles.li}>To send account-related emails (verification codes, password resets) and optional push notifications (new inquiries, review alerts, profile approval).</li>
          </ul>

          <h2 style={styles.h2}>Who we share information with</h2>
          <p style={styles.p}>
            We do not sell your personal information. We use the following third-party services to
            operate the app, each of which processes data only as needed to provide their service to us:
          </p>
          <ul style={styles.ul}>
            <li style={styles.li}><strong>Supabase</strong> — hosts our database.</li>
            <li style={styles.li}><strong>Vercel</strong> — hosts our backend server.</li>
            <li style={styles.li}><strong>Resend</strong> — delivers our verification and password-reset emails.</li>
            <li style={styles.li}><strong>Expo</strong> — delivers push notifications to your device, if enabled.</li>
          </ul>
          <p style={styles.p}>
            A tutor's name, headline, bio, fees, and location are visible to anyone using the app, by
            design, since the app's purpose is to help Seekers find and evaluate tutors. A tutor's
            phone number is only shown to Seekers who are signed in with a verified email address.
          </p>

          <h2 style={styles.h2}>Data retention and deletion</h2>
          <p style={styles.p}>
            We keep your information for as long as your account is active. You may request deletion
            of your account and associated data at any time by contacting us at [YOUR CONTACT EMAIL].
          </p>

          <h2 style={styles.h2}>Children's privacy</h2>
          <p style={styles.p}>
            This app is not directed at children under 13, and we do not knowingly collect
            information from children under 13.
          </p>

          <h2 style={styles.h2}>Changes to this policy</h2>
          <p style={styles.p}>
            We may update this policy from time to time. Changes will be posted on this page with an
            updated date above.
          </p>

          <h2 style={styles.h2}>Contact us</h2>
          <p style={styles.p}>
            If you have questions about this policy or your data, contact us at{" "}
            <strong>[YOUR CONTACT EMAIL]</strong>.
          </p>
        </main>
      </body>
    </html>
  );
}

const styles = {
  body: { margin: 0, fontFamily: "Arial, sans-serif", background: "#fafafa", color: "#111" },
  main: { maxWidth: 680, margin: "0 auto", padding: "48px 24px 80px" },
  h1: { fontSize: 28, marginBottom: 4 },
  updated: { color: "#6b7280", fontSize: 14, marginBottom: 32 },
  h2: { fontSize: 19, marginTop: 32, marginBottom: 10 },
  p: { fontSize: 15, lineHeight: 1.6, marginBottom: 14 },
  ul: { paddingLeft: 20, marginBottom: 14 },
  li: { fontSize: 15, lineHeight: 1.6, marginBottom: 8 },
} as const;