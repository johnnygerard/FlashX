import express from 'express';
import { env } from 'process';

if (env.NODE_ENV !== 'production')
    await import('dotenv/config');

const app = express();
const port = env.PORT || 3000;
const host = 'localhost';

app.set('view engine', 'ejs');

app.get('/', (req, res, next) => {
    res.render('index', { title: 'Homepage' });
});

app.listen(port, host, () => {
    console.log(`Server listening at: http://${host}:${port}`);
});
