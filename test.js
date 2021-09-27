const axios = require('axios');
const FormData = require('form-data');


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
  data.append('federationIds[]', '21916219');

  return data;
}

function get_token() {
  let config = {
    method: 'get',
    url: 'https://services-web.u-cergy.fr/calendar/LdapLogin'
  }

  axios(config)
  .then(response => {
    // console.log(response.data);
    const token_starting_point = response.data.search('__RequestVerificationToken');
    console.log(token_starting_point);
    const token = get_token_from_string(token_starting_point, response.data);
    return token;
  })
  .catch(error => {
    console.log(error);
  })
}

function get_token_from_string(index, str) {
  let token = "";
  let tmp = "";

  while (!tmp.includes("value=\"")) tmp += str[index++];
  while (str[index] != "\"") token += str[index++];

  return token;
}

function get_cookies() {

}

function log_on() {

}

function get_calendar_data(data) {
  let config = {
    method: 'post',
    url: 'https://services-web.u-cergy.fr/calendar/Home/GetCalendarData',
    headers: { 
      'Cookie': '.AspNetCore.Antiforgery.H-YZBixxRx0=CfDJ8J4P7cLbSltBu9qBlxhvj-V8dU7ZSxtATMfwiVUPulsuAmdxqFQnwkNTzqwF3wEqZAmADMqa3kYnFTDZNQdhn00_A-Wnrced8S-Hx-C_AEZoCnFpIWobPwfFHDY740Nm_afXw_aNKdke5fTOCW4n9eo; .AspNetCore.Cookies=CfDJ8J4P7cLbSltBu9qBlxhvj-UKK7kffQKlcyt4n3oK63aKGLjznog5vJFRMRdQLo8m_DLpzJS78jZM03_W3JBRA_UXFyJwYy9Ooa9_jE7_wbweAc0BnM_3MmR5taIzypTIEN-C3BCwS4K8_-Gp6AJOtw9bmOk-HPmI29DkdkPPoQXotal_BtQAo6CO7dLzFIJ0-kqt1ozbM23RH_RGHBO7HbvxtxqcT6x6GsUbX8I_EvkY-K_MFgJmrtWH7nX6GDlhLnE_nnnE__fQjZa31T9wonA; CalendarAuthReturnUrl=https%3A%2F%2Fservices-web.u-cergy.fr%2Fcalendar', 
      ...data.getHeaders()
    },
    data : data
  };
  
  axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
  })
  .catch(function (error) {
    console.log(error);
  });
}

// let data = create_form_data();
// get_calendar_data(data);
const token = get_token();
console.log(token);