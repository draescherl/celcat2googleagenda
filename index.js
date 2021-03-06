// noinspection SpellCheckingInspection,JSUnresolvedVariable

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const FormData = require('form-data');

dotenv.config();


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'private/token.json';

// Delay to avoid a "Time Rate Exceeded" error from the calendar API
const DELAY = 750;

const IDs = [
  {
    studentID: "21916220",
    calendarID: "c_butjsd14hb0bkqbkrnu37qkb18@group.calendar.google.com",
    group: "GSIG2"
  },
  {
    studentID: "21916195",
    calendarID: "c_s8bo9q25pj55hg4om4b9ie69h0@group.calendar.google.com",
    group: "GSIG1"
  },
  {
    studentID: "21916187",
    calendarID: "c_0vhb4293n9ip27umqk3ej9vegs@group.calendar.google.com",
    group: "GMI"
  },
  // {
  //   studentID: "21916220",
  //   calendarID: "c_bdcqp77b4njc9r57s4i1j98p3o@group.calendar.google.com",
  //   group: "GSIG2-tests"
  // }
];


// =============================================================================================
// =============================================================================================
// =============================================================================================


(async () => {

  console.log("[1] Reaching website... ");
  const token_and_cookies = await get_token_and_cookies();
  console.log("[2] Got token and cookies. Logging in... ");
  const other_cookies = await log_on(token_and_cookies.token, token_and_cookies.cookies);
  console.log("[3] Logged in successfully, reading 'credentials.json'... ");
  const content = fs.readFileSync('./private/credentials.json');
  console.log("[4] Credentials read, logging in to the Google Calendar API... ");
  const oAuth2Client = authorize(JSON.parse(content));
  console.log("[5] Logged in successfully.");

  for (const group of IDs) {

    console.log(`\nDeleting events for [${group.group}].`);
    await deleteEvents(oAuth2Client, group.calendarID);
    console.log(`All events for [${group.group}] have been deleted.`);

    const calendar_data = await get_calendar(other_cookies, group.studentID);
    const parsed = parser(calendar_data);

    console.log(`\nCreating events for [${group.group}].`);
    await saveDataInCalendar(parsed, group.calendarID, oAuth2Client);
    console.log(`All events for [${group.group}] have been created.`);
  }

  console.log('Program finished running successfully.');
})();


// =============================================================================================
// =============================================================================================
// =============================================================================================


async function get_token_and_cookies() {

  const result = await make_request('https://services-web.u-cergy.fr/calendar/LdapLogin', 'GET');
  const html = await result.text();
  const token_starting_point = html.search('__RequestVerificationToken');

  return {
    cookies: result.headers.get('set-cookie').split(';')[0],
    token: get_token_from_string(token_starting_point, html)
  }
}

async function log_on(token, cookies) {
  let creds = new URLSearchParams();
  creds.append("Name", process.env.NAME);
  creds.append("Password", process.env.PASSWORD);
  creds.append("__RequestVerificationToken", token);

  const result = await make_request(
    'https://services-web.u-cergy.fr/calendar/LdapLogin/Logon',
    'POST',
    {
      cookie: cookies,
      'content-type': 'application/x-www-form-urlencoded'
    },
    creds
  );

  return result.headers.get('set-cookie').split(';')[0];
}

async function get_calendar(cookies, studentID) {
  const today = new Date();
  const next_week = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 28);
  const today_formatted = today.toISOString().split('T')[0];
  const next_week_formatted = next_week.toISOString().split('T')[0];

  let form_data = new FormData();
  form_data.append('start', today_formatted);
  form_data.append('end', next_week_formatted);
  form_data.append('resType', '104');
  form_data.append('calView', 'agendaWeek');
  form_data.append('federationIds[]', studentID);

  const result = await make_request(
    'https://services-web.u-cergy.fr/calendar/Home/GetCalendarData',
    'POST',
    {
      cookie: cookies,
      ...form_data.getHeaders()
    },
    form_data
  );

  return await result.json();
}


// =============================================================================================
// =============================================================================================
// =============================================================================================


async function make_request(url, method = 'GET', headers = {}, body = null) {
  const default_headers = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "accept-language": "en-US,en;q=0.9",
    "upgrade-insecure-requests": "1",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36"
  }

  return await fetch(url, {
    headers: Object.assign(default_headers, headers),
    method: method,
    redirect: "manual",
    body: body
  });
}

function get_token_from_string(index, str) {
  let token = "";
  let tmp = "";

  while (!tmp.includes("value=\"")) tmp += str[index++];
  while (str[index] !== "\"") token += str[index++];

  return token;
}

