# Tuition Finder API

Next.js 16 (App Router, route handlers only) + PostgreSQL + Prisma 7 + Resend email verification.
Backend for the Expo mobile app. There is no web UI.

## Setup

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # fill in the values
npm run db:migrate -- --name init
npm run db:seed             # sample cities, subjects, levels (edit prisma/seed.ts first)
npm run dev                 # http://localhost:3000/api/health
```

Requires Node 20.9+.

### Environment
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Runtime connection. Use your provider's **pooled** URL on Vercel. |
| `DIRECT_URL` | Direct connection for migrations (optional). |
| `JWT_SECRET` | 32+ chars. `openssl rand -base64 48` |
| `RESEND_API_KEY` | From resend.com |
| `EMAIL_FROM` | `onboarding@resend.dev` only delivers to your own Resend account email. For real users, verify a domain in Resend and send from it. |

### Creating an admin
Register normally, verify the email, then set `role = 'ADMIN'` for that user (`npm run db:studio`).

## Auth flow (mobile)
1. `POST /api/auth/register` → account created, 6-digit code emailed (valid 10 min, 5 attempts, 60 s resend cooldown). `role` is `SEEKER` (anyone looking for a tutor — students and parents share this one role, since they do the same thing) or `TUTOR`.
2. `POST /api/auth/verify-email` `{ email, code }` → returns `{ token, user }`. Store the token in Expo SecureStore.
3. Send `Authorization: Bearer <token>` on protected requests. Tokens last 7 days.
4. Later logins: `POST /api/auth/login`. Unverified accounts get `403 EMAIL_NOT_VERIFIED`, so show the code screen and call `resend-verification`.

## Endpoints
| Method | Path | Access |
|---|---|---|
| GET | `/api/health` | public |
| POST | `/api/auth/register` | public (roles: SEEKER, TUTOR) |
| POST | `/api/auth/verify-email` | public |
| POST | `/api/auth/resend-verification` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | signed in |
| GET | `/api/cities`, `/api/cities/:cityId/localities`, `/api/subjects`, `/api/levels` | public (cached) |
| GET | `/api/tutors?cityId&localityId&subjectId&levelId&teachingMode&maxFee&q&page&limit` | public, verified tutors only |
| GET | `/api/tutors/:id` | public; includes `averageRating`/`reviewCount`; phone only for signed-in, email-verified users |
| GET / PUT | `/api/tutors/me` | TUTOR (PUT creates/updates own profile, starts unverified) |
| POST | `/api/inquiries` `{ tutorProfileId, message }` | signed in, verified — contact a tutor |
| GET | `/api/inquiries/sent?page&limit` | signed in — inquiries you've sent |
| GET | `/api/inquiries/received?status&page&limit` | TUTOR — inquiries sent to your profile |
| PATCH | `/api/inquiries/:id/status` `{ status: NEW\|CONTACTED\|CLOSED }` | TUTOR — must own the inquiry |
| GET | `/api/tutors/:id/reviews?page&limit` | public — includes `averageRating` |
| POST | `/api/tutors/:id/reviews` `{ rating, comment? }` | signed in, verified — creates or updates your own review (one per tutor) |
| DELETE | `/api/reviews/:id` | signed in — must be the review's author |
| GET | `/api/admin/tutors?status=pending\|verified` | ADMIN |
| PATCH | `/api/admin/tutors/:id/verify` `{ isVerified }` | ADMIN |

Errors always look like `{ "error": { "code", "message", "details?" } }`.

## Admin dashboard (web)
A small server-rendered dashboard lives at `/admin`, styled with Tailwind CSS v4 (`postcss.config.mjs`, `src/app/admin/admin.css`).

- `/admin/login` — email/password sign-in. Only `role = ADMIN` accounts can log in here.
- `/admin/tutors?status=pending|verified` — review and approve/revoke tutor profiles.
- Auth is a separate httpOnly cookie (`admin_token`), not the mobile app's bearer token. `src/proxy.ts` (Next's edge middleware) blocks any `/admin/*` page without a valid admin cookie and redirects to `/admin/login`.
- Pages read the database directly with Prisma (no self-fetch over HTTP), so they only run on the Node runtime, not the edge.

## Not built yet
Password reset, tutor document uploads, rate limiting on login, push notifications, requirement postings (students/parents posting what they need — table already exists), a "change password" page in `/admin`.
