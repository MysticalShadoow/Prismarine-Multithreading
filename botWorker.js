const custompvp = require("@nxg-org/mineflayer-custom-pvp")
const pathfinder = require("mineflayer-pathfinder")
const armorManager = require("mineflayer-armor-manager");
const mineflayer = require('mineflayer');
const movement = require("mineflayer-movement")
const { Vec3 } = require("vec3")
const {loader} = require("@nxg-org/mineflayer-smooth-look");
const {default : commonSense} = require("@nxg-org/mineflayer-common-sense");
const minecraftHawkEye = require('minecrafthawkeye');


const commonsense = require("./PLUGINS/CommonSense.js")
const aim = require("./JS/aim.js");
const attacker = require("./JS/attackingLogic.js");
const Movement = require("./JS/movement.js");
const utils = require('./PLUGINS/Utils.js')
const targetsystem = require("./JS/targettingSystem.js")

const config = require("./JSONS/config.json")
const bloodhoundPlugin = require("mineflayer-bloodhound")

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
  bot.loadPlugin(targetsystem)

  bot.loadPlugin(minecraftHawkEye.default)


  bloodhoundPlugin(bot)
 

  let follow;
  let ffa;
  var playerData = [];
  let ffaMode = false;

 const endOfFightMessagesLose = ["GG", "bro is here fighting an ai go fight real people.", "Bro that was a fluke", "Damn your insane!"]
 const endOfFightMessagesWin = ["GG", "ggs", "ez", "gg ez", "your so bad you got ratioed by ai L", "pathetic", "your pvp skills are so trash", "LT5", "L"]

  //UTILS
  function getRandomString(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  }



  bot.once("spawn", () => {
    
    bot.chat("/register predrooo predrooo")
    bot.chat("/login predrooo predrooo")

    bot.on("death", () => {
      bot.chat(getRandomString(endOfFightMessagesLose))
      bot.attackHandler.stop() 
      follow = false;
      bot.targetSystem.targets = [];

     
    })
  // also good :)
  bot.on("entityDead", (e) => {
    const targetEntity = bot.targetSystem.getTargetEntity();
    if (targetEntity) {
      if (e.id === targetEntity.id) {
        follow = false
        bot.targetSystem.removeTarget(targetEntity.username);
        // Remove the dead target from the list
        
        const remainingTargets = bot.targetSystem.targets.length; // Check how many targets are left
  
        if (remainingTargets === 0) {
          bot.chat(getRandomString(endOfFightMessagesWin)); // Only send message if no targets are left
  
          bot.attackHandler.inCombat = false;
          bot.attackHandler.stop();
        } else {
          follow = false
          bot.attackHandler.attack(); // Continue attacking other targets
          follow = true
        }
      }
    }
  });
  
  function getNearestPlayer() {
    // Check if bot.players exists and is not null/undefined
    if (!this.players) {
      console.log("No players object available");
      return null;
    }
  
    // Get an array of player entries
    const playerEntries = Object.entries(this.players)
      .filter(([username, playerInfo]) => 
        // Exclude the bot itself
        username !== this.username && 
        // Ensure player has an entity
        playerInfo && 
        playerInfo.entity
      );
  
    // If no valid players found
    if (playerEntries.length === 0) {
      return null;
    }
  
    // Find the nearest player
    let nearestPlayer = null;
    let shortestDistance = Infinity;
  
    for (const [username, playerInfo] of playerEntries) {
      // Ensure entity exists and has a valid position
      if (!playerInfo.entity || !playerInfo.entity.position) continue;
  
      // Calculate distance
      const distance = this.entity.position.distanceTo(playerInfo.entity.position);
  
      // Update nearest player if this is closer
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestPlayer = playerInfo;
      }
    }
  
    return nearestPlayer;
  }
  


    bot.on("physicsTick", async () => { 
      bot.commonsense.start()
     if (follow) {
       bot.movement.start()
     }

     try {
      const player = getNearestPlayer.call(bot);
      if (ffaMode && player && player.username !== bot.username) {
        bot.targetSystem.addTarget(player.username);
      }
    } catch (error) {
      console.error("Error finding nearest player:", error);
    }
     

    
     const targetEntity = bot.targetSystem?.getTargetEntity();
     if (bot.attackHandler.inCombat || targetEntity) {
       if (playerData[targetEntity?.username]?.eating === true) {     
        if ((bot.food + bot.foodSaturation) < 40) {
          if (bot.attackHandler.isShielding) {
            bot.attackHandler.stopShielding()   
          }
          bot.utils.eatGap()
      }
    }
  }
      if ((bot.health + bot.food + bot.foodSaturation) < 30) {
        if (!bot.isEating) {
          if (bot.attackHandler.isShielding) {
              bot.attackHandler.stopShielding()
          }
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
    if (username === bot.username && username != "FrostifyX2") return;

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

      case "kit":
      case "kit": {
        bot.chat("/clear")
        bot.chat(`/kit claim ${player}`)
        break;
      }

      case "addtarget":
        case "AddTarget": {
          if (!player === bot.username) {
            bot.targetSystem.addTarget(player)
          }
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
        case "FFA": {
          if (!bot.attackHandler.inCombat) {
            ffaMode = !ffaMode;
            if (ffaMode) {
              // Clear existing targets
              bot.targetSystem.targets = [];
              
              // Add all players to the target list, except the bot itself
              for (const playerName in bot.players) {
                if (playerName !== bot.username) {
                  bot.targetSystem.addTarget(playerName);
                }
              }
              
              bot.chat("FFA mode activated! Targeting all players.");
              
              // Prepare for combat
              (async () => {
                await bot.utils.equipShield();
                await bot.utils.readyUp();
                await bot.utils.eatGap();
                bot.utils.equipWeapon();
                
                follow = true;
                
                if (bot.targetSystem.hasValidTarget()) {
                  bot.attackHandler.startAttacking();
                }
              })();
            } else {
              // Deactivate FFA mode
              bot.targetSystem.targets = [];
              bot.attackHandler.stop();
              follow = false;
              bot.chat("FFA mode deactivated.");
            }
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
        if (!bot.attackHandler.inCombat) {
          // Check if the target system already has targets
          if (!bot.targetSystem.hasValidTarget()) {
              // If no valid targets and no passed target, send a message
              if (!player && !username) {
                  bot.chat("No valid targets to attack.");
                  return;
              }
          }

         
      
          // Check if a specific target is passed in
          const target = player || username;
          if (target === bot.username) return; // Prevent attacking the bot itself
      
          // If a valid target is provided, add it to the target list
          if (target) {
              const check = bot.players[target]?.entity;
              if (!check) {
                  bot.chat("I can't attack a ghost, bruh.");
                  return;
              }
              bot.targetSystem.addTarget(target); // Add target to system
          }
      
          // Prepare for combat by equipping items and setting up
          await bot.utils.equipShield();
          await bot.utils.readyUp();
          await bot.utils.eatGap();
          bot.utils.equipWeapon();
      
          // Start attacking the best target available (from list or passed target)
          follow = true;

          if (bot.targetSystem.hasValidTarget()) {
            bot.attackHandler.startAttacking();
          }
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


// Shield cooldown listener
bot._client.on('set_cooldown', (data) => {
    console.log(data);
    if (data.itemID === 1009) {
        botShieldCooldown = data.cooldownTicks;
    }
});

// Register the shield listener
bot._client.on('entity_metadata', async (packet) => {
    bot.utils.playerDataListener(packet)
});



  // Can move out, this will never error.
  bot.on('kicked', console.log)
  bot.on('error', console.log)
}


// outside of function call, lol
if (!isMainThread) {
  initBot();
}
