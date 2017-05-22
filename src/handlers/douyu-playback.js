// 斗鱼录像视频

const request = require('request-promise');
const phantom = require('phantom');

const desktopURLPattern = /https\:\/\/v.douyu.com\/show\/(.*)/;
const mobileURLPattern = /https\:\/\/vmobile.douyu.com\/show\/(.*)/;

// Get url from mobile web url
function getStreamID(source) {
    return mobileURLPattern.exec(source)[1];
}

// Get hls url by stream id
function getStreamInfo(id) {
    return request({
        url: `https://vmobile.douyu.com/video/getInfo?vid=${id}`,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        json: true
    });
}

// Use phantom.js to extract meta info
async function getMetaInfo(mobileUrl) {
    const instance = await phantom.create();
    const page = await instance.createPage();

    await page.open(mobileUrl);

    try {
        const meta = await page.evaluateJavaScript('function () { return window.$DATA }');
        return meta;
    } catch (e) {
        console.error('Unable to get meta info:', e.message);

        return {};
    } finally {
        // Close phantomjs instance
        instance.exit();
    }
}

// Get url and video info from given source (web url)
async function handleDouyuPlayback(ctx) {
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
            errorCode: rawResult.error
        };
    }

    result.url = rawResult.data.video_url;

    if (ctx.meta) {
        let meta = await getMetaInfo(ctx.url);
        result.meta = {
            title: meta.title,
            poster: meta.room_pic
        };
    }

    return result;
}

// Handler
module.exports = async function (ctx, next) {
    if (desktopURLPattern.test(ctx.source)) {
        console.log('match: 斗鱼桌面端录像');
        // Transform source
        ctx.url = ctx.source.replace('v.douyu', 'vmobile.douyu');
        // Convert to url for mobile browser
        ctx.result = await handleDouyuPlayback(ctx);
    } else if (mobileURLPattern.test(ctx.source)) {
        console.log('match: 斗鱼移动端录像');
        ctx.url = ctx.source;
        ctx.result = await handleDouyuPlayback(ctx);
    } else {
        // Handle by other handlers
        await next();
    }
};