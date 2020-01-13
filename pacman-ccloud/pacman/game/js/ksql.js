function updatePanel(){
	var callback = function(playersScores){
		for (var i = 0, l = playersScores.length; i < l; i++) {
			var player = playersScores[i];
			if(player.row.columns[0]===window.name) { 
				$('#rank span').html('#'+(i+1));
				//HIGHSCORE = player.row.columns[1];
				//$('#highscore span').html(HIGHSCORE);
				break;
			}
		}
	}

	getScoreboard(callback);
}

function loadScoreboardPage(){

	var callback = function(playersScores){
		window.localStorage.setItem("playersScores", JSON.stringify(playersScores));
		var headers = ["Rank","Name", "Score", "Level", "Losses"];

		document.getElementById('scoreboard').innerHTML = json2table(playersScores, 'table', headers);

	}

	getScoreboard(callback);
}



function getScoreboard(callbackScoreboard){
	//This is a pull query, requires KSQLDB
	var query = "SELECT METRIC_VALUE FROM PACMAN_METRICS WHERE ROWKEY='PLAYERS_COUNT';";

	executeKsqlQuery(query, function(data) {
		var playersCount = data[1].row.columns[0];
		var query = "SELECT USER, HIGHEST_SCORE, HIGHEST_LEVEL, TOTAL_LOSSES FROM SCOREBOARD EMIT CHANGES LIMIT "+playersCount+" ;";


		executeKsqlQuery(query, function(data) {
			if(Array.isArray(data)){
				var playersScores = data.slice(1,-1).sort(function(a, b) {
					var res=0
					if (a.row.columns[1] > b.row.columns[1]) res = 1;
					if (b.row.columns[1] > a.row.columns[1]) res = -1;

					return res * -1;
				  });
				//debugger;
				callbackScoreboard(playersScores);
			}else{
				console.error(data)
			}

		});
	});


}

function executeKsqlQuery(query, callback){
	var contentType = "application/vnd.ksql.v1+json";
	var url = KSQLDB_QUERY_API;
	var requestObj = { 
		"ksql": query,
		"streamsProperties": {
			"ksql.streams.auto.offset.reset": "earliest"
		}
	};
	var json = JSON.stringify(requestObj);

	const request = new XMLHttpRequest();
	request.open("POST", url, true);
	request.setRequestHeader("Content-Type", contentType);
	request.onload = function() {

		var data = JSON.parse(this.response);
		callback(data,this);
	}

	request.send(json);

}



function json2table(json, classes, headers) {
	var cols = Object.keys(json[0]);

	var headerRow = '';
	var bodyRows = '';

	classes = classes || '';

	function capitalizeFirstLetter(string) {
	  return string.charAt(0).toUpperCase() + string.slice(1);
	}

	headers.map(function(col) {
	  headerRow += '<th>' + capitalizeFirstLetter(col) + '</th>';
	});

	json.forEach((row, index) => {
		bodyRows += '<tr>';
		bodyRows += '<td>#' + (index+1) + '</td>';
		row.row.columns.forEach((column) => {
			bodyRows += '<td>' + column + '</td>';
		})

		bodyRows += '</tr>';
	});

	return '<table class="' +
		   classes +
		   '"><thead><tr>' +
		   headerRow +
		   '</tr></thead><tbody>' +
		   bodyRows +
		   '</tbody></table>';
  }