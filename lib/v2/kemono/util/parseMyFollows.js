const cheerio = require('cheerio');

module.exports = (content, rootUrl, limit) => {
    const $ = cheerio.load(content);

    const followsList = $('div.card-list__items')
        .find('a')
        .toArray()
        .slice(0, limit)
        .map((it) => `${rootUrl}${it.attribs.href}`);

    // Discord 收藏似乎不会出现在这
    return followsList;
};
