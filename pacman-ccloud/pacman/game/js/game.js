//defined in variables file
//const CLOUD_PROVIDER = "${cloud_provider}";

var KEYDOWN = false;
var PAUSE = false;
var LOCK = false;

var HIGHSCORE = 0;
var highScoreWorker;
var SCORE = 0;
var SCORE_BUBBLE = 10;
var SCORE_SUPER_BUBBLE = 50;
var SCORE_GHOST_COMBO = 200;

var LIFES = 2;
var GAMEOVER = false;

var LEVEL = 1;
var LEVEL_NEXT_TIMER = -1;
var LEVEL_NEXT_STATE = 0;

var TIME_GENERAL_TIMER = -1;
var TIME_GAME = 0;
var TIME_LEVEL = 0;
var TIME_LIFE = 0;
var TIME_FRUITS = 0;

var HELP_DELAY = 1500;
var HELP_TIMER = -1;

window.setInterval(function(){
	/// call your function here
	updatePanel();
  }, 5000);

//updatePanel();
			
function blinkHelp() { 
	if ( $('.help-button').attr("class").indexOf("yo") > -1 ) { 
		$('.help-button').removeClass("yo");
	} else { 
		$('.help-button').addClass("yo");
	}

	if ( $('.scoreboard-button').attr("class").indexOf("yo") > -1 ) { 
		$('.scoreboard-button').removeClass("yo");
	} else { 
		$('.scoreboard-button').addClass("yo");
	}
}

function initGame(newGame) {

	// Retrieve the highest score so the current
	// player knows how far behind he/she might
	// be if compared to the best player.

	var ksqlQuery = {};
	ksqlQuery.ksql =
		"SELECT HIGHEST_SCORE FROM HIGHEST_SCORE " +
		"WHERE ROWKEY = 'HIGHEST_SCORE_KEY';";

	var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (this.readyState == 4) {
			if (this.status == 200) {
				var result = JSON.parse(this.responseText);
				if (result[1] != undefined || result[1] != null) {
					var row = result[1].row;
					HIGHSCORE = row.columns[0];
					if (HIGHSCORE === 0) {
						$('#highscore span').html("00");
					} else { 
						$('#highscore span').html(HIGHSCORE);
					}
				}
            }
		}
	};
	request.open('POST', '${ksqldb_query_api}', true);
	request.setRequestHeader('Accept', 'application/vnd.ksql.v1+json');
	request.setRequestHeader('Content-Type', 'application/vnd.ksql.v1+json');
	request.send(JSON.stringify(ksqlQuery));

	// Creates a web worker that continuously update
	// the value of the highest score every five seconds.
	highScoreWorker = new Worker("/game/js/highscore.js");
	highScoreWorker.onmessage = function(event) {
		HIGHSCORE = event.data;
	};

	var lastScore = 0;
	var lastLevel = 0;

	// Temporary workaround for GCP and Azure
	// while their implementations are not using
	// ksqlDB and thus don't support pull queries.
	if (CLOUD_PROVIDER == "GCP" || CLOUD_PROVIDER == "AZR") {
		doInitGame(newGame, lastScore, lastLevel);
		return;
	}

	var ksqlQuery = {};
	ksqlQuery.ksql =
		"SELECT HIGHEST_SCORE, HIGHEST_LEVEL " +
		"FROM STATS_PER_USER WHERE ROWKEY = '" +
		window.name + "';"

	var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (this.readyState == 4) {
			if (this.status == 200) {
				var result = JSON.parse(this.responseText);
				if (result[1] != undefined || result[1] != null) {
					var row = result[1].row;
					lastScore = row.columns[0];
					lastLevel = row.columns[1];
				}
			}
			doInitGame(newGame, lastScore, lastLevel);
		}
	};
	request.open('POST', KSQLDB_QUERY_API, true);
	request.setRequestHeader('Accept', 'application/vnd.ksql.v1+json');
	request.setRequestHeader('Content-Type', 'application/vnd.ksql.v1+json');
	request.send(JSON.stringify(ksqlQuery));
	
}

