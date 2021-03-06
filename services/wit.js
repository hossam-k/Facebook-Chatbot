'use strict'

var Config = require('../config')
var FB = require('../connectors/facebook')
var Wit = require('node-wit').Wit
var request = require('request')

var firstEntityValue = function (entities, entity) {
	var val = entities && entities[entity] &&
		Array.isArray(entities[entity]) &&
		entities[entity].length > 0 &&
		entities[entity][0].value

	if (!val) {
		return null
	}
	return typeof val === 'object' ? val.value : val
}

var actions = {
	say (sessionId, context, message, cb) {
		console.log("Message is :",message)
		// Bot testing mode, run cb() and return
		if (require.main === module) {
			cb()
			return
		}

		console.log('WIT WANTS TO TALK TO:', context._fbid_)
		console.log('WIT HAS SOMETHING TO SAY:', message)
		console.log('WIT HAS A CONTEXT:', context)

		if (checkURL(message)==1) {
			FB.newMessage(context._fbid_, message, false,true)
		} else if(checkURL(message)==2) {
            FB.newMessage(context._fbid_, message, true,false)
		}
        else {
            FB.newMessage(context._fbid_, message)
        }

		cb()

	},

	merge(sessionId, context, entities, message, cb) {
		//Reset the weather story
		delete context.forecast
		delete context.location
    //Reset NASA picture story
    delete context.pic

		// Retrive the location entity and store it in the context field
		var location = firstEntityValue(entities, 'location')
		if (location) {
			context.location = location
		}

		//Retrive the dateTime entity and store it in the context field
		var dateTime =firstEntityValue(entities,'datetime')
		if(dateTime){
			context.datetime=dateTime
		}

		// Retrieve the sentiment
		var sentiment = firstEntityValue(entities, 'sentiment')
		if (sentiment) {
			context.ack = sentiment === 'positive' ? 'Glad your liked it!' : 'Aww, that sucks.'
		} else {
			delete context.ack
		}

		cb(context)
	},

	error(sessionId, context, error) {
		console.log(error.message)
	},

	// list of functions Wit.ai can execute
	['fetch-weather'](sessionId, context, cb) {
		console.log("inside fetch-weather function")
		// Here we can place an API call to a weather service
		 if (context.location) {
		 	getWeather(context.location)
		 		.then(function (forecast) {
		 			context.forecast = forecast || 'something wrong'
					console.log("forecast",forecast)
					cb(context)
		 		})
		 		.catch(function (err) {
		 			console.log("error",err)
		 		})
		 }else{
			 cb(context)
		 }
	 },

    //wit function to call the geoDecoder function (getCoordinates)
	['convertAddress'](sessionId, context, cb) {
			if (context.location) {
				var arr=[]
			 	getCoordinates(context.location)
				 	.then(function (arr) {
					 	context.longitute = arr[0] || 'something wrong'
						context.latitute= arr[1] || 'something wrong'
					 	cb(context)
				 		})
				 	.catch(function (err) {
					 	console.log("error",err)
				 		})
			 }else{
				cb(context)
			}
	 },

	// ['fetch-pic'](sessionId, context, cb) {
	// 	var wantedPics = allPics[context.cat || 'default']
	// 	context.pics = wantedPics[Math.floor(Math.random() * wantedPics.length)]
	//
	// 	cb(context)
	// },

	['fetch-pic'](sessionId, context, cb) {
		if (context.longitute && context.latitute) {
		 getPic(context.longitute,context.latitute)
			 .then(function (pic) {
				 context.pic = pic || 'something wrong'
				 console.log("pics =",pic)
                 console.log(context.pic)
                 //after getting the pic --> resetting the story
                 delete context.location
                 delete context.datetime
                 delete context.longitute
                 delete context.latitute
				 cb(context)
			 })
			 .catch(function (err) {
				 console.log("error",err)
			 })
		}else{
			cb(context)
		}
		//cb(context)
	},
    ['reset'](sessionId, context, cb) {
        console.log("inside reset function")
        delete context.location
        delete context.longitute
        delete context.latitute
        delete context.pic
				delete context.forecast
        cb(context)
     },

}

// SETUP THE WIT.AI SERVICE
var getWit = function () {
	console.log('GRABBING WIT')
	return new Wit(Config.WIT_TOKEN, actions)
}

module.exports = {
	getWit: getWit,
}

// BOT TESTING MODE
if (require.main === module) {
	console.log('Bot testing mode!')
	var client = getWit()
	client.interactive()
}

// GET WEATHER FROM API
var getWeather = function (location) {
	return new Promise(function (resolve, reject) {
		var url = 'http://api.openweathermap.org/data/2.5/weather?q='+location+'&units=metric'+'&APPID=2f530188787a5f9c279e060b23035fb5'
		request(url, function (error, response, body) {
		    if (!error && response.statusCode == 200) {
		    	var jsonData = JSON.parse(body)
		    	var forecast = jsonData.weather[0].description
		      console.log('WEATHER API SAYS....', jsonData.weather[0].description)
		      resolve(forecast)
		    }
				else {
					reject("failed to get weather")
				}
			})
	})
}

//Resolve location to GEO location with longitute and latitute from Google API
var getCoordinates=function(location){
	return new Promise (function (resolve,reject) {
		var url='https://maps.googleapis.com/maps/api/geocode/json?address='+location+'&key=AIzaSyCmnDJHwIEzVrOpeVs-R76-WfXMKGRDtZE'
		request(url,function(error,response,body) {
			if(!error && response.statusCode==200) {
				var jsonData=JSON.parse(body)
				var longitute=jsonData.results[0].geometry.location.lng
				var latitute=jsonData.results[0].geometry.location.lat
				var arr=[longitute,latitute]
				resolve(arr)
			}
				else {
					reject("can't resolve address to geolocations")
				}
		})
	})
}
//GET IMAGE FROM NASA API
var getPic=function (longitute,latitute){
	return new Promise(function(resolve, reject) {
    console.log("longitute and latitute :",longitute+',',latitute)
		var url='https://api.nasa.gov/planetary/earth/imagery?lon='+longitute+'&lat='+latitute+'&date=2016-02-01&cloud_score=false&api_key=0qJwZLHcZGb42Udsrcn6hj7akL7y4jjRO7bJRGg1'
		request (url,function(error,response,body) {
			if(!error && response.statusCode==200) {
				var jsonData=JSON.parse(body)
				var imageURL=jsonData.url
				var imageDate=jsonData.date
				console.log("image Date : ",imageDate)
				resolve(imageURL)
			}
			else{
				reject("failed to get Pics")
			}
		})
	})
}

// CHECK IF URL IS AN IMAGE FILE
var checkURL = function (url) {
    //check if message is a welcome MESSAGE
    if(url.match("hi :D i am espace Chatbot , iam still young dont ask me hard questions. pick one of the replies to get going")){
        return 1
    //check if message is a returned pic From Nasa API
    }else if (url.match("https://earthengine.googleapis.com/")!= null){
        return 2
    }
    //check if message is a text MESSAGE
    else {
        return 3
    }
}
