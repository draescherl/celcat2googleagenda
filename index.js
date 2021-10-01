const axios = require('axios');
const dotenv = require('dotenv');
const FormData = require('form-data');

dotenv.config();


// =============================================================================================
// =============================================================================================
// =============================================================================================


main();

async function main() {

  const token_and_cookies = await get_token_and_cookies();
  const token = token_and_cookies.token;
  const cookies = token_and_cookies.cookies;
  await log_on(token, cookies);
  const data = create_form_data();
  const timetable = await get_timetable_as_json(data, cookies);

  console.log(timetable[0]);

}


// =============================================================================================
// =============================================================================================
// =============================================================================================


async function get_token_and_cookies() {
  try {
    let result = {
      token: "",
      cookies: ""
    }

    const auth_page_response = await axios.get('https://services-web.u-cergy.fr/calendar/LdapLogin');
    const token_starting_point = auth_page_response.data.search('__RequestVerificationToken');
    const token = get_token_from_string(token_starting_point, auth_page_response.data);

    result.token = token;
    result.cookies = auth_page_response.headers['set-cookie'][0].split(';')[0];
    return result;
  } catch (err) {
    console.log(err);
  }
}


async function log_on(token, cookies) {
  try {
    let creds = new URLSearchParams();
    creds.append("Name", process.env.NAME);
    creds.append("Password", process.env.PASSWORD);
    creds.append("__RequestVerificationToken", token);

    console.log(cookies);

    const default_headers = {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36"
    }

    const headers = {
      headers: {
        ...default_headers,
        cookie: cookies,
        'content-type': 'application/x-www-form-urlencoded'
      }
    }

    const res = await axios.post('https://services-web.u-cergy.fr/calendar/LdapLogin/Logon', creds, headers);
    console.log(res.headers);
  } catch (err) {
    console.log(err);
  }
}


async function get_timetable_as_json(form_data, cookies) {
  try {
    const headers = {
      headers: {
        'Cookie': cookies,
        ...form_data.getHeaders()
      }
    }

    const response = await axios.post('https://services-web.u-cergy.fr/calendar/Home/GetCalendarData', form_data, headers);
    return response.data;
  } catch (err) {
    console.log(err);
  }
}


// =============================================================================================
// =============================================================================================
// =============================================================================================


function create_form_data() {
  const today = new Date();
  const next_week = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const today_formated = today.toISOString().split('T')[0];
  const next_week_formated = next_week.toISOString().split('T')[0];

  let data = new FormData();
  data.append('start', today_formated);
  data.append('end', next_week_formated);
  data.append('resType', '104');
  data.append('calView', 'agendaWeek');
  data.append('federationIds[]', '21916219'); // Celui de jenna : 21916187

  return data;
}


function get_token_from_string(index, str) {
  let token = "";
  let tmp = "";

  while (!tmp.includes("value=\"")) tmp += str[index++];
  while (str[index] != "\"") token += str[index++];

  return token;
}