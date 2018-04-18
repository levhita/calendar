class scheduleModel {
  load() {
    this.loadMockup();
    console.log(this.scheduledTasks);
    this.events=[];
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
        console.log(event);
        this.events.push(event);
      }
    }
  }

  getEvents() {
    return this.events;
  }

  loadMockup() {
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
    {id: 2, duration: 1*60, available: later.parse.text('on monday after 8:00am and before 10:00am') ,resources: ['class']},
    {id: 3, duration: 2*60, dependsOn: [1], priority: 100, minSchedule: 120, resources: ['class']},
    {id: 4, duration: 8*60, dependsOn: [1], minSchedule: 120 ,resources: ['class']},
    {id: 5, duration: 5*60, dependsOn: [1,3] ,resources: ['class']},
    {id: 6, duration: 3*60, dependsOn: [4], resources: ['class'] },
    {id: 7, duration: 3*60, dependsOn: [5],  resources: ['class'] },
    {id: 8, duration: 3*60, dependsOn: [6,7], resources: ['class'] }
    ];

    this.resources = [
    {id: 'A'},
    {id: 'class', available: later.parse.text('after 9:00am and before 2:30pm')},
    {id: 'C', isNotReservable: true}
    ];

    this.projectAvailability = later.parse.text('every weekday after 9:00am and before 2:00pm'),
    this.startDate = new Date();
    
    schedule.date.localTime();
    this.scheduledTasks = schedule.create(this.tasks, this.resources, this.projectAvailability, this.startDate).scheduledTasks;

  }
}
