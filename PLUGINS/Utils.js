// Main class
class Utils {
    // Take the bot as a parameter
    constructor(bot) {
      /** 
      * @type {mineflayer.Bot}
      */
      this.bot = bot;


      this.isEating = false;
      this.isPotting = false; 
}


async equipWeapon() {
    if (this.bot.isUsingHeldItem) return;
    if (this.bot.heldItem && (this.bot.heldItem.name.includes("sword") || this.bot.heldItem.name.includes("axe"))) {
      if (this.bot.heldItem.name.includes("axe")) {
        const sword = this.bot.inventory.items().find((item) => item.name.includes("sword"));
        if (sword) {
          this.bot.equip(sword)
        }
      }
    }
    const weapon = this.bot.inventory.items().find((item) => item.name.includes("sword") || item.name.includes("axe"));
    if (!weapon) {
      return;
    }
    this.bot.equip(weapon, "hand");
}

  async equipTotem() {
    // Checks if there is a shield in the off-hand slot, if not, it tries to equip a shield
    const offHandItem = this.bot.inventory.slots[45];
    if (offHandItem && offHandItem.name === "totem") return;
    const totem = this.bot.inventory.items().find((item) => item.name.includes("totem"));
    if (!totem) return;
    this.bot.equip(totem, "off-hand");
  }

  async equipShield() {
    // Checks if there is a shield in the off-hand slot, if not, it tries to equip a shield
    const offHandItem = this.bot.inventory.slots[45];
    if (offHandItem && offHandItem.name === "shield") return;
    const shield = this.bot.inventory.items().find((item) => item.name.includes("shield"));
    if (!shield) return;
    this.bot.equip(shield, "off-hand");
  }



  async eatGap() {
    if (this.bot.isUsingHeldItem) return;
    const gaps = this.bot.inventory
      .items()
      .find(
        (i) => i.name === "golden_apple" || i.name === "enchanted_golden_apple"
      );
    if (!gaps) return;
    const totem = this.bot.inventory.items().find((item) => item.name.includes("totem_of_undying"));
    try {
      if (this.bot.isEating) return;

      this.bot.isEating = true;
      await this.bot.equip(gaps, "hand");
      this.bot.activateItem(false);
      await sleep(1600)
      this.bot.deactivateItem()

      this.bot.isEating = false;

      this.equipWeapon()

    } catch {
      console.log("shit bro failed to eat...")
      this.bot.isEating = false;
    }
  }

 

  async throwHealingPot() {
    if (this.isPotting) return;
    this.isPotting = true;
    const inv = this.bot.inventory.items();
    const healingPotion = inv.find((item) => {
      return item.nbt?.value?.Potion?.value.includes("healing");
    });

    if (!healingPotion) {
      this.bot.chat("no healing potions returning..");
      return;
    }

      const throwPot = async (pot) => {
      return new Promise(async (res, rej) => {
        try {
          await this.bot.smoothLook.lookAt(
            this.bot.entity.position.offset(0, -1, 0),
            50,
            true
          );
          await sleep(100);
          await this.bot.equip(pot, "hand");
          await sleep(50)
          this.bot.activateItem();
          res();
        } catch (err) {
          console.log(err)
        }
      });
    };

    await throwPot(healingPotion);
   
    this.isPotting = false;

  }

  async readyUp() {
    console.log("getting caleed here")
    const inv = this.bot.inventory.items();
    
    const fireResistancePotion = inv.find((item) => {
      return item.nbt?.value?.Potion?.value.includes("fire");
    });
    
    const swiftnessPotion = inv.find((item) => {
      return item.nbt?.value?.Potion?.value.includes("swiftness");
    });
     const strenghtPotion = inv.find((item) => {
      return item.nbt?.value?.Potion?.value.includes("strength");
    });


    if (!fireResistancePotion && !swiftnessPotion && !strenghtPotion) {
      this.bot.chat("no potions returning..");
      return;
    }

    const throwPot = async (pot) => {
      return new Promise(async (res, rej) => {
        try {
          await this.bot.smoothLook.lookAt(
            this.bot.entity.position.offset(0, -1, 0),
            50,
            true
          );
          await sleep(100);
          await this.bot.equip(pot, "hand");
          this.bot.activateItem();
          res();
        } catch (err) {
          console.log(err)
        }
      });
    };

    
    await throwPot(fireResistancePotion);
    await throwPot(swiftnessPotion);
    await throwPot(strenghtPotion);
  }


  generateRandom(maxLimit = 100) {
    let rand = Math.random() * maxLimit;
    rand = Math.floor(rand); // 99.
    return rand;
  }
}

function loadUtils(bot) {
    bot.utils = new Utils(bot);
}

module.exports = loadUtils;
