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
  let webViewLink = res.data.webViewLink || undefined;
  if (!fileId) throw new Error('Drive upload did not return a file id');

  // Make the file accessible to anyone with the link so students
  // can open it without logging into the owner account.
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  } catch (err) {
    console.error('Failed to set Drive file public', err);
  }

  if (!webViewLink) {
    webViewLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  }

  return { fileId, webViewLink };
}
