const express = require('express');
const path = require('path');
const cors = require('cors');
const { initDatabase } = require('./db/database');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const artistsRouter = require('./routes/artists');
const customerRouter = require('./routes/customer');
const festivalRouter = require('./routes/festival');
const newsRouter = require('./routes/news');
const productsRouter = require('./routes/products');
const uploadsRouter = require('./routes/uploads');
const userRouter = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/admin', express.static(path.join(__dirname, '../../admin-web')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/admin', (req, res) => {
  res.redirect('/admin/login.html');
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'server is running',
    database: 'connected'
  });
});

app.use('/api/artists', artistsRouter);
app.use('/api/auth', authRouter);
app.use('/api/customer', customerRouter);
app.use('/api/festival', festivalRouter);
app.use('/api/news', newsRouter);
app.use('/api/products', productsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/user', userRouter);

async function startServer() {
  try {
    await initDatabase();

    return app.listen(PORT, HOST, () => {
      console.log(`Server is running at http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer
};
