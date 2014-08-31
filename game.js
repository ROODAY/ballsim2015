var music = new Audio('assets/sounds/background.wav'); 
music.volume = 0.5;
music.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
}, false);
music.play();

var winwidth = document.documentElement.clientWidth;
var winheight = document.documentElement.clientHeight;
var clientarea = winwidth * winheight;
var screenarea = 2073600;
var screenscale = clientarea / screenarea;

var currentcanvas;
var keysDown = {};
var gameOver = false;
var score = 0;
var enemycap = Math.floor(50 * screenscale);
var firstload = true;

Filler = function(x, y, radius, color, vx, vy) {
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.color = color;
	this.vx = vx;
	this.vy = vy;
	this.alive = true;
};

Filler.prototype.update = function(delta, canvas, array) {
	if (this.alive) {
		this.x += this.vx;
		this.y += this.vy;

		if (this.x < (0 - this.radius) || this.x > (winwidth + this.radius) || this.y < (0 - this.radius) || this.y > (winheight + this.radius)) {
			this.alive = false;
			var index = array.indexOf(this);
			array.splice(index, 1);
		}
	}
}

Filler.prototype.draw = function(ctx) {
	if (this.alive) {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = this.color;
		ctx.fill();
	}
}

Ball = function(x, y, radius, color, vx, vy, target) {
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.color = color;
	this.vx = vx;
	this.vy = vy;
	this.alive = true;
	this.target = target;
};

Ball.prototype.update = function(delta, canvas, array) {
	if (this.alive) {
		this.x += this.vx;
		this.y += this.vy;

		if (this.x < (0) || this.x > (winwidth) || this.y < (0) || this.y > (winheight)) {
			this.alive = false;
			var index = array.indexOf(this);
			array.splice(index, 1);
		}

		if ((this.alive) && (this.radius < this.target.radius) && (collision(this,this.target))) {
			console.log("Alive: " + this.alive + ". Ball velocity: (" + this.vx + ", " + this.vy + ").");
			this.alive = false;
			this.target.radius = Math.round(this.target.radius + this.radius * 0.25);
			this.target.color = this.color;
			score += Math.round(this.radius * 5);
			var index = this.target.enemies.indexOf(this);
			this.target.enemies.splice(index, 1);
			var sound = new Audio("assets/sounds/kill.wav");
			sound.play();
		} else if ((this.alive) && (this.radius >= this.target.radius) && (collision(this,this.target))) {
			console.log("Alive: " + this.alive + ". Ball velocity: (" + this.vx + ", " + this.vy + ").");
			this.target.alive = false;
			this.alive = false;
			var index = this.target.enemies.indexOf(this);
			this.target.enemies.splice(index, 1);
			gameOver = true;
			var sound = new Audio("assets/sounds/death.wav");
			sound.play();
		}

		if (!this.alive) {
			var index = this.target.enemies.indexOf(this);
			this.target.enemies.splice(index, 1);
		}
	}
}

Ball.prototype.draw = function(ctx) {
	if (this.alive) {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = this.color;
		ctx.fill();
	}
}

Player = function(x, y, enemies) {
	this.x = x;
	this.y = y;
	this.radius = 10;
	this.color = "white";
	this.speed = 250;
	this.enemies = enemies;
	this.alive = true;
};

Player.prototype.update = function(delta, canvas) {
	if (this.alive) {
		if (65 in keysDown) { //left
			if (this.x > 0) {
				this.x -= this.speed * delta;
			}
		}
		if (87 in keysDown) { //up
			if (this.y > 0) {
				this.y -= this.speed * delta;
			}
		}
		if (68 in keysDown) { //right
			if (this.x < canvas.width - this.radius) {
				this.x += this.speed * delta;
			}
		}
		if (83 in keysDown) { //down
			if (this.y < canvas.height - this.radius) {
				this.y += this.speed * delta;
			}
		}
	}
}

Player.prototype.draw = function(ctx) {
	if (this.alive) {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = this.color;
		ctx.fill();
	}
}

function distance (x1,y1,x2,y2) {
	dX2 = Math.pow((x2-x1),2);
	dY2 = Math.pow((y2-y1),2);
	return Math.sqrt(dX2 + dY2);
} 

function collision (a,b) {
	space = a.radius + b.radius;
	if (distance(a.x,a.y,b.x,b.y) < space) {
		return true; //collision
	}
	else {
		return false;
	}
}

