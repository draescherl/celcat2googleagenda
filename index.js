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

const IDs = [
  {
    studentID: "21916219", // ING2 GI G2
    calendarID: "c_butjsd14hb0bkqbkrnu37qkb18@group.calendar.google.com"
  },
  {
    studentID: "21916195", // ING2 GI G1
    calendarID: "c_s8bo9q25pj55hg4om4b9ie69h0@group.calendar.google.com"
  },
  {
    studentID: "21916187", // ING2 GM 
    calendarID: "c_0vhb4293n9ip27umqk3ej9vegs@group.calendar.google.com"
  }
];


// =============================================================================================
// =============================================================================================
// =============================================================================================


(async () => {
  console.log("Je pars à la peche aux tokens!")
  const token_and_cookies = await get_token_and_cookies();
  console.log("J'ai mes tokens !!")
  const other_cookies = await log_on(token_and_cookies.token, token_and_cookies.cookies);
  console.log("Et les copains je suis logged, pouet pouet !")


  const content = fs.readFileSync('./private/credentials.json');
  const oAuth2Client = authorize(JSON.parse(content));


  for (const group of IDs) {

    const deletePromise = new Promise((resolve, reject) => {
      deleteEvents(oAuth2Client, group.calendarID, resolve);
    });

    await deletePromise.then(async () => {
      console.log("tous les events sont deleted");
      const calendar_data = await get_calendar(other_cookies, group.studentID);
      const parsed = parser(calendar_data);
      const savePromise = new Promise((resolve, reject) => {
        saveDataInCalendar(parsed, group.calendarID, oAuth2Client, resolve);
      });
      await savePromise.then(async () => {
        console.log("tous les end sont save!!");
      })
    });
    console.log("Fin de l'edt de ", group.studentID);
  }

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
  const today_formated = today.toISOString().split('T')[0];
  const next_week_formated = next_week.toISOString().split('T')[0];

  let form_data = new FormData();
  form_data.append('start', today_formated);
  form_data.append('end', next_week_formated);
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

  const to_return = await result.json();
  return to_return;
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

  let response = await fetch(url, {
    headers: Object.assign(default_headers, headers),
    method: method,
    redirect: "manual",
    body: body
  });

  return response;
}

function get_token_from_string(index, str) {
  let token = "";
  let tmp = "";

  while (!tmp.includes("value=\"")) tmp += str[index++];
  while (str[index] != "\"") token += str[index++];

  return token;
}

function parser(data) {
  let res = [];
  data.forEach(e => {
    res.push(parse_course(e));
  });

  return res;
}


function parse_course(course) {
  let room = "";
  let name = "";
  let start = "";
  let end = "";
  const description = format_description(course.description);
  try {
    start = course.start;
    end = course.end;
    const split_on_PAU = description.split("PAU");
    room = split_on_PAU[1].split(' ')[1];
    name = (split_on_PAU[0].split(' ').length > 2) ? split_on_PAU[0].split(' ').slice(0, -3).join(' ') : split_on_PAU[0].split(' ')[0];
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
  desc = desc.replaceAll('&#233;', 'é');
  desc = desc.replaceAll('&#232;', 'è');
  desc = desc.replaceAll('&#201;', 'É');
  desc = desc.replaceAll('&#194;', 'À');

  return desc;
}

function saveDataInCalendar(data, calendarID, auth, resolve) {

  var i = 0;
  const intervalObj = setInterval(() => {
    insertEvent(auth, {
      'summary': `${data[i].room != "" ? "[" + data[i].room + "]" : ""} ${data[i].name}`,
      'start': {
        'dateTime': data[i].start,
        'timeZone': 'Europe/Paris',
      },
      'end': {
        'dateTime': data[i].end,
        'timeZone': 'Europe/Paris',
      }
    }, calendarID, resolve, i == data.length - 1);

    i++;
    if (i >= data.length) {
      clearInterval(intervalObj);
    }
  }, 500);
}

function insertEvent(auth, event, calendarId, resolve, needToResolve) {
  const calendar = google.calendar({ version: 'v3', auth });

  calendar.events.insert({
    auth: auth,
    calendarId: calendarId,
    resource: event,
  }, function (err, event) {
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
      return;
    }
    console.log('Event created: %s', event.htmlLink);
    if (needToResolve) {
      resolve();
    }
  });
}


function deleteEvents(auth, calendarID, resolve) {
  let yesterDate = new Date();
  yesterDate.setDate(yesterDate.getDate() - 2);
  const calendar = google.calendar({ version: 'v3', auth });


  // Load all the events of the given calendar
  calendar.events.list({
    calendarId: calendarID,
    timeMin: yesterDate.toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    console.log(events.length);
    if (events.length) {
      var i = 0;

      const intervalObj = setInterval(() => {
        calendar.events.delete({
          calendarId: calendarID, eventId: events[i].id,
        }, function (err) {
          if (err) {
            // console.log('The API returned an error: ' + err);
            return;
          }
          console.log(i, '--Event deleted.');
          if (i == events.length) {
            resolve();
          }
        });
        i++;
        if (i >= events.length) {
          clearInterval(intervalObj);
        }
      }, 600);
    } else {
      console.log('No upcoming events found.');
      resolve();
    }
  });

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