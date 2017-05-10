const Koa = require('koa');
const app = new Koa();

app.use(ctx => {
    ctx.body = 'HLS Proxy';
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});