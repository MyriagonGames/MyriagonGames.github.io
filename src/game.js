//canvas variables
let { init, on, load, imageAssets, Sprite, SpriteSheet, GameLoop, initKeys, keyPressed, collides, Text } = kontra //initiate kontra library (micro game engine) object with desired functions
let { canvas } = init();

// this function must be called first before keyboard functions will work
initKeys();

let numAssets = 3;
let assetsLoaded = 0;
on('assetLoaded', (asset, url) => {
  assetsLoaded++;
  // inform user or update progress bar
});

load(
  'assets/imgs/enemy.png',
  'assets/imgs/map1.png',
  'assets/imgs/map2.png',
  'assets/imgs/map3.png',
  'assets/imgs/player_walk.png'
).then(function(assets) {
  // all assets have loaded
	
	let map_layout = [
		[3,0,1],
		[1,2,3],
		[0,0,3]
	]; //map layout must be a square array at the moment

	function getMapImageNum(i,j) {
		//TODO check map asset exists
		return map_layout[i][j].toString();
	};

	function getMapIndex(i,j) {
		//check there is a map tile in the indexed location
		var eoMap = false;
		if (i < 0) {
			i = 0;
			eoMap = true;
		} else if (i >= map_layout.length){
			i = map_layout.length-1;
			eoMap = true;
		};
		if (j < 0) {
			j = 0;
			eoMap = true;
		} else if (j >= map_layout[i].length){
			j = map_layout[i].length-1;
			eoMap = true;
		};

		// if tile is empty (no image, 0)
		if (getMapImageNum(i,j) == 0) {
			eoMap = true;
		};

		return [i,j,eoMap];
	};

	var map_start = getMapIndex(1,1); //starting map tile index

	let map = Sprite({
		x: 0,
		y: 0,
		map_i: map_start[0],
		map_j: map_start[1],
		map_num: getMapImageNum(map_start[0],map_start[1]),
		image: imageAssets[('assets/imgs/map' + getMapImageNum(map_start[0],map_start[1]))]
	});

	var map_size = [map_layout[0].length-1,map_layout.length-1];

	let mapText = Text({
	  text: ('Map:' + map_start.slice(0,2) + ' Size:' + map_size),
	  font: '10px Arial',
	  color: 'black',
	  x: 2,
	  y: 2,
	  anchor: {x: 0, y: 0},
	  textAlign: 'left'
	});

	//player animations
	let player_animation = SpriteSheet({
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
	}); 

	//player sprite
	let player = Sprite({
		x: canvas.width/2 -8,
		y: canvas.height/2 -8,
		dt: 0, //track time that has passed
		x_dir: 1, //for determining last faced direction, for bullet direction
		y_dir: 0,
		anchor: {x: 0.5, y: 0.5},
		animations: player_animation.animations
	});

	//empty bullets array (array is populated on key press)
	let bullets = [];

	//enemy array
	let enemies = [
		Sprite({
			x: 10,
			y: 16*5+8,
			anchor: {x: 0.5, y: 0.5},
			dx: 0.5,
			dy: 0,
			image: imageAssets['assets/imgs/enemy']
		}),
		Sprite({
			x: 16*5+8,
			y: 10,
			anchor: {x: 0.5, y: 0.5},
			dx: 0,
			dy: 0.6,
			image: imageAssets['assets/imgs/enemy']
		})
	];
	

	let loop = GameLoop({
		
		update: function () {
			
			//user controls
			if (keyPressed('up')){
				player.y = player.y - 1;
				player.y_dir = -1;
				player.x_dir = 0;
			}
			if (keyPressed('down')){
				player.y = player.y + 1;
				player.y_dir = 1;
				player.x_dir = 0;
			}
			if (keyPressed('left')){
				player.x = player.x - 1;
				player.x_dir = -1;
				player.y_dir = 0;
			}
			if (keyPressed('right')){
				player.x = player.x + 1;
				player.x_dir = 1;
				player.y_dir = 0;
			}

			//player animations
			if (keyPressed('right') || keyPressed('up')){
				player.playAnimation('walk_right_up');
			} else if (keyPressed('down') || keyPressed('left')) {
				player.playAnimation('walk_left_down');
			} else {
				player.playAnimation('idle');
			}

			//bullet firing from player, no more than once per 1/4 second
			player.dt += 1/60;
			if (keyPressed('space') && player.dt > 0.25) {
				player.dt = 0;
				let bullet = Sprite({
					color: 'white',
					x: player.x, // start the bullet on the player
					y: player.y,
					dx: 5 * player.x_dir,
					dy: 5 * player.y_dir, 
					ttl: 20, // live only 20 frames (i.e. 1 second at 20fps)
					radius: 2, // bullets are small
					width: 2,
					height: 2
				});
				bullets.push(bullet);
			}
			
			//player map limits
			if (player.x >= canvas.width-player.width/2){
				player.x = canvas.width-player.width/2;
			} else if (player.x <= player.width/2){
				player.x = player.width/2;
			};			
			
			if (player.y >= canvas.height-player.height/2){
				player.y = canvas.width-player.height/2;
			} else if (player.y <= player.height/2){
				player.y = player.height/2;
			};
			
			//player map traversing, via exits/entrances
			door_x_s = canvas.width/2-16;
			door_x_e = canvas.width/2+16;
			door_y_s = canvas.height/2-16;
			door_y_e = canvas.height/2+16;
			
			if (player.y >= canvas.height-player.height/2 && player.x > door_x_s && player.x < door_x_e) { 
				[map_i,map_j,eoMap] = getMapIndex(map.map_i+1,map.map_j); //go down a map
				if (eoMap == false) {
					map.map_i = map_i;
					map.map_j = map_j;
					map.map_num = getMapImageNum(map.map_i,map.map_j);
					map.image = imageAssets[('assets/imgs/map' + map.map_num)]; //load relevant map tile
					player.y = player.height/2; //place player in correct space
				};

			} else if (player.y <= player.height/2 && player.x > door_x_s && player.x < door_x_e) { 
				[map_i,map_j,eoMap] = getMapIndex(map.map_i-1,map.map_j); //go up a map
				if (eoMap == false) {
					map.map_i = map_i;
					map.map_j = map_j;
					map.map_num = getMapImageNum(map.map_i,map.map_j);
					map.image = imageAssets[('assets/imgs/map' + map.map_num)]; //load relevant map tile
					player.y = canvas.height-player.height/2; //place player in correct space
				};

			} else if (player.x >= canvas.width-player.width/2 && player.y > door_y_s && player.y < door_y_e) { 
				[map_i,map_j,eoMap] = getMapIndex(map.map_i,map.map_j+1); //go right a map
				if (eoMap == false) {
					map.map_i = map_i;
					map.map_j = map_j;
					map.map_num = getMapImageNum(map.map_i,map.map_j);
					map.image = imageAssets[('assets/imgs/map' + map.map_num)]; //load relevant map tile
					player.x = player.width/2; //place player in correct space
				};

			} else if (player.x <= player.width/2 && player.y > door_y_s && player.y < door_y_e) { 
				[map_i,map_j,eoMap] = getMapIndex(map.map_i,map.map_j-1); //go left a map
				if (eoMap == false) {
					map.map_i = map_i;
					map.map_j = map_j;
					map.map_num = getMapImageNum(map.map_i,map.map_j);
					map.image = imageAssets[('assets/imgs/map' + map.map_num)]; //load relevant map tile
					player.x = player.x = canvas.width-player.width/2; //place player in correct space
				};
			};

			//update player sprite
			player.update();

			//update Text
			mapText.text = 'Map:' + map.map_i + ', ' + map.map_j + ' Size:' + map_size;
			
			//update enemy sprites
			enemies.forEach(function(enemy){
				//enemy movement
				if (enemy.x >= canvas.width-enemy.width/2){
					enemy.x = canvas.width-enemy.width/2;
					enemy.dx = -enemy.dx;
				} else if (enemy.x <= enemy.width/2){
					enemy.x = enemy.width/2;
					enemy.dx = -enemy.dx;
				}
				if (enemy.y >= canvas.height-enemy.height/2){
					enemy.y = canvas.height-enemy.height/2;
					enemy.dy = -enemy.dy;
				} else if (enemy.y <= enemy.height/2){
					enemy.y = enemy.height/2;
					enemy.dy = -enemy.dy;
				}
				enemy.update();
				
				//check for enemy player collision
				if(collides(enemy,player)){
					loop.stop();
					alert('GAME OVER!');
					window.location = '';
				}
			});

			//update bullet sprites
			bullets.map(sprite => {sprite.update()});

			//update map sprite
			map.update();

			//collision detection bullet and enemy
			for (let i = 0; i < enemies.length; i++) {
				for (let j = 0; j < bullets.length; j++) {
					let enemy = enemies[i];
					let sprite = bullets[j];
					if (collides(enemy,sprite)) {
						enemy.ttl = 0;
						sprite.ttl = 0;
						break;
					}
				}
			};
			
			enemies = enemies.filter(enemy => enemy.isAlive());	// filter out (remove) enemies
			bullets = bullets.filter(sprite => sprite.isAlive());	// filter out (remove) bullets

		}, //this update fn gets called multiple times per second
		
		render: function () {
			map.render();
			mapText.render();
			player.render();
			enemies.forEach(function(enemy){
				enemy.render();
			});

			bullets.map(sprite => sprite.render()); //bullets etc.

		} //this render fn takes care of displaying things on the canvas
		
	});

	loop.start();
	
}).catch(function(err) {
  // error loading an asset
});
