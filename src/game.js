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
  'assets/imgs/enemy1.png',
  'assets/imgs/map1.png',
  'assets/imgs/map2.png',
  'assets/imgs/map3.png',
  'assets/imgs/player_walk.png'
).then(function(assets) {
	// all assets have loaded
	
	//high level variables
	var difficulty = 3; //initial difficulty level
	var difficulty_pool = difficulty; //a pool that determines how many and of what type of enemies can spawn in total throughout map tiles
	var points = 0; //points player has collected from defeating enemies etc.
	var max_enemies_per_tile = 3;

	let map_layout = [
		[3,2,0],
		[1,2,3],
		[0,1,3]
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

	//starting map tile index variable
	var map_start = getMapIndex(1,1);

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
		text: 'Map:' + map.map_i + ', ' + map.map_j + ' Size:' + map_size + ' Points:' + points,
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

	//enemy array (array is populated on new map)
	let enemies = [];

	let loop = GameLoop({
		
		update: function () {

			function spawn_enemy(type){ //TODO different enemy types and difficulties
				if (difficulty_pool < type) { //if not enough points left in pool then stop spawning enemy
					return;
				};

				difficulty_pool = difficulty_pool - type; //remove points from pool

				var enemy_x = 32 + Math.floor(Math.random()*96);
				var enemy_y = 32 + Math.floor(Math.random()*96);
				var enemy_dx = 1 - Math.round(Math.random()* 20)/10;
				var enemy_dy = 1 - Math.round(Math.random()* 20)/10;

				enemies.push(
					Sprite({
						x: enemy_x,
						y: enemy_y,
						anchor: {x: 0.5, y: 0.5},
						dx: enemy_dx,
						dy: enemy_dy,
						image: imageAssets[('assets/imgs/enemy' + type)],
						type: type //type 1 is worth 1 difficulty point etc. at the moment TODO
					})
				);

				return;
			};

			function updateMapText(){
				mapText.text = 'Map:' + map.map_i + ', ' + map.map_j + ' Size:' + map_size + ' Points:' + points; //update map text
			};

			function newMap(i,j,x,y) {
				//check new map index exists
				[i,j,eoMap] = getMapIndex(i,j);
				
				//return if no new map tile available
				if (eoMap == true) {
					return; 
				};

				//remove enemies next frame
				for (let a = 0; a < enemies.length; a++) {
					enemies[a].ttl = 0;
					difficulty_pool = difficulty_pool + enemies[a].type; //add points back to pool if not used
				};
				//enemies = enemies.filter(enemy => enemy.isAlive());	// filter out (remove) enemies
				enemies = [];
				
				//remove bullets next frame
				for (let a = 0; a < bullets.length; a++) {
					bullets[a].ttl = 0; 
				};
				//bullets = bullets.filter(sprite => sprite.isAlive());	// filter out (remove) bullets
				bullets = [];

				//new map data
				map.map_i = i; //new map row
				map.map_j = j; //new map column
				map.map_num = getMapImageNum(i,j); //new map image number
				map.image = imageAssets[('assets/imgs/map' + map.map_num)]; //load relevant map tile image
				
				updateMapText(); //update map text

				//place player in correct location
				player.x = x; 
				player.y = y; 

				//TODO: need a proper map structure with metadata for each map tile, created on start of game rather than each time player moves tile, for enemy and item placement etc.
				//Populate Enemies
				if (map_start[0] == getMapIndex(i,j)[0] && map_start[1] == getMapIndex(i,j)[1]) { 
					//do nothing
				} else {
					//if not the starting map tile, place new enemy where player will not be (i.e. not next to exit/entrance)
					for (let a = 0; a < Math.floor(Math.random()*(1+max_enemies_per_tile)); a++) { //equal chance of having any integer number of (or no) enemies
						spawn_enemy(1);
					};
				}

				return;
			};

			function move(x, y) {
				player.x += x;
				player.y += y;
				player.y_dir = Math.sign(y);
				player.x_dir = Math.sign(x);
			}

			//user controls
			if (keyPressed('up')){
				move(0, -1);
			}
			if (keyPressed('down')){
				move(0, 1);
			}
			if (keyPressed('left')){
				move(-1, 0);
			}
			if (keyPressed('right')){
				move(1, 0);
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
			if (keyPressed('space') && player.dt > 0.5) {
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
			var door_x_s = canvas.width/2-16;
			var door_x_e = canvas.width/2+16;
			var door_y_s = canvas.height/2-16;
			var door_y_e = canvas.height/2+16;
			
			if (player.y >= canvas.height-player.height/2 && player.x > door_x_s && player.x < door_x_e) { 
				//down a map
				newMap(map.map_i+1, map.map_j, player.x, player.height/2);

			} else if (player.y <= player.height/2 && player.x > door_x_s && player.x < door_x_e) { 
				//up a map
				newMap(map.map_i-1, map.map_j, player.x, canvas.height-player.height/2);

			} else if (player.x >= canvas.width-player.width/2 && player.y > door_y_s && player.y < door_y_e) { 
				//right a map
				newMap(map.map_i, map.map_j+1, player.width/2, player.y);

			} else if (player.x <= player.width/2 && player.y > door_y_s && player.y < door_y_e) { 
				//left a map
				newMap(map.map_i, map.map_j-1, canvas.width-player.width/2, player.y);

			};

			//update player sprite
			player.update();
			
			//update enemy sprites
			enemies.forEach(function(enemy){
				//enemy movement
				if (enemy.x >= canvas.width-enemy.width/2-16){
					enemy.x = canvas.width-enemy.width/2-16;
					enemy.dx = -enemy.dx;
				} else if (enemy.x <= enemy.width/2 +16){
					enemy.x = enemy.width/2 +16;
					enemy.dx = -enemy.dx;
				}
				if (enemy.y >= canvas.height-enemy.height/2-16){
					enemy.y = canvas.height-enemy.height/2-16;
					enemy.dy = -enemy.dy;
				} else if (enemy.y <= enemy.height/2+16){
					enemy.y = enemy.height/2 +16;
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

			//collision detection bullet and enemy
			for (let i = 0; i < enemies.length; i++) {
				for (let j = 0; j < bullets.length; j++) {
					let enemy = enemies[i];
					let sprite = bullets[j];
					if (collides(enemy,sprite)) {
						enemy.ttl = 0;
						sprite.ttl = 0;
						points = points + enemy.type; //enemy is worth it's type in points
						updateMapText();
						break;
					}
				}
			};
			
			enemies = enemies.filter(enemy => enemy.isAlive());	// filter out (remove) enemies
			bullets = bullets.filter(sprite => sprite.isAlive());	// filter out (remove) bullets

			//update map sprite
			map.update();

		}, //this update fn gets called multiple times per second
		
		render: function () {
			map.render();
			mapText.render();
			player.render();
			enemies.map(enemy => enemy.render());
			bullets.map(sprite => sprite.render()); //bullets etc.

		} //this render fn takes care of displaying things on the canvas
		
	});

	loop.start();
	
}).catch(function(err) {
  // error loading an asset
});
