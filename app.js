const Koa = require('koa');
const serve = require('koa-static');
const bodyParser = require('koa-bodyparser');

// const { createWorker } = require('./src/coordinator.js');
const apiRouter = require('./src/routes/api.js');

const app = new Koa();

app.use(bodyParser());

app.use(apiRouter.routes())
app.use(apiRouter.allowedMethods());

app.use(serve(__dirname + '/static'));

app.listen(3000, () => {
    console.log('Server started on port 3000');
    // createWorker('douyu', 'http://vodhls1.douyucdn.cn/live/normal_live-417813rbEPmQ9MAQ--20170508215801/playlist.m3u8?k=a60cf63866e1aad5ad5f09b44493fbda&t=5912ecd0&u=0&ct=h5&vid=620761&d=');
    // createWorker('twitch', 'https://vod064-ttvnw.akamaized.net/v1/AUTH_system/vods_9827/johnnymar10_25236436176_645947754/chunked/highlight-141199759.m3u8');
    // createWorker({
    //     source: 'http://vodhls1.douyucdn.cn/live/normal_live-417813rBhIHh6MZt--20170507015551/playlist.m3u8?k=dd535f9305dca2d40933821f72abacc2&t=5914128e&u=3739695&ct=web&vid=614361&d=C81378F40B411A4245993D8B703D1D2D',
    //     audioOnly: true
    // });
});