//This is the main function that will define global variables and reset Google triggers that will run the other functions
function start() {
	// REPLACE THESE DUMMY VALUES
	var TWITTER_CONSUMER_KEY = "";
	var TWITTER_CONSUMER_SECRET = "";
	var TWITTER_HANDLE = "a5tabot";
	var TWITTER_TARGET_HANDLE = "BuFai7an";
	var TWITTER_TARGET_HASHTAG = "#خرب_هاشتاقهم";
	var i = 0;
	
	// Be Careful changing anything below this line
	ScriptProperties.setProperty("TWITTER_CONSUMER_KEY", TWITTER_CONSUMER_KEY);
	ScriptProperties.setProperty("TWITTER_CONSUMER_SECRET", TWITTER_CONSUMER_SECRET);
	ScriptProperties.setProperty("TWITTER_HANDLE", TWITTER_HANDLE);
	ScriptProperties.setProperty("TWITTER_TARGET_HANDLE", TWITTER_TARGET_HANDLE);
	ScriptProperties.setProperty("TWITTER_TARGET_HASHTAG", TWITTER_TARGET_HASHTAG);
	ScriptProperties.setProperty("MAX_TWITTER_ID", 0);
	
	// Delete exiting triggers, if any
	var triggers = ScriptApp.getScriptTriggers();
	for (i; i < triggers.length; i++) {
		ScriptApp.deleteTrigger(triggers[i]);
	}
	
	//Add a trigger
	ScriptApp.newTrigger("follow_followers_back").timeBased().everyMinutes(1).create();
	ScriptApp.newTrigger("follow").timeBased().everyHours(6).create();
	ScriptApp.newTrigger("fetchTweets").timeBased().everyMinutes(1).create();
	ScriptApp.newTrigger("favorite").timeBased().everyMinutes(1).create();
}

//Automatically, read a hashtag and favorite tweets
function favorite() {
	oAuth();
	
	// 1- Initiate #hashtag search request
	var options = {
		"method": "get",
		"oAuthServiceName":"twitter",
		"oAuthUseToken":"always"
	};
	var phrase = ScriptProperties.getProperty("TWITTER_TARGET_HASHTAG");
	var search = "https://api.twitter.com/1.1/search/tweets.json?count=1&include_entities=false&result_type=recent&q="; 
	search = search + encodeString(phrase) + "&since_id=" + ScriptProperties.getProperty("MAX_TWITTER_ID");
	Logger.log(search);	
	
	try {
		var result = UrlFetchApp.fetch(search, options); 
		if (result.getResponseCode() === 200) {
			Logger.log("search result 200");
			var data = Utilities.jsonParse(result.getContentText());
			if (data) {
				var tweets = data.statuses;
				for (var i=tweets.length-1; i>=0; i--) {
					
					// 2- Inititate favorite request
					var favorite_url = "https://api.twitter.com/1.1/favorites/create.json?id="+tweets[i].id_str;
					Logger.log(favorite_url);
					var options = {
						"method": "post",
						"oAuthServiceName":"twitter",
						"oAuthUseToken":"always"
					}
					try {
						var fav_result = UrlFetchApp.fetch(favorite_url, options); 
						if (fav_result.getResponseCode() === 200) {
							Logger.log("favorute result 200");
						}
					} 
					catch (e) {	Logger.log(e.toString()); return false;}
						
				};
			}
		}
	} 
	catch (e) { Logger.log(e.toString());}
}

//Check for new followers and follow them back
function follow_followers_back() {
	oAuth();
	//Get followers
	var twitter_handle = ScriptProperties.getProperty("TWITTER_HANDLE");
	var handler_followers = get_followers(twitter_handle);
	Logger.log("Finished getting target followers");
	
	//Get following
	var my_id = ScriptProperties.getProperty("TWITTER_HANDLE");
	var my_followings = get_followings(my_id);
	Logger.log("Finished getting followings");
	
	if(handler_followers == false || my_followings == false){
		return;
	}
	//Filter the subject followers list deleting the people i already follow
	var unique_followers = array_diff(handler_followers,my_followings);
	Logger.log("Finished uniquifying");
	
	//Do the follow within limit
	follow_users(unique_followers,10)
}

//Target a specific user's followers and follow them gradually
function follow() {
  oAuth();
	//Get other user followers
	var twitter_handle = ScriptProperties.getProperty("TWITTER_TARGET_HANDLE");
	var handler_followers = get_followers(twitter_handle);
	Logger.log("Finished getting target followers");
	
	//Get People I'm following
	var my_id = ScriptProperties.getProperty("TWITTER_HANDLE");
	var my_followers = get_followings(my_id);
	Logger.log("Finished getting followings");
	
	//Filter the subject followers list deleting the people i already follow
	var unique_followers = array_diff(handler_followers,my_followers);
	Logger.log("Finished uniquifying");
	
	//Do the follow within limit
	follow_users(unique_followers,3)
}

//A list of twitter ID's is to be passed and a limit, the limit number of that array will be followed
function follow_users(array,limit) {
	var count = 0;
	for(var i in array){
		
      if (count >= limit-1){
			break;
		}
		count++;
		
		var follow_url = "https://api.twitter.com/1.1/friendships/create.json?user_id="+array[i].toString();
      
		var options ={
			"method": "post",
			"oAuthServiceName":"twitter",
			"oAuthUseToken":"always"
		};
		try {
			var follow_result = UrlFetchApp.fetch(follow_url, options);
		} 
		catch (e) {	Logger.log(e.toString());}
	}
	Logger.log("Finished following");
	//return follow_result;
}

