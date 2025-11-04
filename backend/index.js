const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use(routes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server pokrenut na http://localhost:${PORT}`);
});
