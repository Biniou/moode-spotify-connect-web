function renderSpcUI(metadata) {
  debugLog('renderSpcUI');

  //time knob
  $('#countdown-display').css({"font-size":"24px"});
  $('#countdown-display').css({"margin-top":"-13px"});
  $('#countdown-display').html('SPOTIFY');

  // playlist
  $('.playlist li').removeClass('active');

  // cover art
  $('#coverart-url').html('<img class="coverart" src="http://i.scdn.co/image/' + metadata.cover_uri.substr(metadata.cover_uri.lastIndexOf(':') + 1) + '" alt="Cover art not found">');

  // metadata
  $('#extratags').html('Spotify Connect active');
  $('#currentartist').html(metadata.artist_name);
  $('#currentsong').html(metadata.track_name);
  $('#currentalbum').html(metadata.album_name);

  // reset this so cover art is redisplayed when resuming MPD playback
  // UI.lastSong = '';
}

function engineSpc() {
  var connection = new WebSocket('ws://' + window.location.hostname + ':1880/engine-spc');
  
  // When the connection is open, send some data to the server
  connection.onopen = function () {
    connection.send('Ping');
  };

  // Log errors
  connection.onerror = function (error) {
    debugLog('WebSocket Error ' + error);
  };

  // Log messages from the server
  connection.onmessage = function (e) {
    var payload = JSON.parse(e.data);

    if (payload.action === 'engineSpc:newSong') {
      renderSpcUI(payload.metadata);
    }
  };
}

engineSpc();