function doInitGame(newGame, lastScore, lastLevel) {

	if (newGame) { 
		stopPresentation();
		stopTrailer();
	
		HOME = false;
		GAMEOVER = false;

		$('#help').fadeOut("slow");
		
		score(lastScore);
		LEVEL = lastLevel;
		if (LEVEL == 0) {
			LEVEL = 1;
		}
		$('#level span').html(LEVEL + "UP");

		clearMessage();
		$("#home").hide();
		$("#panel").show();
		
		var ctx = null;
		var canvas = document.getElementById('canvas-panel-title-pacman');
		canvas.setAttribute('width', '38');
		canvas.setAttribute('height', '32');
		if (canvas.getContext) { 
			ctx = canvas.getContext('2d');
		}
		
		var x = 15;
		var y = 16;
		
		ctx.fillStyle = "#fff200";
		ctx.beginPath();
		ctx.arc(x, y, 14, (0.35 - (3 * 0.05)) * Math.PI, (1.65 + (3 * 0.05)) * Math.PI, false);
		ctx.lineTo(x - 5, y);
		ctx.fill();
		ctx.closePath();
		
		x = 32;
		y = 16;
		
		ctx.fillStyle = "#dca5be";
		ctx.beginPath();
		ctx.arc(x, y, 4, 0, 2 * Math.PI, false);
		ctx.fill();
		ctx.closePath();
	}
	initBoard();
	drawBoard();
	drawBoardDoor();
	initPaths();
	drawPaths();
	initBubbles();
	drawBubbles();
	initFruits();
	initPacman();
	drawPacman();
	initGhosts();
	drawGhosts();
	lifes();
	ready();

}

function win() { 
	stopAllSound();

	LOCK = true;
	stopPacman();
	stopGhosts();
	stopBlinkSuperBubbles();
	stopTimes();
	
	eraseGhosts();

	setTimeout("prepareNextLevel()", 1000);

}

function prepareNextLevel(i) { 
	if ( LEVEL_NEXT_TIMER === -1 ) { 
		eraseBoardDoor();
		LEVEL_NEXT_TIMER = setInterval("prepareNextLevel()", 250);
	} else { 
		LEVEL_NEXT_STATE ++;
		drawBoard( ((LEVEL_NEXT_STATE % 2) === 0) );
		
		if ( LEVEL_NEXT_STATE > 6) { 
			LEVEL_NEXT_STATE = 0;
			clearInterval(LEVEL_NEXT_TIMER);
			LEVEL_NEXT_TIMER = -1;
			nextLevel();
		}
	}
}
function nextLevel() { 
	LOCK = false;
	
	LEVEL ++;
	
	erasePacman();
	eraseGhosts();
	
	resetPacman();
	resetGhosts();

	initGame();
	
	TIME_LEVEL = 0;
	TIME_LIFE = 0;
	TIME_FRUITS = 0;

	$('#level span').html(LEVEL + "UP");

}


function retry() { 
	stopTimes();

	erasePacman();
	eraseGhosts();
	
	resetPacman();
	resetGhosts();
	
	drawPacman();
	drawGhosts();
	
	TIME_LIFE = 0;
	TIME_FRUITS = 0;
	
	ready();
}

function ready() { 
	LOCK = true;
	message("ready!");
	
	playReadySound();
	setTimeout("go()", "4100");
}
function go() { 
	playSirenSound();

	LOCK = false;
	
	startTimes();
	
	clearMessage();
	blinkSuperBubbles();

	movePacman();

	moveGhosts();
}
function startTimes() { 
	if (TIME_GENERAL_TIMER === -1) { 
		TIME_GENERAL_TIMER = setInterval("times()", 1000);
	}
}
function times() { 
	TIME_GAME ++;
	TIME_LEVEL ++;
	TIME_LIFE ++;
	TIME_FRUITS ++;
	
	fruit();
}
function pauseTimes() { 
	if (TIME_GENERAL_TIMER != -1) { 
		clearInterval(TIME_GENERAL_TIMER);
		TIME_GENERAL_TIMER = -1;
	}
	if (FRUIT_CANCEL_TIMER != null) FRUIT_CANCEL_TIMER.pause();
}
function resumeTimes() { 
	startTimes();
	if (FRUIT_CANCEL_TIMER != null) FRUIT_CANCEL_TIMER.resume();
}
function stopTimes() { 
	if (TIME_GENERAL_TIMER != -1) { 
		clearInterval(TIME_GENERAL_TIMER);
		TIME_GENERAL_TIMER = -1;
	}
	if (FRUIT_CANCEL_TIMER != null) { 
		FRUIT_CANCEL_TIMER.cancel();
		FRUIT_CANCEL_TIMER = null;
		eraseFruit();
	}
}

function pauseGame() { 

	if (!PAUSE) { 
		stopAllSound();
		PAUSE = true;
		
		message("pause");
		
		pauseTimes();
		pausePacman();
		pauseGhosts();
		stopBlinkSuperBubbles();
	}
}
function resumeGame() { 
	if (PAUSE) { 
		testStateGhosts();

		PAUSE = false;
		
		clearMessage();
		
		resumeTimes();
		resumePacman();
		resumeGhosts();
		blinkSuperBubbles();
	}
}