function initMenu() {
	var gc = document.createElement('canvas');
	gc.id = 'menu';
	document.body.appendChild(gc);

	var canvas = document.getElementById('menu');
	currentcanvas = "menu";
	var ctx = canvas.getContext('2d');
	canvas.width = winwidth;
	canvas.height = winheight;

	var elements = [];
	elements.push({
		color: "green",
		width: 200,
		height: 75,
		top: winheight / 2 + 50,
		left: winwidth / 2 - 100
	});

	canvas.addEventListener('click', function(e) {
		var cLeft = canvas.offsetLeft;
		var cTop = canvas.offsetTop;
		var x = e.pageX - cLeft;
		var y = e.pageY - cTop;

		elements.forEach(function(element) {
			if (y > element.top && y < element.top + element.height && x > element.left && x < element.left + element.width) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				document.body.removeChild(gc);
				initGame();
			}
		});
	}, false);

	var enemies = [];
	var colors = ['#2ecc71', '#1abc9c', '#f39c12', '#34495e', '#f1c40f', '#7f8c8d', '#e67e22', '#3498db'];

	var makeEnemy = function(side) {
		if (side === 0) {
			var randY = Math.round(Math.random() * winheight);
			var ranRadius = Math.round(Math.random() * 1.25 * 10);
			var color = colors[Math.round(Math.random() * colors.length)];
			var speed = Math.round(Math.random() * 5) + 1;
			var enemy = new Filler(0, randY, ranRadius, color, speed, 0);
			enemies.push(enemy);
		} else if (side === 1) {
			var randX = Math.round(Math.random() * winwidth);
			var ranRadius = Math.round(Math.random() * 1.25 * 10);
			var color = colors[Math.round(Math.random() * colors.length)];
			var speed = Math.round(Math.random() * 5) + 1;
			var enemy = new Filler(randX, 0, ranRadius, color, 0, speed);
			enemies.push(enemy);
		} else if (side === 2) {
			var randY = Math.round(Math.random() * winheight);
			var ranRadius = Math.round(Math.random() * 1.25 * 10);
			var color = colors[Math.round(Math.random() * colors.length)];
			var speed = Math.round(Math.random() * 5) + 1;
			var enemy = new Filler(winwidth, randY, ranRadius, color, speed * -1, 0);
			enemies.push(enemy);
		} else if (side === 3) {
			var randX = Math.round(Math.random() * winwidth);
			var ranRadius = Math.round(Math.random() * 1.25 * 10);
			var color = colors[Math.round(Math.random() * colors.length)];
			var speed = Math.round(Math.random() * 5) + 1;
			var enemy = new Filler(randX, 0, ranRadius, color, 0, speed * -1);
			enemies.push(enemy);
		}
	}

	var main = function() {
		var now = Date.now();
		var delta = now - then;
		update(delta / 1000);
		render();
		then = now;
		requestAnimationFrame(main);
	};

	var update = function(delta) {
		enemies.forEach(function(ball) {
			ball.update(delta, canvas, enemies);
		});

		if (enemies.length <= enemycap) {
			makeEnemy(Math.round(Math.random() * 4));
		}

	};

	var clearScreen = function() {
		ctx.clearRect(0,0,canvas.width,canvas.height);
	};

	var render = function() {
		clearScreen();

		enemies.forEach(function(ball){
			ball.draw(ctx);
		});

		ctx.font = "30pt Arial";
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.fillText("Ball Simulator 2015", winwidth / 2, 50);

		elements.forEach(function(element) {
			ctx.fillStyle = element.color;
			ctx.fillRect(element.left, element.top, element.width, element.height);
		});

		ctx.fillStyle = "black";
		ctx.fillText("Start", winwidth / 2, winheight / 2 + 100);

	};

	var then = Date.now();
	main();
}

