import * as Express from 'express';
import App, { Container, NextAppContext, DefaultAppIProps } from 'next/app';

const port = parseInt(process.env.PORT, 10) || 3000
console.log(port)
// const dev = process.env.NODE_ENV !== 'production'
// const app = next({ dev })
// const handle = app.getRequestHandler()

// app.prepare().then(() => {
//   const server = express()

//   server.get('/a', (req, res) => {
//     return app.render(req, res, '/a', req.query)
//   })
// })