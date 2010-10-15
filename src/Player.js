/**
    A class to represent the player on the screen
    @author <a href="mailto:matthewcasperson@gmail.com">Matthew Casperson</a>
    @class
*/
function Player()
{
    /** The maximum height of the jump
        @type Number
     */
    this.jumpHeight = 64;
    /** The constant or half PI
        @type Number
     */
    this.halfPI = Math.PI / 2;
    /** The amount of time to spend in the air when jumping
        @type Number
     */
    this.jumpHangTime = 0.5;
    /** The speed to progress alone the sine wave that defines
        the jumping arc
        @type Number
     */
    this.jumpSinWaveSpeed = this.halfPI / this.jumpHangTime;
    /** The current position on the sine wave that defines the jump arc
        @type Number
     */
    this.jumpSinWavePos = 0;
    /** The rate to fall at
        @type Number
     */
    this.fallMultiplyer = 1.5;
    /** True when the player is on the ground, false otherwise
        @type Boolean
     */
    this.grounded = true;
    /** the players running speed
        @type Number
     */
    this.speed = 100;
    /** True if the player is moving left, false otherwise
        @type Boolean
     */
    this.left = false;
    /** True if the player is moving right, false otherwise
        @type Boolean
     */
    this.right = false;
    /** A reference to the level object
        @type Level
    */
    this.level = null;
    /** The distance between the player and the edge of the screen
        @type Number
     */
    this.screenBorder = 200;
	
	/** Boolean indicating that the player is moving by mouse?
        @type Boolean
     */
	this.moving = false;
	
	/** The direction that the player is currently facing/moving.  Range is 0-360?  Need to work on the math.
        @type Number
     */
	this.angle = 0;
	
	this.dest_x = 0;
	this.dest_y = 0;

    /**
        Initialises this object
    */
    this.startupPlayer = function(level)
    {
        this.startupAnimatedGameObject(g_ResourceManager.idleLeft, 300, 400 - 48 - 48, 4, 6, 20);
        this.level = level;
        return this;
    }

    /**
        Called when a key is pressed
        @param event Event Object
    */
    this.keyDown = function(event)
    {
        var updateRequired = false;

        // left
        if (event.keyCode == 37 && !this.left)
        {
            this.left = true;
            updateRequired = true;
        }
        // right
        if (event.keyCode == 39 && !this.right)
        {
            this.right = true;
            updateRequired = true;
        }
        if (event.keyCode == 32 && this.grounded)
        {
            this.grounded = false;
            this.jumpSinWavePos = 0;
        }

        if (updateRequired)
            this.updateAnimation();

    }

    /**
        Called when a key is pressed
        @param event Event Object
    */
    this.keyUp = function(event)
    {
        // left
        if (event.keyCode == 37)
        {
            this.left = false;
            this.setAnimation(g_ResourceManager.idleLeft, 6, 20);
        }
        // right
        if (event.keyCode == 39)
        {
            this.right = false;
            this.setAnimation(g_ResourceManager.idleRight, 6, 20);
        }

        this.updateAnimation();
    }
	
	this.mouseDown = function(event)
    {
		if (event.layerX || event.layerX == 0) { // Firefox
			event._x = event.layerX;
			event._y = event.layerY;
		} else if (event.offsetX || event.offsetX == 0) { // Opera
			event._x = event.offsetX;
			event._y = event.offsetY;
		}

		this.dest_x = event._x;
		this.dest_y = event._y;		
		
        this.moving = true;
		
		//the movement in the x dimension is equal to the ... this doesnt work i dont think, but parts are good
		//xmove = (mousex - this.x)*this.speed/distance(this.x, this.y, mousex, mousey)
		
		this.angle = Math.atan2(event._y-this.y, event._x - this.x);
    }
	
	this.mouseMove = function (event)
	{
		if (this.moving) {
			if (event.layerX || event.layerX == 0) { // Firefox
				event._x = event.layerX;
				event._y = event.layerY;
			} else if (event.offsetX || event.offsetX == 0) { // Opera
				event._x = event.offsetX;
				event._y = event.offsetY;
			} 
			this.dest_x = event._x;
			this.dest_y = event._y;
			this.angle = Math.atan2(event._y-this.y, event._x - this.x);
		}
	}
	
	this.mouseUp = function(event)
    {
		// keep moving to the destination, but stop when you get there.  this needs to happen on the update animation part, not here
		this.moving = false;
	}

    /**
        Updates the current animation depending on the movement
        of the player. This accounts for the fact that both
        the left and right arrow keys can be pressed at the
        same time.
    */
    this.updateAnimation = function()
    {
       if (this.right && this.left)
            this.setAnimation(g_ResourceManager.idleLeft, 6, 20);
        else if (this.right)
            this.setAnimation(g_ResourceManager.runRight, 12, 20);
        else if (this.left)
            this.setAnimation(g_ResourceManager.runLeft, 12, 20);
    }

    /**
        Updates the object
        @param dt The time since the last frame in seconds
        @param context The drawing context
        @param xScroll The global scrolling value of the x axis
        @param yScroll The global scrolling value of the y axis
    */
	this.update = function (/**Number*/ dt, /**CanvasRenderingContext2D*/context, /**Number*/ xScroll, /**Number*/ yScroll)
    {
		if (distance(this.dest_x, this.dest_y, this.x, this.y) < (this.speed * dt)) {
			//alert("destination reached");
			//g_console = "destination (" + this.dest_x + ", " + this.dest_y + ") reached - " + this.x + "," + this.y + "<br/" + g_console;
			this.x = this.dest_x;
			this.y = this.dest_y;
		} else {
			//alert("moving");
			this.x += Math.cos(this.angle) * this.speed * dt;
			this.y += Math.sin(this.angle) * this.speed * dt;
			//g_console = "moving. distance: " + (Math.cos(this.angle) * this.speed * dt) + ", " + (Math.sin(this.angle) * this.speed * dt) + "<br/>" + g_console;
		}
		

        // XOR operation (JavaScript does not have a native XOR operator)
        // only test for a collision if the player is moving left or right (and not trying to do both at
        // the same time)
		
        if ((this.right || this.left) && !(this.left && this.right))
        {
            // this will be true until the player is no longer colliding
            var collision = false;
            // the player may have to be pushed back through several block stacks (especially if the
            // frame rate is very slow)
            //do
            //{
                // the current position of the player (test the left side if running left
                // and the right side if running right)
                //var xPos = this.left ? this.x : this.x + this.frameWidth;
                // the index of stack of blocks that the player is standing on/in
                //var currentBlock = this.level.currentBlock(xPos);
                // the height of the stack of blocks that the player is standing on/in
                //var groundHeight = this.level.groundHeight(currentBlock);
                // the height of the player (we need the height from the ground up,
                // whereas the this.y value represents the position of the player
                // from the "sky" down).
                //var playerHeight = context.canvas.height - (this.y + this.image.height);
                // if the player is not higher than the stack of blocks, it must be colliding
                //if (playerHeight  < groundHeight)
                //{
                //    collision = true;
                    // we are moving right, so push the player left
                //    if (this.right)
                //        this.x = this.level.blockWidth * currentBlock - this.frameWidth - 1;
                    // we are moving left, push the player right
                //    else
                //        this.x = this.level.blockWidth * (currentBlock + 1);
                //}
                //else
                //{
                //    collision = false;
                //}
            //}  while (collision)
        }

        // keep the player bound to the level
        //if (this.x > this.level.blocks.length * this.level.blockWidth - this.frameWidth - 1)
        //    this.x = this.level.blocks.length * this.level.blockWidth - this.frameWidth - 1;
        if (this.x > context.canvas.width - this.frameWidth + xScroll -  this.screenBorder)
            g_GameObjectManager.xScroll = this.x - (context.canvas.width - this.frameWidth -  this.screenBorder);
        // modify the xScroll value to keep the player on the screen
        if (this.x < 0)
            this.x = 0;
        if (this.x -  this.screenBorder < xScroll)
            g_GameObjectManager.xScroll = this.x - this.screenBorder;
		
		//figure out top and bottom scroll
		// need to add variables for this stuff - y scroll, y screenborder (?)
		if (this.y < 0)
            this.y = 0;
		if (this.y -  this.screenBorder < yScroll)
            g_GameObjectManager.yScroll = this.y - this.screenBorder;

        // if the player is jumping or falling, move along the sine wave
        //if (!this.grounded)
        //{
            // the last position on the sine wave
        //    var lastHeight = this.jumpSinWavePos;
            // the new position on the sine wave
        //    this.jumpSinWavePos += this.jumpSinWaveSpeed * dt;

            // we have fallen off the bottom of the sine wave, so continue falling
            // at a predetermined speed
        //    if (this.jumpSinWavePos >= Math.PI)
        //         this.y += this.jumpHeight / this.jumpHangTime * this.fallMultiplyer * dt;
            // otherwise move along the sine wave
        //    else
        //        this.y -= (Math.sin(this.jumpSinWavePos) - Math.sin(lastHeight)) * this.jumpHeight;
        //}

        // now that the player has had it's y position changed we need to check for a collision
        // with the ground below the player. we have to check both the players left and right sides
        // for a collision with the ground

        // left side
        //var currentBlock1 = this.level.currentBlock(this.x);
        // right side
        //var currentBlock2 = this.level.currentBlock(this.x + this.frameWidth);
        // ground height below the left side
        //var groundHeight1 = this.level.groundHeight(currentBlock1);
        // ground height below the right side
        //var groundHeight2 = this.level.groundHeight(currentBlock2);
        // the heighest point under the player
        //var maxGroundHeight = groundHeight1 > groundHeight2 ? groundHeight1 : groundHeight2;
        // the players height (relaitive to the bottom of the screen)
        //var playerHeight = context.canvas.height - (this.y + this.image.height);

        // we have hit the ground
        //if (maxGroundHeight >= playerHeight)
        //{
         //   this.y = context.canvas.height - maxGroundHeight - this.image.height;
           // this.grounded = true;
            //this.jumpSinWavePos = 0;
        //}
        // otherwise we are falling
        //else if (this.grounded)
        //{
          //  this.grounded = false;
            // starting falling down the sine wave (i.e. from the top)
            //this.jumpSinWavePos = this.halfPI;
        //}
    }
	function distance(x1,y1,x2,y2) {
	//find horizontal distance (x)
		var x = x2 - x1;
		//find vertical distance (y)
		var y = y2 - y1;
		//do calculation
		var hyp = Math.sqrt(x*x + y*y);
		return hyp;
	}
}

Player.prototype = new AnimatedGameObject;