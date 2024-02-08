// Main class
class SmartAim {
    // Take the bot as a parameter
    constructor(bot) {
      /** 
      * @type {mineflayer.Bot}
      */
      this.bot = bot
}

async start() {
    const look = async () => {

      if (!this.target_G && this.isPotting) return;
      this.bot.smoothLook.lookAt(this.target_G.position.offset(0, 1.5, 0), 10, true);
    }

    this.lookInter = setInterval(look)
  }
}

function loadAimPlugin(bot) {
    bot.smartAim = new SmartAim(bot)
}

module.exports = loadAimPlugin