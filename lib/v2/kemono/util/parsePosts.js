const cheerio = require('cheerio');
const got = require('@/utils/got');
const { parseDate } = require('@/utils/parse-date');
const { headers } = require('./../common/config');

module.exports = async function parsePosts(content, rootUrl, ctx) {
    const $ = cheerio.load(content);

    const title = $('title').text();

    const items = await Promise.all(
        $('.post-card.post-card--preview')
            .slice(0, ctx.query.limit ? parseInt(ctx.query.limit) : 25)
            .toArray()
            .map((item) => {
                item = $(item);
                const link = `${rootUrl}${item.find('a').attr('href')}`;

                return {
                    link,
                };
            })
            .map((item) =>
                ctx.cache.tryGet(item.link, async () => {
                    const detailResponse = await got({
                        method: 'get',
                        url: item.link,
                        headers,
                    });

                    const content = cheerio.load(detailResponse.data);

                    content('.post__thumbnail').each(function () {
                        content(this).html(`<img src="${rootUrl}${content(this).find('.fileThumb').attr('href')}">`);
                    });

                    const desc = content('.post__body');
                    desc.find('div.ad-container').remove();

                    item.description = desc.html().trim();
                    item.author = content('.post__user-name').text();
                    item.title = content('.post__title span').first().text();
                    item.pubDate = parseDate(content('.timestamp').attr('datetime'));

                    return item;
                })
            )
    );
    return {
        title,
        items,
    };
};
