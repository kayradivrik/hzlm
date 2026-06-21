/* global process */

import { app, connectToDatabase } from './app.js'

const port = Number(process.env.PORT || 4000)

async function start() {
  await connectToDatabase()
  app.listen(port, () => {
    console.log(`API hazir: http://localhost:${port}`)
  })
}

start().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
