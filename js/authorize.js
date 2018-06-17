(function() {
    var authorizeButton = document.getElementById('authorize-button');
    var signoutButton = document.getElementById('signout-button');
    
    /** On load, called to load the auth2 library and API client library **/
    function handleClientLoad() {
        gapi.load('client:auth2', initClient);
    }
    
    /** Initializes the API client library and sets up sign-in state listeners **/
    function initClient() {
        gapi.client.init({
            apiKey: config.googleCalendarApiKey,
            clientId: config.googleCalendarClientId,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
            scope: "https://www.googleapis.com/auth/calendar"
        }).then(function () {
            // Listen for sign-in state changes.
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            
            // Handle the initial sign-in state.
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            authorizeButton.onclick = handleAuthClick;
            signoutButton.onclick = handleSignoutClick;
        });
    }
    
    /** Called when the signed in status changes, to update the UI appropriately.
     * After a sign-in, the API is called
     * **/
    function updateSigninStatus(isSignedIn) {
        if (isSignedIn) {
            authorizeButton.style.display = 'none';
            //signoutButton.style.display = 'inline-block';
        } else {
            authorizeButton.style.display = 'inline-block';
            signoutButton.style.display = 'none';
        }
    }
    
    /** Sign in the user upon button click **/
    function handleAuthClick(event) {
        gapi.auth2.getAuthInstance().signIn();
    }
    
    /** Sign out the user upon button click **/
    function handleSignoutClick(event) {
        gapi.auth2.getAuthInstance().signOut();
    }
    
    handleClientLoad();
    window.gapi= gapi;
})();

/**
* Print the summary and start datetime/date of the next ten events in
* the authorized user's calendar. If no events are found an
* appropriate message is printed.
*/
/*function listUpcomingEvents() {
    gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 10,
        'orderBy': 'startTime'
    }).then(function(response) {
        var events = response.result.items;
        appendPre('Upcoming events:');
        
        if (events.length > 0) {
            for (i = 0; i < events.length; i++) {
                var event = events[i];
                var when = event.start.dateTime;
                if (!when) {
                    when = event.start.date;
                }
                appendPre(event.id +" - "+ event.summary + ' (' + when + ')')
                
                /*var request = gapi.client.calendar.events.delete({
                    calendarId:'laboratoria.la_vgvublo69ulgdo7qlreoje4lr0@group.calendar.google.com',
                    eventId:event.id
                });
                request.execute();*
            }
        } else {
            appendPre('No upcoming events found.');
        }
    });
}*/


/*function timestamp(date) {
    var pad = function (amount, width) {
        var padding = "";
        while (padding.length < width - 1 && amount < Math.pow(10, width - padding.length - 1))
        padding += "0";
        return padding + amount.toString();
    }
    date = date ? date : new Date();
    var offset = date.getTimezoneOffset();
    return pad(date.getFullYear(), 4)
    + "-" + pad(date.getMonth() + 1, 2)
    + "-" + pad(date.getDate(), 2)
    + "T" + pad(date.getHours(), 2)
    + ":" + pad(date.getMinutes(), 2)
    + ":" + pad(date.getSeconds(), 2)
    + "." + pad(date.getMilliseconds(), 3)
    + (offset > 0 ? "-" : "+")
    + pad(Math.floor(Math.abs(offset) / 60), 2)
    + ":" + pad(Math.abs(offset) % 60, 2);
}*/

/*function insertEvent() {
    var request = gapi.client.calendar.events.insert({
        resource: {
            "summary": "New Event",
            "description": "Description of new event",
            "end": {
                "dateTime": "2018-05-25T14:00:00-05:00"
            },
            "start": {
                "dateTime": "2018-05-25T12:00:00-05:00"
            },
        },
        calendarId:'primary',
    });
    request.execute(function(event) {
        appendPre('Event created: ' + event.htmlLink);
    });
}*/