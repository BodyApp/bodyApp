var config = require('../../config/environment');
// var ZiggeoSdk = require('ziggeo');
var AWS = require('aws-sdk');
// var videoLibrary = new AWS.S3({params: {Bucket: 'videolibraries'}});
// ZiggeoSdk.init(config.ziggeo.token, config.ziggeo.private_key, config.ziggeo.encryption_key); 

exports.getStudioVideos = function(req, res, next){
	// var studioId = req.body.studioId;
	// console.log(studioId)
	// if (!studioId) return res.status(400)

	// 	var s3 = new AWS.S3();
		
	// 	s3.listObjects({Bucket: 'videolibraries', Prefix: studioId}, function(err, data) {
	// 		if (err) console.log(err)
	// 		else {
	// 			for (var i = 0; i < data.Contents.length; i++) {
	// 				s3.getSignedUrl('getObject', {Bucket: "videolibraries", Key: data.Contents[i].Key}, function(err, url) {
	// 					console.log("The URL is", url)
	// 				})
	// 			}
	// 		}
	// 	})

		

		// s3.listBuckets(function(err, data) {
		//   if (err) { console.log("Error:", err); }
		//   else {
		//     for (var index in data.Buckets) {
		//       var bucket = data.Buckets[index];
		//       console.log("Bucket: ", bucket.Name, ' : ', bucket.CreationDate);
		//     }
		//   }
		// });

	// ZiggeoSdk.Videos.index({
	// 	tags: studioId
	// }, function(data){
	// 	res.status(200).json(data)
	// }, function(err){
	// 	console.log(err)
	// 	res.status(400)
	// }) 
}

exports.deleteStudioVideo = function(req, res, next){
	var studioId = req.body.studioId;
	var videoToken = req.body.videoToken
	
	if (!studioId || !videoToken) return res.status(400)

	// ZiggeoSdk.Videos.destroy(videoToken, function(data){
	// 	console.log("Successfully deleted video")
	// 	res.status(200).send("Successfully deleted video")
	// }, function(err){
	// 	console.log(err)
	// 	res.status(400)
	// }) 
}