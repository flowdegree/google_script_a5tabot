function Start() {
    var props = PropertiesService.getScriptProperties();

    props.setProperties({
        TWITTER_CONSUMER_KEY: "",
        TWITTER_CONSUMER_SECRET: "",
        TWITTER_ACCESS_TOKEN: "",
		TWITTER_ACCESS_SECRET: "",
		MAX_TWITTER_ID: '',
        TWITTER_TARGET_HASHTAG: '#السعودية',
    });

    // Delete exiting triggers, if any

    var triggers = ScriptApp.getProjectTriggers();

    for (var i = 0; i < triggers.length; i++) {
        ScriptApp.deleteTrigger(triggers[i]);
    }

    // Setup a time-based trigger for the Bot to fetch and process incoming Tweets
    // every minute. If your Google Script is running out of quota, change the
    // time to 5 or 10 minutes though the bot won't offer real-time answers then.

    ScriptApp.newTrigger("a5tabot_twitterBot")
        .timeBased()
        .everyMinutes(1)
        .create();

    ScriptApp.newTrigger("favorite_hashtag")
        .timeBased()
        .everyMinutes(1)
        .create();
}

function clearProps(){
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteAllProperties();
}
  

function favorite_hashtag(){
  Logger.log("entering hashtag");
  var props = PropertiesService.getScriptProperties(),
      twit = new Twitter.OAuth(props);
    var phrase = ScriptProperties.getProperty('TWITTER_TARGET_HASHTAG');
    try{
      Logger.log("inside try");
        var twit = new Twitter.OAuth(props);
        if (twit.hasAccess()) {
          Logger.log("has access");
            var tweets = twit.fetchTweets(phrase, function(tweet) {
                // Ignore tweets that are sensitive (NSFW content)
                if (!tweet.possibly_sensitive) {
                    Logger.log("not sensitive");
                  return {id_str: tweet.id_str};
                }
            }, { multi: true, count: 6, });
            
            Logger.log("before length");
            if (tweets.length) {
              Logger.log("inside length");
                // Process the tweets in FIFO order
                for (var i = tweets.length - 1; i >= 0; i--) {
                    Logger.log(twit.favorite(tweets[i]));
                    Logger.log("inside for");
                    // Wait a second to avoid hitting the rate limits
                    Utilities.sleep(1000);
                }
            }
        }
    } 
    catch (f) {
        Logger.log("Error: " + f.toString());
    }
}
  
  
function reverse(s) {
    return s.split("").reverse().join("");
}

function a5tabot_twitterBot() {
    try {
        var props = PropertiesService.getScriptProperties(),
        twit = new Twitter.OAuth(props);

        // Are the Twitter access tokens are valid?
        if (twit.hasAccess()) {
            var tweets = twit.fetchTweets("to:" + "a5tabot", function(tweet) {
                // Ignore tweets that are sensitive (NSFW content)
                if (!tweet.possibly_sensitive) {
                    var question = tweet.text.toLowerCase().replace("@a5tabot","").trim();
                    var answer = reverse(question);
                    if (answer) {
                        return {
                            answer: "@" + tweet.user.screen_name + " " + answer,
                            id_str: tweet.id_str
                        };
                    }
                }
            }, { multi: true, count: 5, since_id: props.getProperty("MAX_TWITTER_ID")});

            if (tweets.length) {
                // The MAX_TWITTER_ID property store the ID of the last tweet answered by the bot
                props.setProperty("MAX_TWITTER_ID", tweets[0].id_str);

                // Process the tweets in FIFO order
                for (var i = tweets.length - 1; i >= 0; i--) {
                    // The bot replies with an answer
                    twit.sendTweet(tweets[i].answer, {
                    in_reply_to_status_id: tweets[i].id_str
                    });

                    // Wait a second to avoid hitting the rate limits
                    Utilities.sleep(1000);
                }
            }
        }
    } 
    catch (f) {
        // You can also use MailApp to get email notifications of errors.
        Logger.log("Error: " + f.toString());
    }
}