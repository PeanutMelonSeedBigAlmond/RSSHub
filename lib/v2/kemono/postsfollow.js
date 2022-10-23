const got = require('@/utils/got');
const { headers } = require('./common/config');
const parseMyFollows = require('./util/parseMyFollows');
const parsePosts = require('./util/parsePosts');

module.exports = async (ctx) => {
    const rootUrl = 'https://kemono.party';

    const response = await got({
        method: 'get',
        url: 'https://kemono.party/favorites',
        headers,
    });

    const limit = ctx.query.limit ? parseInt(ctx.query.limit) : 25;

    const follows = parseMyFollows(response.data, rootUrl);
    const pageList = await Promise.all(
        follows.map((it) =>
            got({
                method: 'get',
                url: it,
                headers,
            })
        )
    );
    const postList = (await Promise.all(pageList.map((it) => parsePosts(it.data, rootUrl, ctx))))
        .map((it) => it.items)
        .flat()
        .sort((post1, post2) => post2.pubDate - post1.pubDate)
        .slice(0, limit);

    ctx.state.data = {
        title: 'Kemono | 关注的作者更新',
        link: 'https://kemono.party/favorites',
        item: postList,
    };
};
