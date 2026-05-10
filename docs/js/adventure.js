/**
 * A tiny framework dedicated to tiny adventure games.
 *
 * `AdventureScene` is a Phaser scene that provides:
 *   - an inventory of named string items carried between scenes,
 *   - a transient message box for flavor text,
 *   - faded transitions between scenes,
 *   - a consistent UI layout with fullscreen support.
 *
 * Subclass it and implement {@link AdventureScene#onEnter} to build one
 * location of your adventure. Call the helper methods ({@link AdventureScene#showMessage},
 * {@link AdventureScene#gainItem}, {@link AdventureScene#gotoScene}, etc.) from
 * your interactive objects.
 *
 * @extends {Phaser.Scene}
 */
class AdventureScene extends Phaser.Scene {

    /**
     * Phaser lifecycle: receives data passed by `scene.start(key, data)`.
     * We use this to thread the inventory through scene transitions.
     *
     * @param {{inventory?: string[]}} data
     */
    init(data) {
        this.inventory = data.inventory || [];
    }

    /**
     * @param {string} key  A unique Phaser scene key (e.g. `"tunnel"`).
     * @param {string} name A human-readable name shown in the UI (e.g. `"The Tunnel"`).
     */
    constructor(key, name) {
        super(key);
        this.name = name;
    }

    /**
     * Phaser lifecycle: called once when the scene starts.
     * Lays out the UI, then invokes {@link AdventureScene#onEnter}.
     * Subclasses should override `onEnter`, not `create`.
     */
    create() {
        /** @type {number} Duration in ms of scene fade-in / fade-out. */
        this.transitionDuration = 1000;

        /** @type {number} Game width in scaled pixels (nominally 1920). */
        this.w = this.game.config.width;
        /** @type {number} Game height in scaled pixels (nominally 1080). */
        this.h = this.game.config.height;
        /** @type {number} UI spacing unit in scaled pixels (1% of width). Use multiples of `this.s` for text sizes, margins, etc. */
        this.s = this.game.config.width * 0.01;

        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(this.transitionDuration, 0, 0, 0);

        this.add.rectangle(this.w * 0.75, 0, this.w * 0.25, this.h).setOrigin(0, 0).setFillStyle(0);
        this.add.text(this.w * 0.75 + this.s, this.s)
            .setText(this.name)
            .setStyle({ fontSize: `${3 * this.s}px` })
            .setWordWrapWidth(this.w * 0.25 - 2 * this.s);

        this.messageBox = this.add.text(this.w * 0.75 + this.s, this.h * 0.33)
            .setStyle({ fontSize: `${2 * this.s}px`, color: '#eea' })
            .setWordWrapWidth(this.w * 0.25 - 2 * this.s);

        this.inventoryBanner = this.add.text(this.w * 0.75 + this.s, this.h * 0.66)
            .setStyle({ fontSize: `${2 * this.s}px` })
            .setText("Inventory")
            .setAlpha(0);

        this.inventoryTexts = [];
        this.updateInventory();

        this.add.text(this.w - 3 * this.s, this.h - 3 * this.s, "📺")
            .setStyle({ fontSize: `${2 * this.s}px` })
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.showMessage('Fullscreen?'))
            .on('pointerdown', () => {
                if (this.scale.isFullscreen) {
                    this.scale.stopFullscreen();
                } else {
                    this.scale.startFullscreen();
                }
            });

