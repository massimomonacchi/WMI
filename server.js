const express = require('express');
const fs = require('fs');
const multer = require('multer');
const app = express();
const path = require('path');
const youtubeSearch = require('youtube-search');
var utils = require('./serverSideUtils.js');
var utilsSmog = require('./serverSideUtils2.js');

var client = require('mongodb').MongoClient;
var parseString = require('xml2js').parseString;
var https = require("https");
const OpenLocationCode = require('open-location-code').OpenLocationCode;
const openLocationCode = new OpenLocationCode();
const upload = multer();
const Youtube = require("youtube-api");
const readJson = require("r-json");
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const rickyKey = "AIzaSyBEpETjNZc18OP9L603YkzOvotslkQiBGI";
const rickykey_second = "AIzaSyB5PLURpl92Ix6gBHvgBMJ9s1JC7m69b2c";
const guiKey = "AIzaSyBFXSS4CBQKDc8yJtAdEruvXgAEHNwg8ko";
const maxKey = "AIzaSyD5gNJnmZJlz4DsDcD1cFjgpqLfzX0LsFk";
const rickyNewkey = "AIzaSyAIk7cdHgscrcEjpLZVLL-FU0qA37akOK0";
const Entities = require('html-entities').XmlEntities;

const entities = new Entities();

app.use(express.static("public")); // for serving the HTML file
ffmpeg.setFfmpegPath(ffmpegPath);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./index.html"));
});

app.get("/askDBPedia", (req, res) => {
  return new Promise(async (resolve, reject) => {
    var vector = req.query.que.split(" ");
    for (string in vector) {
      vector[string] = "'" + vector[string] + "'";
      vector[string] = vector[string].toUpperCase();
    }
    var string = req.query.que.toUpperCase();
    string = string.replace(/ /g, " AND ");
    var q =
      "select ?s1 as ?c1, (bif:search_excerpt (bif:vector (" +
      vector +
      " , 'BOLOGNA'), ?o1)) as ?c2, ?sc, ?rank, ?g where {{{ select ?s1, (?sc * 3e-1) as ?sc, ?o1, (sql:rnk_scale (<LONG::IRI_RANK> (?s1))) as ?rank, ?g where  { quad map virtrdf:DefaultQuadMap { graph ?g { ?s1 ?s1textp ?o1 . ?o1 bif:contains  '(" +
      string +
      " AND BOLOGNA)'  option (score ?sc)  . } } } order by desc (?sc * 3e-1 + sql:rnk_scale (<LONG::IRI_RANK> (?s1)))  limit 1  offset 0 }}}";

    dps
      .client()
      .query(q)
      .timeout(15000)
      .asJson()
      .then(r => {
        res.send(r);
      })
      .catch(e => {

        res.send(e);
      });
  });
});

app.post("/updateReview", (req, res) => {
  client.connect(
    "mongodb://site181947:ASae0ahr@mongo_site181947:27017/",
    //"mongodb://localhost:27017/",
    { useUnifiedTopology: true },
    async function (error, db) {
      var myquery = { luogo: req.query.luogo, wr: req.query.wr, clip: req.query.clip }
      var newvalues = {
        $set: {
          luogo: req.query.luogo,
          value: {
            voto: req.query.voto,
            descrizione: req.query.descrizione
          },
          clip: req.query.clip,
          wr: req.query.wr,
          rd: req.query.rd
        }
      };
      var mydb = db.db("WMIdb");
      mydb
        .collection("review")
        .updateOne(myquery, newvalues, function (err, result) {
          if (err) {
            res.status(400).send({
              message: "DB error"
            });
          } else {
            res.send("Update!");
          }
        });
    }
  );
});


app.get("/removeReview", async (req, res) => {
  client.connect(
    "mongodb://site181947:ASae0ahr@mongo_site181947:27017/",
    //"mongodb://localhost:27017/",
    { useUnifiedTopology: true }, async function (error, db) {
      var mydb = db.db("WMIdb");
      var mongodb = require('mongodb');
      mydb.collection("review").deleteOne({ _id: new mongodb.ObjectID(req.query.id) }, function (err, obj) {
        if (err) {
          res.send(err)
        };
        res.send("eliminato");
      });
    });
});




