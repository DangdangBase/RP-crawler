const { parse } = require('node-html-parser');
const R = require('ramda');
const xlsx = require('xlsx');
const axios = require('./axios');

const getCompanyLinkList = async (page = 1) => {
  const { data } = await axios.get(`api/companies/template?page=${page}`);
  const root = parse(data.data.template);

  const companyLinkList = root.querySelectorAll('.company > .content > .link');

  return companyLinkList.map((item) => item.getAttribute('href'));
};

const getCompanyJobs = async (RPCompanyDetailLink) => {
  const { data } = await axios.get(`${RPCompanyDetailLink}/jobs`);
  const root = parse(data);

  const jobList = root.querySelectorAll('#company-jobs > .ui.segment.items');
  const jobTitleList = jobList.map(
    (job) => job.querySelector('.job-title > a').text,
  );

  return {
    jobInfoLength: jobTitleList.length,
    jobInfo: jobTitleList.join('\n'),
  };
};

const getCompanyDetailInfo = async (RPCompanyName) => {
  const { data: companyMetaInfo } = await axios.post(
    'https://kreditjob.com/api/search/company',
    {
      q: RPCompanyName,
    },
  );
  if (R.isEmpty(companyMetaInfo)) return {};

  const companyNameHash = companyMetaInfo.PK_NM_HASH;

  const companyDetailInfo = {
    creditjobLink: `https://kreditjob.com/company/${companyNameHash}`,
  };

  axios
    .get(`https://kreditjob.com/api/company/${companyNameHash}/summary`)
    .then((data) => {
      companyDetailInfo.annualEntry = data.employee.hired;
    });

  const { data: companyInfo } = await axios.get(
    `https://kreditjob.com/api/company/${companyNameHash}/info`,
  );

  if (companyInfo.niceId) {
    const { data: niceCompanyHTML } = await axios.get(
      `https://www.nicebizinfo.com/ep/EP0100M002GE.nice?kiscode=${companyInfo.niceId}`,
    );

    const niceRoot = parse(niceCompanyHTML);

    companyDetailInfo.representativeName = niceRoot
      .querySelector('.cSection > .wrap > .cTable.sp2.mb10 td:first-child')
      ?.querySelector('strong').text;
  }

  return companyDetailInfo;
};

const getCompanyInfo = (pageRoot) => {
  const companyInfo = {};

  const companyInfoList = pageRoot.querySelectorAll(
    '.ui.company.info.items > .item:not(#map-canvas)',
  );

  const getTitle = (elem) => elem.querySelector('.title').text.trim();
  const getContent = (elem) => elem.querySelector('.content').text.trim();
  const detailViewRegex = /.+(?=[\s]+상세보기)/g;

  companyInfoList.forEach((info) => {
    const title = getTitle(info);
    const content = getContent(info);

    switch (title) {
      case '구성원':
        companyInfo.memberNum = content.match(detailViewRegex)[0];
        break;
      case '홈페이지':
        companyInfo.homepageLink = content;
        break;
      case '이메일':
        companyInfo.hrEmail = content;
        break;
      case '전화번호':
        companyInfo.hrPhoneNumber = content;
        break;
      case '산업 분야':
        companyInfo.industry = content;
        break;
      case '투자유치':
        companyInfo.investment = content.match(detailViewRegex)[0].trim();
        break;
      case '설립일':
        companyInfo.foundingDate = content;
        break;
      case '사무실':
        let wholeOfficeText = ``;
        const officeList = info.querySelectorAll('.office.item');

        officeList.forEach((office) => {
          const officeName = office.querySelector('.office-button').text;
          const officeLoc = office.querySelector('.address').text;
          wholeOfficeText += `[${officeName}]  ${officeLoc}\n`;
        });

        companyInfo.officeLocation = wholeOfficeText;
        break;
      case '문의 담당자':
        companyInfo.inquireManager = info.querySelector('.name').text;
        break;
      default:
        break;
    }
  });

  return companyInfo;
};

const getCompanyData = async (RPCompanyDetailLink) => {
  const { data } = await axios.get(RPCompanyDetailLink);
  const root = parse(data);

  const name = root.querySelector('#company-name > h1').text;
  const description = root.querySelector('#company-description').text.trim();

  let companyData = {
    name,
    description,
    rocketpunchLink: RPCompanyDetailLink,
  };

  const mergeWithCompanyData = (data) => {
    companyData = R.mergeRight(data, companyData);
  };

  const detailInfoPromise =
    getCompanyDetailInfo(name).then(mergeWithCompanyData);

  const jobsPromise =
    getCompanyJobs(RPCompanyDetailLink).then(mergeWithCompanyData);

  mergeWithCompanyData(getCompanyInfo(root));

  await Promise.all([detailInfoPromise, jobsPromise]);

  return companyData;
};

const createCSV = (dataList) => {
  const book = xlsx.utils.book_new();

  const sheet = xlsx.utils.json_to_sheet(dataList, {
    header: [
      'name',
      'description',
      'jobInfoLength',
      'jobInfo',
      'industry',
      'memberNum',
      'investment',
      'foundingDate',
      'hrEmail',
      'hrPhoneNumber',
      'inquireManager',
      'homepageLink',
      'officeLocation',
      'annualEntry',
      'representativeName',
      'rocketpunchLink',
      'creditjobLink',
    ],
  });

  xlsx.utils.book_append_sheet(book, sheet, 'data1');
  xlsx.writeFile(book, 'company_data.csv');
};

module.exports = {
  getCompanyLinkList,
  getCompanyData,
  createCSV,
};
