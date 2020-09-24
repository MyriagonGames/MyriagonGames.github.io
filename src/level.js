// level and room functions

function getRoomImageNum(level_array,i,j) {
	//TODO check room asset exists
	return level_array[i][j].toString();
};

function getLevelIndex(level_array,i,j) {
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
	if (getRoomImageNum(level_array,i,j) == 0) {
		end_of_level = true;
	};

	return [i,j,end_of_level];
};

function populateRoom(level_array,i,j,level_settings){
	var img_num = getRoomImageNum(level_array,i,j);
	var enemies_per_room = Math.floor(Math.random()*(1+level_settings.max_enemies_per_room)); //equal chance of having any integer number of (or no) enemies
	var items_per_room =  Math.floor(Math.random()*(1+level_settings.max_items_per_room));

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
	if (level_settings.room_start[0] == i && level_settings.room_start[1] == j) { 
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
		
		if (level_settings.difficulty_pool < enemy_difficulty) { break }; //if not enough points left in pool then stop spawning enemies
		level_settings.difficulty_pool = level_settings.difficulty_pool - enemy_difficulty; //remove points from difficulty pool

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

function populateLevel(level,level_array,level_settings){
	//iterate through 2d level array and populate each room (could have fun and make the level nDimensional...)
	for (let i = 0; i < level_array.length; i++) {
		for (let j = 0; j < level_array[i].length; j++) {
			level[i][j] = populateRoom(level_array,i,j,level_settings);
		}
	}
};