const Vec3 = require('vec3').Vec3;

class Attack {
  constructor(bot) {
    /** 
    * @type {mineflayer.Bot}
    */
    this.bot = bot;
    this.inCaombat = false;
    this.atkInter = null;
    this.currentAttackType = null;
    this.isShielding = false;
    this.shieldDebounce = false;
    this.isCobwebbingPlayer = false

    this.baseDebounce = 543;
    this.debounce = 543;
    this.dynamicReachEnabled = true;
    this.minReach = 2.8;
    this.maxReach = 2.99;

    // Simple shield timing
    this.shieldDelay = {
      min: 1700,  
      max: 2500   
    };
    this.unshieldDelay = {
      min: 1700,   
      max: 2500   
    };
  }

  getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getRandomAttackBasedOnContext(ping, isEating) {
    // Base probabilities for each attack type
    let critChance = 0.85;
    let sprintChance = 0.15;
  
    // If the target is eating or the bot is falling, return 'Crit' immediately
    if (isEating || this.bot.entity.velocity.y <= -0.2) {  // Adjusted value for falling
      return 'Crit';
    }
  
    // Adjust probabilities based on ping
    if (ping > 100) {
      critChance += 0.2;
      sprintChance -= 0.1;
    } else if (ping > 60) {
      critChance += 0.15;
      sprintChance -= 0.075;
    } else if (ping < 40) {
      sprintChance += 0.1;
      critChance -= 0.05;
    } else if (ping < 20) {
      sprintChance += 0.15;
      critChance -= 0.1;
    }
  
    // Ensure probabilities don’t drop below zero
    critChance = Math.max(0, critChance);
    sprintChance = Math.max(0, sprintChance);
  
    // Normalize probabilities to sum to 1
    const total = critChance + sprintChance;
    critChance /= total;
    sprintChance /= total;
  
    // Simplified random selection
    return Math.random() < critChance ? 'Crit' : 'Sprint';
  }
  

  async startShielding() {
    if (this.shieldDebounce || this.bot.isEating) return;
    
    try {
      // Check if shield is already equipped in off-hand
      const offHandItem = this.bot.inventory.slots[45]; // Slot 45 is off-hand in Minecraft
      if (!offHandItem || !offHandItem.name.toLowerCase().includes('shield')) {
        const shield = this.bot.inventory.items().find(item => 
          item.name.toLowerCase().includes('shield')
        );
        
        if (shield) {
          await this.bot.equip(shield, 'off-hand');
        } else {
          return; // No shield available
        }
      }

      // Only proceed if we have a shield equipped (either already or just equipped)
      this.isShielding = true;
      await this.bot.activateItem(true);
      
      // Random shield duration between 300ms and 1000ms
      const duration = Math.floor(Math.random() * 900) + 600;
      
      setTimeout(async () => {
        if (this.isShielding) {
          await this.stopShielding();
        }
      }, duration);
    } catch (err) {
      console.error('Error in startShielding:', err);
    }
  }

  async stopShielding() {
    if (!this.isShielding) return;
    
    try {
      await this.bot.deactivateItem();
      this.isShielding = false;
      
      this.shieldDebounce = true;
      setTimeout(() => {
        this.shieldDebounce = false;
      }, this.getRandomDelay(400, 600));
    } catch (err) {
      console.error('Error in stopShielding:', err);
    }
  }

  async performCritAttack(targetEntity) {
    if (this.isShielding) {
      await this.stopShielding();
      await new Promise(resolve => setTimeout(resolve, this.getRandomDelay(this.unshieldDelay.min, this.unshieldDelay.max)));
    }

    if (!this.bot.getControlState("jump")) {
      this.bot.setControlState("jump", true);
    }

    await this.bot._client.write("position", { ...this.bot.entity.position.offset(0, 0.1625, 0), onGround: false });
    await this.bot._client.write("position", { ...this.bot.entity.position.offset(0, 4.0e-6, 0), onGround: false });
    await this.bot._client.write("position", { ...this.bot.entity.position.offset(0, 1.1e-6, 0), onGround: false });
    await this.bot._client.write("position", { ...this.bot.entity.position, onGround: false });

    await this.bot.attack(targetEntity);
    this.bot.entity.onGround = false;

    // Random chance to shield after attack
    if (Math.random() < 0.8) { // 50% chance to shield after attack
      setTimeout(() => {
        this.startShielding();
      }, this.getRandomDelay(this.shieldDelay.min, this.shieldDelay.max));
    }
  }

