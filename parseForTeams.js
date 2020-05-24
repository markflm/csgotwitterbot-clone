const teamExists = require('./teamExists');

function parseForTeams(tweet) {
    let newTweet = tweet.substring(14, tweet.length);
    const action = newTweet.charAt(0);
    newTweet = newTweet.substring(1, newTweet.length);
    let teamsArray = newTweet.split(',');
    for (let x = 0; x < teamsArray.length; x++) {
        teamsArray[x].split('+');
    }
    for (let x = 0; x < teamsArray.length; x++) {
        teamsArray[x].split('-');
    }
    for (let x = 0; x < teamsArray.length; x++) {
        teamsArray[x] = teamsArray[x].trim();
    }
    console.log(teamsArray);
    console.log(action);

    if (action === '+') {
        let teamsToAdd = [];
        let invalidTeams = [];
        for (let y = 0; y < teamsArray.length; y++) {
            if (teamExists(teamsArray[y]) === true) {
                teamsToAdd.push(teamsArray[y]);
            }
            else {
                invalidTeams.push(teamsArray[y]);
            }
        }
        console.log(`Add ${teamsToAdd}`);
        console.log(`Invalid ${invalidTeams}`);
    } 
    else if 
        (action === '-') {
            let teamsToRemove = [];
            let invalidTeams = [];
            for (let y = 0; y < teamsArray.length; y++) {
                if (teamExists(teamsArray[y]) === true) {
                    teamsToRemove.push(teamsArray[y]);
                }
                else {
                    invalidTeams.push(teamsArray[y]);
                }
            }
            console.log(`Remove ${teamsToRemove}`);
            console.log(`Invalid ${invalidTeams}`);
        }
        else {
            console.log('invalid syntax');
        }
    }