function lifes(l) { 
	if (l) { 
		if ( l > 0 ) { 
			playExtraLifeSound();
		}
		LIFES += l;
	}
	
	var canvas = document.getElementById('canvas-lifes');
	canvas.setAttribute('width', '120');
	canvas.setAttribute('height', '30');
	if (canvas.getContext) { 
		var ctx = canvas.getContext('2d');
		
		ctx.clearRect(0, 0, 120, 30);
		ctx.fillStyle = "#fff200";
		for (var i = 0, imax = LIFES; (i < imax && i < 4); i ++) { 
			ctx.beginPath();
			
			var lineToX = 13;
			var lineToY = 15;
			
			ctx.arc(lineToX + (i * 30), lineToY, 13, (1.35 - (3 * 0.05)) * Math.PI, (0.65 + (3 * 0.05)) * Math.PI, false);
			ctx.lineTo(lineToX + (i * 30) + 4, lineToY);
			ctx.fill();
			ctx.closePath();
		}
	}

	// Emit event 'USER_GAME' event
	var record = {};
	record.user = window.name;
	record.game = {}
	record.game.score = SCORE
	record.game.lives = LIFES
	record.game.level = LEVEL

	produceRecord('USER_GAME', record);

}

function gameover() { 
	GAMEOVER = true;
	message("game over");
	stopTimes();

	erasePacman();
	eraseGhosts();
	
	resetPacman();
	resetGhosts();
	
	TIME_GAME = 0;
	TIME_LEVEL = 0;
	TIME_LIFE = 0;
	TIME_FRUITS = 0;

	LIFES = 2;
	LEVEL = 1;
	SCORE = 0;

	// Emit event 'USER_LOSSES' event
	var record = {};
	record.user = window.name;
	produceRecord('USER_LOSSES', record);

	// Terminate the web worker that
	// updates the highest score value
	highScoreWorker.terminate();

}

function message(m) { 
	$("#message").html(m);
	if (m === "game over") $("#message").addClass("red");
}
function clearMessage() { 
	$("#message").html("");
	$("#message").removeClass("red");
}

function score(s, type) { 

	var scoreBefore = (SCORE / 10000) | 0;
	
	SCORE += s;
	if (SCORE === 0) { 
		$('#score span').html("00");
	} else { 
		$('#score span').html(SCORE);
	}
	
	var scoreAfter = (SCORE / 10000) | 0;
	if (scoreAfter > scoreBefore) { 
		lifes( +1 );
	}
	
	if (SCORE > HIGHSCORE) {
		HIGHSCORE = SCORE;
	}

	if (HIGHSCORE === 0) {
		$('#highscore span').html("00");
	} else { 
		$('#highscore span').html(HIGHSCORE);
	}
	
	if (type && (type === "clyde" || type === "pinky" || type === "inky" || type === "blinky") ) { 
		erasePacman(); 
		eraseGhost(type); 
		$("#board").append('<span class="combo">' + SCORE_GHOST_COMBO + '</span>');
		$("#board span.combo").css('top', eval('GHOST_' + type.toUpperCase() + '_POSITION_Y - 10') + 'px');
		$("#board span.combo").css('left', eval('GHOST_' + type.toUpperCase() + '_POSITION_X - 10') + 'px');
		SCORE_GHOST_COMBO = SCORE_GHOST_COMBO * 2;
	} else if (type && type === "fruit") { 
		$("#board").append('<span class="fruits">' + s + '</span>');
		$("#board span.fruits").css('top', (FRUITS_POSITION_Y - 14) + 'px');
		$("#board span.fruits").css('left', (FRUITS_POSITION_X - 14) + 'px');
	}

	// Emit event 'USER_GAME' event
	var record = {};
	record.user = window.name;
	record.game = {}
	record.game.score = SCORE
	record.game.lives = LIFES
	record.game.level = LEVEL

	produceRecord('USER_GAME', record);

}

function produceRecord(topic, record) {

	var contentType = "application/json";
	var url = EVENT_HANDLER_API + "?topic=" + topic;
	var json = JSON.stringify(record);

	// The verification below is only
	// necessary while the application
	// is being migrated to serverless,
	// since some implementations still
	// rely on REST Proxy to emmit the
	// game events.
	
	if (CLOUD_PROVIDER == "GCP" || CLOUD_PROVIDER == "AZR") {

		// Fallback to the format that REST Proxy
		// requires in order to emmit the events.

		contentType = "application/vnd.kafka.json.v2+json";
		url = EVENT_HANDLER_API + "/topics/" + topic;

		var recordHolder = {};
		recordHolder.value = record;
		var recordsHolder = {};
		recordsHolder.records = [recordHolder];
		json = JSON.stringify(recordsHolder);

	}

	const request = new XMLHttpRequest();
	request.open("POST", url, true);
	request.setRequestHeader("Content-Type", contentType);
	request.send(json);

	record

}
