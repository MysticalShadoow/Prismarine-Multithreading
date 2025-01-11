class TargetSystem {
    /**
     * Manages target selection and prioritization for the bot.
     * @param {import('mineflayer').Bot} bot - The mineflayer bot instance.
     */
    constructor(bot) {
        /** @type {import('mineflayer').Bot} */
        this.bot = bot;
        /** @type {string[]} */
        this.targets = []; // Array to hold multiple target usernames
        /** @type {Record<string, { priority: number, health: number, armorStrength: number, armorDurability: number, damageDealt: number, priorityScore: number }>} */
        this.targetPriorities = {}; // Object to store usernames and their priority data
        /** @type {Set<string>} */
        this.allies = new Set(); // Set to hold ally usernames
        /** @type {Record<string, number>} */
        this.damageDealt = {}; // Track damage dealt to each player
        /** @type {Record<string, number>} */
        this.lastHealths = {}; // Track last known health of players

        this.config = {
            armorWeight: 1.5,
            healthWeight: 0.5,
            distanceWeight: 0.2,
            shieldPenalty: 5,
            damageDealtBonus: 0.5,
            highDurabilityPenalty: 2,
            highDurabilityThreshold: 50,
        };
    }

    /**
     * Adds a target to the list by username with priority based on armor strength and other factors.
     * @param {string} targetUsername - The username of the target to add.
     */
    addTarget(targetUsername) {
        if (this.allies.has(targetUsername)) {
            console.log(`Skipping ${targetUsername}: is marked as an ally.`);
            return;
        }

        const targetEntity = this.bot.players[targetUsername]?.entity || null;
        if (!targetEntity) {
            console.log(`Error: Target ${targetUsername} does not exist or is out of range.`);
            return;
        }

        this._initializeDamageTracking(targetUsername);
        this._storeInitialHealth(targetUsername, targetEntity);

        const priorityData = this._calculatePriority(targetUsername);

        if (!this.targets.includes(targetUsername)) {
            this.targets.push(targetUsername);
            this.targetPriorities[targetUsername] = priorityData;
            this._logTargetInfo(targetUsername);
        } else {
            this.targetPriorities[targetUsername] = priorityData;
        }
    }

    /**
     * Initializes damage tracking for a player.
     * @private
     * @param {string} targetUsername - The username of the player.
     */
    _initializeDamageTracking(targetUsername) {
        if (!this.damageDealt[targetUsername]) {
            this.damageDealt[targetUsername] = 0;
        }
    }

    /**
     * Stores the initial health of a target.
     * @private
     * @param {string} targetUsername - The username of the target.
     * @param {import('mineflayer').Entity} targetEntity - The target's entity object.
     */
    _storeInitialHealth(targetUsername, targetEntity) {
        const currentHealth = this._getEntityHealth(targetEntity);
        this.lastHealths[targetUsername] = currentHealth;
    }

    /**
     * Tracks damage dealt to players.
     * @param {string} targetUsername - The username of the target.
     */
    updateDamageDealt(targetUsername) {
        const targetEntity = this.bot.players[targetUsername]?.entity;
        if (!targetEntity) return;

        const currentHealth = this._getEntityHealth(targetEntity);
        const lastHealth = this.lastHealths[targetUsername] || 20;

        if (currentHealth < lastHealth) {
            const damageDone = lastHealth - currentHealth;
            this.damageDealt[targetUsername] = (this.damageDealt[targetUsername] || 0) + damageDone;
            // Consider using debug logging instead of console.log for less verbose output
            // this.bot.emit('debug', `Damage dealt to ${targetUsername}: ${this.damageDealt[targetUsername]} total`);
        }

        this.lastHealths[targetUsername] = currentHealth;
    }

    /**
     * Retrieves the health of an entity using different methods.
     * @private
     * @param {import('mineflayer').Entity} entity - The entity object.
     * @returns {number} - The health of the entity.
     */
    _getEntityHealth(entity) {
        let health = 20; // Default to full health

        if (entity?.metadata) {
            if (entity.metadata[8] && typeof entity.metadata[8].value === 'number') {
                health = entity.metadata[8].value;
            } else if (entity.metadata[7] && typeof entity.metadata[7].value === 'number') {
                health = entity.metadata[7].value;
            }
        }

        return Math.max(0, Math.min(20, health));
    }

    /**
     * Calculates the priority of a target based on various factors.
     * @private
     * @param {string} targetUsername - The username of the target.
     * @returns {{ priority: number, health: number, armorStrength: number, armorDurability: number, damageDealt: number, priorityScore: number }} - The priority data for the target.
     */
    _calculatePriority(targetUsername) {
        const player = this.bot.players[targetUsername];
        const targetEntity = player?.entity || null;
        if (!targetEntity) return { priority: 5, health: 20, armorStrength: 0, armorDurability: 0, damageDealt: 0, priorityScore: Infinity };

        const health = this._getEntityHealth(targetEntity);
        this.lastHealths[targetUsername] = health; // Update last known health

        const armorData = this._calculateArmorStrengthAndDurability(targetEntity);
        const distance = targetEntity.position.distanceTo(this.bot.entity.position);
        const damageDealt = this.damageDealt[targetUsername] || 0;
        const hasShield = this._hasShield(targetEntity);

        const priorityScore = this._calculatePriorityScore(health, armorData.armorStrength, distance, hasShield, damageDealt, armorData.totalDurability);
        const priority = this._scoreToPriorityLevel(priorityScore);

        return {
            priority,
            health,
            armorStrength: armorData.armorStrength,
            armorDurability: armorData.totalDurability,
            damageDealt,
            priorityScore
        };
    }

    /**
     * Calculates the combined armor strength and total durability of a target.
     * @private
     * @param {import('mineflayer').Entity} targetEntity - The target's entity object.
     * @returns {{ armorStrength: number, totalDurability: number }} - The armor strength and total durability.
     */
    _calculateArmorStrengthAndDurability(targetEntity) {
        const armorSlots = targetEntity.equipment.slice(2, 6);
        let armorStrength = 0;
        let totalDurability = 0;

        const armorStrengths = {
            "netherite_helmet": 4, "netherite_chestplate": 4, "netherite_leggings": 4, "netherite_boots": 4,
            "diamond_helmet": 3, "diamond_chestplate": 3, "diamond_leggings": 3, "diamond_boots": 3,
            "iron_helmet": 2, "iron_chestplate": 2, "iron_leggings": 2, "iron_boots": 2,
            "chainmail_helmet": 1.5, "chainmail_chestplate": 1.5, "chainmail_leggings": 1.5, "chainmail_boots": 1.5,
            "gold_helmet": 1, "gold_chestplate": 1, "gold_leggings": 1, "gold_boots": 1,
            "leather_helmet": 0.5, "leather_chestplate": 0.5, "leather_leggings": 0.5, "leather_boots": 0.5
        };

        armorSlots.forEach(armor => {
            if (armor) {
                const armorName = armor.name;
                if (armorStrengths[armorName]) {
                    armorStrength += armorStrengths[armorName];
                }
                totalDurability += armor.durabilityUsed || 0;
            }
        });

        return { armorStrength, totalDurability };
    }

    /**
     * Checks if a target has a shield in their off-hand.
     * @private
     * @param {import('mineflayer').Entity} targetEntity - The target's entity object.
     * @returns {boolean} - True if the target has a shield, false otherwise.
     */
    _hasShield(targetEntity) {
        const offhandItem = targetEntity.equipment[1];
        return !!(offhandItem && offhandItem.name === 'shield');
    }

    /**
     * Calculates the priority score based on various factors.
     * @private
     * @param {number} health - The health of the target.
     * @param {number} armorStrength - The armor strength of the target.
     * @param {number} distance - The distance to the target.
     * @param {boolean} hasShield - Whether the target has a shield.
     * @param {number} damageDealt - The damage dealt to the target.
     * @param {number} totalDurability - The total durability of the target's armor.
     * @returns {number} - The calculated priority score.
     */
    _calculatePriorityScore(health, armorStrength, distance, hasShield, damageDealt, totalDurability) {
        let priorityScore = 0;

        priorityScore += health * this.config.healthWeight;
        priorityScore += armorStrength * this.config.armorWeight;
        priorityScore += distance * this.config.distanceWeight;
        priorityScore += hasShield ? this.config.shieldPenalty : 0;
        priorityScore -= damageDealt * this.config.damageDealtBonus;

        if (totalDurability > this.config.highDurabilityThreshold) {
            priorityScore += this.config.highDurabilityPenalty;
        }

        return priorityScore;
    }

    /**
     * Converts a priority score to a priority level (1-5).
     * @private
     * @param {number} priorityScore - The priority score.
     * @returns {number} - The priority level.
     */
    _scoreToPriorityLevel(priorityScore) {
        if (priorityScore < 10) return 1;
        if (priorityScore < 20) return 2;
        if (priorityScore < 30) return 3;
        if (priorityScore < 40) return 4;
        return 5;
    }

    /**
     * Gets the best target entity based on comprehensive scoring.
     * @returns {import('mineflayer').Entity | null} - The best target entity or null if no valid targets.
     */
    getTargetEntity() {
        let bestTarget = null;
        let bestScore = Infinity;

        for (const targetUsername of this.targets) {
            if (this.allies.has(targetUsername)) continue;

            const targetEntity = this.bot.players[targetUsername]?.entity;
            if (!targetEntity) continue;

            this.updateDamageDealt(targetUsername); // Keep damage tracking up-to-date

            const priorityData = this._calculatePriority(targetUsername);
            this.targetPriorities[targetUsername] = priorityData;

            if (priorityData.priorityScore < bestScore) {
                bestTarget = targetEntity;
                bestScore = priorityData.priorityScore;
            }
        }

        return bestTarget;
    }

    /**
     * Adds an ally to the ally list and removes them from the target list.
     * @param {string} allyUsername - The username of the ally to add.
     */
    addAlly(allyUsername) {
        this.allies.add(allyUsername);
        this.removeTarget(allyUsername);
        console.log(`${allyUsername} added as an ally.`);
    }

    /**
     * Removes an ally from the ally list.
     * @param {string} allyUsername - The username of the ally to remove.
     */
    removeAlly(allyUsername) {
        this.allies.delete(allyUsername);
        console.log(`${allyUsername} removed as an ally.`);
    }

    /**
     * Logs information about a target.
     * @private
     * @param {string} targetUsername - The username of the target.
     */
    _logTargetInfo(targetUsername) {
        const player = this.bot.players[targetUsername];
        if (!player) {
            console.log(`Error: Player ${targetUsername} does not exist.`);
            return;
        }

        const targetEntity = player.entity;
        const armorSlots = targetEntity.equipment.slice(2, 6);
        const armorInfo = armorSlots.map(armor => (armor ? armor.name : 'none')).join(", ");
        const health = this._getEntityHealth(targetEntity);
        const damageDealt = this.damageDealt[targetUsername] || 0;

        console.log(`Target: ${targetUsername}, Health: ${health}, Damage Dealt: ${damageDealt}, Armor: ${armorInfo}`);
    }

    /**
     * Removes a target from the target list and related data.
     * @param {string} targetUsername - The username of the target to remove.
     */
    removeTarget(targetUsername) {
        this.targets = this.targets.filter(t => t !== targetUsername);
        delete this.targetPriorities[targetUsername];
        delete this.damageDealt[targetUsername];
        delete this.lastHealths[targetUsername];
    }

    /**
     * Clears all targets and related data.
     */
    clearTargets() {
        this.targets = [];
        this.targetPriorities = {};
        this.damageDealt = {};
        this.lastHealths = {};
    }

    /**
     * Gets the username of the best target.
     * @returns {string | null} - The username of the best target or null if no valid targets.
     */
    getTargetUsername() {
        const targetEntity = this.getTargetEntity();
        return targetEntity?.username || null;
    }

    /**
     * Checks if there is a valid target.
     * @returns {boolean} - True if there is a valid target, false otherwise.
     */
    hasValidTarget() {
        return this.targets.length > 0 && this.getTargetEntity() !== null;
    }
}

/**
 * Initializes the target system for the bot.
 * @param {import('mineflayer').Bot} bot - The mineflayer bot instance.
 */
function loadTargetSystem(bot) {
    bot.targetSystem = new TargetSystem(bot);
}

module.exports = loadTargetSystem;