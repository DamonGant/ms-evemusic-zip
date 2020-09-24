var app = require('express')()
var archiver = require('archiver')
var p = require('path')
var fs = require('fs')
var jsdom = require('jsdom')
var request = require('request')
var async = require('async')

var list = []

app.get('/', function(req, res) {
  var archive = archiver('zip')

  archive.on('error', function(err) {
    res.status(500).send({error: err.message})
  })

  res.on('close', function() {
    console.log('Archive wrote %d bytes', archive.pointer())
    return res.status(200).send('OK').end()
  })

  jsdom.env("http://www.modenstudios.com/EVE/music/",["http://code.jquery.com/jquery-2.1.3.min.js"], function(err, window) {
    window.jQuery("a").each(function(i, obj) {
      if (window.jQuery(obj).prop("href") && window.jQuery(obj).prop("href").indexOf(".mp3") != -1) {
        list.push(window.jQuery(obj).prop("href"));
      }
    })
    list = list.map(function(element) {
      return element.replace("http:\/\/www.modenstudios.com\/EVE\/music\/", "");
    })

    res.attachment('eve-music.zip');
    archive.pipe(res);

    async.eachLimit(list, 1, function(item, callback) {
      archive.append(request("http://www.modenstudios.com/EVE/music/" + item, function(err) {
        callback(err);
      }), {name: decodeURIComponent(item)})
    }, function(err) {
      if (err)
        return res.end();
      archive.finalize();
    })
  })

});
app.listen(process.env.PORT || 8080);
