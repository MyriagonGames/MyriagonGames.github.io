let { init, on, load, imageAssets, Sprite, SpriteSheet, GameLoop, initKeys, keyPressed, collides } = kontra //initiate kontra library (micro game engine) object with desired functions
let { canvas } = init();

// this function must be called first before keyboard
// functions will work
initKeys();

let numAssets = 4;
let assetsLoaded = 0;
on('assetLoaded', (asset, url) => {
  assetsLoaded++;
  // inform user or update progress bar
});

load(
  'assets/imgs/enemy.png',
  'assets/imgs/map1.png',
  'assets/imgs/player_walk.png'
).then(function(assets) {
  // all assets have loaded
	
	let player_walk = SpriteSheet({
		image: imageAssets['assets/imgs/player_walk'],
		frameWidth: 16,
		frameHeight: 16,
		animations: {
			idle: {
				frames: 0,
				loop: false
			},
			walk_right_up: {
				frames: '1..7',
				frameRate: 30
			},
			walk_left_down: {
				frames: '7..1',
				frameRate: 30
			}
		}
	}); //player walk animation

	let player = Sprite({
		x: 50,
		y: 50,
		anchor: {x: 0.5, y: 0.5},
		animations: player_walk.animations
	}); //sprites are the shapes we will use in our game


	let enemies = [
		Sprite({
			x: 100,
			y: 220,
			anchor: {x: 0.5, y: 0.5},
			dx: 1,
			dy: 0,
			image: imageAssets['assets/imgs/enemy']
		}),
		Sprite({
			x: 100,
			y: 165,
			anchor: {x: 0.5, y: 0.5},
			dx: 0.8,
			dy: 0,
			image: imageAssets['assets/imgs/enemy']
		})
	];

	let map = Sprite({
		x: 0,
		y: 0,
		image: imageAssets['assets/imgs/map1']
	});

	let loop = GameLoop({
		
		update: function () {
			
			//user controls
			if (keyPressed('up')){
				player.y = player.y - 1;
			}
			if (keyPressed('down')){
				player.y = player.y + 1;
			}
			if (keyPressed('left')){
				player.x = player.x - 1;
			}
			if (keyPressed('right')){
				player.x = player.x + 1;
			}

			//player animations
			if (keyPressed('right') || keyPressed('up')){
				player.playAnimation('walk_right_up');
			} else if (keyPressed('down') || keyPressed('left')) {
				player.playAnimation('walk_left_down');
			} else {
				player.playAnimation('idle');
			}
			
			//map limits
			if (player.x >= canvas.width-player.width/2){
				//player.dx = player.dx * -1;
				player.x = canvas.width-player.width/2;
			} else if (player.x <= player.width/2){
				player.x = player.width/2;
			}			
			
			if (player.y >= canvas.height-player.height/2){
				//player.dy = player.dy * -1;
				player.y = canvas.width-player.height/2;
			} else if (player.y <= player.height/2){
				player.y = player.height/2;
			}
			
			//end of game
			if (player.y >= canvas.height-player.height/2){
				loop.stop();
				alert('You Won!');
				window.location = '';
			}
			
			player.update();
			
			enemies.forEach(function(enemy){
				if (enemy.x >= canvas.width-enemy.height/2){
					enemy.x = canvas.width-enemy.height/2;
					enemy.dx = -enemy.dx;
				} else if (enemy.x < 20){
					enemy.x = 20;
					enemy.dx = -enemy.dx;
				}
				enemy.update();
				
				//check for collisions
				if(collides(enemy,player)){
					loop.stop();
					alert('GAME OVER!');
					window.location = '';
				}
			});
			
			map.update();

		}, //this update fn gets called multiple times per second
		
		render: function () {
			map.render();
			player.render();
			enemies.forEach(function(enemy){
				enemy.render();
			});

		} //this render fn takes care of displaying things on the canvas
		
	});

	loop.start();
	
}).catch(function(err) {
  // error loading an asset
});