app.get("/getReview", async (req, res) => {
  client.connect(
    "mongodb://site181947:ASae0ahr@mongo_site181947:27017/",

    //"mongodb://localhost:27017/",
    { useUnifiedTopology: true }, async function (error, db) {
      if (req.query.mode == "user") {
        if (error) {
          res.status(400).send({
            message: "DB error"
          });
        } else {
          var mydb = db.db("WMIdb");
          mydb
            .collection("review")
            .find({ wr: req.query.wr })
            .toArray(function (err, result) {
              if (err) {
                res.status(400).send({
                  message: "DB error"
                });
              } else {
                if (result.length == 0) {
                  res.send("null");
                } else {
                  res.send(result);
                }
              }
            });
        }
      } else if (req.query.mode == "check") {
        var mydb = db.db("WMIdb");
        var ifExist = await utils.getSingleReview(req, mydb);
        res.send(ifExist);
      } else {
        var mydb = db.db("WMIdb");
        mydb
          .collection("review")
          .find({ rd: req.query.rd })
          .toArray(function (err, result) {
            if (err) {
              res.status(400).send({
                message: "DB error"
              });
            } else {
              if (result.length == 0) {
                res.send("null");
              } else {
                res.send(result);
              }
            }
          });
      }
    }
  );
});

app.post("/insertReview", (req, res) => {
  client.connect(
    "mongodb://site181947:ASae0ahr@mongo_site181947:27017/",

    //"mongodb://localhost:27017/",
    { useUnifiedTopology: true },
    async function (error, db) {
      if (!error) {
        var mydb = db.db("WMIdb");

        var ifExist = await utils.getSingleReview(req, mydb);

        if (ifExist == "error") {
          res.send(ifExist);
        } else if (ifExist.length == 0) {


          var myobj = {
            luogo: req.query.luogo,
            value: {
              voto: req.query.voto,
              descrizione: req.query.descrizione
            },
            clip: req.query.clip,
            wr: req.query.wr,
            rd: req.query.rd
          };
          mydb.collection("review").insertOne(myobj, function (err, result) {
            if (err) {
              res.send(err.message);
            } else {
              res.send("Insert!");
            }
          });
        } else {
          res.send(ifExist);
        }
      }
      db.close();
    }
  );
});

try {
  app.get("/getPOIs", async (req, res) => {
    var opts = (youtubeSearch.YouTubeSearchOptions = {
      maxResults: 50,
      key: rickyKey
    });

    try {
      var contOlc = 12;
      var c = req.query.searchQuery;
      var data = {};
      var index = c.indexOf(' ')
      c = c.replace('a', '+')
      var biggerOlc = c.split(' ');
      biggerOlc = biggerOlc[0];
      c = c.split(' ');
      var decoded = openLocationCode.decode(biggerOlc);
      //  while(contOlc > 0){

      var encoded = openLocationCode.encode(decoded.latitudeCenter, decoded.longitudeCenter, contOlc);
      if (encoded.indexOf('+') == encoded.length - 1) {
        encoded = encoded.replace('+', '');

      }

      c[0] = encoded;
      var queryYT = '';
      for (var i in c) {
        queryYT += c[i] + ' ';
      }
      data = await searchYoutube(queryYT, opts, data, res, req);

      if (data.length > 50)

        contOlc = contOlc - 12;
      //  }
      res.send(data);
    } catch (error) { }


  });
} catch (error) { }

async function searchYoutube(c, req, r, res) {
  return new Promise(async (resolve, reject) => {
    var x = 1;
    c = c.split(' ');
    var r = [];
    var temp = [];
    var totalResult = 0;
    for (var el in c) {
      if (c[el] != "" || c[el] != " ") {
        var nextPageToken = '';
        do {
          try {
            var opts = (youtubeSearch.YouTubeSearchOptions = {
              maxResults: 50,
             // key: "AIzaSyAqgzgIb6o-E8-2V7gPkflm7ZzmgprvOL4",
              key: "AIzaSyAImEHHTGC_cJCdd3MNitQwV0nBSversFg",
              pageToken: nextPageToken
            });
            var ret = await cerca(c[el], opts, nextPageToken, r, res);
            for (var el in ret.list) {
              temp.push(ret.list[el]);
            }

            nextPageToken = ret.npt;
            if (totalResult == 0) totalResult = ret.total;
          }
          catch (e) {
            res.send(e);
            resolve(e)
            break;
          }

        } while (temp.length < totalResult);
        r = r.concat(temp);
        temp = [];
        totalResult = 0;
      }
    }
    resolve(r);
  });
}

async function cerca(c, opts, nextPageToken, r, res) {
  return new Promise(async (resolve, reject) => {
    try {
      youtubeSearch(c, opts, async (err, results, pageInfo) => {
        if (err) {
          console.log(err)
          res.send({ error: err.response.statusText });
        } else {
          var boh = await results;
          for (var val in boh) {
            r.push(results[val]);
          }
          var npt = await pageInfo;
          var tot = pageInfo.totalResults
          nextPageToken = npt.nextPageToken;
          resolve({ npt: nextPageToken, list: r, total: tot });
        }
      });
    } catch (e) { res.send("mmmmm"); resolve(e) }
  });
}

