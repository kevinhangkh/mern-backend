const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const { logger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const corsOptions = require('./config/corsOptions');

// Logger middleware
app.use(logger);

// Built in middleware
// Process json files
app.use(express.json());

// 3rd party middleware
app.use(cors(corsOptions));
app.use(cookieParser());

// Serve css files and whatnot
app.use('/', express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/root'));

// Default
app.all('*', (req, res) => {
  res.status(404);
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'));
  } else if (req.accepts('json')) {
    res.json({ error: '404 Not Found' });
  } else {
    res.type('txt').send('404 Not Found');
  }
});

// Custom error handler middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
