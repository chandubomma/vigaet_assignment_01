import express from 'express';
import initRoutes from './routes/index.js';

const app = express()
app.use(express.json());
app.use('/api',initRoutes());


app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})