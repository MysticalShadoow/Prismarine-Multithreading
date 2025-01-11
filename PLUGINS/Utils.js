// Main class
const sleep = async (ms = 2000) => {
  return new Promise((r) => setTimeout(r, ms));
};

class Utils {
    // Take the bot as a parameter
    constructor(bot) {
      /** 
      * @type {mineflayer.Bot}
      */
      this.bot = bot;


      this.isEating = false;
      this.isPotting = false; 

      this.playerData = [];
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
      this.bot.setControlState("sprint", false)
      this.bot.isEating = true;
      await this.bot.equip(gaps, "hand");
      this.bot.activateItem(false);
      await sleep(1600)
      this.bot.deactivateItem()

      this.bot.isEating = false;
     
      this.bot.setControlState("sprint", true)
      this.equipWeapon()

    } catch (error) {
      console.log(error)
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
    console.log("getting called here");
    const inv = this.bot.inventory.items();
    
    const fireResistancePotion = inv.find((item) => {
        return item.nbt?.value?.Potion?.value.includes("fire");
    });
    
    const swiftnessPotion = inv.find((item) => {
        return item.nbt?.value?.Potion?.value.includes("swiftness");
    });
    
    const strengthPotion = inv.find((item) => {
        return item.nbt?.value?.Potion?.value.includes("strength");
    });


    if (!fireResistancePotion && !swiftnessPotion && !strengthPotion) {
        this.bot.chat("No potions found.");
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
                await sleep(90);
                if (!pot) {
                    console.log("No potion provided to throwPot");
                    res();
                    return;
                }
                await this.bot.equip(pot, "hand");
                this.bot.activateItem();
                this.bot.deactivateItem();
                res();
            } catch (err) {
                console.log(err);
                rej(err);
            }
        });
    };

    await throwPot(fireResistancePotion);
    await throwPot(swiftnessPotion);
    await throwPot(strengthPotion);
}

playerDataListener(packet) {
  if (!packet.entityId || !packet.metadata || packet.metadata.length === 0) return;
  if (!packet.metadata[0].key || packet.metadata[0].key !== 8) return;
  //if (!bot.entities[packet.entityId]) {console.log("error no entity with such packet id"); return;}
  //try 0x1B for entity status
  const entity = this.bot.entities[packet.entityId];
      // if (entity.username == "PyroArchive") {
      //   console.log(entity.type + ", " + packet.metadata[0].value);
      // }
  if (entity.type === 'player') {
      if (!this.playerData[entity.username]) {
          this.playerData[entity.username] = {
              "blocking":false,
              "blockTimer":0,
              "eating":false
          };
      }

       if (packet.metadata[0].value === 3) {
        if (entity.equipment[1]?.name === "shield" || entity.equipment[0]?.name === "shield") {
          this.playerData[entity.username].blocking = true;
        }
       } else {
        this.playerData[entity.username].blocking = false;
     }

    // Eating Check
    if (packet.metadata[0].value === 1) {
        this.playerData[entity.username].eating = true
  } else {
      this.playerData[entity.username].eating = false;
  }
      if (entity.username == "PyroArchive") {
          console.log(JSON.stringify(entity.username) + ", " + "EATING? : " + this.playerData[entity.username].eating + ", Shielding? : " + this.playerData[entity.username].blocking);
      }
  }
}

getPlayerData() {
  return this.playerData
}


  generateRandom(maxLimit = 100) {
    let rand = Math.random() * maxLimit;
    rand = Math.floor(rand); // 99.
    return rand;
  }



  pickRandomNumber(start, end) {
    /**
     * Picks a random number within a specified range.
     * 
     * @param {number} start - The start of the range.
     * @param {number} end - The end of the range.
     * @returns {number|string} - A random number within the specified range, or an error message if the range is invalid.
     */
    if (start >= end) {
        return "Invalid range: Start must be less than end.";
    } else {
        return Math.floor(Math.random() * (end - start + 1)) + start;
    }
 }
 
}

function loadUtils(bot) {
    bot.utils = new Utils(bot);
}

module.exports = loadUtils;
