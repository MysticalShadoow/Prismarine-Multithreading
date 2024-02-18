;

const Vec3 = require("vec3").Vec3
const sleep = async (ms = 2000) => {
  return new Promise((r) => setTimeout(r, ms));
};


class Commonsense {
  constructor(bot) {
    /**
     * @type {import("mineflayer").Bot}
     */
    this.bot = bot;
    

    this.isDoingTask = false;
  }

  async start() {
    this.escapeCobweb()
  }


  getFeetBlocks() {
    const botPos = this.bot.entity.position;
    const verts = [
      botPos.offset(-0.3, 0, -0.3),
      botPos.offset(-0.3, 0, 0.3),
      botPos.offset(0.3, 0, -0.3),
      botPos.offset(0.3, 0, 0.3)
    ]

    return verts.map(p => this.bot.blockAt(p))

  }

  async escapeCobweb() {
    if (this.bot.isEating) return;

    // these are the blocks that are in the this.bot's feet block
    // you were checking straight in the middle; if its on the edge of a block, it won't see the cobweb.
    // you have to check every corner of the this.bot's hitbox to make sure it isn't in a cobweb.
    // To see what I'm talking about, do CTRL+B to see hitboxes, then look at the this.bot's hitbox
    // put it on the edge of a web and you can tell.
    // okay


    let blocksAtBotPos = this.getFeetBlocks()

    // Check if the this.bot is stuck in a cobweb
    if (!blocksAtBotPos) return;

    if (this.isDoingTask) return;
    this.isDoingTask = true;

    let cobwebIdx = blocksAtBotPos.findIndex(b => b?.name.includes("cobweb"));

    while (cobwebIdx !== -1) {
      if (this.bot.isEating) return;
      const blockAtBotPos = blocksAtBotPos[cobwebIdx];
      if (!blockAtBotPos) return;

  
      // Add code here to place down water.
      const items = this.bot.inventory.items()
      const sword = items.find(item => item.name.includes("sword"));
      const waterBucket = items.find(item => item.name.includes("water_bucket"));
      const chorus_fruit = items.find(item => item.name.includes("chorus_fruit"));

      if (waterBucket) {
        // 0.5, 0.5, 0.5 is center of block
        await this.bot.lookAt(blockAtBotPos.position.offset(0.5, 0.5, 0.5), true)
        await this.bot.equip(waterBucket, "hand");

        this.bot.activateItem(false);
        await sleep(400);

        const waterSourceBlocke = this.bot.findBlock({
          matching: (block) => block.name === "water",
          maxDistance: 3,
        })

        if (waterSourceBlocke) {
          const empty = this.bot.inventory.items().find(item => item.name === "bucket");

          if (empty) {
            this.bot.equip(empty);
          }

          await this.bot.lookAt(waterSourceBlocke.position.offset(0.5, 0.5, 0.5), true)
          this.bot.activateItem(false);
        }

      }else if (chorus_fruit) {
        if (this.bot.isEating) return;
        await this.bot.equip(chorus_fruit, "hand");
        this.bot.activateItem(false);
        await sleep(1600)
        this.bot.deactivateItem()
      }else if (sword) {
        if (this.bot.heldItem && this.bot.heldItem !== sword) {
          await this.bot.equip(sword, "hand");
        } else if (!this.bot.heldItem) {
          await this.bot.equip(sword, "hand");
        }

        await this.bot.lookAt(blockAtBotPos.position.offset(0.5, 0.5, 0.5), true)
        await this.bot.dig(blockAtBotPos)
        await sleep(200)
      }

      // Temporary slow-down.
      await this.bot.waitForTicks(1);

      // Redefine idx to make sure we have the correct next block.
      blocksAtBotPos = this.getFeetBlocks()
      cobwebIdx = blocksAtBotPos.findIndex(b => b.name.includes("cobweb"));
    }

    this.isDoingTask = false;
   // Equip weapon
    if (this.bot.isUsingHeldItem) return;
    if (this.bot.heldItem && (this.bot.heldItem.name.includes("sword") || this.bot.heldItem.name.includes("axe"))) return;
    const weapon = this.bot.inventory.items().find((item) => item.name.includes("sword") || item.name.includes("axe"));
    if (!weapon) {
      return;
    }
    this.bot.equip(weapon, "hand");
  }
}

function commonLoader(bot) {
  bot.commonsense = new Commonsense(bot);
}

module.exports = commonLoader;