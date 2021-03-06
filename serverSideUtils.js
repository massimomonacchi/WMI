/*d = d.replace(".", "");
    var list = d.split(":");
    var check = (list.length >= 3) && (list[0].split("-").length >= 3) &&  (type.indexOf(list[1]) != -1) && (language.indexOf(list[2]) != -1);
    if (check) {
        console.log(d);
        if (list[3] != undefined){
          if (list[3].charAt(0) != 'A' && list[3].charAt(0) != 'P'){
            var contentList = list[3].split("-");
            for (var content in contentList) {
              check = check && (contents.indexOf(contentList[content]) != -1);
            }
            if (list[4] != undefined && list[4].charAt(0) == 'A'){
              var val = list[4].replace("A", "");
              check = check && (audience.indexOf(val) != -1);

              if (list[5] != undefined && list[5].charAt(0) == 'P') {
                var val = list[5].replace("P", "");
                try {
                  check = check && (parseInt(val, 10) >= 0);

                } catch (err) {
                  check = false;
                }
              }
            } else if (list[4] != undefined && list[4].charAt(0) == 'P') {
              var val = list[4].replace("P", "");
              try {
                check = check && (parseInt(val, 10) >= 0);

              } catch (err) {
                check = false;
              }
            }
          }
          else if (list[3] != undefined && list[3].charAt(0) == 'A'){
            var val = list[3].replace("A", "");
            check = check && (audience.indexOf(val) != -1);

            if (list[4] != undefined && list[4].charAt(0) == 'P') {
              var val = list[4].replace("P", "");
              try {
                check = check && (parseInt(val, 10) >= 0);
              } catch (err) {
                check = false;
              }
            }
          } else if (list[3] != undefined && list[3].charAt(0) == 'P') {
            var val = list[3].replace("P", "");
            try {
              check = check && (parseInt(val, 10) >= 0);

            } catch (err) {
              check = false;
            }
          }
        }
    }
    try {


      if (check){
        var ocls = list[0].split("-");
        return { coords: openLocationCode.decode(ocls[ocls.length -1 ]), plusCode: ocls[ocls.length -1 ] };
      } else {
        throw check;
     }
    } catch (err) {
      return false;
    }*/


const OpenLocationCode = require('open-location-code').OpenLocationCode;
const openLocationCode = new OpenLocationCode();
const axios = require('axios');
const fs = require('fs')
var parseString = require('xml2js').parseString;
var multer = require('multer');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
var readJson = require("r-json");
var Youtube = require('youtube-api')
var path = require("path");
var rimraf = require("rimraf");
ffmpeg.setFfmpegPath(ffmpegPath);
const dps = require('dbpedia-sparql-client').default;
var latinize = require('latinize');
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();
var mp3Duration = require('mp3-duration');

const type = [
  "why",
  "how",
  "what"
];

const language = [
  "ita",
  "eng",
  "deu",
  "fra",
  "esp"
];

const contents = [
  "none",
  "nat",
  "art",
  "his",
  "flk",
  "mod",
  "rel",
  "cui",
  "spo",
  "mus",
  "mov",
  "fas",
  "shp",
  "tec",
  "pop",
  "prs",
  "oth"
];

const audience = [
  "gen",
  "pre",
  "elm",
  "mid",
  "scl"
];


var auth = Youtube.authenticate({
 type: 'key',
  key: 'AIzaSyAJeTICiFLFNXkdHk5T8cUXyb-h1OF3WLQ'
});



var oauth;

function UploadYoutube (myTitle, myDescription, myTags, myFileLocation,res,token,refresh) {
	console.log("in upload")
	  oauth.setCredentials({
		access_token: token,
		refresh_token :refresh
	});
    var req = Youtube.videos.insert({
            resource: {
                snippet: {
                    title: myTitle
                  , description: myDescription
                  , tags: myTags

                }
              , status: {
                    privacyStatus: "public"
                }
            }
          , part: "snippet,status"

          , media: {
                body: fs.readFileSync(myFileLocation)
            }
        }, (err, data) => {
          console.log("this data");
            if(err){
              res.send(err.message);
            }
            else res.send(data);
        });
        return req;
}


