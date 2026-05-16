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
        this.load.spritesheet('player', 'Assets/scene1bedroom/totalsprite2.2.png', { frameWidth: 14, frameHeight: 30 });

        // Load body shapes from JSON file generated using PhysicsEditor
        this.load.json('shapes', 'Assets/scene1bedroom/shapes.json');
    }

    update() {
        const { bg, player, bed, door, desk } = this;

        if (player && player.body && bg && !player.body.isSleeping && (Math.abs(player.body.velocity.x) > 0.1 || Math.abs(player.body.velocity.y) > 0.1)) {

            if (this.exitDetected(player, bg)
                || this.collisionDetected(player, bed)
                || this.collisionDetected(player, desk)
                || this.collisionDetected(player, door)
            ) {
                player.anims.stop();
                player.setVelocity(0,0); player.setAngularVelocity(0); player.setAngle(0); player.setFixedRotation();
            }
        }
    }


    onEnter() {
        this.matter.world.setGravity(0,0); // top-down 2D movement has to use 0 gravity
        const { width, height } = this.scale; // world size
        const shapes = this.shapes = this.cache.json.get('shapes'); // shapes for objects, e.g. floor
        const targetScale = 4; // scale images up 4x
        const bg = this.bg = this.add.image(3/4*width, 1/2*height, 'bg').setScale(targetScale).setOrigin(0.5,0.5); // floor texture centered at center 
        const bgBody = this.matter.add.fromPhysicsEditor(1/2*bg.x, 1.2*bg.y, shapes.Background3, { isStatic: true }); // floor body bounds from the json
        this.matter.body.scale(bgBody, targetScale, targetScale); // scale floor body like floor texture
        this.matter.body.setPosition(bgBody, { // center floor body on top of floor texture
            x: 0, // bg.displayWidth / 2, // - bgBody.bounds.min.x, // Matter moved floor body center to average weight distribution
            y: 0  // bg.displayHeight / 2 // - bgBody.bounds.min.y // Matter moved floor body center to average weight distribution
        });

/*
        // const bg = this.bg = this.matter.add.image(0, 0, 'bg', null, { shape: shapes.Background3, isStatic: true }).setScale(4).setOrigin(0,0);
        const bg = this.bg = this.matter.add.image(0, 0, 'bg').setScale(4);
        bg.setPosition( 3/4*width / 2 - bg.centerOfMass.x, height / 2 + bg.centerOfMass.x );

        this.matter.body.scale(bgBody, 4, 4); // scale body to match texture scale
        bgBody.bounds.min.x;
        bgBody.isStatic = true; // unmovable
*/

        const player = this.player = this.matter.add.sprite(0, 0, 'player').setScale(targetScale);
        [ player.x, player.y ] = [ 1/2 * bg.displayWidth, 1/2 * bg.displayHeight ];
        player.setFixedRotation(); // no rotation
        player.setFriction(0.9, 0.05); // friction

        
/*
        const door = this.door = this.matter.add.image(bg.x, bg.y, 'door').setScale(4);
        door.x = bg.x - 1 / 8 * bg.displayWidth;
        door.y = bg.y - 1 / 2 * bg.displayHeight - 1 / 2 * door.displayHeight;
        const desk = this.desk = this.matter.add.image(bg.x, bg.y, 'desk').setScale(4);
        desk.y = bg.y - 1 / 2 * bg.displayHeight + 1 / 2 * desk.displayHeight;
        const bed = this.bed = this.matter.add.image(bg.x, bg.y, 'bed').setScale(4);
*/

        // create animation effect for up/down
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'front',
            frames: this.anims.generateFrameNumbers('player', { start: 6, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'back',
            frames: this.anims.generateFrameNumbers('player', { start: 9, end: 11 }),
            frameRate: 10,
            repeat: -1
        });

        // stop animation when we let go!
        this.input.on('pointerup', (pointer) => {
            player.anims.stop();
            player.setVelocity(0,0); player.setAngularVelocity(0); player.setAngle(0); player.setFixedRotation();
        });

        // as long as mouse pointer is pressed, move the player sprite in the direction of the pointer
        this.input.on('pointerdown', (pointer) => {
            // matter engine requires: speed, angle, and velocity x and y components
            const speed = 5;
            const angle = Phaser.Math.Angle.Between(player.x, player.y, pointer.x, pointer.y); // angle between 4 and click position
            player.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed); // trig to calculate horizontal (x) and vertical (y) components of the acceleration

            switch(this.determineRelativeDirection(pointer, player)) {
                case 'up':
                    player.anims.play('back', true);
                    break;
                case 'down':
                    player.anims.play('front', true);
                    break;
                case 'left':
                    player.anims.play('left', true);
                    break;
                case 'right':
                    player.anims.play('right', true);
                    break;
                default: // 'none' - no animation (both are dead-center)
                    player.anims.stop();
                    player.setVelocity(0,0); player.setAngularVelocity(0); player.setAngle(0); player.setFixedRotation();
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
        default: 'matter',
        matter: {
            gravity: { y: 0 },
            debug: true
        },
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    },
    scene: [Intro, Demo1, Demo2, Outro],
    title: "Vucici Game",
});
