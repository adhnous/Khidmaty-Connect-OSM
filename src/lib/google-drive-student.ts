import 'server-only';
import { google } from 'googleapis';
import { Readable } from 'stream';
import type { StudentResource } from '@/lib/student-bank';

/**
 * NOTE:
 * We no longer use a service account for Drive uploads, because
 * service accounts have no storage quota in personal "My Drive".
 *
 * Instead we act as a normal Google user via OAuth2, using:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_OAUTH_REDIRECT_URI
 * - APP_GOOGLE_DRIVE_REFRESH_TOKEN
 *
 * All Student Bank files will live in that user's Drive.
 */

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    'http://localhost:3000/api/google/oauth/callback';
  const refreshToken = process.env.APP_GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and APP_GOOGLE_DRIVE_REFRESH_TOKEN.',
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

export async function getDriveClient() {
  const auth = getOAuthClient();
  return google.drive({ version: 'v3', auth });
}

export async function uploadStudentFileToDrive(options: {
  file: File;
  folderId: string;
  title: string;
  type: StudentResource['type'];
}): Promise<{ fileId: string; webViewLink?: string }> {
  const drive = await getDriveClient();

  const arrayBuffer = await options.file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = options.file.type || 'application/pdf';

  const stream = Readable.from(buffer);

  const res = await drive.files.create({
    requestBody: {
      name: options.file.name || options.title,
      parents: [options.folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, webViewLink',
  });

  const fileId = res.data.id || '';
  const webViewLink = res.data.webViewLink || undefined;
  if (!fileId) throw new Error('Drive upload did not return a file id');

  // Optionally we could also set the file permission to "anyone with link"
  // here. For now, callers can do it separately if needed.

  return { fileId, webViewLink };
}

