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

// Use phantom.js to extract extra info
async function getExtraStreamInfo(mobileUrl) {
    const instance = await phantom.create();
    const page = await instance.createPage();

    await page.open(mobileUrl);

    try {
        const meta = await page.evaluateJavaScript('function () { return window.$DATA }');
        return meta;
    } catch (e) {
        console.error('Unable to get extra info:', e.message);

        return {};
    } finally {
        // Close phantomjs instance
        instance.exit();
    }
}

// Get url and video info from given source (web url)
async function handleDouyuStream(ctx) {
    const id = getStreamID(ctx.url);
    const result = await getStreamInfo(id);

    if (ctx.extra) {
        result.extra = await getExtraStreamInfo(ctx.url);
    }

    return result;
}

// Handler
module.exports = async function (ctx, next) {
    if (desktopURLPattern.test(ctx.source)) {
        console.log('match: 斗鱼桌面端');
        // Transform source
        ctx.url = ctx.source.replace('v.douyu', 'vmobile.douyu');
        // Convert to url for mobile browser
        ctx.result = await handleDouyuStream(ctx);
    } else if (mobileURLPattern.test(ctx.source)) {
        console.log('match: 斗鱼移动端');
        ctx.url = ctx.source;
        ctx.result = await handleDouyuStream(ctx);
    } else {
        // Handle by other handlers
        await next();
    }
};