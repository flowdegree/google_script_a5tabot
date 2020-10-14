//This is the main function that will define global variables and reset Google triggers that will run the other functions
function start() {
	// REPLACE THESE DUMMY VALUES
	var TWITTER_CONSUMER_KEY = "";
	var TWITTER_CONSUMER_SECRET = "";
	var TWITTER_HANDLE = "A5taBot";
	var TWITTER_TARGET_HANDLE = "Nejer";
	var TWITTER_TARGET_HASHTAG = "#أقطع_علاقتي_فيك_إذ";

	// Be Careful changing anything below this line
	ScriptProperties.setProperty("TWITTER_CONSUMER_KEY", TWITTER_CONSUMER_KEY);
	ScriptProperties.setProperty("TWITTER_CONSUMER_SECRET", TWITTER_CONSUMER_SECRET);
	ScriptProperties.setProperty("TWITTER_HANDLE", TWITTER_HANDLE);
	ScriptProperties.setProperty("TWITTER_TARGET_HANDLE", TWITTER_TARGET_HANDLE);
	ScriptProperties.setProperty("TWITTER_TARGET_HASHTAG", TWITTER_TARGET_HASHTAG);
	ScriptProperties.setProperty("MAX_TWITTER_ID", 0);

	// Delete exiting triggers, if any
	reset_triggers();

	//Add a trigger
	ScriptApp.newTrigger("follow_followers_back").timeBased().everyMinutes(1).create();
	//ScriptApp.newTrigger("follow").timeBased().everyHours(6).create();
	ScriptApp.newTrigger("fetchTweets").timeBased().everyMinutes(1).create();
	ScriptApp.newTrigger("favorite").timeBased().everyMinutes(1).create();
}

// General Requests
//Function to do requests
function do_request(url, method) {
	var options = {
		method: method,
		oAuthServiceName: "twitter",
		oAuthUseToken: "always",
	};

	Logger.log("Trying: " + url);

	try {
		var result = UrlFetchApp.fetch(url, options);
		if (result.getResponseCode() === 200) {
			Logger.log("Result 200");
			var data = Utilities.jsonParse(result.getContentText());
			return data;
		} else {
			Logger.log("Result failed");
			return false;
		}
	} catch (e) {
		Logger.log(e.toString());
		return false;
	}
}

//Random function that prepares a response
function prepare_answer(s) {
	Logger.log(s.match(/^.*\s+(\w)\w+$/)[1]);
	Logger.log(s.match(/([اأإآبتثجحخدذرزسشصضطظعغفقكلمنهويءئوةـىًٌٍَُِّ])[اأإآبتثجحخدذرزسشصضطظعغفقكلمنهويءئوةـىًٌٍَُِّ]*$/)[1]);
	s = s.match(/^.*\s+(\w)\w+$/)[1];
	return s + ", هاااااا؟ ;)";
}

//Random function that reverses a string
function reverse(s) {
	return s.split("").reverse().join("");
}

function logCallbackUrl() {
	var service = getService();
	Logger.log(service.getCallbackUrl());
}

//To authenticate requests
function oAuth() {
	var service = getTwitterService();
	if (service.hasAccess()) {
		var url = "https://api.twitter.com/1.1/statuses/user_timeline.json";
		var response = service.fetch(url);
		var tweets = JSON.parse(response.getContentText());
		for (var i = 0; i < tweets.length; i++) {
			Logger.log(tweets[i].text);
		}
	} else {
		var authorizationUrl = service.authorize();
		Logger.log("Please visit the following URL and then re-run the script: " + authorizationUrl);
	}
}

function getTwitterService() {
	var service = OAuth1.createService("twitter");
	service.setAccessTokenUrl("https://api.twitter.com/oauth/access_token");
	service.setRequestTokenUrl("https://api.twitter.com/oauth/request_token");
	service.setAuthorizationUrl("https://api.twitter.com/oauth/authorize");
	service.setConsumerKey(ScriptProperties.getProperty("TWITTER_CONSUMER_KEY"));
	service.setConsumerSecret(ScriptProperties.getProperty("TWITTER_CONSUMER_SECRET"));
	//service.setProjectKey('MMD0FSSwyfXaEQRaWjRY_S7Uc_Q5CG5v6');
	service.setCallbackFunction("authCallback");
	service.setPropertyStore(PropertiesService.getScriptProperties());
	return service;
}

function authCallback(request) {
	var service = getTwitterService();
	var isAuthorized = service.handleCallback(request);
	if (isAuthorized) {
		return HtmlService.createHtmlOutput("Success! You can close this page.");
	} else {
		return HtmlService.createHtmlOutput("Denied. You can close this page");
	}
}

