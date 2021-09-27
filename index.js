const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();


// =============================================================================================
// =============================================================================================
// =============================================================================================


main();

async function main() {

  const resToken = await getToken();
  const creds = build_credentials(resToken);
  const config = get_config(resToken);
  const resLogon = await logon(creds, config);
  const params = build_params();
  const calendarData = await getCalendarData(params);
  console.log(calendarData);

}

// axios.interceptors.request.use(req => {
//   console.log('------------------------------------------------------------------------');
//   console.log(req);
//   console.log('------------------------------------------------------------------------');
//   return req;
// });


// =============================================================================================
// =============================================================================================
// =============================================================================================


async function getToken() {
  try {
    const resp = await axios.get('https://services-web.u-cergy.fr/calendar/LdapLogin');
    return resp;
  } catch (err) {
    console.error(err);
  }
}

async function logon(creds, config) {
  try {
    const resp = await axios.post('https://services-web.u-cergy.fr/calendar/LdapLogin/Logon', creds, config);
    return resp;
  } catch (err) {
    console.error(err);
  }
}

async function getCalendarData(params) {
  try {
    const resp = await axios.post('https://services-web.u-cergy.fr/calendar/Home/GetCalendarData', params, {
      headers: {
        'Content-Type': 'multipart/form-data',
        //'Cookie': res.headers['set-cookie'][0]
      }
    });
    return resp;
  } catch (err) {
    console.error(err);
  }
  
}


// =============================================================================================
// =============================================================================================
// =============================================================================================


function build_credentials(res) {

  const token_starting_point = res.data.search('__RequestVerificationToken');
  const token = get_token_from_string(token_starting_point, res.data);

  let creds = new URLSearchParams();
  creds.append("Name", process.env.NAME);
  creds.append("Password", process.env.PASSWORD);
  creds.append("__RequestVerificationToken", token);

  return creds;
}

function get_config(res) {
  return {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': res.headers['set-cookie'][0]
    }
  }
}

function build_params() {
  const today = new Date();
  const next_week = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const today_formated = today.toISOString().split('T')[0];
  const next_week_formated = next_week.toISOString().split('T')[0];

  return {
    "start": today_formated,
    "end": next_week_formated,
    "resType": 104,
    "calView": "agendaWeek",
    "federationIds[]": 21916219
  }
}

function get_token_from_string(index, str) {
  let token = "";
  let tmp = "";

  while (!tmp.includes("value=\"")) tmp += str[index++];
  while (str[index] != "\"") token += str[index++];

  return token;
}