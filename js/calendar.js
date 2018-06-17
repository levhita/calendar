(function(){
	var app = new Vue({
		el: '#app',
		data: {
			/** DB Key for this calendar **/
			key: "", 
			
			/**Basic Settings **/
			name: "", 
			description: "", 
			eventsSource: "",
			eventsTarget: "",
			startDate: "",
			ranges: [],
			
			/** Sessions as defined in the database, this is transformed in real time before calculus **/
			sessions: [],
			
			/** The sequence of single sessions that complete a class (we might not use this if it's used right away) **/
			singleSessions: [], 
			
			/** Reference to the database nodes **/
			scheduleRef: null, 
			settingsRef: null, 
			sessionsRef: null, 
			
			/**	For Session editing **/
			selectedSession : null,
			
			/** The fullcalendar reference **/
			calendar: null,
			lastRefresh: 0,
		},
		computed: {
			orderedSessions: function(){
				return this.sessions.sort( function(a,b) {
					if ( parseInt(a.priority)>parseInt(b.priority) ) return -1;
					if ( parseInt(a.priority)<parseInt(b.priority) ) return 1;
					return 0;
				});
			},
			lowestPriority: function() {
				if ( this.sessions.length>0 ) {
					let min = 1000;
					this.sessions.map( (session) => {
						if (parseInt(session.priority)<min ) min = parseInt(session.priority);
					});
					return min;
				}
				return 100;
			},
		},
		methods: {
			render: function(){
				if ( $('#calendar').children().length > 0 ) {
					$('#calendar').fullCalendar('removeEvents');
					$('#calendar').fullCalendar('removeEventSource', app.singleSessions);
					$('#calendar').fullCalendar('addEventSource', app.singleSessions );
					$('#calendar').fullCalendar('refetchEvents'); 
				} else {
					$("#calendar").fullCalendar('destroy');
					app.lastRefresh=Date.now();
					$("#calendar").fullCalendar({
						header: {
							left: "prev,next today",
							center: "title",
							right: "month,agendaWeek,agendaDay"
						},
						defaultView: "agendaWeek",
						navLinks: true, 
						editable: false,
						height: 'parent',
						googleCalendarApiKey: config.googleCalendarApiKey,
						eventSources: [app.eventsSource, app.singleSessions ],
						theme: "bootstrap4"
					});
					console.log();
					app.calendar = $("#calendar").fullCalendar('getCalendar');
				}
			},
			refresh:function() {
				let delta = Date.now()-app.lastRefresh;
				
				if( delta >500 && $('#calendar').children().length > 0){
					console.log('Debouncing time passed');
					app.lastRefresh=Date.now();
					app.schedule();
					app.render();
				}
			},
			load: function() {
				if (window.location.hash=="") app.redirectHome();
				
				app.key = window.location.hash.substr(1);
				app.scheduleRef = firebase.database().ref().child("schedules").child(app.key);
				app.settingsRef = app.scheduleRef.child('settings');
				app.sessionsRef = app.scheduleRef.child('sessions');
				
				app.scheduleRef.once("value", (snap) => {
					if (snap.val()==null) app.redirectHome();
				}, (error) => app.redirectHome() );
				
				app.connectFirebaseEvents();
			},
			redirectHome: function(){
				alert("Couldn't load Schedule, redirecting to home...");
				window.location = "index.html";
			},
			connectFirebaseEvents: function(){
				app.settingsRef.on("value", app.settingsUpdated);
				app.sessionsRef.on("child_added",   app.sessionAdded);
				app.sessionsRef.on("child_removed", app.sessionRemoved);
				app.sessionsRef.on("child_changed", app.sessionChanged);
			},
			settingsUpdated: function(snap) {
				settings = snap.val();
				
				let properties = ['name', 'description', 'eventsSource', 'eventsTarget','startDate', 'ranges'];
				let changed = false;
				properties.map( (property) => {
					if ( app[property] != settings[property] ) {
						app[property] = settings[property];
						changed = true;
					}
				});
				
				console.log("settingsUpdated");
				app.render();
				app.schedule();
			},
			saveSettings: function(){
				app.settingsRef.update({
					name: app.name,
					description: app.description,
					eventsSource: app.eventsSource,
					eventsTarget: app.eventsTarget,
					ranges: app.ranges,
					startDate: app.startDate
				});
				$("#editSettingsModal").modal('hide');
			},
			sessionAdded: function(snap) {
				let session = snap.val();
				session.id = snap.key;
				app.sessions.push(session);
				app.refresh();
			},
			sessionRemoved: function(snap) {
				let index = app.sessions.findIndex( (session) => snap.key==session.id );
				app.sessions.splice(index,1);
				app.refresh();
			},
			sessionChanged: function(snap) {
				let index = app.sessions.findIndex( (session) => snap.key==session.id );
				app.sessions.splice(index,1, snap.val());
				app.refresh();
			},
			changePriority(id, change){
				let newPriority = parseInt(app.sessions.find( (session) => id==session.id ).priority) + change;
				app.sessionsRef.child(id).update({priority: newPriority});
			},
			openAddSession: function() {
				app.selectedSession = {
					id: null,
					name:"",
					notes:"",
					duration: 120,
					priority: this.lowestPriority-1,
					minSchedule: 60,
					new: true
				}
				$("#editSessionModal").modal('show');
				setTimeout(function(){document.getElementById('nameInput').focus()},10);
			},
			saveSession: function() {
				$("#editSessionModal").modal('hide');
				if(app.selectedSession.new) {
					delete app.selectedSession.new;
					let newSessionRef = app.sessionsRef.push();
					app.selectedSession.id = newSessionRef.key;
					newSessionRef.set(app.selectedSession);
				} else {
					app.sessionsRef.child(app.selectedSession.id).update(app.selectedSession);
				}
				app.selectedSession=null;
			},
			editSession: function(id) {
				let index = this.sessions.findIndex(session => session.id===id );
				this.selectedSession = Object.assign({}, this.sessions[index]); 
				$('#editSessionModal').modal("show");
			},
			deleteSession: function(id) {
				if(confirm('Are you sure to delete this session?')) {
					app.sessionsRef.child(id).remove();
				}
			},
			addRange: function() {
				let top = 0;
				for (i=0;i<app.ranges.length;i++) {
					if(app.ranges[i].id>top) {
						top=app.ranges[i].id;
					}
				}
				app.ranges.push({id:++top, after:'15:00', before:'17:00'});
			},
			deleteRange: function(id) {
				let index = app.ranges.findIndex(range => range.id===id );
				app.ranges.splice(index,1);
			},
			
			schedule: function(){
				let startDate = new Date(app.startDate);
				
				let availability = later.parse.recur();
				for (let i=0;i<app.ranges.length;i++) {
					availability.and().onWeekday()
					.after(app.ranges[i].after).time()
					.before(app.ranges[i].before).time();
				}
				
				availability = availability.except();
				let clientEvents = app.calendar.clientEvents();
				for (let i=0;i<clientEvents.length;i++) {
					let event = clientEvents[i];
					if (typeof event.source.googleCalendarId !=='undefined') {
						let start = event.start;
						let end = event.end;
						
						availability
						.and()
						.on(start.dayOfYear()).dayOfYear()
						.after(start.format('HH:mm')).time()
						.before(end.format('HH:mm')).time();
					}
				}
				let processedSessions = [];
				app.sessions.map( (session) => {
					session.resources = ['class'];
					processedSessions.push(session);
				});
				
				let scheduledSessions = schedule.create(processedSessions, [{id: "class"}], availability, startDate).scheduledTasks;
				
				let events = [];
				for(let id in scheduledSessions) {
					let session = scheduledSessions[id];
					for(let i=0;i<session.schedule.length;i++){
						let start = new Date(session.schedule[i].start);
						let end = new Date(session.schedule[i].end);
						
						let singleSession = {
							id: id,
							title: app.sessions.find(session_search => session_search.id==id).name,
							start: start.toISOString(),
							end: end.toISOString(),
						}
						events.push(singleSession);
					}
				}
				app.singleSessions = {
					events: events,
					color: "cornflowerblue",
					textColor: "black",
					borderColor: "grey"
				};
			},			
			exportCalendar: function() {
				
				$("#exportModal").modal("show");
				document.getElementById('exportOutput').textContent="";
				//First we clear the Target Calendar
				gapi.client.calendar.events.list({
					'calendarId': app.eventsTarget,
					'timeMin': (new Date(app.startDate)).toISOString(),
					'showDeleted': false,
					'singleEvents': true,
					'maxResults': 50,
					'orderBy': 'startTime'
				}).then(function(response) {
					var events = response.result.items;
					if (events.length > 0) {
						for (i = 0; i < events.length; i++) {
							document.getElementById('exportOutput').textContent = "Deleting: " + events[i].summary;
							var request = gapi.client.calendar.events.delete({
								calendarId: app.eventsTarget,
								eventId: events[i].id
							});
							request.execute()
						}
					}
					
					var total = app.singleSessions.events.length;
					var count = 0;
					app.singleSessions.events.forEach( event => {
						let custom_date = new Date();
						offset = custom_date.getTimezoneOffset()/60;
						
						let start = new Date(event.start);
						start.setHours(start.getHours()+offset);
						
						let end = new Date(event.end);
						end.setHours(end.getHours()+offset);
						
						
						let request = gapi.client.calendar.events.insert({
							resource: {
								"summary": event.title,
								//"description": event."Description of new event",
								"start": {
									"dateTime": app.timestamp(start),
								},
								"end": {
									"dateTime": app.timestamp(end),
								}
							},
							calendarId:app.eventsTarget,
						});
						request.execute(function(event) {
						    count++;
							document.getElementById('exportOutput').textContent = "Created: " + event.summary;
							document.getElementById('progressBar').style = "width:"+Math.ceil(count/total*100)+"%";
							
							if ( count == total ) {
								$("#exportModal").modal("hide");
								document.getElementById('progressBar').style = "width:0%";
							}
						
						});
					});
					
					
					
				});
			},
			timestamp: function (date) {
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
				+ (offset > 0 ? "-" : "+")
				+ pad(Math.floor(Math.abs(offset) / 60), 2)
				+ ":" + pad(Math.abs(offset) % 60, 2);
			}
		}
		
	});
	
	app.load();
	window.app=app;
})();


// defining flags
var isCtrl = false;
var isShift = false;

$(document).ready(function() {
	console.log("Ready. Press Ctrl+Shift+F9!");
	
	// action on key up
	$(document).keyup(function(e) {
		if(e.which == 17) {
			isCtrl = false;
		}
		if(e.which == 16) {
			isShift = false;
		}
	});
	// action on key down
	$(document).keydown(function(e) {
		if(e.which == 17) {
			isCtrl = true; 
		}
		if(e.which == 16) {
			isShift = true; 
		}
		if(e.which == 65 && !isCtrl && isShift) { 
			//Shift+a to add
			app.openAddSession();
		} 
	});
	
});