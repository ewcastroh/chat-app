import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

	private client: Client;
	connected = false;

	constructor() { }

	ngOnInit() {

		this.client = new Client();
		this.client.webSocketFactory = () => {
			return new SockJS('http://localhost:8080/chat-websocket');
		};

		this.client.onConnect = (frame) => {
			console.log('Connected: ' + this.client.connected + ' : ' + frame);
			this.connected = true;
		};

		this.client.onDisconnect = (frame) => {
			console.log('Disonnected: ' + !this.client.connected + ' : ' + frame);
			this.connected = false;
		};
	}

	connect(): void {
		this.client.activate();
	}

	disconnect(): void {
		this.client.deactivate();
	}

}
