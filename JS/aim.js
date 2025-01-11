// Main class
class SmartAim {
  // Take the bot as a parameter
  constructor(bot) {
    /** 
    * @type {mineflayer.Bot}
    */
    this.bot = bot;
    this.lookInter = null;
  }

  async start() {
    const look = async () => {
      if (this.bot.commonsense.isDoingTask) return;
      if (this.bot.movement.isPearling) return;
      if (!this.bot.attackHandler.inCombat) return;

      const targetUsername = this.bot.targetSystem.getTargetUsername();
      const targetEntity = this.bot.players[targetUsername]?.entity || null;
      
      if (!targetEntity) return; // If no valid target, exit

      this.bot.smoothLook.lookAt(targetEntity.position.offset(0, 1.5, 0), 20);
    };

    // Clear any existing interval and set a new one for aiming
    if (this.lookInter) {
      clearInterval(this.lookInter);
    }
    this.lookInter = setInterval(look, 50); // Adjust the interval duration as needed
  }

  async stop() {
    // Clear the interval when stopping the aiming
    clearInterval(this.lookInter);
    this.lookInter = null;
  }
}

function loadAimPlugin(bot) {
  bot.smartAim = new SmartAim(bot);
}

module.exports = loadAimPlugin;