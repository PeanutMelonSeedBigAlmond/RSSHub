const { getToken } = require('./token');
const getIllustFollows = require('./api/getIllustFollows');
const getUgoiraInfo = require('./api/getUgoiraInfo');
const config = require('@/config').value;
const pixivUtils = require('./utils');
const { parseDate } = require('@/utils/parse-date');

module.exports = async (ctx) => {
    if (!config.pixiv || !config.pixiv.refreshToken) {
        throw 'pixiv RSS is disabled due to the lack of <a href="https://docs.rsshub.app/install/#pei-zhi-bu-fen-rss-mo-kuai-pei-zhi">relevant config</a>';
    }

    const token = await getToken(ctx.cache.tryGet);
    if (!token) {
        throw 'pixiv not login';
    }

    const response = await getIllustFollows(token);
    const illusts = response.data.illusts;

    const promises = [];
    for (let i = 0; i < illusts.length; i++) {
        if (illusts[i].type === 'ugoira') {
            promises.push(
                handleUgoira(illusts[i].id, token).then((it) => {
                    illusts[i].zipUrl = it.zipUrl;
                    illusts[i].frames = it.frames;
                })
            );
        }
    }

    await Promise.all(promises);

    ctx.state.data = {
        title: `Pixiv关注的新作品`,
        link: 'https://www.pixiv.net/bookmark_new_illust.php',
        description: `Pixiv关注的画师们的最新作品`,
        item: illusts.map((illust) => {
            const images = pixivUtils.getImgs(illust);
            const tags = [];
            illust.tags.forEach((it) => {
                const tagName = it.name;
                const translatedName = it.translated_name;

                if (tagName !== null) {
                    tags.push(`#${tagName}`);
                }
                if (translatedName !== null) {
                    tags.push(`#${translatedName}`);
                }
            });

            const user = illust.user;
            const nickname = user.name;
            const username = user.account;
            const uid = user.id;

            const commonObj = {
                title: String(illust.title),
                author: illust.user.name,
                pubDate: parseDate(illust.create_date),
                comments: `https://www.pixiv.net/artworks/${illust.id}`,
                guid: `https://www.pixiv.net/artworks/${illust.id}`,
                description: `<strong>作者</strong>: <a href="https://www.pixiv.net/users/${uid}">${nickname} (@${username})</a></br>` + `<strong>标签</strong>: ${tags.join(' ')}<br/>` + `<strong>简介</strong>: ${illust.caption}`,
                link: `https://www.pixiv.net/artworks/${illust.id}`,
            };

            if (illust.type === 'ugoira') {
                const src = illust.zipUrl.replace('https://i.pximg.net', config.pixiv.imgProxy);
                commonObj.ugoira = {
                    src,
                    poster: images[0],
                    frames: illust.frames,
                };
            } else {
                const imagesProceed = images.map((it) => `<img src="${it}"/></br>`);
                commonObj.description = `${imagesProceed.join('')}<br/>` + commonObj.description;
            }

            return commonObj;
        }),
    };
};

async function handleUgoira(pid, token) {
    const resp = (await getUgoiraInfo(pid, token)).data.ugoira_metadata;
    const zipUrlsObj = resp.zip_urls;
    let zipUrl = '';
    if (zipUrlsObj.hasOwnProperty('original')) {
        zipUrl = zipUrlsObj.original;
    } else if (zipUrlsObj.hasOwnProperty('large')) {
        zipUrl = zipUrlsObj.large;
    } else if (zipUrlsObj.hasOwnProperty('medium')) {
        zipUrl = zipUrlsObj.medium;
    } else if (zipUrlsObj.hasOwnProperty('square_medium')) {
        zipUrl = zipUrlsObj.square_medium;
    }

    zipUrl = zipUrl.replace(/ugoira\d+x\d+/g, 'ugoira1920x1080');

    return {
        zipUrl,
        frames: resp.frames,
    };
}
