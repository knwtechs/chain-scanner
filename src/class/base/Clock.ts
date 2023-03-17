import { Colors } from "../utils";

type TimerItem = {
    id?: any,
    status: boolean,
    thick: number,
    started?: Date,
    lastRun?: Date,
    fn: Function
};

export class Clock {

    timers: Map<string,TimerItem>;

    constructor(){
        this.timers = new Map<string, TimerItem>();
    }

    addTimer(name: string, fn: Function, thick: number, lazyStart: boolean = false){
        let now = new Date();
        if(!lazyStart){
            let timerId = setInterval(fn, thick);
            this.timers.set(name, {
                id: timerId,
                status: true,
                thick: thick,
                started: now,
                lastRun: now,
                fn: fn
            });
        }else{
            this.timers.set(name, {
                status: true,
                thick: thick,
                fn: fn
            });
        }
        
        
    }

    start(name: string): void {
        let t = this.timers.get(name);
        if(t === undefined) return;
        if(t.status) return;
        t.id = setInterval(t.fn, t.thick);
        t.started = new Date();
        t.status = true;
        let thick: number | undefined;
        thick = this.timers.get(name)?.thick;
        if(thick) thick = thick / 1000;
        console.log(`${Colors.BRIGHT_BLUE}[CLOCK] ${name} | ${this.timers.get(name)?.started?.toLocaleString()} | ${thick}s ${Colors.RESET}`);
    }

    get(name: string): TimerItem | undefined {
        return this.timers.get(name);
    }

    count(): number {
        return this.timers.size;
    }

    clear(name: string) {
        let i = this.get(name);
        if(!i) return;
        i.id.close();
        i.status = false;
    }

    data() {
        return this.timers;
    }

    init() {
        if(this.count() == 0) return;
        this.data().forEach( (v: TimerItem, k: string) => {
            this.start(k);
        });
    }
}