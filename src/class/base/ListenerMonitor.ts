import { Listener } from "./";

export class ListenerMonitor {

    static processes: Map<Listener,boolean> = new Map<Listener, boolean>();

    static set(k: Listener, v: boolean): void{
        ListenerMonitor.processes.set(k,v);
    }

    static running(k: Listener): boolean{
        return ListenerMonitor.processes.get(k) ?? false;
    }

    static run(k: Listener): void {
        ListenerMonitor.processes.set(k,true);
    }

    static error(k: Listener): void{
        ListenerMonitor.processes.set(k, false);
    }

    static listeners(): Listener[] {
        return [...ListenerMonitor.processes.keys()]; 
    }
}