//Get Followings of a user
function get_followings(screen_name) {
	var followers_url = "https://api.twitter.com/1.1/friends/ids.json?screen_name="+screen_name;
	var followers;
	var options = {
		"method": "get",
		"oAuthServiceName":"twitter",
		"oAuthUseToken":"always"
	};
	//Execute
	try {
		var result = UrlFetchApp.fetch(followers_url, options); 
		if (result.getResponseCode() === 200) {
			Logger.log("result 200");
			var data = Utilities.jsonParse(result.getContentText());
			if (data) {
				followers = data.ids;
			}
		}
	} 
	catch (e) {	Logger.log(e.toString()); return false;}
	
	return followers;
}

//Get Followers of a user
function get_followers(screen_name) {
	var followers_url = "https://api.twitter.com/1.1/followers/ids.json?screen_name="+screen_name;
	var followers;
	var options = {
		"method": "get",
		"oAuthServiceName":"twitter",
		"oAuthUseToken":"always"
	};
	//Execute
	try {
		var result = UrlFetchApp.fetch(followers_url, options); 
		if (result.getResponseCode() === 200) {
			Logger.log("result 200");
			var data = Utilities.jsonParse(result.getContentText());
			if (data) {
				followers = data.ids;
			}
		}
	} 
	catch (e) {	Logger.log(e.toString());return false;}
	
	return followers;
}

//Get tweets from timeline and auto respond
function fetchTweets() {
	oAuth();
	var twitter_handle = ScriptProperties.getProperty("TWITTER_HANDLE");
	var phrase = "to:" + twitter_handle; // English languate tweets sent to @labnol
	var search = "https://api.twitter.com/1.1/search/tweets.json?count=5&include_entities=false&result_type=recent&q="; 
	search = search + encodeString(phrase) + "&since_id=" + ScriptProperties.getProperty("MAX_TWITTER_ID"); 
	var options = {
		"method": "get",
		"oAuthServiceName":"twitter",
		"oAuthUseToken":"always"
	};
   
	try {
		var result = UrlFetchApp.fetch(search, options); 
		if (result.getResponseCode() === 200) {
          Logger.log("result 200");
			var data = Utilities.jsonParse(result.getContentText());
			if (data) {
				var tweets = data.statuses;
				for (var i=tweets.length-1; i>=0; i--) {
					var question = tweets[i].text.replace(new RegExp("\@" + twitter_handle, "ig"), "");
                  question = question.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ")
                  Logger.log("Question: "+question);
					var answer = reverse(question);
					sendReply(tweets[i].user.screen_name, tweets[i].id_str, answer);
				}
			}
		}
	} 
	catch (e) { Logger.log(e.toString());}
}

//Random function that prepares a response
function prepare_answer(s) {
	//    /(\w)\w*$/
	
	Logger.log(s.match(/^.*\s+(\w)\w+$/)[1]);
  Logger.log(s.match(/([اأإآبتثجحخدذرزسشصضطظعغفقكلمنهويءئوةـىًٌٍَُِّ])[اأإآبتثجحخدذرزسشصضطظعغفقكلمنهويءئوةـىًٌٍَُِّ]*$/)[1]);
	s = s.match(/^.*\s+(\w)\w+$/)[1];
	return s + ", هاااااا؟ ;)";
}

//Random function that reverses a string
function reverse(s){
	return s.split("").reverse().join("");
}

//Send a reply to a tweet
function sendReply(user, reply_id, tweet) {
	var options = {
		"method": "POST",
		"oAuthServiceName":"twitter",
		"oAuthUseToken":"always" 
	};
	var status = "https://api.twitter.com/1.1/statuses/update.json?status=" + encodeString("@" + user + " " + tweet)+ "&in_reply_to_status_id=" + reply_id; 
	try {
		var result = UrlFetchApp.fetch(status, options);
		ScriptProperties.setProperty("MAX_TWITTER_ID", reply_id);
		Logger.log(result.getContentText()); 
	} 
	catch (e) {
		Logger.log(e.toString());
	}
}

//To authenticate requests
function oAuth() {
	var oauthConfig = UrlFetchApp.addOAuthService("twitter");
	oauthConfig.setAccessTokenUrl("https://api.twitter.com/oauth/access_token");
	oauthConfig.setRequestTokenUrl("https://api.twitter.com/oauth/request_token");
	oauthConfig.setAuthorizationUrl("https://api.twitter.com/oauth/authorize");
	oauthConfig.setConsumerKey(ScriptProperties.getProperty("TWITTER_CONSUMER_KEY"));
	oauthConfig.setConsumerSecret(ScriptProperties.getProperty("TWITTER_CONSUMER_SECRET"));
}

//Helper function to encode strings
function encodeString (q) {
	var str = encodeURIComponent(q);
	str = str.replace(/!/g,'%21');
	str = str.replace(/\*/g,'%2A');
	str = str.replace(/\(/g,'%28');
	str = str.replace(/\)/g,'%29');
	str = str.replace(/'/g,'%27');
	return str;
}

//Helper function to find differences between two arrays' items
function array_diff (arr1) {
	var retArr = {},
	argl = arguments.length,
	k1 = '',
	i = 1,
	k = '',
	arr = {};
	
	arr1keys: for (k1 in arr1) {
		for (i = 1; i < argl; i++) {
			arr = arguments[i];
			for (k in arr) {
				if (arr[k] === arr1[k1]) {
					// If it reaches here, it was found in at least one array, so try next value
					continue arr1keys;
				}
			}
			retArr[k1] = arr1[k1];
		}
	}
	return retArr;
}

//To Stop and disable all triggers
function stop(){
  var triggers = ScriptApp.getScriptTriggers();
	for(var i=0; i < triggers.length; i++) {
		ScriptApp.deleteTrigger(triggers[i]);
	}
}