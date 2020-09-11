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
  'assets/imgs/player_walk.png',
  'assets/imgs/item1.png',

).then(function(assets) {
	// all assets have loaded
	
	//high level variables
	var difficulty = 9; //initial difficulty level
	var difficulty_pool = difficulty; //a pool that determines how many and of what type of enemies can spawn in total throughout rooms of the level
	var points = 0; //points player has collected from defeating enemies etc.
	var max_enemies_per_room = 3;
	var max_items_per_room = 1;
	var level_array = [
		[3,2,0],
		[1,2,3],
		[0,1,3]
	]; //level layout must be a square array of rooms at the moment, but can be empty with a 0
	var room_start = [1,1]; //starting room of level index variable
	var level_size = [level_array[0].length-1,level_array.length-1];
	var level = JSON.parse(JSON.stringify(level_array)); //level variable to hold all meta data on rooms in level

	function getRoomImageNum(i,j) {
		//TODO check room asset exists
		return level_array[i][j].toString();
	};

	function getLevelIndex(i,j) {
		//check there is a room in the indexed level location
		var end_of_level = false;
		if (i < 0) {
			i = 0;
			end_of_level = true;
		} else if (i >= level_array.length){
			i = level_array.length-1;
			end_of_level = true;
		};
		if (j < 0) {
			j = 0;
			end_of_level = true;
		} else if (j >= level_array[i].length){
			j = level_array[i].length-1;
			end_of_level = true;
		};

		// if room is empty (no image, 0)
		if (getRoomImageNum(i,j) == 0) {
			end_of_level = true;
		};

		return [i,j,end_of_level];
	};

	var room_start = getLevelIndex(room_start[0],room_start[1]);

	function populateRoom(i,j){
		var img_num = getRoomImageNum(i,j);
		var enemies_per_room = Math.floor(Math.random()*(1+max_enemies_per_room)); //equal chance of having any integer number of (or no) enemies
		var items_per_room =  Math.floor(Math.random()*(1+max_items_per_room));

		var room = {
			level_i: i,
			level_j: j,
			start: false, //is this the starting room of the level?
			image_num: img_num,
			is_empty: false, //is this room empty? i.e. do not populate
			image_asset_name: ('assets/imgs/map' + img_num),
			enemy_count: 0,
			enemy_array: [],
			item_count: 0,
			item_array: []

		};

		// determine if starting room
		if (room_start[0] == i && room_start[1] == j) { 
			room.start = true;
		}

		//determine if empty room
		if (room.image_num == 0) { 
			room.is_empty = true;
			room.enemy_count = 0;
			room.item_count = 0;
			return;
		}
		
		//populate room with enemies
		var e = 0;
		while (e < enemies_per_room){ //while still space for enemies in this room
			enemy_type = 1; //type used for naming and image asset, TODO when we have more than one enemy type add a semi random selector here to determine what enemy type to add
			enemy_difficulty = 1; //points of difficulty, TODO possibly pull this from a master list of available enemies, with type and difficulty etc.
			//TODO difficulty 1 is worth 1 point etc. at the moment, might want to change this
			enemy_name = 'zombie';
			
			if (difficulty_pool < enemy_difficulty) { break }; //if not enough points left in pool then stop spawning enemies
			difficulty_pool = difficulty_pool - enemy_difficulty; //remove points from difficulty pool

			room.enemy_array.push({
				id: e,
				name: enemy_name,
				status: 'alive',
				type: enemy_type,
				difficulty: enemy_difficulty,
				image_asset_name: ('assets/imgs/enemy' + enemy_type) //sprite and location in room generated upon player entering room using this
			});
			
			room.enemy_count += 1;
			e += enemy_difficulty;
		};

		//populate room with items
		var f = 0;
		while (f < items_per_room){ //while still space for items in this room
			item_type = 1; //type used for naming and image asset, TODO when we have more than one enemy type add a semi random selector here to determine what enemy type to add
			item_rarity = 1; //points of rarity, TODO possibly pull this from a master list of available items, with type and rarity etc.
			item_name = 'byte';
			item_text = 'fire rate up'; //text to display upon item pickup
			//TODO consider level pool for total number of items allowed to spawn like there is for enemies? Associate with difficulty?

			room.item_array.push({
				id: f,
				name: item_name,
				status: 'dropped',
				text: item_text,
				type: item_type,
				rarity: item_rarity,
				image_asset_name: ('assets/imgs/item' + item_type) //sprite and location in room generated upon player entering room using this
			});
			
			room.item_count += 1;
			f += item_rarity;
		};

		return room;
	};

	function populateLevel(){
		//iterate through 2d level array and populate each room (could have fun and make the level nDimensional...)
		for (let i = 0; i < level_array.length; i++) {
			for (let j = 0; j < level_array[i].length; j++) {
				level[i][j] = populateRoom(i,j);
			}
		}
	};

	let room_sprite = Sprite({
		//initial room sprite
		x: 0,
		y: 0,
		level_i: undefined,
		level_j: undefined,
		image_num: undefined,
		image: undefined
	});

	function updateRoomSprite(i,j){
		//update room sprite with level coordinate, image number and image
		room = level[i][j];
		rs = room_sprite;
		rs.level_i = room.level_i;
		rs.level_j = room.level_j;
		rs.image_num = room.image_num;
		rs.image = imageAssets[(room.image_asset_name)]; //load relevant level room image
		return;
	};
	
	populateLevel();
	updateRoomSprite(room_start[0],room_start[1]); //starting room sprite

	let inventory = Text({
		text: 'Room:' + room_sprite.level_i + ', ' + room_sprite.level_j + ' Size:' + level_size + ' Points:' + points,
		font: '10px Arial',
		color: 'black',
		x: 2,
		y: 2,
		anchor: {x: 0, y: 0},
		textAlign: 'left'
	});

	let item_spawn_text = Text({
		text: '',
		font: '7px Arial',
		color: 'white',
		x: 0,
		y: 0,
		anchor: {x: 0.5, y: 0.5},
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
		animations: player_animation.animations,
		speed: 1, //1 pixel per frame
		firerate: 1 //once per second (assuming 30 fps)
	});

	//empty bullet sprite array (array is populated on key press)
	let bullets = [];

	//empty enemy sprite array (array is populated on new room)
	let enemies = [];

	//empty item sprite array (array is populated on new room)
	let items = [];

	let loop = GameLoop({
		
		update: function () {

			function spawn_enemy_sprite(enemy){ //TODO different enemy types and difficulties
				if (enemy.status == 'dead'){
					return;					
				};

				//TODO random enemy position and velocity currently, be good to have upper and lower limits for different enemy behaviour
				var x = 32 + Math.floor(Math.random()*96);
				var y = 32 + Math.floor(Math.random()*96);
				var dx = 1 - Math.round(Math.random()* 20)/10;
				var dy = 1 - Math.round(Math.random()* 20)/10;

				//add enemy sprite
				enemies.push(
					Sprite({
						id: enemy.id, //enemy id in this room
						x: x,
						y: y,
						anchor: {x: 0.5, y: 0.5},
						dx: dx,
						dy: dy,
						image: imageAssets[(enemy.image_asset_name)]
					})
				);

				return;
			};

			function spawn_item_sprite(item){ //TODO different item types and rarities
				if (item.status != 'dropped'){
					return;					
				};

				//TODO random item position currently, be good to have different item behaviour, and not place on empty spaces or walls etc.
				var x = 32 + Math.floor(Math.random()*96);
				var y = 32 + Math.floor(Math.random()*96);

				//add item sprite
				items.push(
					Sprite({
						id: item.id, //item id in this room
						x: x,
						y: y,
						anchor: {x: 0.5, y: 0.5},
						image: imageAssets[(item.image_asset_name)]
					})
				);

				return;
			};

			function updateInventory(){
				inventory.text = 'Room:' + room_sprite.level_i + ', ' + room_sprite.level_j + ' Size:' + level_size + ' Points:' + points; //update inventory text
			};

			function newMapRoom(i,j,x,y) {
				//check new level index exists
				[i,j,end_of_level] = getLevelIndex(i,j);
				
				//return if no new room available
				if (end_of_level == true) {
					return; 
				};

				//remove enemies next frame
				for (let a = 0; a < enemies.length; a++) {
					enemies[a].ttl = 0;
				};

				//remove items next frame
				for (let a = 0; a < items.length; a++) {
					items[a].ttl = 0;
				};
				
				//remove bullets next frame
				for (let a = 0; a < bullets.length; a++) {
					bullets[a].ttl = 0; 
				};
				
				room = level[i][j];
				updateRoomSprite(i,j); //update room sprite image
				updateInventory(); //update inventory text
				item_spawn_text.text = ''; //update/remove item spawn text

				//place player in correct location in room
				player.x = x; 
				player.y = y; 

				//populate enemy and item sprites
				if (room.start) { 
					//do nothing
				} else {
					//if not the starting room of the level, place new enemy where player will not be (i.e. not next to exit/entrance)
					for (let a = 0; a < room.enemy_count; a++) { 
						spawn_enemy_sprite(room.enemy_array[a]); //pass specific enemy object variable for this room to fn
					};

					for (let a = 0; a < room.item_count; a++) { 
						spawn_item_sprite(room.item_array[a]); //pass specific item object variable for this room to fn
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
				move(0, -player.speed);
			}
			if (keyPressed('down')){
				move(0, player.speed);
			}
			if (keyPressed('left')){
				move(-player.speed, 0);
			}
			if (keyPressed('right')){
				move(player.speed, 0);
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
			player.dt += 1/30;
			if (keyPressed('space') && player.dt > 1/player.firerate) {
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
			
			//player room limits
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
			
			//player level traversing, via room exits/entrances
			var door_x_s = canvas.width/2-16;
			var door_x_e = canvas.width/2+16;
			var door_y_s = canvas.height/2-16;
			var door_y_e = canvas.height/2+16;
			
			if (player.y >= canvas.height-player.height/2 && player.x > door_x_s && player.x < door_x_e) { 
				//down a room
				newMapRoom(room_sprite.level_i+1, room_sprite.level_j, player.x, player.height/2);

			} else if (player.y <= player.height/2 && player.x > door_x_s && player.x < door_x_e) { 
				//up a room
				newMapRoom(room_sprite.level_i-1, room_sprite.level_j, player.x, canvas.height-player.height/2);

			} else if (player.x >= canvas.width-player.width/2 && player.y > door_y_s && player.y < door_y_e) { 
				//right a room
				newMapRoom(room_sprite.level_i, room_sprite.level_j+1, player.width/2, player.y);

			} else if (player.x <= player.width/2 && player.y > door_y_s && player.y < door_y_e) { 
				//left a room
				newMapRoom(room_sprite.level_i, room_sprite.level_j-1, canvas.width-player.width/2, player.y);

			};

			//update player sprite
			player.update();
			
			//update enemy sprites
			enemies.forEach(function(es){
				//enemy movement
				if (es.x >= canvas.width - es.width /2 - 16){
					es.x = canvas.width - es.width /2 - 16;
					es.dx = -es.dx;
				} else if (es.x <= es.width /2 + 16){
					es.x = es.width /2 + 16;
					es.dx = -es.dx;
				}
				if (es.y >= canvas.height - es.height/2 - 16){
					es.y = canvas.height - es.height/2 - 16;
					es.dy = -es.dy;
				} else if (es.y <= es.height /2 + 16){
					es.y = es.height /2 + 16;
					es.dy = -es.dy;
				}
				es.update();
				
				//check for enemy_sprite player collision
				if(collides(es,player)){
					loop.stop();
					alert('GAME OVER!');
					window.location = '';
				}
			});

			//update item sprites
			items.forEach(function(i){
				//check for item_sprite player collision
				if(collides(i,player)){
					//update item text
					ist = item_spawn_text; //assignment for below
					ist.text = room.item_array[i.id].text;
					ist.x = i.x;
					ist.y = i.y;
					ist.update();
					//TODO remove item text after ~1 second

					//apply item effect
					player.firerate += 1; //TODO per item effect

					//remove item this frame
					i.ttl = 0;
					
					//set variable to stop item respawning when re-entering a room
					room.item_array[i.id].status = 'collected';
				};
				i.update();
			});
			
				
			//update bullet sprites
			bullets.map(sprite => {sprite.update()});

			//collision detection bullet and enemy sprite
			for (let i = 0; i < enemies.length; i++) {
				for (let j = 0; j < bullets.length; j++) {
					let es = enemies[i];
					let b = bullets[j];
					if (collides(es,b)) {
						
						//set variable to stop enemy respawning when re-entering a room
						room.enemy_array[es.id].status = 'dead'; 
						
						//enemy is worth it's difficulty in points
						points = points + room.enemy_array[es.id].difficulty; 

						es.ttl = 0;
						b.ttl = 0;
						updateInventory();
						break;
					}
				}
			};
			
			enemies = enemies.filter(enemy_sprite => enemy_sprite.isAlive());	// filter out (remove) enemies
			items = items.filter(item_sprite => item_sprite.isAlive());	// filter out (remove) items
			bullets = bullets.filter(sprite => sprite.isAlive());	// filter out (remove) bullets

			//update room sprite
			room_sprite.update();

		}, //this update fn gets called multiple times per second
		
		render: function () {
			room_sprite.render();
			inventory.render();
			player.render();
			item_spawn_text.render();
			enemies.map(enemy_sprite => enemy_sprite.render());
			items.map(item_sprite => item_sprite.render());
			bullets.map(bullet_sprite => bullet_sprite.render());

		} //this render fn takes care of displaying things on the canvas
		
	});

	loop.start();
	
}).catch(function(err) {
  // error loading an asset
});
