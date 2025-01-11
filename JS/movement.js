

class Movement {
    constructor(bot) {
        /**
         * @type {mineflayer.Bot}
         */
        this.bot = bot;
        this.isStrafing = false;
        this.isPearling = false;
    }

    
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    // Diagonal strafing pattern
    async diagonalStrafe() {
        if (this.isStrafing) return;
        this.isStrafing = true;

        const diagonalDuration = this.getRandomInt(1500, 3000); // Duration between 1.5s and 3s
        const directions = [["forward", "right"], ["forward", "left"]]; // Possible diagonal directions
        const [move1, move2] = directions[this.getRandomInt(0, directions.length)];

        this.bot.setControlState(move1, true);
        this.bot.setControlState(move2, true);

        await new Promise(resolve => setTimeout(resolve, diagonalDuration));

        this.bot.setControlState(move1, false);
        this.bot.setControlState(move2, false);

        this.isStrafing = false;
    }

    // Zig-zag strafing pattern
    async zigZagStrafe() {
        if (this.isStrafing) return;
        this.isStrafing = true;

        const duration = this.getRandomInt(1000, 3000);
        const directions = ["left", "right"];
        let currentDirection = directions[this.getRandomInt(0, 2)];

        const zigZagInterval = setInterval(() => {
            this.bot.setControlState(currentDirection, false);
            currentDirection = currentDirection === "left" ? "right" : "left";
            this.bot.setControlState(currentDirection, true);
        }, 500);

        await new Promise(resolve => setTimeout(resolve, duration));
        clearInterval(zigZagInterval);
        this.bot.setControlState("left", false);
        this.bot.setControlState("right", false);

        this.isStrafing = false;
    }

    // Circle strafing pattern
    async circleStrafe() {
        if (this.isStrafing) return;
        this.isStrafing = true;

        const circleDuration = this.getRandomInt(2000, 5000); // Duration between 2s and 5s
        const circleDirection = this.getRandomInt(0, 2) === 0 ? "right" : "left";

        this.bot.setControlState(circleDirection, true);
        this.bot.setControlState("forward", true);

        await new Promise(resolve => setTimeout(resolve, circleDuration));

        this.bot.setControlState(circleDirection, false);
        this.bot.setControlState("forward", false);

        this.isStrafing = false;
    }

    // Step (Stap) movement pattern
    async stepMovement() {
        if (this.isStrafing) return;
        this.isStrafing = true;

        const stepCount = this.getRandomInt(2, 5); // Number of steps to take
        const directions = ["left", "right"];
        const moveDirection = directions[this.getRandomInt(0, 2)];

        for (let i = 0; i < stepCount; i++) {
            this.bot.setControlState(moveDirection, true);
            await new Promise(resolve => setTimeout(resolve, this.getRandomInt(200, 400))); // Short burst
            this.bot.setControlState(moveDirection, false);
            await new Promise(resolve => setTimeout(resolve, this.getRandomInt(200, 400))); // Pause between steps
        }

        this.isStrafing = false;
    }

    // Left and Right short strafes (unpredictable)
    async shortStrafe() {
        if (this.isStrafing) return;
        this.isStrafing = true;

        const duration = this.getRandomInt(300, 800); // Short duration between 0.3s and 0.8s
        const direction = this.getRandomInt(0, 2) === 0 ? "left" : "right"; // Randomly choose left or right

        this.bot.setControlState(direction, true);

        await new Promise(resolve => setTimeout(resolve, duration));

        this.bot.setControlState(direction, false);

        this.isStrafing = false;
    }

    // Randomly select and execute a strafing pattern
    async randomStrafe() {
        if (this.isStrafing) return;

        const strafePatterns = [
            this.diagonalStrafe.bind(this),
            this.zigZagStrafe.bind(this),
            this.circleStrafe.bind(this),
            this.stepMovement.bind(this),
            this.shortStrafe.bind(this)
        ];

        // Choose a random strafing pattern
        const pattern = strafePatterns[this.getRandomInt(0, strafePatterns.length)];
        await pattern();
    }

    async start() {
        if (this.bot.isEating) return;
    
        const targetEntity = this.bot.targetSystem.getTargetEntity();
        if (!targetEntity) return;
    
        const dist = this.bot.entity.position.distanceTo(targetEntity.position);
        if (!this.bot.attackHandler.inCombat) return;


        if (this.isEntityInCobweb(this.bot.targetSystem.getTargetEntity()) && dist < 2.7) {
            // Stop moving forward and perform critical hits while strafing
            this.bot.setControlState("forward", false);
            //await this.randomStrafe(); // Perform strafing while attacking
            return;
        }
    
        // Set forward control
        this.bot.setControlState("forward", true);
    
        // Manage sprinting based on task state
        if (this.bot.commonsense.isDoingTask) {
            this.bot.setControlState("sprint", false);
        } else {
            this.bot.setControlState("sprint", true);
        }
    
        // Check if the target is in a cobweb (assuming you have a method to check this)
       
        
    
            if (dist <= 5) {
                // Stop moving forward and start strafing
                await this.randomStrafe();
            }
    
            if (dist <= 1) {
                this.bot.setControlState("forward", false);
            }
    
            // If distance is greater than 4, ensure strafing controls are reset
            if (dist > 4) {
                this.bot.setControlState("right", false);
                this.bot.setControlState("left", false);
        
        }
    }
    
    // Helper method to check if the entity is in a cobweb
    isEntityInCobweb(targetEntity) {
        const blocksAtTargetPos = [
            this.bot.blockAt(targetEntity.position),
            this.bot.blockAt(targetEntity.position.offset(0, -1, 0)),
            this.bot.blockAt(targetEntity.position.offset(0, 1, 0))
          ];
      
          // If any of these blocks are already a cobweb, return
          if (blocksAtTargetPos.some(block => block.name.includes("cobweb"))) {
            console.log("Target is already in a cobweb");
            return true;
          } else {
            return false;
          }
    }
}

// Function to load movement behavior into the bot
function loadMovement(bot) {
    bot.movement = new Movement(bot);
}

module.exports = loadMovement;
