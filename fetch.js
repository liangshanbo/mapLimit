/*
 * @Author: longhai.wang
 * @Date: 2019-07-30 14:51:37
 * @LastEditors: longhai.wang
 * @LastEditTime: 2019-07-30 15:37:37
 * @Description: 保证并发请求数不超过10
 * @jira: IDSS-3214
 */
let fetchingCount = 0;
const nextFetchList = [];
const DEFAULE_OPTIONS = { method: 'GET', headers: { 'Content-Type': 'application/json; charset=UTF-8' }, body: {} };
const nextStep = () => {
  if (nextFetchList.length > 0) {
    const next = nextFetchList.shift();
    fetchingCount += 1;
    customFetch(next.url, next.options, next.resolve);
  }
  fetchingCount -= 1;
};

function customFetch(url, options, resolve) {
  fetch(url, options).then((response) => {
    nextStep();
    if (response.ok) {
      response.json().then((json) => {
        resolve(json);
      }, (error) => {
        resolve({
          error,
          msg: 'json解析错误',
          status: -1024,
        });
      });
    } else {
      resolve({
        res: response,
        msg: '接口请求异常',
        status: response.status,
      });
    }
  }).catch((error) => {
    nextStep();
    resolve({
      error,
      status: -1024,
      msg: '接口请求异常',
    });
  });
}
const request = (url, options = {}, limit = 10) => new Promise((resolve) => {
  const requestOptions = { ...DEFAULE_OPTIONS, ...options };
  if (fetchingCount >= limit) {
    nextFetchList.push({ url, options: requestOptions, resolve });
  } else {
    fetchingCount += 1;
    customFetch(url, requestOptions, resolve);
  }
});

export default request;
