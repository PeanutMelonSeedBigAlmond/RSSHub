const got = require('../pixiv-got');
const maskHeader = require('../constants').maskHeader;
const queryString = require('query-string');

module.exports = function getUgoiraInfo(pid, token) {
    return got({
        method: 'get',
        url: 'https://app-api.pixiv.net/v1/ugoira/metadata',
        headers: {
            ...maskHeader,
            Authorization: 'Bearer ' + token,
        },
        searchParams: queryString.stringify({
            illust_id: pid,
            lang: 'zh',
        }),
    });
};
