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

const config = require("./JSONS/config.json")

//Inbuilt PLugins

const print = console.log;

process.on('uncaughtException', (err) => {
  console.error('Unhandled error:', err.stack || err.toString());
  process.exit(1);
});


const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { stat } = require("fs");
const { brotliCompress } = require("zlib");


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
  var playerData = []

 const endOfFightMessagesLose = ["GG", "bro is here fighting an ai go fight real people.", "Bro that was a fluke", "Damn your insane!"]
 const endOfFightMessagesWin = ["GG", "ggs", "ez", "gg ez", "your so bad you got ratioed by ai L", "pathetic", "your pvp skills are so trash", "LT5"]

  //UTILS
  function getRandomString(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  }

  if (config.Settings.RandomPlayStyle) {
    bot.attackHandler.debounce = bot.utils.pickRandomNumber(546, 553)

    bot.attackHandler.items[0].rarity = bot.utils.pickRandomNumber(1, 7) / 10
    bot.attackHandler.items[1].rarity = (10 - bot.attackHandler.items[0].rarity) / 10

    console.log(bot.attackHandler.items[0].rarity)
  }



  bot.once("spawn", () => {
    bot.on("death", () => {
      bot.chat(getRandomString(endOfFightMessagesLose))
      bot.attackHandler.stop() 
      follow = false;
    })

    bot._client.on('entity_metadata',(packet) => {
      if (bot.utils.isEating || bot.commonsense.isDoingTask) return;
      bot.utils.playerDataListener(packet)
    });
    

    // this is good!
 

  // also good :)
  bot.on("entityDead", (e) => {
    if (bot.attackHandler.target_G) {
      if (e.id == bot.attackHandler.target_G.id) {
        bot.chat(getRandomString(endOfFightMessagesWin))
        follow = false;
        
        bot.attackHandler.inCombat = false;
        bot.attackHandler.stop()
      }
    }
  })

    bot.on("physicsTick", async () => { 
      playerData = bot.utils.getPlayerData();
      bot.commonsense.start()
     if (follow) {
       bot.movement.start()
     }

    
     if (bot.attackHandler.inCombat || bot.attackHandler.target_G) {
      if (playerData[bot.attackHandler.target_G.username]?.eating == true) {
        if ((bot.food + bot.foodSaturation) < 5) {
          bot.utils.eatGap()
      }
    }
  }
    if (!bot.utils.isEating) {
     if (bot.attackHandler.inCombat || bot.attackHandler.target_G ) {
          if (playerData[bot.attackHandler.target_G.username]?.blocking == true) {

            //Weapon
            const axe = bot.inventory.items().find((item) => item.name.includes("axe"))
            const sword = bot.inventory.items().find((item) => item.name.includes("sword"))
            const distance = Math.round(bot.entity.position.distanceTo(bot.attackHandler.target_G.position));
            if (!axe) return;
              if (distance <= 3 ) {
                if (bot.heldItem.name.includes(axe)) {
                  bot.attack(bot.attackHandler.target_G)

                  if (!sword) return;
                  bot.equip(sword)
                } else {
                  bot.equip(axe)
                  bot.attack(bot.attackHandler.target_G)
                  if (!sword) return;
                  bot.equip(sword)
                }  
              }
        }
       }
     }
      if ((bot.health + bot.food + bot.foodSaturation) < 35) {
        if (!bot.isEating) {
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
        follow = true;
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
       bot.smartAim.stop()
       follow = false;
        break;
      }
      case "ffa":
      case "ffa": {
        if (!bot.attackHandler.inCombat) {
          const targetEntity = bot.nearestEntity(entity => entity.type.toLowerCase() === "player");
          const targetUsername = targetEntity.username;
          console.log(targetUsername)
          if (!targetUsername) return;
          if (!target) return bot.chat("i aint gonna attack no ghost bruv");
          
          await bot.utils.equipShield();
          await bot.utils.readyUp();
          await bot.utils.eatGap();
          bot.utils.equipWeapon();

          if (!targetUsername) return;

          bot.attackHandler.setTarget(targetUsername);
          follow = true;
         
          bot.smartAim.start(bot.attackHandler.target_G.username)
          bot.attackHandler.startAttacking();
        }
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
          if (!check) return bot.chat("i aint gonna attack no ghost bruh");
        
          await bot.utils.equipShield()
          await bot.utils.readyUp()
          await bot.utils.eatGap()
          bot.utils.equipWeapon()
          
          bot.attackHandler.setTarget(target);

          follow = true;
          bot.smartAim.start(bot.attackHandler.targetUsername)
          bot.attackHandler.startAttacking()
         
        }
        break;
      }

      default:
        bot.chat(`I dont know this command sorry. "${cmd}"`)
    }
  })

  // :thumbsup:
  bot.on("playerCollect", (username) => {
    if (username === bot.username) return;
    bot.armorManager.equipAll();
  });

  //Thanks to Genrel for this code#7675 for this code!
 
    //bot._client.on('entity_metadata', shieldListener);
    bot._client.on('set_cooldown', (data) => {
        console.log(data);
        if (data.itemID == 1009) {
            botShieldCooldown = data.cooldownTicks;
        }
    });


  // Can move out, this will never error.
  bot.on('kicked', console.log)
  bot.on('error', console.log)
}


// outside of function call, lol
if (!isMainThread) {
  initBot();
}
