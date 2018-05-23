(function(){
	var app = new Vue({
		el: '#tasks',
		data: {
			key:'', //done
			name:'', //done
			description:'', //done
			events:[],
			tasks:[], //done
			tasksData:[], //done
			scheduledTasks:[],
			scheduleRef: null, //done
			resources:[{id: 'class'}], 
			ranges:[],
			selectedTask : null,
			projectAvailability: [],
			startDate: "",
			googleCalendarApiKey: "",
			eventsGoogleCalendar: "",
			
		},
		methods: {
			render: function(){
				//Replace with test of emptyness and only refresh
				$("#calendar").fullCalendar('destroy');
				$("#calendar").fullCalendar({
					header: {
						left: "prev,next today",
						center: "title",
						right: "month,agendaWeek,agendaDay"
					},
					defaultView: "agendaWeek",
					navLinks: true, /* can click day/week names to navigate views */
					editable: true,
					googleCalendarApiKey: this.googleCalendarApiKey,
					eventSources: [ this.eventsGoogleCalendar, this.getEvents() ]
					
				});
				app.calendar = $('#calendar').fullCalendar('getCalendar'); 
			},
			
			load: function() {
				if (window.location.hash=="") {
					alert("Couldn't load Schedule, redirecting to home...");
					window.location = "index.html";
				}
				app.key = window.location.hash.substr(1);
				
				app.scheduleRef = firebase.database().ref().child("schedules/"+app.key);
				
				app.scheduleRef.once("value", (snap) => {
					if (snap.val()==null) {
						alert("Couldn't load Schedule,redirecting to home...");
						window.location = "index.html";
					}
				}, function (error) {
					alert("Couldn't load Schedule, redirecting to home...");
					window.location = "index.html";
				});
				
				app.scheduleRef.on("value", (snap) => app.updateSettings(snap.val()));
				app.scheduleRef.child('tasks').on("value", (snap) => app.updateTasks(snap.val()));
				
				/*this.render();*/
			},
			updateSettings: function(schedule) {
				app.name		= schedule.name || "";
				app.description = schedule.description || "";
				app.googleCalendarApiKey = schedule.googleCalendarApiKey || "";
				app.eventsGoogleCalendar = schedule.eventsGoogleCalendar || "";
				
				app.ranges = schedule.ranges || [];				
				app.startDate = (schedule.startDate)? new Date(schedule.startDate): new Date();
			},
			updateTasks: function(tasks) {
				app.tasksData = {};
				
				Object.keys(tasks).forEach( function(key, index) {
					let task = tasks[key];
					task.id = app.tasksData.length;
					if (task.id>0) {
						task.dependsOn=[task.id-1];
					}
					task.resources=['class'];
					app.tasksData[task.id]=task.name;
				});	
				app.tasks = tasks;
			},
			loadMockup: function() {
				this.tasksData= {
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
				];
			},
			
			refresh:function() {
				this.schedule();
				this.render();
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
			
			edit: function(id) {
				let index = this.tasks.findIndex(task => task.id===id );
				let name = (' ' + this.tasksData[id]).slice(1);
				this.selectedTask = Object.assign({name:name}, this.tasks[index]); 
				$('#editTaskModal').modal("show");
			},
			
			schedule: function(){
				this.startDate = new Date(this.startDate);
				
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
				}
			},
			
			getEvents: function() {
				return this.events;
			}
		}
	});
	
	app.load();
	
})();