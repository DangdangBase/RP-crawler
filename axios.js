const axios = require('axios');

axios.defaults.baseURL = 'https://www.rocketpunch.com';
axios.defaults.headers.common['cookie'] = process.env.CRAWLER_COOKIE;

module.exports = axios;