function parser(data) {
  let res = [];
  let parsed_course;
  data.forEach(e => {
    parsed_course = parse_course(e);
    if (parsed_course != null) res.push(parsed_course);
  });

  return res;
}

// https://stackoverflow.com/questions/4968250/how-to-round-time-to-the-nearest-quarter-hour-in-javascript
function roundTimeQuarterHour(time) {
  let timeToReturn = new Date(time);
  timeToReturn.setMilliseconds(Math.round(timeToReturn.getMilliseconds() / 1000) * 1000);
  timeToReturn.setSeconds(Math.round(timeToReturn.getSeconds() / 60) * 60);
  timeToReturn.setMinutes(Math.round(timeToReturn.getMinutes() / 15) * 15);
  return timeToReturn;
}

function parse_course(course) {
  let room = "";
  let name = "";
  let start = "";
  let end = "";

  const description = format_description(course.description);

  try {
    if (course.end == null) return null;
    start = roundTimeQuarterHour(course.start);
    end = roundTimeQuarterHour(course.end);
    const split_on_PAU = description.split("PAU");
    room = split_on_PAU[1].split(' ')[1];
    if (split_on_PAU[0].split(' ').length > 3) {
      const tmp = split_on_PAU[0];
      const keywords = ["CM", "TP", "TD"];
      for (k of keywords) {
        if (tmp.split(k).length > 1) {
          name = k + tmp.split(k)[1]
        }
      }
    }
    name = name != "" ? name : name = split_on_PAU[0];
  } catch (error) {
    name = description;
  }

  return {
    start: start,
    end: end,
    name: name,
    room: room
  };
}

function format_description(desc) {
  desc = desc.replaceAll('<br />', ' ');
  desc = desc.replaceAll('\r\n', '');
  desc = desc.replaceAll('&#233;', '??');
  desc = desc.replaceAll('&#232;', '??');
  desc = desc.replaceAll('&#201;', '??');
  desc = desc.replaceAll('&#194;', '??');

  return desc;
}


// =============================================================================================
// =============================================================================================
// =============================================================================================


async function saveDataInCalendar(data, calendarID, auth) {
  let i = 0;
  const today = new Date();

  while (i < data.length) {
    await insertEvent(
      auth,
      {
        'summary': `${data[i].room !== "" ? "[" + data[i].room + "]" : ""} ${data[i].name}`,
        'description': `Mis ?? jour le ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()} ?? ${today.getHours()}h${today.getMinutes()}.`,
        'start': {
          'dateTime': data[i].start,
          'timeZone': 'Europe/Paris',
        },
        'end': {
          'dateTime': data[i].end,
          'timeZone': 'Europe/Paris',
        }
      },
      calendarID
    );

    await new Promise(resolve => setTimeout(resolve, DELAY));
    i++;
  }
}

async function insertEvent(auth, event, calendarId) {
  const calendar = google.calendar({ version: 'v3', auth });

  const insertEventPromise = new Promise(async (resolve) => {
    await calendar.events.insert({
      auth: auth,
      calendarId: calendarId,
      resource: event,
    }, function (err, event) {
      if (err) {
        console.log('Event causing trouble: ', err);
        console.log('There was an error contacting the Calendar service: ' + err);
        return;
      }
      console.log(`Event created: ${event.data.summary} @ ${event.data.start.dateTime}`);
      resolve();
    });

  });
  await insertEventPromise;
}

async function deleteEvents(auth, calendarID) {
  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 2);

  const calendar = google.calendar({ version: 'v3', auth });

  const loadEventsPromise = new Promise(async (loadResolve) => {
    // Load all the events of the given calendar
    await calendar.events.list({
      calendarId: calendarID,
      timeMin: yesterday.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    }, async (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);

      let deleteEventPromise;
      const events = res.data.items;
      console.log("Number of events to delete: ", events.length);

      if (events.length) {
        let i = 0;
        while (i < events.length) {
          deleteEventPromise = new Promise((resolve, reject) => {
            calendar.events.delete({ calendarId: calendarID, eventId: events[i].id }, (err) => {
              if (err) {
                reject();
                return;
              }
              console.log(`Event number ${i + 1} deleted.`);
              resolve();
            });

          });
          await new Promise(resolve => setTimeout(resolve, DELAY));

          await deleteEventPromise;
          i++;
        }
      } else {
        console.log('No events to delete.');
      }
      loadResolve();
    });
  });
  await loadEventsPromise;
}


// =============================================================================================
// =============================================================================================
// =============================================================================================


function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  try {
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    return getAccessToken(oAuth2Client);
  }
}

function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      return oAuth2Client;
    });
  });
}