function initGame() {
	var gc = document.createElement('canvas');
	gc.id = 'game';
	document.body.appendChild(gc);

	var canvas = document.getElementById("game");
	var ctx = canvas.getContext('2d');
	currentcanvas = "game";
	canvas.width = winwidth;
	canvas.height = winheight;
	score = 0;

	var enemies = [];
	var colors = ['#2ecc71', '#1abc9c', '#f39c12', '#34495e', '#f1c40f', '#7f8c8d', '#e67e22', '#3498db'];

	var player = new Player(winwidth / 2, winheight / 2, enemies);

	var makeEnemy = function(side) {
		if (side === 0) {
			var randY = Math.round(Math.random() * winheight);
			var ranRadius = Math.round(Math.random() * 1.25 * player.radius);
			var color = colors[Math.round(Math.random() * colors.length)];
			var speed = Math.round(Math.random() * 4) + 1;
			var enemy = new Ball(1, randY, ranRadius, color, speed, 0, player);
			enemies.push(enemy);
		} else if (side === 1) {
			var randX = Math.round(Math.random() * winwidth);
			var ranRadius = Math.round(Math.random() * 1.25 * player.radius);
			var color = colors[Math.round(Math.random() * colors.length)];
			var speed = Math.round(Math.random() * 4) + 1;
			var enemy = new Ball(randX, 1, ranRadius, color, 0, speed, player);
			enemies.push(enemy);
		} else if (side === 2) {
			var randY = Math.round(Math.random() * winheight);
			var ranRadius = Math.round(Math.random() * 1.25 * player.radius);
			var color = colors[Math.round(Math.random() * colors.length)];
			var speed = Math.round(Math.random() * 4) + 1;
			var enemy = new Ball(winwidth - 1, randY, ranRadius, color, speed * -1, 0, player);
			enemies.push(enemy);
		} else if (side === 3) {
			var randX = Math.round(Math.random() * winwidth);
			var ranRadius = Math.round(Math.random() * 1.25 * player.radius);
			var color = colors[Math.round(Math.random() * colors.length)];
			var speed = Math.round(Math.random() * 4) + 1;
			var enemy = new Ball(randX, winheight - 1, ranRadius, color, 0, speed * -1, player);
			enemies.push(enemy);
		}
	}

	window.addEventListener('keydown', function (e) {
		keysDown[e.keyCode] = true;
	}, false);
	window.addEventListener('keyup', function(e) {
		delete keysDown[e.keyCode];
	}, false);

	var main = function() {
		var now = Date.now();
		var delta = now - then;

		if (!gameOver) {
			update(delta / 1000);
			render();
		} else {
			lose();
		}

		then = now;

		requestAnimationFrame(main);
	};

	var update = function(delta) {
		enemies.forEach(function(ball) {
			ball.update(delta, canvas, enemies);
		});
		player.update(delta, canvas);

		if (enemies.length <= enemycap) {
			makeEnemy(Math.round(Math.random() * 4));
		}
	};

	var clearScreen = function() {
		ctx.clearRect(0,0,canvas.width,canvas.height);
	};

	var render = function() {
		clearScreen();

		enemies.forEach(function(ball){
			ball.draw(ctx);
		});
		player.draw(ctx);

		ctx.font = "20pt Arial";
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.fillText(score, winwidth / 2, 30);

		if (((Date.now() - start) / 1000 <= 10) && firstload) {
			ctx.font = "20pt Arial";
			ctx.fillStyle = "white";
			ctx.textAlign = "left";
			ctx.fillText("WASD to move", 10, 40);
			ctx.fillText("Eat the smaller circles", 10, 65);
			ctx.fillText("Avoid the larger ones", 10, 90);
		}
	};

	var lose = function() {
		clearScreen();

		ctx.font = "100pt Impact";
		ctx.fillStyle = "red";
		ctx.textAlign = "center";
		ctx.fillText("Game Over!", winwidth / 2, winheight / 2);
		ctx.font = "75pt Impact";
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.fillText("Your score was " + score, winwidth / 2, winheight / 2 + 100);

		ctx.fillStyle = "green";
		ctx.fillRect(canvas.width / 2 - 100, canvas.height - 150, 200, 75);
		ctx.fillStyle = "black";
		ctx.font = "30pt Arial";
		ctx.textAlign = "center";
		ctx.fillText("Replay", winwidth / 2, winheight - 100);
	}

	canvas.addEventListener('click', function(event) {
		var cLeft = canvas.offsetLeft;
		var cTop = canvas.offsetTop;
		var x = event.pageX - cLeft;
		var y = event.pageY - cTop;

		if (y > canvas.height - 150 && y < canvas.height - 150 + 75 && x > canvas.width / 2 - 100 && x < canvas.width / 2 - 100 + 200 && gameOver) {
			gameOver = false;
			score = 0;
			enemies.forEach(function(ball){
				ball.alive = false;
				ball.x = 0;
				ball.y = 0;
				ball.vx = 0;
				ball.vy = 0;
			});
			enemies.length = 0;
			player.radius = 10;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			document.body.removeChild(gc);
			firstload = false;
			then = Date.now();
			initGame();
			//location.reload();
		}
	}, false);

	var then = Date.now();
	var start = Date.now();
	main();

}

function resize() {
	if (currentcanvas === "menu") {
		initMenu();
	} else if (currentcanvas === "game") {
		initGame();
	}
}
