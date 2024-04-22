// Main class

class Attack {
    // Take the bot as a parameter
    constructor(bot) {
      /** 
      * @type {mineflayer.Bot}
      */
      this.bot = bot

      this.inCombat = false;
      this.atkInter = null;
      this.lookInter = null;
      this.targetUsername = ""
      this.target_G = null
  
      this.debounce = 546;

      this.currentAttackType = null;

      this.items = [
        { name: 'Crit', rarity: 0.05 },
        { name: 'Sprint', rarity: 0.95 },
      ];
}

getRandomAttack() {
  const randomNumber = Math.random();
  let accumulatedProbability = 0;

  for (const item of this.items) {
      accumulatedProbability += item.rarity;
      if (randomNumber < accumulatedProbability) {
          return item.name;
      }
  }
  if (this.bot.utils.playarData[this.target_G.username].eating) {
      return "Crit";
  } else {
    return items[items.length - 1].name;
  }
}


setTarget(target) {
    this.targetUsername = target;
    this.target_G = this.bot.players[target].entity;
  }

 // Our first method
 async attack() {
    const atk = async () => {
      
      if (this.bot.commonsense.isDoingTask) return;
      if (this.bot.isEating) return;
      if (this.targetUsername !== "") {
        const targetEntity = this.bot.players[this.targetUsername]?.entity

        if (targetEntity) {
          // getting distance between bot and targ
          this.inCombat = true
          const distance = Math.round(this.bot.entity.position.distanceTo(targetEntity.position))
          const randomAttackType = this.getRandomAttack()
          // Do something
          this.currentAttackType = randomAttackType

          if (randomAttackType == "Crit") {
            if (!this.bot.getControlState("jump")) {
                this.bot.setControlState("jump", true)
                await this.bot.waitForTicks(8)
            }
          } else {
            this.bot.setControlState("jump", false)
          }
         
          if (between(distance, 0, 3) && !this.bot.isEating) {
            

            const offHandItem = this.bot.inventory.slots[45];
            if (this.bot.isUsingHeldItem && offHandItem && offHandItem.name === "shield") {
             if (this.bot.isUsingHeldItem && shield) {
              if (this.bot.heldItem === "shield") {
                this.bot.deactivateItem(true)
              }
             }
            }
           
            if (randomAttackType === "Crit") {
              // Perform Crit attack
              this.bot._client.write("position", { ...this.bot.entity.position.offset(0, 0.1625, 0), onGround: false });
              this.bot._client.write("position", { ...this.bot.entity.position.offset(0, 4.0e-6, 0), onGround: false });
              this.bot._client.write("position", { ...this.bot.entity.position.offset(0, 1.1e-6, 0), onGround: false });
              this.bot._client.write("position", { ...this.bot.entity.position, onGround: false });
              
              await this.bot.attack(targetEntity);
              this.bot.entity.onGround = false;
          } else if (randomAttackType === "Sprint") {
              // Perform Sprint attack
              this.bot.setControlState("sprint", false);
              await this.bot.setControlState("sprint", true);
              await this.bot.attack(targetEntity);
             
          }


          if (offHandItem && offHandItem.name === "shield") {
            this.bot.activateItem(true)
          }
          }
        }
      }
    }

    function between(x, min, max) {
      return x >= min && x <= max;
    }

  

    if (this.atkInter) {
      clearInterval(this.atkInter)
      this.atkInter = setInterval(atk, this.debounce)
    } else {
      this.atkInter = setInterval(atk, this.debounce)
    }
    
  }



  stop() {
    this.inCombat = false;
    this.target_G = null;
    this.targetUsername = "";


    this.bot.smartAim.stop()
    this.bot.clearControlStates()
    clearInterval(this.atkInter)
  }
  stopTemporarily() {
    this.inCombat = true;
    this.bot.clearControlStates()
    this.bot.smartAim.stop()
  }

  startAttacking() {
    this.inCombat = true;
    this.bot.smartAim.start(this.targetUsername)
    this.attack(this.target_G)
  }
}


function loadAttackPlugin(bot) {
    bot.attackHandler = new Attack(bot);
}
module.exports = loadAttackPlugin