  async attack() {
    console.log(this.bot.targetSystem.getTargetUsername());
    const atk = async () => {
      if (this.bot.commonsense.isDoingTask || this.bot.isEating) return;
  
      const targetUsername = this.bot.targetSystem.getTargetUsername();
      const targetEntity = this.bot.players[targetUsername]?.entity || null;
  
      if (targetEntity) {
        this.inCombat = true;
        const distance = Math.round(this.bot.entity.position.distanceTo(targetEntity.position));
        const ping = this.bot.players[targetUsername]?.ping || 0;
        const isEating = this.bot.utils.playerData[targetUsername]?.eating || false;
        const isOpponentShielding = this.bot.utils.playerData[targetUsername]?.blocking || false;
        const axe = this.bot.inventory.items().find((item) => item.name.includes("axe"))

         // Random chance to trap in cobweb (20% chance)
        const cobwebs = this.bot.inventory.items().find(item => item.name.includes("cobweb"));
        if (cobwebs && Math.random() < 0.2) {
          await this.trapTargetInCobweb(targetEntity);
        }
  
        // Simple shield decision
        await this.stopShielding();
  
        const randomAttackType = this.getRandomAttackBasedOnContext(ping, isEating);
  
        
        if (between(distance, 0, 3)) {
          await this.stopShielding();

          if (isOpponentShielding) {
            if (!axe) return;
            // Equip axe with a slight delay for human-like behavior
            await this.bot.equip(axe);
            
            // Attack the target
            await this.bot.attack(targetEntity);
          
            // Wait 100 ticks to simulate a cooldown or delay after attacking
          
            // Add delay before re-equipping the main weapon
            await new Promise(resolve => setTimeout(resolve, 20000));
            this.bot.utils.equipWeapon();
          
            return;
          }
          
          if (!this.bot.utils.playerData[targetEntity?.username]?.eating === true) {
            if (Math.random() < 0.8) {
              setTimeout(() => {
                this.startShielding();
              }, this.getRandomDelay(this.shieldDelay.min, this.shieldDelay.max));
            }
          }
  
          if (randomAttackType === "Crit") {
            await this.performCritAttack(targetEntity);

            if (!this.bot.utils.playerData[targetEntity?.username]?.eating === true) {
              if (Math.random() < 0.8) {
                setTimeout(() => {
                  this.startShielding();
                }, this.getRandomDelay(this.shieldDelay.min, this.shieldDelay.max));
              }
            }
  
          } else if (randomAttackType === "Sprint") {
            await this.stopShielding();
            this.bot.setControlState("sprint", true);
            await this.bot.attack(targetEntity);
            this.bot.setControlState("sprint", false);
  
            if (!this.bot.utils.playerData[targetEntity?.username]?.eating === true) {
            if (Math.random() < 0.8) {
              setTimeout(() => {
                this.startShielding();
              }, this.getRandomDelay(this.shieldDelay.min, this.shieldDelay.max));
            }
          }
        }
        }
      }
    };
  
    function between(x, min, max) {
      return x >= min && x <= max;
    }
  
    // Clear any existing interval to prevent multiple timers
    if (this.atkInter) clearInterval(this.atkInter);
    
    // Start the attack loop
    this.atkInter = setInterval(atk, this.debounce);
  
    // Invoke atk initially to start the first attack immediately
    await atk();
  };
  

