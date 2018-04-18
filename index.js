$(document).ready(function() {
  let Schedule= new scheduleModel();
  Schedule.load();

  $("#calendar").fullCalendar({
    header: {
      left: "prev,next today",
      center: "title",
      right: "month,basicWeek,basicDay"
    },
    //defaultDate: "2018-03-12",
    navLinks: true, // can click day/week names to navigate views
    editable: true,
    eventLimit: true, // allow "more" link when too many events
    events: Schedule.getEvents()
  });
});

