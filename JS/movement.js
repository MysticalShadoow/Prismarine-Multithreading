const { Movements } = require("mineflayer-pathfinder");

// Main class
class Movement {
    // Take the bot as a parameter
    constructor(bot) {
      /** 
      * @type {mineflayer.Bot}
      */
      this.bot = bot
}


randomStrafe() {
    const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;
    const strafeValue = random(1, 3);
    let strafeTimer = 0;
    const strafeDuration = Math.floor(Math.random() * (3500 - 1000) + 1900);
    var strafeDirection = null;


    if (strafeValue === 2) {
      strafeDirection = "left";
    }

    if (strafeValue === 1) {
      strafeDirection = "right";
    }

    while (strafeTimer < strafeDuration) {
      strafeTimer++;
      if (strafeDirection === "right") {
        this.bot.setControlState("left", false);
        this.bot.setControlState("right", true);
      } else if (strafeDirection === "left") {
        this.bot.setControlState("right", false);
        this.bot.setControlState("left", true);
      } else {
        this.bot.setControlState("right", false);
        this.bot.setControlState("left", false);
      }
    }

    strafeTimer = 0;
  }

  start() {
    console.log("called")
      if (this.bot.isEating) return;
      const dist = this.bot.entity.position.distanceTo(this.bot.attackHandler.target_G.position)
      if (!this.bot.attackHandler.inCombat) return;
        console.log("second called")
        this.bot.setControlState("jump", true)
        this.bot.setControlState("forward", true)
        if (this.bot.commonsense.isDoingTask) {
          this.bot.setControlState("sprint", false)
        } else {
          this.bot.setControlState("sprint", true)
        }



        if (dist <= 3) {
          this.bot.setControlState("forward", false)
          this.randomStrafe()
        }

        // if (dist <= 1) {
        //   this.bot.setControlState("forward", false)
        //   this.bot.setControlState("sprint", false)

        // }

        if (dist > 5) {
          this.bot.setControlState("right", false)
          this.bot.setControlState("left", false)
        }


      
    }
  }

function loadMovement(bot) {
  bot.movement = new Movement(bot)
}

module.exports = loadMovement