  async trapTargetInCobweb(targetEntity) {
    this.isCobwebbingPlayer = true;
    try {
      // Check if we have cobwebs in inventory
      const cobwebs = this.bot.inventory.items().find(item => item.name.includes("cobweb"));
      if (!cobwebs) return;
  
      // Check if target is already in a cobweb
      const blocksAtTargetPos = [
        this.bot.blockAt(targetEntity.position),
        this.bot.blockAt(targetEntity.position.offset(0, -1, 0)),
        this.bot.blockAt(targetEntity.position.offset(0, 1, 0))
      ];
  
      // If any of these blocks are already a cobweb, return
      if (blocksAtTargetPos.some(block => block.name.includes("cobweb"))) {
        console.log("Target is already in a cobweb");
        return;
      }
  
      // Calculate the block directly below the player
      const underTargetPos = targetEntity.position.offset(0, -1, 0);
      const blockUnderTarget = this.bot.blockAt(underTargetPos);
  
      // More comprehensive list of valid placement blocks
      const validPlacementBlocks = [
        "grass_block", 
        "dirt", 
        "stone", 
        "sand", 
        "gravel", 
        "netherrack", 
        "end_stone",
        "bedrock",
        "cobblestone",
        "oak_planks",
        "deepslate"
      ];
  
      // Check if the block under the target is suitable for cobweb placement
      if (!validPlacementBlocks.includes(blockUnderTarget.name)) {
        console.log("Cannot place cobweb on this block type:", blockUnderTarget.name);
        return false;
      }
  
      // Equip cobwebs with error handling
      try {
        await this.bot.equip(cobwebs, "hand");
      } catch (equipError) {
        console.log("Failed to equip cobwebs:", equipError);
        return false;
      }
  
      // Advanced placement with multiple strategies
      const placementStrategies = [
        async () => {
          // Strategy 1: Direct placement with extended timeout
          await this.bot.smoothLook.lookAt(underTargetPos.offset(0.5, 0.5, 0.5), true);
          
          // Use custom packet placement to bypass some restrictions
          return this.bot._client.write('block_place', {
            location: underTargetPos,
            direction: 1,  // Up direction
            heldItem: { 
              present: true, 
              itemId: cobwebs.type,
              itemCount: 1
            },
            cursorX: 0.5,
            cursorY: 0.5,
            cursorZ: 0.5
          });
        },
        async () => {
          // Strategy 2: Alternative placement method
          await this.bot.smoothLook.lookAt(underTargetPos.offset(0.5, 0.5, 0.5), true);
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Try mineflayer's placeBlock with modified options
          return this.bot.placeBlock(blockUnderTarget, new Vec3(0, 1, 0), {
            swingArm: true,
            waitForBlockUpdate: false,
            maxPlaceDistance: 5
          });
        }
      ];
  
      // Try multiple placement strategies
      let placementSuccessful = false;
      for (const strategy of placementStrategies) {
        try {
          await strategy();
          placementSuccessful = true;
          console.log("Successfully placed cobweb");
          break;
        } catch (placeError) {
          console.log("Placement strategy failed:", placeError);
          // Small delay between strategies
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
  
      // If no strategy worked, log a comprehensive error
      if (!placementSuccessful) {
        console.error("Failed to place cobweb after all strategies");
        return false;
      }
  
      // Equip weapon after trapping
      try {
        await this.bot.utils.equipWeapon();
      } catch (equipError) {
        console.log("Failed to equip weapon:", equipError);
      }
  
      return placementSuccessful;
    } catch (error) {
      console.error("Comprehensive cobweb trapping failed:", error);
      return false;
    }
    this.isCobwebbingPlayer = false
  }

  stop() {
    this.inCombat = false;
    this.isShielding = false;
    this.bot.deactivateItem();
    this.bot.clearControlStates();
    clearInterval(this.atkInter);
  }

  startAttacking() {
    this.inCombat = true;
    this.bot.smartAim.start(this.bot.targetSystem.getTargetUsername());
    this.bot.utils.equipWeapon();
    this.attack();
  }
}

function loadAttackPlugin(bot) {
  bot.attackHandler = new Attack(bot);
}

module.exports = loadAttackPlugin;