function start() {
	// REPLACE THESE DUMMY VALUES
	var TWITTER_CONSUMER_KEY = "";
	var TWITTER_CONSUMER_SECRET = "";
	var TWITTER_HANDLE = "BuFai7an";
	
	// DO NOT CHANGE ANYTHING BELOW THIS LINE
	ScriptProperties.setProperty("TWITTER_CONSUMER_KEY", TWITTER_CONSUMER_KEY);
	ScriptProperties.setProperty("TWITTER_CONSUMER_SECRET", TWITTER_CONSUMER_SECRET);
	ScriptProperties.setProperty("TWITTER_HANDLE", TWITTER_HANDLE);
	ScriptProperties.setProperty("MAX_TWITTER_ID", 0);
	
	// Delete exiting triggers, if any
	var triggers = ScriptApp.getScriptTriggers();
	for(var i=0; i < triggers.length; i++) {
		ScriptApp.deleteTrigger(triggers[i]);
	}
	
	//Add a trigger
	ScriptApp.newTrigger("fetchTweets").timeBased().everyMinutes(1).create();
	ScriptApp.newTrigger("follow").timeBased().everyHours(1).create();
}

function follow_followers_back()
{
	oAuth();
	//Get other user followers
	var twitter_handle = "Bufai7an";
	var handler_followers = get_followers(twitter_handle);
	
	//Get People I'm following
	var my_id = ScriptProperties.getProperty("TWITTER_HANDLE");
	var my_followings = get_followings(my_id);
	
	//Filter the subject followers list deleting the people i already follow
	var unique_followers = array_diff(handler_followers,my_followings);
	Logger.log("Finished uniquifying");
	
	//Do the follow within limit
	follow_users(unique_followers,500)
}

function follow()
{
	oAuth();

	//Get other user followers
	var twitter_handle = "Nejer";
	var handler_followers = get_followers(twitter_handle);
	
	//Get People I'm following
	var my_id = ScriptProperties.getProperty("TWITTER_HANDLE");
	var my_followers = get_followings(my_id);

	//Filter the subject followers list deleting the people i already follow
	var unique_followers = array_diff(handler_followers,my_followers);
	Logger.log("Finished uniquifying");
	
	//Do the follow within limit
	follow_users(unique_followers,20)
}

//Follow a list
function follow_users(array,limit)
{
	var count = 0;
	for(var i in array)
	{
		Logger.log("========================================Cycle " + count);
		
		if (count == limit-1){
			return;
		}
		count++;
		
		var follow_url = "https://api.twitter.com/1.1/friendships/create.json";
		follow_url = follow_url + "?user_id="+array[i]+"&follow=true";
		
		var options ={
			"method": "post",
			"oAuthServiceName":"twitter",
			"oAuthUseToken":"always"
		};
		try {
			var follow_result = UrlFetchApp.fetch(follow_url, options);
		} 
		catch (e) {
			Logger.log(e.toString());
		}
		
	}
	Logger.log("Finished following");
	return follow_result;
}

//Get Followings of a user
function get_followings(screen_name)
{
	var followers_url = "https://api.twitter.com/1.1/friends/ids.json?cursor=-1&screen_name="+screen_name;
	var followers;
	var options =
	{
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
	catch (e) {	Logger.log(e.toString());}
	Logger.log("Finished getting my followings");
	return followers;
}


//Get Followers of a user
function get_followers(screen_name)
{
	var followers_url = "https://api.twitter.com/1.1/followers/ids.json?cursor=-1&screen_name="+screen_name;
	var followers;
	var options =
	{
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
	catch (e) {	Logger.log(e.toString());}
	Logger.log("Finished getting target followers");
	
	return followers;
}


//Get tweets from timeline
function fetchTweets() {
	oAuth();
	var twitter_handle = ScriptProperties.getProperty("TWITTER_HANDLE");
	var phrase = "to:" + twitter_handle; // English languate tweets sent to @labnol
	var search = "https://api.twitter.com/1.1/search/tweets.json?count=5&include_entities=false&result_type=recent&q="; 
	search = search + encodeString(phrase) + "&since_id=" + ScriptProperties.getProperty("MAX_TWITTER_ID"); 
	var options =
	{
		"method": "get",
		"oAuthServiceName":"twitter",
		"oAuthUseToken":"always"
	};
   
	try {
		var result = UrlFetchApp.fetch(search, options); 
		if (result.getResponseCode() === 200) 
		{
          Logger.log("result 200");
			var data = Utilities.jsonParse(result.getContentText());
			if (data) {
				var tweets = data.statuses;
				for (var i=tweets.length-1; i>=0; i--) {
					var question = tweets[i].text.replace(new RegExp("\@" + twitter_handle, "ig"), "");
					var answer = reverse(question);
					sendReply(tweets[i].user.screen_name, tweets[i].id_str, answer);
				}
			}
		}
	} 
	catch (e) 
	{
		Logger.log(e.toString());
	}
}



function reverse(s){
	return s.split("").reverse().join("");
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

function sendReply(user, reply_id, tweet) {
	var options =
	{
		"method": "POST",
		"oAuthServiceName":"twitter",
		"oAuthUseToken":"always" 
	};
	var status = "https://api.twitter.com/1.1/statuses/update.json";
	status = status + "?status=" + encodeString("@" + user + " " + tweet);
	status = status + "&in_reply_to_status_id=" + reply_id; 
	try {
		var result = UrlFetchApp.fetch(status, options);
		ScriptProperties.setProperty("MAX_TWITTER_ID", reply_id);
		Logger.log(result.getContentText()); 
	} 
	catch (e) {
		Logger.log(e.toString());
	}
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