import express from 'express';

const app = express();
const port = 3000;
const host = 'localhost';

app.get('/', (req, res, next) => {
    res.send('hello world');
});

app.listen(port, host, () => {
    console.log(`Server listening at: http://${host}:${port}`);
});
