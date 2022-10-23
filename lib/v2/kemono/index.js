const got = require('@/utils/got');
const { parseDate } = require('@/utils/parse-date');
const parsePosts = require('./util/parsePosts');
const { headers } = require('./common/config');

module.exports = async (ctx) => {
    const source = ctx.params.source ?? '';
    const id = ctx.params.id;

    const rootUrl = 'https://kemono.party';
    const apiUrl = `${rootUrl}/api/discord/channels/lookup?q=${id}`;
    const currentUrl = `${rootUrl}/${source ? `${source}/${source === 'discord' ? `server/${id}` : `user/${id}`}` : 'posts'}`;

    const response = await got({
        method: 'get',
        url: source === 'discord' ? apiUrl : currentUrl,
        headers,
    });

    let items = [],
        title = '';

    if (source === 'discord') {
        title = `Posts of ${id} from Discord | Kemono`;

        await Promise.all(
            response.data.map(async (channel) => {
                await ctx.cache.tryGet(channel.id, async () => {
                    const channelResponse = await got({
                        method: 'get',
                        url: `${rootUrl}/api/discord/channel/${channel.id}?skip=0`,
                        headers,
                    });

                    items.push(
                        ...channelResponse.data
                            .filter((i) => i.content || i.attachments)
                            .map((i) => ({
                                title: i.content,
                                description: (i.content ? `<p>${i.content}</p>` : '') + (i.attachments ? i.attachments.map((a) => `<img src="${rootUrl}${a.path}">`).join('') : ''),
                                author: i.author.username,
                                pubDate: parseDate(i.published),
                                category: channel.name,
                            }))
                    );
                });
            })
        );
    } else {
        const data = await parsePosts(response.data, rootUrl, ctx);
        title = data.title;
        items = data.items;
    }

    ctx.state.data = {
        title,
        link: currentUrl,
        item: items,
    };
};
