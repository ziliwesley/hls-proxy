// 斗鱼直播

const request = require('request-promise');

const desktopURLPattern = /https\:\/\/www.douyu.com\/(.*)/;
const mobileURLPattern = /https\:\/\/m.douyu.com\/(.*)/;

// Get url from mobile web url
function getStreamID(source) {
    return mobileURLPattern.exec(source)[1];
}

// Get hls url by stream id
function getStreamInfo(id) {
    return request({
        url: `https://m.douyu.com/html5/live?roomId=${id}`,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        json: true
    });
}

// Get url and video info from given source (web url)
async function handleDouyuStream(ctx) {
    const id = getStreamID(ctx.url);
    const result = {};
    let rawResult;

    try {
        rawResult = await getStreamInfo(id);
    } catch (e) {
        return {
            errorCode: 10001,
            message: e.message
        };
    }

    if (rawResult.error) {
        return {
            errorCode: rawResult.error,
            message: rawResult.msg
        }
    }

    result.url = rawResult.data.hls_url;
    result.meta = {
        title: rawResult.data.room_name,
        poster: rawResult.data.room_src
    };

    return result;
}

// Handler
module.exports = async function (ctx, next) {
    if (desktopURLPattern.test(ctx.source)) {
        console.log('match: 斗鱼桌面端直播');
        // Transform source
        ctx.url = ctx.source.replace('www.douyu', 'm.douyu');
        // Convert to url for mobile browser
        ctx.result = await handleDouyuStream(ctx);
    } else if (mobileURLPattern.test(ctx.source)) {
        console.log('match: 斗鱼移动端直播');
        ctx.url = ctx.source;
        ctx.result = await handleDouyuStream(ctx);
    } else {
        // Handle by other handlers
        await next();
    }
};