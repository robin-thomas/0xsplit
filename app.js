const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

app.listen(port, () => console.log(`app listening on ${port}`));