//Helper function to encode strings
function encodeString(q) {
	var str = encodeURIComponent(q);
	str = str.replace(/!/g, "%21");
	str = str.replace(/\*/g, "%2A");
	str = str.replace(/\(/g, "%28");
	str = str.replace(/\)/g, "%29");
	str = str.replace(/'/g, "%27");
	return str;
}

//Helper function to find differences between two arrays' items
function array_diff(arr1) {
	var retArr = {},
		argl = arguments.length,
		k1 = "",
		i = 1,
		k = "",
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
function reset_triggers() {
	var triggers = ScriptApp.getScriptTriggers();
	for (var i = 0; i < triggers.length; i++) {
		ScriptApp.deleteTrigger(triggers[i]);
	}
}


// Twitter Requests
//Get tweets from timeline and auto respond
function fetchTweets() {
	oAuth();
	var twitter_handle = ScriptProperties.getProperty("TWITTER_HANDLE");
	var phrase = "to:" + twitter_handle; // English languate tweets sent to @labnol
	var search = "https://api.twitter.com/1.1/search/tweets.json?count=5&include_entities=false&result_type=recent&q=";
	search = search + encodeString(phrase) + "&since_id=" + ScriptProperties.getProperty("MAX_TWITTER_ID");

	var data = do_request(search, "get");
	if (data) {
		var tweets = data.statuses;
		for (var i = tweets.length - 1; i >= 0; i--) {
			var question = tweets[i].text.replace(new RegExp("@" + twitter_handle, "ig"), "");
			question = question.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
			Logger.log("Question: " + question);
			var answer = reverse(question);
			sendReply(tweets[i].user.screen_name, tweets[i].id_str, answer);
		}
	}
}

//Get Followings of a user
function get_followings(screen_name) {
	var data = do_request(
		"https://api.twitter.com/1.1/friends/ids.json?screen_name=" + screen_name, "get");
	var followings;
	if (data) {
		followings = data.ids;
		return followings;
	} else {
		return false;
	}
	Logger.log("Finished getting followings");
}

//Get Followers of a user
function get_followers(screen_name) {
	var data = do_request("https://api.twitter.com/1.1/followers/ids.json?screen_name=" + screen_name, "get");
	var followers;
	if (data) {
		followers = data.ids;
		return followers;
	} else {
		return false;
	}
	Logger.log("Finished getting target followers");
}

function unfollow_inactive_followings() {
	//Check people you follow
	//Get following
	var my_id = ScriptProperties.getProperty("TWITTER_HANDLE");
	var my_followings = get_followings(my_id);
	Logger.log("Finished getting followings");
}

//Automatically, read a hashtag and favorite tweets
function favorite() {
	oAuth();
	// 1- Initiate #hashtag search request
	var phrase = ScriptProperties.getProperty("TWITTER_TARGET_HASHTAG");
	var search = "https://api.twitter.com/1.1/search/tweets.json?count=1&include_entities=false&result_type=recent&q=";
	search = search + encodeString(phrase) + "&since_id=" + ScriptProperties.getProperty("MAX_TWITTER_ID");

	var data = do_request(search, "get");

	if (data) {
		var tweets = data.statuses;
		for (var i = tweets.length - 1; i >= 0; i--) {
			// 2- Inititate favorite request
			var fav_data = do_request("https://api.twitter.com/1.1/favorites/create.json?id=" + tweets[i].id_str, "POST");
		}
	}
}

//Check for new followers and follow them back
function follow_followers_back() {
	oAuth();
	//Get followers
	var twitter_handle = ScriptProperties.getProperty("TWITTER_HANDLE");
	var handler_followers = get_followers(twitter_handle);

	//Get following
	var my_id = ScriptProperties.getProperty("TWITTER_HANDLE");
	var my_followings = get_followings(my_id);

	if (handler_followers == false || my_followings == false) {
		return;
	}

	//Filter the subject followers list deleting the people i already follow
	var unique_followers = array_diff(handler_followers, my_followings);
	Logger.log("Finished uniquifying");

	//Do the follow within limit
	follow_users(unique_followers, 10);
}

//Target a specific user's followers and follow them gradually
function follow() {
	oAuth();
	//Get other user followers
	var twitter_handle = ScriptProperties.getProperty("TWITTER_TARGET_HANDLE");
	var handler_followers = get_followers(twitter_handle);

	//Get People I'm following
	var my_id = ScriptProperties.getProperty("TWITTER_HANDLE");
	var my_followers = get_followings(my_id);

	//Filter the subject followers list deleting the people i already follow
	var unique_followers = array_diff(handler_followers, my_followers);
	Logger.log("Finished uniquifying");

	//Do the follow within limit
	follow_users(unique_followers, 3);
}

//A list of twitter ID's is to be passed and a limit, the limit number of that array will be followed
function follow_users(array, limit) {
	var count = 0;

	for (var i in array) {
		if (count >= limit - 1) {
			break;
		}
		count++;
		var data = do_request("https://api.twitter.com/1.1/friendships/create.json?user_id=" + array[i].toString(), "POST");
	}
	Logger.log("Finished following");
}

//Send a reply to a tweet
function sendReply(user, reply_id, tweet) {
	var status = "https://api.twitter.com/1.1/statuses/update.json?status=" + encodeString("@" + user + " " + tweet) + "&in_reply_to_status_id=" + reply_id;
	var data = do_request(status, "POST");
	if (data) {
		ScriptProperties.setProperty("MAX_TWITTER_ID", reply_id);
		Logger.log(result.getContentText());
	}
}