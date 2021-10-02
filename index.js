const fetch = require('node-fetch');
const dotenv = require('dotenv');
const FormData = require('form-data');

dotenv.config();


// =============================================================================================
// =============================================================================================
// =============================================================================================


(async () => {
  const token_and_cookies = await get_token_and_cookies();
  const other_cookies = await log_on(token_and_cookies.token, token_and_cookies.cookies);
  const calendar_data = await get_calendar(other_cookies);
  const data = calendar_data[calendar_data.length - 2];

  // const parsed = parse_course(data);
  const parsed = parser(calendar_data);
  console.log(parsed);

  // console.log(data.description);
  // start
  // end
  // description
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

async function get_calendar(cookies) {
  const today = new Date();
  const next_week = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const today_formated = today.toISOString().split('T')[0];
  const next_week_formated = next_week.toISOString().split('T')[0];

  let form_data = new FormData();
  form_data.append('start', today_formated);
  form_data.append('end', next_week_formated);
  form_data.append('resType', '104');
  form_data.append('calView', 'agendaWeek');
  form_data.append('federationIds[]', '21916219'); // Celui de jenna : 21916187

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
  
  const start = course.start;
  const end = course.end;
  const description = format_description(course.description);
  const split_on_PAU = description.split("PAU");
  const salle = split_on_PAU[1].split(' ')[1];
  const name = (split_on_PAU[0].split(' ').length > 2) ? split_on_PAU[0].split(' ').slice(0,-3).join(' ') : split_on_PAU[0].split(' ')[0];
  
  // console.log(salle, '---', name, '---', description);
  return {
    start: start,
    end: end,
    name: name,
    salle: salle
  };
}

function format_description(desc) {
  desc = desc.replaceAll('<br />', ' ');
  desc = desc.replaceAll('\r\n', '');
  desc = desc.replaceAll('&#233;', 'é');
  desc = desc.replaceAll('&#201;', 'É');
  desc = desc.replaceAll('&#194;', 'À');

  return desc;
}