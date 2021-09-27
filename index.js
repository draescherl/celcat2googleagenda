const axios = require('axios');
const dotenv = require('dotenv');
const FormData = require('form-data');

dotenv.config();


// =============================================================================================
// =============================================================================================
// =============================================================================================


main();

async function main() {

  const auth_page_html = await get_auth_page_html();
  const creds = build_credentials(auth_page_html);
  const headers = build_headers(auth_page_html);
  const unused = await log_on(headers, creds);
  const params = build_params();
  const calendarData = await getCalendarData(headers, params);
  console.log(calendarData);

}


// =============================================================================================
// =============================================================================================
// =============================================================================================


async function get_auth_page_html() {
  try {
    const resp = await axios.get('https://services-web.u-cergy.fr/calendar/LdapLogin');
    return resp;
  } catch (err) {
    console.error(err);
  }
}

async function log_on(headers, creds) {

  let config = {
    method: 'post',
    url: 'https://services-web.u-cergy.fr/calendar/LdapLogin/Logon',
    headers: headers,
    data: creds
  }

  axios(config)
    .then(res => {
      return res.data;
    })
    .catch(err => {
      console.log(err);
    })

  // try {
  //   const resp = await axios.post('https://services-web.u-cergy.fr/calendar/LdapLogin/Logon', creds, config);
  //   return resp;
  // } catch (err) {
  //   console.error(err);
  // }
}

async function getCalendarData(headers, data) {

  let config = {
    method: 'post',
    url: 'https://services-web.u-cergy.fr/calendar/Home/GetCalendarData',
    headers: headers,
    data: data
  };

  axios(config)
    .then(function (response) {
      return JSON.stringify(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });

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

function build_headers(res) {
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

  let data = new FormData();
  data.append('start', '2021-09-27');
  data.append('end', '2021-10-03');
  data.append('resType', '104');
  data.append('calView', 'agendaWeek');
  data.append('federationIds[]', '21916219');

  return data;
}