app.get("/prova", async (req, res) => {
  try {
    var c = req.query.searchQuery;
    var r = [];
    r = await searchYoutube(c, req, r, res);
    var data = await call(r, res, req, req.query.filter);
    utils.updateJson(data, res);
  } catch (error) { res.send(error.message) }

});

function call(results, res, req, filtri) {
  return new Promise(async (resolve, reject) => {
    var POIs = {};
    var list = {};
    var counter = 0;

    try {
      client.connect(
        "mongodb://site181947:ASae0ahr@mongo_site181947:27017/",

        //"mongodb://localhost:27017/",
        { useUnifiedTopology: true },
        async function (error, db) {
          var mydb = db.db("WMIdb");
          for (var key in results) {
            var item = results[key];

            if ((val = utils.validator(item.description, filtri)) !== false) {

              if (list[val.plusCode] === undefined) {

                list[val.plusCode] = counter;
                var c;
                if (req.query.mode != "editor") {
                  c = await utils.getDescription(item.title, mydb, utils, res);

                  item.title = entities.decode(item.title);
                  try {
                    POIs[counter] = {
                      name: item.title,
                      coords: val.coords,
                      videoId: [item.id],
                      description: c[0].descrizione,
                      youtubeDescription: item.description,
                      img: c[0].urlImg,
                      visited: false
                    };
                  } catch (error) {
                    POIs[counter] = {
                      name: item.title,
                      coords: val.coords,
                      videoId: [item.id],
                      description: c.descrizione,
                      youtubeDescription: item.description,
                      img: c.urlImg,
                      visited: false
                    };
                  }

                } else {
                  try {
                    POIs[counter] = {
                      name: item.title,
                      coords: val.coords,
                      videoId: [item.id],
                    };
                  } catch (error) {
                    POIs[counter] = {
                      name: item.title,
                      coords: val.coords,
                      videoId: [item.id],
                    };
                  }
                }

                counter++;
              }
              else {
                if (POIs[list[val.plusCode]].videoId.indexOf(item.id) === -1)
                  POIs[list[val.plusCode]].videoId.push(item.id)
              }
            }
          }

          resolve(POIs);
        }
      );
    }
    catch (e) {

      try {
        for (var key in results) {
          var item = results[key];
          if ((val = utils.validator(item.description, res, filtri)) !== false) {
            if (list.indexOf(val.plusCode) === -1) {

              list.push(val.plusCode);
              var c;
              if (req.query.mode != "editor") {
                c = await utils.getDescription(item.title, mydb, utils, res);
                item.title = entities.decode(item.title);
                try {
                  POIs[counter] = {
                    name: item.title,
                    coords: val.coords,
                    videoId: item.id,
                    description: c[0].descrizione,
                    img: c[0].urlImg,
                    visited: false
                  };
                } catch (error) {
                  POIs[counter] = {
                    name: item.title,
                    coords: val.coords,
                    videoId: item.id,
                    description: c.descrizione,
                    img: c.urlImg,
                    visited: false
                  };
                }
              } else {
                try {
                  POIs[counter] = {
                    name: item.title,
                    coords: val.coords,
                    videoId: item.id
                  };
                } catch (error) {
                  POIs[counter] = {
                    name: item.title,
                    coords: val.coords,
                    videoId: item.id
                  };
                }
              }

              counter++;
            }
          }
          //}


        }
        resolve(POIs);
      }
      catch (e) {
        resolve(POIs);
      }
    }
  });
}

app.get("/getDuration", (req, res) => {
  utils.getDuration(req, res);
});

app.post('/saveOriginAudio', upload.single('file'), (req, res) => {
  utils.saveOrigin(req, res);
});

app.post('/uploadFile', upload.single('file'), function (req, res) {
  utils.createVideo(req, res);
});

app.post('/cutAudio', upload.single('file'), function (req, res) {
  utils.cutAudio(req, res);
});
app.post('/saveToken', function (req, res) {
  utils.reload(req, res);
});
app.post('/removeDir', function (req, res) {
  utils.remove(res, req.query.id);
  res.send("deleted")
});

app.get('*', (req, res) => {
  var ext = path.extname(req.url);

  if (ext === ".css" || ext === ".html" || ext === ".json" || ext === ".js" || ext === ".jpg" || ext === ".png" || ext === ".woff" || ext === ".woff2" || ext === ".ttf" || ext === ".svg" || ext === ".eot") {
    res.sendFile(path.join(__dirname, './' + req.url))
  } else if (ext === ".mp3") {
    //audio
    res.sendFile(path.join(__dirname, './' + req.url));
  }
  else {
    res.status(204).json({ nope: true });
  }

});


//https.createServer({
//  key: fs.readFileSync('server.key'),
//  cert: fs.readFileSync('server.cert')
//}, app).listen(8000, () => console.log('Gator app listening on port 8000!'))

app.listen(8000, () => console.log('Gator app listening on port 8000!'))
