var canPlayNatively = document.createElement('video').canPlayType('application/vnd.apple.mpegURL') === 'maybe';
var hlsJSSource = 'https://cdn.jsdelivr.net/hls.js/latest/hls.min.js';

function loadJSOnDemand(src) {
  var head= document.querySelector('head');
  var scriptEl= document.createElement('script');

  return new Promise(function (resolve) {
    scriptEl.type= 'text/javascript';
    scriptEl.onreadystatechange = function () {
      if (this.readyState == 'complete') {
        resolve();
      }
    }
    scriptEl.onload = resolve;
    scriptEl.src= src;
    head.appendChild(scriptEl);
  });
}

function initHlsJS() {
  return loadJSOnDemand(hlsJSSource)
    .then(function () {
      if (window.Hls.isSupported()) {
        var hls = new window.Hls();
        return hls;
      }
    });
}

function init() {
  var playerEl = document.querySelector('#video-player');
  var inputForm = document.querySelector('#input-form');
  var messEl = document.querySelector('.alert');
  var hlsJSInstance;

  if (!canPlayNatively) {
    initHlsJS()
      .then(function (hls) {
        hlsJSInstance = hls;
      });
  }

  function attachVideoSource(src, playerEl) {
    if (canPlayNatively) {
      playerEl.src = src;
    } else if (hlsJSInstance) {
      hlsJSInstance.loadSource(src);
      hlsJSInstance.attachMedia(playerEl);
      hlsJSInstance.on(window.Hls.Events.MANIFEST_PARSED,function() {
        playerEl.play();
      });
    } else {
      console.error('Can not play hls video');
    }
  }

  inputForm.addEventListener('submit', function (e) {
    var opts = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: inputForm.querySelector('#url').value,
        meta: true
      })
    };

    // Prevent the form from actually submitted.
    e.preventDefault();

    fetch('/api/detect', opts)
      .then(function (resp) {
        return resp.json();
      })
      .then(function (result) {
        
        if (result.error) {
          messEl.querySelector('.title').innerText = result.message;
          messEl.className = 'alert alert-warning';
          messEl.style.display = 'block';
          return;
        }

        playerEl.poster = result.meta.poster;
        attachVideoSource(result.url, playerEl);

        messEl.querySelector('.title').innerText = result.meta.title;

        inputForm.style.display = 'none';
        messEl.className = 'alert alert-success';
        messEl.style.display = 'block';
      });
  });
}

document.addEventListener("DOMContentLoaded", init);