function upload(title,fileName,res,desc,token,refresh) {
  var tags = desc.split(":");
  var result = UploadYoutube(title, desc, tags,fileName,res,token,refresh);


}
module.exports = {
  validator: function validator(d, filtri) {
	d = d.replace(".","");
	var list = d.split(":");

	//res.send(list);
	var listFiltri = filtri.split(" ");
	/*for(var c in listFiltri){
		if((listFiltri[c].charAt(0) <= '0') && (listFiltri[c].charAt(0) >= '9')) {
		if(list.includes(listFiltri[c]) == false){
			return false;
		}
	}
	}*/
	try {

        return {coords:openLocationCode.decode(list[2]), plusCode: list[2]};
    }catch (err) {
		try{


			var olc = list[0].split("-");
			return {coords:openLocationCode.decode(olc[olc.length-1]), plusCode: olc[olc.length-1] };
		}catch(err){
			return false;
		}
      return false;
    }
  },
  insertDescription : function insertDescription(mydb, titolo, desc, img){
	var myobj = { nome: titolo, descrizione: desc, urlImg : img };
    mydb.collection("descrizioni").insertOne(myobj, function (err, res) {
        if (err) throw err;
    });
  },

  askDBPedia :   function(titolo,res){
    return new Promise((resolve, reject) => {
      var vector = titolo.split(" ");
      for (string in vector) {
        vector[string] = "'" + vector[string] + "'";
        vector[string] = vector[string].toUpperCase();
      }
      var string = titolo.toUpperCase();
      string = string.replace(/&#([0-9]|[a-z])*;/g, "  ");
      string = string.replace( /  +/g, ' ' );
      string = string.replace(/ /g, " AND ");
      string = latinize(string);
      var q =
        "select ?s1 as ?c1, (bif:search_excerpt (bif:vector (" +
        vector +
        " , 'BOLOGNA'), ?o1)) as ?c2, ?sc, ?rank, ?g where {{{ select ?s1, (?sc * 3e-1) as ?sc, ?o1, (sql:rnk_scale (<LONG::IRI_RANK> (?s1))) as ?rank, ?g where  { quad map virtrdf:DefaultQuadMap { graph ?g { ?s1 ?s1textp ?o1 . ?o1 bif:contains  '(" +
        string +
        " AND BOLOGNA)'  option (score ?sc)  . } } } order by desc (?sc * 3e-1 + sql:rnk_scale (<LONG::IRI_RANK> (?s1)))  limit 1  offset 0 }}}";
      dps.client().query(q).timeout(15000).asJson().then(r => {
          resolve(r)
        })
        .catch(e => {
          reject(e)
        });
    });
  },

  getDescription :   function (nome, mydb = null,utils,  res){
	return new Promise( (resolve, reject) => {
		var cont={},img;
		try{
			mydb.collection("descrizioni").find({ nome: nome }).toArray( async function (err, result) {
				if(result.length != 0){
					resolve(result);
				}
				else {

					try {
			  var d =  await utils.askDBPedia(nome,res);

						nome = entities.decode(nome);
						d = d.results.bindings[0].c1.value.replace("resource","data"  ) + ".rdf";
						var e = await utils.get(d);
						parseString(e.data, function(err, result) {
							var json = {};
							var list =
							result["rdf:RDF"]["rdf:Description"][0]["rdfs:comment"];
							for (var key in list) {
								var chiave = list[key]["$"]["xml:lang"];
								var valore = list[key]["_"];
								json[chiave] = valore;
							}
							var img =
							result["rdf:RDF"]["rdf:Description"][0]["dbo:thumbnail"][0]["$"]["rdf:resource"];
							utils.insertDescription(mydb, nome, json, img)
							cont["descrizione"] = json;
							cont["urlImg"] = img;
							resolve(cont)
						});
				  }
				  catch (error) {
					nome = entities.decode(nome);
					var json = {};
					var img = "NF";
					json["en"] = "NOT FOUND";
					cont["descrizione"] = json;
					cont["urlImg"] = img;
					utils.insertDescription(mydb, nome, json, img)
					resolve(cont)
				  }
				}
			});
	}
		catch(e){}
	});
  },

  getSingleReview : async function(req, mydb){
    return new Promise((resolve, reject) => {
       mydb.collection("review").find({ luogo: req.query.luogo, wr : req.query.wr, clip: req.query.clip }).toArray( function(err, result) {
         if (err) {
            resolve("error");
         }
         else{
           resolve(result);
         }
       });
    });
  },

  get: function get(search) {
    return new Promise((resolve,reject) => {resolve(axios.get(search))});
  },

  dist: function dist(item,lat,lon){
    return new Promise((resolve,reject) => {
		var url = "https://graphhopper.com/api/1/matrix?from_point=" + lat + "," + lon;
		url += "&to_point=" + item["latitudeCenter"] + "," + item["longitudeCenter"]
		url += "&type=json&vehicle=foot&debug=true&out_array=weights&out_array=times&out_array=distances&key=a0695b22-2381-4b66-8330-9f213b610d8f";
		axios.get(url)
		.then(response => {
		item["distance"] = response["data"]["distances"][0][0];
		resolve(response["data"]["distances"][0][0])
		})
		.catch(error => {
			reject(error);
		});
	});
  },

/* * * Editor Mode modules * * */
   cutAudio: function cutAudio(audio,res) {
	const fileName = audio.body.fname;
	const stime = audio.body.stime;
	const etime = audio.body.etime;
	const id = audio.body.id;
	const newPath = path.join(__dirname, 'user',id);
	const filePath = path.join(newPath , fileName.replace("Origin",""));
	if (!fs.existsSync(newPath)) {
		fs.mkdirSync(newPath,{recursive:true,mode:"777"});
	}

	fs.writeFileSync(filePath, audio.file.buffer, error => {
		if (error) {
		res.send("error")
		}
	})

	if(stime != undefined && etime != undefined){
		if(fileName.includes('How')) {
			if(etime-stime < 15){
				 res.send('Le clip How devono durare almeno 15 secondi!');
			 }
			 else{
				const conv = new ffmpeg({ source: filePath  });
				conv
					.setStartTime(stime)
					.setDuration(etime-stime)
					.on("start", function(commandLine) {})
					.on("error", function(err) {
						res.send(err.message);
					})
					.on("end", function(err) {
						if (err) res.send(err.message);
						res.send('user/'+id+'/new' + fileName);

					})
					.saveToFile(newPath +'/' + 'new' + fileName);
			 }
		 }
		 else{
			const conv = new ffmpeg({ source: filePath  });
			conv
				.setStartTime(stime)
				.setDuration(etime-stime)
				.on("start", function(commandLine) {})
				.on("error", function(err) {
					res.send(err.message);
				})
				.on("end", function(err) {
					if (err) res.send(err.message);
					res.send('user/'+id+'/new' + fileName);

				})
				.saveToFile(newPath +'/' + 'new' + fileName);
		}
	}
  },

  reload: function reload(base,res){
	oauth = Youtube.authenticate({
		type: "oauth"
		, client_id: "668542132317-c9an23v8dkkeotliabjoh16m1k37778n.apps.googleusercontent.com"
		, client_secret: "N8AHEh-84T2F9PD8ze9Ynnrb"
	});
	//oauth[base.query.id].setCredentials({
	//	access_token: base.query.token,
	//	refresh_token :base.query.refresh
	//});

	//if(oauth[base.query.id].credentials != null || oauth[base.query.id].credentials != undefined) res.send("token updated");
	//else res.send("something went wrong during updating token");
	res.send('init')
  },

  remove: function remove(res,id){
	rimraf(path.join(__dirname , 'user',id), function () { console.log("done"); });
  },

  createVideo: function createVideo(req,res){
	  console.log("inizio")
	const fileName = req.body.fname;
	const id = req.body.id;
	const newPath = path.join(__dirname, 'user',id,'upload');
	const filePath = path.join(newPath , fileName+ ".mp3");
	if (!fs.existsSync(newPath)) {
		console.log("crea directory")
		fs.mkdirSync(newPath,{recursive:true,mode:"777"});
	}
	fs.writeFileSync(filePath, req.file.buffer, error => {
		if (error) res.send("err");
		else res.send("end");
	})
	console.log("salvato")
	var img = path.join(__dirname,'nero.jpg');
	var  proc = new ffmpeg({source:filePath})
		.addInputOption('-loop', '1')
		.addInputOption('-i',img)
		.addOptions(['-c:v libx264','-tune stillimage','-c:a aac','-b:a 192k','-pix_fmt yuv420p','-shortest'])
		.setDuration(req.body.etime)
		.on("start", function(commandLine){})
		.on("error", function(err) {
			res.send(err.message);
		})
		.on("end", function(err) {
			if (!err) upload(req.body.title,path.join(newPath,fileName+".mkv"),res,req.body.desc,req.body.token,req.body.refresh);
			else res.send("error on end video")
		})
		.saveToFile(newPath + "/" + fileName+".mkv");
  },
  saveOrigin: async function saveOrigin(audio,res){
	const fileName = audio.body.fname + '.mp3';
	const stime = audio.body.stime;
	const etime = audio.body.etime;
	const mode = audio.body.mode;
	const id = audio.body.id;
	const newPath = path.join(__dirname, 'user',id);
	const filePath = path.join(newPath , fileName.replace("Origin",""));
	if (!fs.existsSync(newPath)) {
		fs.mkdirSync(newPath,{recursive:true,mode:"777"});
	}

	await fs.writeFileSync(filePath, audio.file.buffer, error => {
		if (error) {
		res.send("error");
		}
	})
	if(mode == 0){
		if(fileName.includes('How')) {
				mp3Duration(filePath, function (err, duration) {
					if(duration < 15) res.send('Le clip How devono durare almeno 15 secondi!');
					else{
						const origin = new ffmpeg({source:filePath});
						origin
							.on("start", function(commandLine) {})
							.on("error", function(err) {
								res.send("errorp: " +err.message);
							})
							.on("end", function(err) {
								if (!err) res.send('user/'+id+'/' + fileName);
								else res.send("something went wrong")
							})
							.saveToFile(newPath + "/" + fileName)
					}
				});
		}
		else{
			const origin = new ffmpeg({source:filePath});
			origin
				.on("start", function(commandLine) {})
				.on("error", function(err) {
					res.send("errorp: " +err.message);
				})
				.on("end", function(err) {
					if (!err) res.send('user/'+id+'/' + fileName);
					else res.send("something went wrong")
				})
				.saveToFile(newPath + "/" + fileName)
		}
	}
	else{
		const origin = new ffmpeg({source:filePath});
		origin
			.on("start", function(commandLine) {})
			.on("error", function(err) {
				res.send("errorp: " +err.message);
			})
			.on("end", function(err) {
				if (!err) res.send('user/'+id+'/' + fileName);
				else res.send("something went wrong")
			})
			.saveToFile(newPath + "/" + fileName)
	}
},
  getDuration: async function getDuration(req,res){
	  const name = req.query.name;
	  const id = req.query.id;
	  const path = './user/'+id+'/'+name+'.mp3';
	  mp3Duration(path, function (err, duration) {
					if(duration >= 16) res.send(1);
					else res.send(0);

				});
},
  updateJson: async function updateJson(POIs,res){
	  try{
		if (!fs.existsSync(path.join(__dirname,'POIs.json'))) {
		  var stream = await fs.createWriteStream(path.join(__dirname,'POIs.json'), { mode: 0o777 });
		  stream.write("{}");
		  stream.end();
		  /*await fs.writeFileSync('./POIs.json', '{}', error => {
				if (error) {
				res.send("error");
				}
			})*/
		}
		var myJson = fs.readFileSync(path.join(__dirname,'POIs.json'));
		//fs.readFileSync('./POIs.json', function (err, data){
		//  if (!err){
			var myJson = JSON.parse(myJson);
			for (var place in POIs){
			  var esistente = false;
			  for (var key in myJson){
				if (myJson[key].coords.latitudeCenter === POIs[place].coords.latitudeCenter && myJson[key].coords.longitudeCenter === POIs[place].coords.longitudeCenter){
					myJson[key].videoId = POIs[place].videoId;
					esistente = true;
				}
			  }
			  if(!esistente){
				myJson[Object.keys(myJson).length] = POIs[place];
			  }
			}

			fs.writeFileSync(path.join(__dirname,'POIs.json'), JSON.stringify(myJson),function (err, data){
			  if(err) console.log(err)
		  });
		  res.send(myJson)
		 // } else res.send(err);
		//});
	}
	catch(e){
		res.send(e);
	}
    
  }
//End Modules
}
