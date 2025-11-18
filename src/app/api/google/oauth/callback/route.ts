import { NextResponse } from 'next/server';

// One-time helper route to exchange a Google "code" for tokens.
// Use this ONLY in local development to obtain APP_GOOGLE_DRIVE_REFRESH_TOKEN,
// then remove or protect it.

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'missing_code', message: 'No ?code= param in URL' },
        { status: 400 },
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_OAUTH_REDIRECT_URI ||
      'http://localhost:3000/api/google/oauth/callback';

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error: 'missing_env',
          message:
            'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in env.',
        },
        { status: 500 },
      );
    }

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = (await tokenRes.json()) as any;

    return NextResponse.json(data);
  } catch (err) {
    console.error('google oauth callback error', err);
    return NextResponse.json(
      { error: 'oauth_callback_failed' },
      { status: 500 },
    );
  }
}

