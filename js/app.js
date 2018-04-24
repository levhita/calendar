var app = new Vue({
	el: '#tasks',
	data: {
		events:[],
		tasks:[],
		tasksData:[],
		scheduledTasks:[],
		resources:[],
		projectAvailability:'',
		startDate:''
	},
	methods: {
		render: function(){
			$("#calendar").fullCalendar('destroy');
			
			$("#calendar").fullCalendar({
				header: {
					left: "prev,next today",
					center: "title",
					right: "month,agendaWeek,basicDay"
				},
				defaultView: "agendaWeek",
			    navLinks: true, /* can click day/week names to navigate views */
			    editable: true,
			    eventLimit: false, /* allow "more" link when too many events */
			    events: this.getEvents()
			});
		},

		load: function() {
			this.loadMockup();
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

			this.resources = [
			{id: 'class', available: later.parse.text('after 8:30am and before 2:00pm')},
			{id: 'extra', available: later.parse.text('after 3:00pm and before 5:00pm')}
			];

			this.projectAvailability = later.parse.text('every weekday after 8:30am and before 5:00pm'),
			this.startDate = new Date();

		},
		
		schedule: function(){
			this.startDate = new Date(this.startDate);
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
//app.schedule();
//app.render();