        this.onEnter();

    }

    /**
     * Briefly flash a message in the UI message box. The message fades out
     * over a few seconds.
     *
     * @param {string} message The text to show.
     */
    showMessage(message) {
        this.messageBox.setText(message);
        this.tweens.add({
            targets: this.messageBox,
            alpha: { from: 1, to: 0 },
            easing: 'Quintic.in',
            duration: 4 * this.transitionDuration
        });
    }

    /**
     * Re-render the inventory panel. Called automatically by
     * {@link AdventureScene#gainItem} and {@link AdventureScene#loseItem};
     * you generally do not need to call this yourself.
     */
    updateInventory() {
        if (this.inventory.length > 0) {
            this.tweens.add({
                targets: this.inventoryBanner,
                alpha: 1,
                duration: this.transitionDuration
            });
        } else {
            this.tweens.add({
                targets: this.inventoryBanner,
                alpha: 0,
                duration: this.transitionDuration
            });
        }
        if (this.inventoryTexts) {
            this.inventoryTexts.forEach((t) => t.destroy());
        }
        this.inventoryTexts = [];
        let h = this.h * 0.66 + 3 * this.s;
        this.inventory.forEach((e, i) => {
            let text = this.add.text(this.w * 0.75 + 2 * this.s, h, e)
                .setStyle({ fontSize: `${1.5 * this.s}px` })
                .setWordWrapWidth(this.w * 0.75 + 4 * this.s);
            h += text.height + this.s;
            this.inventoryTexts.push(text);
        });
    }

    /**
     * Test whether the player is currently carrying an item.
     *
     * @param {string} item Item name.
     * @returns {boolean}
     */
    hasItem(item) {
        return this.inventory.includes(item);
    }

    /**
     * Add an item to the player's inventory (no-op with a console warning
     * if the item is already held). The inventory panel animates the new entry in.
     *
     * @param {string} item Item name. Short and consistent works best (e.g. `"key"`, not `"a shiny key"`).
     */
    gainItem(item) {
        if (this.inventory.includes(item)) {
            console.warn('gaining item already held:', item);
            return;
        }
        this.inventory.push(item);
        this.updateInventory();
        for (let text of this.inventoryTexts) {
            if (text.text == item) {
                this.tweens.add({
                    targets: text,
                    x: { from: text.x - 20, to: text.x },
                    alpha: { from: 0, to: 1 },
                    ease: 'Cubic.out',
                    duration: this.transitionDuration
                });
            }
        }
    }

    /**
     * Remove an item from the player's inventory (no-op with a console warning
     * if the item is not held). The inventory panel animates the entry out.
     *
     * @param {string} item Item name. Must match the name passed to {@link AdventureScene#gainItem}.
     */
    loseItem(item) {
        if (!this.inventory.includes(item)) {
            console.warn('losing item not held:', item);
            return;
        }
        for (let text of this.inventoryTexts) {
            if (text.text == item) {
                this.tweens.add({
                    targets: text,
                    x: { from: text.x, to: text.x + 20 },
                    alpha: { from: 1, to: 0 },
                    ease: 'Cubic.in',
                    duration: this.transitionDuration
                });
            }
        }
        this.time.delayedCall(500, () => {
            this.inventory = this.inventory.filter((e) => e != item);
            this.updateInventory();
        });
    }

    /**
     * Fade out the camera and transition to another scene by key, carrying
     * the current inventory with us.
     *
     * @param {string} key The Phaser scene key of the destination scene.
     */
    gotoScene(key) {
        this.cameras.main.fade(this.transitionDuration, 0, 0, 0);
        this.time.delayedCall(this.transitionDuration, () => {
            this.scene.start(key, { inventory: this.inventory });
        });
    }

    /**
     * Subclass hook: called at the end of {@link AdventureScene#create}, after
     * the message box and inventory panel exist. Override this in your scene
     * to add your location's interactive objects.
     *
     * @example
     * onEnter() {
     *     this.add.text(100, 100, "a rock")
     *         .setInteractive()
     *         .on('pointerover', () => this.showMessage("It's a rock."))
     *         .on('pointerdown', () => this.gotoScene('next_room'));
     * }
     */
    onEnter() {
        console.warn('This AdventureScene did not implement onEnter():', this.constructor.name);
    }


    /**
     * Detect if future (ghost) sprite position (based on current direction and acceleration) would have collided with the image.
     * This allows the movement handler to PREVENT movement *before* the collision occurs.
     */
    collisionDetected(sprite, img) {

        const nextX = sprite.x + (sprite.body.velocity.x / 60);
        const nextY = sprite.y + (sprite.body.velocity.y / 60);

        const ghostRect = new Phaser.Geom.Rectangle(
            nextX - (sprite.displayWidth * sprite.originX),
            nextY - (sprite.displayHeight * sprite.originY),
            sprite.displayWidth,
            sprite.displayHeight
        );

        const imgBounds = img.getBounds();
        if (Phaser.Geom.Intersects.RectangleToRectangle(imgBounds, ghostRect)) {
            return true;
        }

    }

    /**
     * Detect if future (ghost) sprite position (based on current direciton and acceleration) would have exited the image's non-transparent area.
     * This allows the movement handler to PREVENT movement *before* the sprite exit off of the visible background canvas.
     */
    exitDetected(sprite, img) {

        const nextX = sprite.x + (sprite.body.velocity.x / 60);
        const nextY = sprite.y + (sprite.body.velocity.y / 60);

        const ghostRect = new Phaser.Geom.Rectangle(
            nextX - (sprite.displayWidth * sprite.originX),
            nextY - (sprite.displayHeight * sprite.originY),
            sprite.displayWidth,
            sprite.displayHeight
        );

        const imgBounds = img.getBounds();

        if (Phaser.Geom.Intersects.RectangleToRectangle(ghostRect, imgBounds)) {
            const halfW = (sprite.displayWidth / 2);
            const halfH = (sprite.displayHeight / 2);

            const points = [
                { x: nextX - halfW, y: nextY },
                { x: nextX + halfW, y: nextY },
                { x: nextX, y: nextY - halfH },
                { x: nextX, y: nextY + halfH }
            ];

            let exitDetected = points.some(p => {
                const localX = (p.x - imgBounds.x) / img.scaleX;
                const localY = (p.y - imgBounds.y) / img.scaleY;
                return this.textures.getPixelAlpha(localX, localY, img.texture.key) === 0;
            });
            return exitDetected;
        }
        if (!Phaser.Geom.Rectangle.ContainsRect(imgBounds, ghostRect)) {
            return true;
        }
    }

    /**
     * returns 'up', 'down', 'left', 'right', 'aligned' based on pointer relative position compared to sprite.
     * this allows (pointerdown) handler to determine which direction is the user asking the sprite to move to.
     * the direction where sprite needs to go in turn drives the movement animation choice from the spritesheet.
     * we use a 45 degree line as a transition boundary from left/right to up/down 
     */
    determineRelativeDirection(pointer, sprite) { // X-axis increases left to right; Y-axis increases top to bottom!
        if (pointer.x == sprite.x) { // special case, sprite and pointer are on the same vertical
            if (pointer.y < sprite.y)
                return 'up'; // pointer is above the sprite (pointer.y < sprite.y)
            else if (pointer.y > sprite.y)
                return 'down'; // pointer is below the sprite (pointer.y > sprite.y)
            else
                return 'none'; // both pointer and sprite are centered on one another - no movement should occur!
        } else { // use 45 degree angle to transition from going left/right to up/down. slope <= 1 means angle is under 45 degrees
            const slope = Math.abs((pointer.y - sprite.y) / (pointer.x - sprite.x))
            if (slope <= 1) { // slope <= 1 means angle is under 45 degrees against the x-axis
                if (pointer.x < sprite.x)
                    return 'left'; // pointer is to the left of the sprite (pointer.x < sprite.x)
                else
                    return 'right'; // pointer is to the right of the sprite (pointer.x > sprite.x)
            } else { // slope > 1 means angle is over 45 degrees against the x-axis
                if (pointer.y < sprite.y)
                    return 'up'; // pointer is above the sprite (pointer.y < sprite.y)
                else
                    return 'down'; // pointer is below the sprite (pointer.y > sprite.y)
            }
        }
    }
}
