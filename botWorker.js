const custompvp = require("@nxg-org/mineflayer-custom-pvp")
const pathfinder = require("mineflayer-pathfinder")
const armorManager = require("mineflayer-armor-manager");
const mineflayer = require('mineflayer');
const movement = require("mineflayer-movement")
const { Vec3 } = require("vec3")
const { loader } = require("@nxg-org/mineflayer-smooth-look");
const {default : commonSense} = require("@nxg-org/mineflayer-common-sense");


const commonsense = require("./PLUGINS/CommonSense.js")
const aim = require("./JS/aim.js");
const attacker = require("./JS/attackingLogic.js");
const Movement = require("./JS/movement.js");
const utils = require('./PLUGINS/Utils.js')

//Inbuilt PLugins

const print = console.log;

process.on('uncaughtException', (err) => {
  console.error('Unhandled error:', err.stack || err.toString());
  process.exit(1);
});


const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { stat } = require("fs");


function initBot() {
  // ahhh here we go.
  const { username, host, port, version } = workerData;
  const bot = mineflayer.createBot({
    host,
    port,
    username,
    version,
  });



  bot.loadPlugin(armorManager);
  bot.loadPlugin(loader);
  bot.loadPlugin(commonsense)
  bot.loadPlugin(aim)
  bot.loadPlugin(Movement);
  bot.loadPlugin(attacker)
  bot.loadPlugin(utils)
 

  let follow;

  bot.once("spawn", () => {
  
    bot.on("death", () => {
      bot.chat("darn")
      bot.attackHandler.inCombat = false;
      bot.attackHandler.stop()
    })

    bot._client.on('entity_metadata',(packet) => {
      if (bot.utils.isEating) return;
      //shieldListener(packet)
    });
    

    // this is good!
 

  // also good :)
  bot.on("entityDead", (e) => {
    if (bot.attackHandler.target_G) {
      if (e.id == bot.attackHandler.target_G.id) {
        bot.chat("HAHHAH gg")
        fight.inCombat = false;
        bot.attackHandler.stop()
      }
    }
  })

    bot.on("physicsTick", async () => { 
     if (follow) {
      bot.movement.start()
     }
     bot.commonsense.start()

     let totalCheck = (bot.health + bot.food + bot.foodSaturation);
     let variableToEat;
     if (bot.inCombat) { variableToEat = 35} else { variableToEat = 30 }

      if (totalCheck <= variableToEat) {
        if (!bot.utils.isEating) {
          if (bot.utils.isEating) return;
          bot.utils.eatGap()
        }
      }
    })
  })

  // there should be a bot.on('health'), but I'm not sure
  // this is alright
  // I'm 95% sure this is fine to be outside of bot.once('spawn'), but it could not be.
  // if this errors, just move it back in :thumbsup:
  

  

  bot.on("chat", async (username, message) => {
    if (username === bot.username) return;

    const split = message.split(" ");
    if (split.length < 2) return;
    const [target, cmd, player,...args] = split;

    // if "ALL" OR bot's username, allow. Otherwise return early.
    if (target !== bot.username && target !== 'ALL') return;

    switch (cmd) {
      case "Follow":
      case "follow": {
        follow = !follow
        break;
      }

      case "equip":
      case "Equip": {
        bot.armorManager.equipAll();
        break;
      }

      case "execute":
      case "Execute": {
        bot.chat("/clear")
        bot.chat(`/playerkits:kit claim ${player}`)
        break;
      }

      case "stop":
      case "Stop": {
       bot.attackHandler.stop()
        break;
      }

        case "rtp":
        case "rtp": {
          bot.chat("/rtp")
          break;
        }

      case "test":
      case "Test": {
        bot.utils.eatGap();
        break;
      }

      case "attack":
      case "Attack": {
        // if you dont specify a target it will attack the user that ran the command
        if (!bot.attackHandler.inCombat) {
          const target = player || username;
          if (target === bot.username) return;
          const check = bot.players[target]?.entity
          if (!check) return bot.chat("i aint gonna attack no ghost");
          
          await bot.utils.equipShield()
          await bot.utils.eatGap()

          bot.equip.equipWeapon()
          follow = !follow

          bot.attackHandler.setTarget(target);
          bot.attackHandler.attack()
        }
        break;
      }

      default:
        bot.chat(`I do not know the command "${cmd}"`)
    }
  })

  // :thumbsup:
  bot.on("playerCollect", (username) => {
    if (username === bot.username) return;
    bot.armorManager.equipAll();
  });

  //Thanks to Genrel for this code#7675 for this code!
  const shieldListener = async (packet) => {
    if (!fight.inCombat) return;
    if (bot.commonsense.isDoingTask) return;
    // Define Variable here
    var inv = bot.inventory;
    const axe = inv.items().find((item) => item.name.includes("axe"));
    const weapon = inv.items().find((item) => item.name.includes("sword"));
    const distance = Math.round(bot.entity.position.distanceTo(fight.target_G.position))

    if (!packet.entityId || !packet.metadata || packet.metadata.length === 0) return;
    if (!packet.metadata[0].key || packet.metadata[0].key !== 8) return;
    if (!bot.entities[packet.entityId]) return;
    const entity = bot.entities[packet.entityId];
    if (entity.type === 'player') {
        const state = (packet.metadata[0].value === 3);
        if (entity.type === 'player' && entity.id == fight.target_G.id) {
          console.log("called")
          if (fight.target_G.metadata[8] === 3 && fight.target_G.equipment[1]?.name === "shield") {
            if (bot.isUsingHeldItem) return;
            while (fight.target_G.metadata[8] === 3 && fight.target_G.equipment[1]?.name === "shield") {
              if (bot.commonsense.isDoingTask) return;
            if (bot.heldItem.name?.includes("axe")) {
              bot.waitForTicks(4)
              if (distance < 3) {
                bot.equip(axe, "hand")
                if (!fight.target_G) return;
                while (fight.target_G.metadata[8] === 3 && fight.target_G.equipment[1]?.name === "shield") {
                  await bot.waitForTicks(3)
                  await bot.attack(fight.target_G, true)
                 }
                if (!weapon) {
                  return;
                }
                return;
              };
              
    
            } 
    
            if (!axe) {
              return;
            } 
            bot.equip(axe, "hand")
            while (fight.target_G.metadata[8] === 3 && fight.target_G.equipment[1]?.name === "shield") {
             await bot.waitForTicks(5)
             await bot.attack(fight.target_G, true)
            }
            if (distance < 3) return;
            await bot.waitForTicks(1)
            if (!weapon) {
              return;
            }
          }
        }
      }
    }
    if (!fight.target_G.metadata[8] === 3 && !fight.target_G.equipment[1]?.name === "shield") {
        bot.equip(weapon, "hand")
    }
}
        





  // Can move out, this will never error.
  bot.on('kicked', console.log)
  bot.on('error', console.log)
}


// outside of function call, lol
if (!isMainThread) {
  initBot();
}
