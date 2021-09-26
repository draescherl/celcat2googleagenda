const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

function get_token(index, str) {
  let token = "";
  let tmp = "";
  
  while (!tmp.includes("value=\"")) tmp += str[index++];
  while (str[index] != "\"") token += str[index++];

  return token;
}

let data = new URLSearchParams();
data.append("Name", process.env.NAME);
data.append("Password", process.env.PASSWORD);

axios.get('https://services-web.u-cergy.fr/calendar/LdapLogin').then(res => {
  
  const token_starting_point = res.data.search('__RequestVerificationToken');
  const token = get_token(token_starting_point, res.data);
  data.append("__RequestVerificationToken", token);
  
  console.log(res.headers['set-cookie'][0]);
  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': res.headers['set-cookie'][0]
    }
  }

  axios.post(
    'https://services-web.u-cergy.fr/calendar/LdapLogin/Logon', 
    data, 
    config
  ).then(res => {

    const obj = {
      "start": (new Date ("2021-09-27")).toISOString().split('T')[0],
      "end": (new Date ("2021-10-02")).toISOString().split('T')[0],
      "resType": 104,
      "calView": agendaWeek,
      "federationIds[]": 21916219
    }

    axios.post(
      'https://services-web.u-cergy.fr/calendar/Home/GetCalendarData',
      obj
    ).then(res => {
      // console.log(res);
    }).catch(err => {
      console.log('err');
    })

  }).catch(err => {
    console.log(err)
  });
});

// axios.interceptors.request.use(req => {
//   console.log(req);
//   return req;
// })