var config = require('../../config/environment');
var ZiggeoSdk = require('ziggeo');
ZiggeoSdk.init(config.ziggeo.token, config.ziggeo.private_key, config.ziggeo.encryption_key); 

exports.getStudioVideos = function(req, res, next){
	var studioId = req.body.studioId;
	console.log(studioId)
	if (!studioId) return res.status(400)

	ZiggeoSdk.Videos.index({
		tags: studioId
	}, function(data){
		console.log(data)
		res.status(200).json(data)
	}, function(err){
		console.log(err)
		res.status(400)
	}) 
}