const { getCompanyLinkList, getCompanyData, createCSV } = require('./utils');

const main = async () => {
  let companyDataObject = {};

  for (const pageIndex of Array.from({ length: 1 }, (_, i) => i + 1)) {
    const companyLinkList = await getCompanyLinkList(pageIndex);

    const promiseList = companyLinkList.map((companyLink, linkIndex) => {
      const curIndex = (pageIndex - 1) * 20 + linkIndex;

      return getCompanyData(companyLink).then((data) => {
        companyDataObject[curIndex] = data;
        console.log(curIndex);
      });
    });

    // let curIndex = 0;
    // const p = getCompanyData(companyLinkList[0]).then((data) => {
    //   companyDataObject[curIndex] = data;
    //   console.log(curIndex);
    // });
    // promiseList.push(p);

    await Promise.all(promiseList);
  }

  console.log(companyDataObject);
  // createCSV(Object.values(companyDataObject));
};

main();
