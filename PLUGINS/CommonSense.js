const Vec3 = require("vec3").Vec3;
const sleep = (ms = 2000) => new Promise((resolve) => setTimeout(resolve, ms));

class Commonsense {
  constructor(bot) {
    /** 
     * @type {import("mineflayer").Bot}
     */
    this.bot = bot;
    this.isDoingTask = false;
  }

  async start() {
    await this.escapeCobweb();
  }

  getFeetBlocks() {
    const botPos = this.bot.entity.position;
    const offsets = [
      new Vec3(-0.3, 0, -0.3),
      new Vec3(-0.3, 0, 0.3),
      new Vec3(0.3, 0, -0.3),
      new Vec3(0.3, 0, 0.3),
    ];
    return offsets.map(offset => this.bot.blockAt(botPos.plus(offset)));
  }

  async escapeCobweb() {
    if (this.bot.isEating || this.isDoingTask) return;

    this.isDoingTask = true;

    let blocksAtBotPos = this.getFeetBlocks();
    let cobwebBlock = blocksAtBotPos.find(block => block?.name.includes("cobweb"));

    while (cobwebBlock) {
      if (this.bot.isEating) return;

      const waterBucket = this.bot.inventory.items().find(item => item.name.includes("water_bucket"));
      const chorusFruit = this.bot.inventory.items().find(item => item.name.includes("chorus_fruit"));
      const sword = this.bot.inventory.items().find(item => item.name.includes("sword"));

      if (waterBucket) {
        await this.useItem(waterBucket, cobwebBlock, "water");
      } else if (chorusFruit) {
        await this.useItem(chorusFruit, cobwebBlock, "chorus_fruit");
      } else if (sword) {
        await this.useItem(sword, cobwebBlock, "sword");
      }

      blocksAtBotPos = this.getFeetBlocks();
      cobwebBlock = blocksAtBotPos.find(block => block?.name.includes("cobweb"));
    }

    this.isDoingTask = false;
    await this.equipWeapon();
  }

  async useItem(item, block, type) {
    await this.bot.lookAt(block.position.offset(0.5, 0.5, 0.5), true);
    await this.bot.equip(item, "hand");

    if (type === "water") {
      this.bot.activateItem(false);
      await sleep(400);

      const waterSourceBlock = this.bot.findBlock({
        matching: block => block.name === "water",
        maxDistance: 3,
      });

      if (waterSourceBlock) {
        const emptyBucket = this.bot.inventory.items().find(i => i.name === "bucket");
        if (emptyBucket) {
          await this.bot.equip(emptyBucket, "hand");
        }
        await this.bot.lookAt(waterSourceBlock.position.offset(0.5, 0.5, 0.5), true);
        this.bot.activateItem(false);
      }
    } else if (type === "chorus_fruit") {
      this.bot.activateItem(false);
      await sleep(1600);
      this.bot.deactivateItem();
    } else if (type === "sword") {
      await this.bot.dig(block);
      await sleep(200);
    }
  }

  async equipWeapon() {
    if (this.bot.isUsingHeldItem) return;

    const weapon = this.bot.inventory.items().find(item => item.name.includes("sword") || item.name.includes("axe"));
    if (weapon) {
      await this.bot.equip(weapon, "hand");
    }
  }
}

function commonLoader(bot) {
  bot.commonsense = new Commonsense(bot);
}

module.exports = commonLoader;
