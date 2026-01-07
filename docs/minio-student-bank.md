# Student Bank: MinIO (S3) PDF Storage

This project stores Student Bank PDF uploads in a private MinIO bucket (S3-compatible) and serves them via short-lived signed URLs.

## Required env vars

- `S3_ENDPOINT` (e.g. `http://127.0.0.1:9000`)
- `S3_PUBLIC_ENDPOINT` (optional; public/browser URL used for signed URLs, e.g. `https://s3.example.com`)
- `S3_REGION` (optional, default `us-east-1`)
- `S3_FORCE_PATH_STYLE` (must be `true` for MinIO in most setups)
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_BUCKET_STUDENT_RESOURCES` (optional, default `cloudai-student-resources`)

Student Bank feature flag (server-enforced):
- Firestore `app_settings/student_bank.uploadsEnabled` (boolean)

## Local testing

1) Start MinIO and create the bucket (or let MinIO auto-create if enabled).
2) Run the app: `npm run dev`
3) Health check (owner/admin only):
   - `GET /api/s3/health`
4) Upload test:
   - Go to `/student-bank`
   - Sign in
   - Upload a valid PDF
   - A Firestore doc is created in `student_resources` with `status: "pending"` and a `pdfKey`.

## Viewing files

- Approved resources are listed publicly, but the underlying objects remain private.
- The UI requests a signed URL from `POST /api/student-bank/signed-url` with `{ "key": "<pdfKey>" }`.
- Signed URLs expire after ~10 minutes.
- If the PDF uploads but won’t render inline, your `S3_ENDPOINT` is likely not reachable from the browser (or it’s `http` while the site is `https`). Set `S3_PUBLIC_ENDPOINT` to a browser-reachable `https` URL.
- Inline preview uses a same-origin proxy `GET /api/student-bank/file?key=...` to avoid browser iframe restrictions when MinIO sets frame-blocking headers.

## Vercel notes

- Large multipart uploads may be rejected by the platform (HTTP 413). The UI keeps the existing fallback behavior: upload to your own Google Drive and paste the link.
- Ensure `S3_ENDPOINT` is reachable from Vercel (publicly accessible or via a network path Vercel can reach).
