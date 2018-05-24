(function(){
	var app = new Vue({
		el: '#app',
		data: {
			/** DB Key for this calendar **/
			key: "", 
			
			/**Basic Settings **/
			name: "", 
			description: "", 
			googleCalendarApiKey: "",
			eventsGoogleCalendar: "",
			startDate: null,
			ranges: [],
			
			/** Sessions as defined in the database, this is transformed in real time before calculus **/
			sessions: [],
			
			schedule: {
				sessions: [], //the sessions already preprocessed (we might not use this if it's used right away)
				singleSessions: [], //the sequence of single sessions that complete a class (we might not use this if it's used right away)
				events: [], // the events ready to be used by the calendar, again this might become in singleSessions
				resources: [{id: "class"}], 
				availability: [],
			},
			
			/** Reference to the database node **/
			scheduleRef: null, //done
			
			/**	For Session editing **/
			selectedSession : null,
			
			/** The fullcalendar reference **/
			calendar: null,
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
				//Replace with test of emptyness and only refresh
				if ( $('#calendar').children().length > 0 ) {
					$("#calendar").fullCalendar('refetchEvents');
				} else {
					$("#calendar").fullCalendar({
						header: {
							left: "prev,next today",
							center: "title",
							right: "month,agendaWeek,agendaDay"
						},
						defaultView: "agendaWeek",
						navLinks: false, /* can click day/week names to navigate views */
						editable: false,
						googleCalendarApiKey: app.googleCalendarApiKey,
						eventSources: [app.eventsGoogleCalendar, app.getSingleSessions() ],
						theme: "bootstrap4"
					});
					app.calendar = $('#calendar').fullCalendar('getCalendar'); 
				}
			},
			
			load: function() {
				if (window.location.hash=="") app.redirectHome();
				
				app.key = window.location.hash.substr(1);
				app.scheduleRef = firebase.database().ref().child("schedules/"+app.key);
				
				app.scheduleRef.once("value", (snap) => {
					if (snap.val()==null) app.redirectHome();
					app.settingsUpdated(snap);
				}, (error) => app.redirectHome() );
				
				app.connectFirebaseEvents();
				
			},
			redirectHome: function(){
				alert("Couldn't load Schedule, redirecting to home...");
				window.location = "index.html";
			},
			connectFirebaseEvents: function(){
				app.scheduleRef.on("value", app.settingsUpdated);
				app.scheduleRef.child('sessions').on("child_added",   app.sessionAdded);
				app.scheduleRef.child('sessions').on("child_removed", app.sessionRemoved);
				app.scheduleRef.child('sessions').on("child_changed", app.sessionChanged);
			},
			settingsUpdated: function(snap) {
				schedule = snap.val();
				app.name		= schedule.name || "";
				app.description = schedule.description || "";
				app.googleCalendarApiKey = schedule.googleCalendarApiKey || "";
				app.eventsGoogleCalendar = schedule.eventsGoogleCalendar || "";
				
				app.ranges = schedule.ranges || [];				
				app.startDate = (schedule.startDate)? new Date(schedule.startDate): new Date();
				
				app.render();
			},
			saveSettings: function(){
				app.scheduleRef.update({
					name: app.name,
					description: app.description,
					googleCalendarApiKey: app.googleCalendarApiKey,
					eventsGoogleCalendar: app.eventsGoogleCalendar,
					ranges: app.ranges,
					startDate: app.startDate
				});
				$("#editSettingsModal").modal('hide');
			},
			sessionAdded: function(snap) {
				let session = snap.val();
				session.id = snap.key;
				app.sessions.push(session);
			},
			sessionRemoved: function(snap) {
				let index = app.sessions.findIndex( (session) => snap.key==session.id );
				app.sessions.splice(index,1);
			},
			sessionChanged: function(snap) {
				let index = app.sessions.findIndex( (session) => snap.key==session.id );
				app.sessions.splice(index,1, snap.val());
			},
			changePriority(id, change){
				let newPriority = parseInt(app.sessions.find( (session) => id==session.id ).priority) + change;
				app.scheduleRef.child('sessions').child(id).update({priority: newPriority});
			},
			openAddSession: function() {
				app.selectedSession = {
					id: null,
					name:"",
					duration: 120,
					priority: this.lowestPriority-1,
					minSchedule: 60,
					new: true
				}
				$("#editSessionModal").modal('show');
			},
			saveSession: function() {
				$("#editSessionModal").modal('hide');
				if(app.selectedSession.new) {
					delete app.selectedSession.new;
					let newSessionRef = app.scheduleRef.child('sessions').push();
					app.selectedSession.id = newSessionRef.key;
					newSessionRef.set(app.selectedSession);
				} else {
					app.scheduleRef.child('sessions').child(app.selectedSession.id).update(app.selectedSession);
				}
				app.selectedSession=null;
			},
			editSession: function(id) {
				let index = this.sessions.findIndex(session => session.id===id );
				this.selectedSession = Object.assign({}, this.sessions[index]); 
				$('#editSessionModal').modal("show");
			},
			deleteSession: function(id) {
				app.scheduleRef.child('sessions').child(id).remove();
			},
			loadMockup: function() {
				/*this.tasksData= {
					1: 'Presentation',
					2: 'English Class',
					3: 'Priority Class',
					4: 'Minimal 2 Hours',
					5: 'Doubly Dependent Task 1',
					6: 'Another Task',
					7: 'Yet Another Task',
					8: 'I really dont understand this'
				}
				
				this.tasks = [
					{id: 1, duration: 4*60, resources: ['class']},
					{id: 2, duration: 1*60, priority: 100, available: later.parse.recur().after('08:30:00').time().before('09:30:00').time() ,resources: ['class']},
					{id: 3, duration: 2*60, dependsOn: [1], priority: 10, minSchedule: 120, resources: ['class']},
					{id: 4, duration: 8*60, dependsOn: [1], minSchedule: 120 ,resources: ['class']},
					{id: 5, duration: 5*60, dependsOn: [1,3] ,resources: ['class']},
					{id: 6, duration: 3*60, dependsOn: [4], resources: ['class'] },
					{id: 7, duration: 3*60, dependsOn: [5],  resources: ['class'] },
					{id: 8, duration: 3*60, dependsOn: [6,7], resources: ['class'] }
				];
				
				this.resources = [{id: 'class'}];
				
				this.ranges = [
					{id:1, after:'8:30', before:'11:00'},
					{id:2, after:'11:30', before:'14:00'},
					{id:3, after:'15:00', before:'17:00'}
				];*/
			},
			
			refresh:function() {
				/*this.schedule();
				this.render();*/
			},
			addRange: function() {
				let top = 0;
				for (i=0;i<this.ranges.length;i++) {
					if(this.ranges[i].id>top) {
						top=this.ranges[i].id;
					}
				}
				this.ranges.push({id:++top, after:'15:00', before:'17:00'});
			},
			deleteRange: function(id) {
				let index = this.ranges.findIndex(range => range.id===id );
				this.ranges.splice(index,1);
			},
			
			
			createSchedule: function(){
				/*this.startDate = new Date(this.startDate);
				
				this.projectAvailability =	later.parse.recur();
				for (let i=0;i<this.ranges.length;i++) {
					this.projectAvailability.and().onWeekday()
					.after(this.ranges[i].after).time()
					.before(this.ranges[i].before).time();
				}
				
				this.projectAvailability = this.projectAvailability.except();
				let clientEvents = this.calendar.clientEvents();
				for (let i=0;i<clientEvents.length;i++) {
					let event = clientEvents[i];
					if (typeof event.source.googleCalendarId !=='undefined') {
						let start = event.start;
						let end = event.end;
						
						this.projectAvailability
						.and()
						.on(start.dayOfYear()).dayOfYear()
						.after(start.format('HH:mm')).time()
						.before(end.format('HH:mm')).time();
					}
				}
				
				this.scheduledTasks = schedule.create(this.tasks, this.resources, this.projectAvailability, this.startDate).scheduledTasks;
				
				this.events = [];
				for(let id in this.scheduledTasks) {
					let task = this.scheduledTasks[id];
					
					for(let i=0;i<task.schedule.length;i++){
						let start = new Date(task.schedule[i].start);
						let end = new Date(task.schedule[i].end);
						
						let event = {
							id: id,
							title: this.tasksData[id],
							start: start.toISOString(),
							end: end.toISOString(),
						}
						this.events.push(event);
					}
				}*/
			},
			
			getSingleSessions: function() {
				return [];
				/*return app.schedule.singleSession;*/
			}
		}
	});
	
	app.load();
	window.app=app;
})();