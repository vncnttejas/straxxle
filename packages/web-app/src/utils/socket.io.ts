import { io } from 'socket.io-client';

export const socket = io('http://developer.vbox', {
  autoConnect: false,
});
