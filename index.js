const config = require('config');
const express = require('express');
require('express-async-errors');
const app = express();
const mongoose = require('mongoose');
var slug = require('mongoose-slug-updater');
mongoose.plugin(slug);

require('./start/logging')(app);
require('./start/config')();
require('./start/routes')(app);
require('./database/db').init();
require('./start/prod')(app);

const port = config.get('port') || 3000;
const server = app.listen(port, () => console.log(`Listening on port ${port}...`));

module.exports = server;
