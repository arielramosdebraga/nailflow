/* eslint-disable require-jsdoc */
import {google, calendar_v3} from "googleapis";
import {
  buildDedicatedCalendarSummary,
  getGoogleCalendarScopes,
  getGoogleOAuthConfig,
} from "./config";

interface CodeExchangeResult {
  refreshToken: string | null;
}

interface CalendarIdentity {
  displayName: string;
  email: string;
  uid: string;
}

function createOAuthClient() {
  const config = getGoogleOAuthConfig();

  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
}

async function withCalendarClient<T>(
  refreshToken: string,
  callback: (calendarApi: calendar_v3.Calendar) => Promise<T>
): Promise<T> {
  const oauthClient = createOAuthClient();
  oauthClient.setCredentials({refresh_token: refreshToken});

  const calendarApi = google.calendar({
    version: "v3",
    auth: oauthClient,
  });

  return callback(calendarApi);
}

export function buildGoogleCalendarAuthUrl(state: string): string {
  const oauthClient = createOAuthClient();

  return oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: getGoogleCalendarScopes(),
    state,
  });
}

export async function exchangeCodeForRefreshToken(
  code: string
): Promise<CodeExchangeResult> {
  const oauthClient = createOAuthClient();
  const tokenResponse = await oauthClient.getToken(code);

  return {
    refreshToken: tokenResponse.tokens.refresh_token ?? null,
  };
}

async function findDedicatedCalendarId(
  refreshToken: string,
  expectedSummary: string
): Promise<string | null> {
  return withCalendarClient(refreshToken, async (calendarApi) => {
    let pageToken: string | undefined;

    do {
      const response = await calendarApi.calendarList.list({
        maxResults: 250,
        pageToken,
      });

      const items = response.data.items ?? [];
      const found = items.find(
        (entry: calendar_v3.Schema$CalendarListEntry) =>
          entry.summary === expectedSummary
      );

      if (found?.id) {
        return found.id;
      }

      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken);

    return null;
  });
}

export async function ensureDedicatedCalendar(
  refreshToken: string,
  identity: CalendarIdentity
): Promise<string> {
  const calendarSummary = buildDedicatedCalendarSummary(
    identity.displayName,
    identity.email,
    identity.uid
  );

  const existingCalendarId = await findDedicatedCalendarId(
    refreshToken,
    calendarSummary
  );

  if (existingCalendarId) {
    return existingCalendarId;
  }

  return withCalendarClient(refreshToken, async (calendarApi) => {
    const createdCalendar = await calendarApi.calendars.insert({
      requestBody: {
        summary: calendarSummary,
        description: "Calendario dedicado NailFlow para sincronizacao.",
        timeZone: "America/Sao_Paulo",
      },
    });

    const createdCalendarId = createdCalendar.data.id;

    if (!createdCalendarId) {
      throw new Error("Google Calendar did not return the created calendar id.");
    }

    return createdCalendarId;
  });
}

export async function createGoogleCalendarEvent(
  refreshToken: string,
  calendarId: string,
  eventPayload: calendar_v3.Schema$Event
): Promise<string> {
  return withCalendarClient(refreshToken, async (calendarApi) => {
    const response = await calendarApi.events.insert({
      calendarId,
      requestBody: eventPayload,
    });

    const eventId = response.data.id;

    if (!eventId) {
      throw new Error("Google Calendar did not return an event id.");
    }

    return eventId;
  });
}

export async function updateGoogleCalendarEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string,
  eventPayload: calendar_v3.Schema$Event
): Promise<void> {
  await withCalendarClient(refreshToken, async (calendarApi) => {
    await calendarApi.events.patch({
      calendarId,
      eventId,
      requestBody: eventPayload,
    });
  });
}

export async function deleteGoogleCalendarEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  await withCalendarClient(refreshToken, async (calendarApi) => {
    try {
      await calendarApi.events.delete({
        calendarId,
        eventId,
      });
    } catch (error) {
      const status =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as {code?: unknown}).code === "number" ?
          (error as {code: number}).code :
          null;

      if (status === 404) {
        return;
      }

      throw error;
    }
  });
}
