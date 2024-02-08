process.on('uncaughtException', (err) => {
  console.error('Unhandled error:', err.stack || err.toString());
  process.exit(1); // Terminate the process to avoid undefined behavior
});

// index.js
const { Worker } = require('worker_threads');
const mineflayer = require('mineflayer');
const config = require('./JSONS/config.json');

// Settings
const NUM_BOTS = config.bots.NumberOfBotsToSpawn; // Number of bot instances
const SPAWN_DELAY = config.Optimizations.SpawnDelay; 

class MCBot {
  constructor(username) {
    this.username = username;
    this.host = config.server.host;
    this.port = config.server.port;
    this.version = config.bots.Version;
    this.viewdistance = config.Optimizations.RenderDistance;

    this.initBot();
  }

  initBot() {
    this.worker = new Worker('./botWorker.js', {
      workerData: {
        username: this.username,
        host: this.host,
        port: this.port,
        version: this.version,
      },
    });

    this.worker.on('message', (message) => {
      if (message.type === 'botReady') {
        this.bot = message.bot;
        this.initEvents();
        console.log(`[${this.username}] Worker initialized`);
      } else if (message.type === 'error') {
        console.error(`[${this.username}] Worker encountered an error:`, message.error);
      }
    });
  }

  initEvents() {
    if (!this.bot) {
      return;
    }

    
    this.bot.on('end', (reason) => {
      console.log(`[${this.username}] Disconnected: ${reason}`);
      this.reconnect();
    });
  }

  reconnect() {
    if (this.worker) {
      this.worker.terminate();
    }
    setTimeout(() => {
      console.log(`[${this.username}] Attempting to reconnect...`);
      this.initBot();
    }, 500);
  }
}


async function spawnBots() {
  for (let i = 0; i < NUM_BOTS; i++) {
    const username = `${config.bots.Username}${i}`;
    console.log(username + " Attempting to connect")
    new MCBot(username);
    await sleep(SPAWN_DELAY);
  }
}


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

spawnBots();