
$(document).ready(function() {
  let Schedule= new scheduleModel();
  Schedule.load();

  $("#calendar").fullCalendar({
    header: {
      left: "prev,next today",
      center: "title",
      right: "month,basicWeek,basicDay"
    },
    defaultDate: "2018-03-12",
    navLinks: true, // can click day/week names to navigate views
    editable: true,
    eventLimit: true, // allow "more" link when too many events
    events: Schedule.getEvents()
  });



});

  var tasks = [
    {id: 1, duration: 60, name:'one'},
    {id: 2, duration: 60, available: later.parse.text('every weekday'), name:'one'},
    {id: 3, duration: 30, dependsOn: [1], priority: 100, name:'two'},
    {id: 4, duration: 30, dependsOn: [1], minLength: 30, name:'three'},
    {id: 5, duration: 90, dependsOn: [2,3], name:'four'},
    {id: 6, duration: 45, dependsOn: [4], resources: ['A'], name:'five'},
    {id: 7, duration: 60, dependsOn: [5], resources: ['A', 'B'], name:'six'},
    {id: 8, duration: 30, dependsOn: [6,7], resources: [['A', 'B'], 'C'], name:'seven'}
  ];

    var resources = [
    {id: 'A'},
    {id: 'B', available: later.parse.text('after 10:00am and before 6:00pm')},
    {id: 'C', isNotReservable: true}
  ];

  var projectAvailability = later.parse.text('every weekday'),
  startDate = new Date();

  var s = schedule.create(tasks, resources, projectAvailability, startDate);