// Main class
class SmartAim {
    // Take the bot as a parameter
    constructor(bot) {
      /** 
      * @type {mineflayer.Bot}
      */
      this.bot = bot
}


async start(target) {
    const look = async () => {
      if (this.bot.commonsense.isDoingTask) return;
      if (!this.bot.attackHandler.target_G) return;
      
      if (!this.bot.players[target] && this.bot.isPotting) return;
      this.bot.lookAt(this.bot.players[target].entity?.position.offset(0, 1.5, 0), 10, true);

async start() {
    const look = async () => {

      if (!this.target_G && this.isPotting) return;
      this.bot.smoothLook.lookAt(this.target_G.position.offset(0, 1.5, 0), 10, true);

    }

    this.lookInter = setInterval(look)
  }

  async stop() {
    clearInterval(this.bot.lookInter)
  }

}



}


function loadAimPlugin(bot) {
    bot.smartAim = new SmartAim(bot)
}

module.exports = loadAimPlugin