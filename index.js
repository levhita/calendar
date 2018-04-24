$(document).ready(function() {

  global app;
  app.load().then(function(){
    alert('sfsdf');
  });
  console.log(app.getEvents());

  $("#calendar").fullCalendar({
    header: {
      left: "prev,next today",
      center: "title",
      right: "month,agendaWeek,basicDay"
    },
    defaultView: "agendaWeek",
    navLinks: true, // can click day/week names to navigate views
    editable: true,
    eventLimit: false, // allow "more" link when too many events
    events: app.getEvents()
  });

});