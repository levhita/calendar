$(document).ready(function() {
  //let Schedule= new scheduleModel();
  //Schedule.load();

  $("#calendar").fullCalendar({
    header: {
      left: "prev,next today",
      center: "title",
      right: "month,agendaWeek,basicDay"
    },
    //defaultDate: "2018-03-12",
    defaultView: "agendaWeek",
    navLinks: true, // can click day/week names to navigate views
    editable: true,
    eventLimit: false, // allow "more" link when too many events
    //events: Schedule.getEvents()
  });
});

