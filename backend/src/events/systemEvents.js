import { EventEmitter } from 'events';

export const systemEvents = new EventEmitter();
// Increase max listeners if needed since many modules might listen
systemEvents.setMaxListeners(20);
