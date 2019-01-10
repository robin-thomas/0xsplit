const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.options('*', cors());
app.use(express.static(__dirname + '/static'));

app.listen(port, () => console.log(`app listening on ${port}`));
