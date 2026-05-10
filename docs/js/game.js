class Demo1 extends AdventureScene {
    constructor() {
        super("demo1", "Room");
    }
    preload() {
        this.load.setBaseURL('https://nmalenovic.github.io/vucici/');
        this.load.image('bg', 'Assets/scene1bedroom/Background3.png');
        this.load.image('bed', 'Assets/scene1bedroom/bed2.png');
        this.load.image('desk', 'Assets/scene1bedroom/desk2.png');
        this.load.image('door', 'Assets/scene1bedroom/door2.png');
        this.load.spritesheet('sprite', 'Assets/scene1bedroom/totalsprite2.2.png', { frameWidth: 14, frameHeight: 30 });
    }

    update() {
        const { bg, sprite, bed, door, desk } = this;

        if (sprite && sprite.body && bg && (sprite.body.velocity.x !== 0 || sprite.body.velocity.y !== 0)) {

            if (this.exitDetected(sprite, bg)
                || this.collisionDetected(sprite, bed)
                || this.collisionDetected(sprite, desk)
                || this.collisionDetected(sprite, door)
            ) {
                sprite.body.reset(sprite.x, sprite.y);
                sprite.anims.stop();
            }
        }
    }


    onEnter() {
        const { width, height } = this.scale;
        const bg = this.bg = this.add.image(width * 3 / 4 / 2, height / 2, 'bg').setScale(4);
        const sprite = this.sprite = this.physics.add.sprite(bg.x, bg.y, 'sprite').setScale(4);
        sprite.x = bg.x - 1/2 * bg.displayWidth + 1/2 * sprite.displayWidth;
        
        const door = this.door = this.add.image(bg.x, bg.y, 'door').setScale(4);
        door.x = bg.x - 1 / 8 * bg.displayWidth;
        door.y = bg.y - 1 / 2 * bg.displayHeight - 1 / 2 * door.displayHeight;
        const desk = this.desk = this.add.image(bg.x, bg.y, 'desk').setScale(4);
        desk.y = bg.y - 1 / 2 * bg.displayHeight + 1 / 2 * desk.displayHeight;
        const bed = this.bed = this.add.image(bg.x, bg.y, 'bed').setScale(4);

        // create animation effect for up/down
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('sprite', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'front',
            frames: this.anims.generateFrameNumbers('sprite', { start: 6, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('sprite', { start: 3, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'back',
            frames: this.anims.generateFrameNumbers('sprite', { start: 9, end: 11 }),
            frameRate: 10,
            repeat: -1
        });

        // stop animation when we let go!
        this.input.on('pointerup', (pointer) => {
            sprite.body.reset(sprite.x, sprite.y);
            sprite.anims.stop();
        });

        // as long as mouse pointer is pressed, move the sprite in the direction of the pointer
        this.input.on('pointerdown', (pointer) => {
            this.physics.moveToObject(sprite, pointer, 200);

            switch(this.determineRelativeDirection(pointer, sprite)) {
                case 'up':
                    sprite.anims.play('back', true);
                    break;
                case 'down':
                    sprite.anims.play('front', true);
                    break;
                case 'left':
                    sprite.anims.play('left', true);
                    break;
                case 'right':
                    sprite.anims.play('right', true);
                    break;
                default: // 'none' - no animation (both are dead-center)
                    sprite.body.reset(sprite.x, sprite.y);
                    sprite.anims.stop();
            }
        });
    }
}

class Demo2 extends AdventureScene {
    constructor() {
        super("demo2", "The second room has a long name (it truly does).");
    }
    preload() {

    }

    onEnter() {
        this.add.text(this.w * 0.3, this.w * 0.4, "just go back")
            .setFontSize(this.s * 2)
            .setInteractive()
            .on('pointerover', () => {
                this.showMessage("You've got no other choice, really.");
            })
            .on('pointerdown', () => {
                this.gotoScene('demo1');
            });

        let finish = this.add.text(this.w * 0.6, this.w * 0.2, '(finish the game)')
            .setInteractive()
            .on('pointerover', () => {
                this.showMessage('*giggles*');
                this.tweens.add({
                    targets: finish,
                    x: this.s + (this.h - 2 * this.s) * Math.random(),
                    y: this.s + (this.h - 2 * this.s) * Math.random(),
                    ease: 'Sine.inOut',
                    duration: 500
                });
            })
            .on('pointerdown', () => this.gotoScene('outro'));
    }
}

class Intro extends Phaser.Scene {
    constructor() {
        super('intro')
    }

    create() {

        this.add.text(50, 50, "").setFontSize(50);
        this.add.text(50, 100, "Click anywhere to begin.").setFontSize(20);
        this.input.on('pointerdown', () => {
            this.cameras.main.fade(1000, 0, 0, 0);
            this.time.delayedCall(1000, () => this.scene.start('demo1'));
        });
    }
}

class Outro extends Phaser.Scene {
    constructor() {
        super('outro');
    }
    create() {
        this.add.text(50, 50, "That's all!").setFontSize(50);
        this.add.text(50, 100, "Click anywhere to restart.").setFontSize(20);
        this.input.on('pointerdown', () => this.scene.start('intro'));
    }
}

const game = new Phaser.Game({
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1080
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [Intro, Demo1, Demo2, Outro],
    title: "Adventure Game",
});
