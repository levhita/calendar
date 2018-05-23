(function() {
	var app = new Vue({
		el: '#app',
		
		data: {
			schedules: [],
			schedulesRef: null,
		},
		methods: {
			load: function() {
				app.schedulesRef = firebase.database().ref().child('schedules');
				app.schedulesRef.on('child_added', function(snap){
					let schedule = snap.val();
					schedule.key = snap.key;
					app.schedules.push(schedule);
				});
			},
			showCreateModal: function() {
				$('#createModal').modal("show");
			},
			create: function() {
				let newSchedule = {
					name: $("#nameInput").val(),
					description: $("#descriptionTextarea").val(),
					googleCalendarApiKey: $("#keyInput").val(),
					eventsGoogleCalendar: $("#calendarInput").val(),
				}
				
				app.schedulesRef.push().set(newSchedule);
				
				$("nameInput").val("");
				$("descriptionTextarea").val("");
				$("keyInput").val("");
				$("calendarInput").val("");
				
				$("#createModal").modal("hide");
			},
			edit:  function(key) {
				window.location = "calendar.html#"+key;
			},
			view:  function(key) {
				window.location = "view.html#"+key;
			}
		}
	});
	app.load();
})();