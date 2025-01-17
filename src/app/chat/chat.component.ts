import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Message } from './models/message';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

	private client: Client;
	connected = false;
	message: Message = new Message();
	messages: Message[] = [];
	typing: string;
	clientId: string;

	constructor() {
		this.clientId = 'id_' + new Date().getTime() + '-' + Math.random().toString(36).substr(2);
	}

	ngOnInit() {

		this.client = new Client();
		this.client.webSocketFactory = () => {
			return new SockJS('http://localhost:8080/chat-websocket');
		};

		this.client.onConnect = (frame) => {
			console.log('Connected: ' + this.client.connected + ' : ' + frame);
			this.connected = true;

			this.client.subscribe('/chat/message', e => {
				const message: Message = JSON.parse(e.body) as Message;
				message.date = new Date(message.date);

				if (!this.message.color && message.type === 'NEW_USER' && this.message.username === message.username) {
					this.message.color = message.color;
				}

				this.messages.push(message);
				console.log('Received message: ' + JSON.stringify(message));
			});

			this.client.subscribe('/chat/typing', e => {
				this.typing = e.body;
				setTimeout(() => this.typing = '', 3000);
			});

			console.log('ClientId: ' + this.clientId);

			this.client.subscribe('/chat/history/' + this.clientId, e => {
				const history = JSON.parse(e.body) as Message[];
				this.messages = history.map(msg => {
					msg.date = new Date(msg.date);
					return msg;
				}).reverse();
			});

			this.client.publish({destination: '/app/history', body: this.clientId});

			this.message.type = 'NEW_USER';
			this.client.publish({ destination: '/app/message', body: JSON.stringify(this.message) });
		};

		this.client.onDisconnect = (frame) => {
			console.log('Disonnected: ' + !this.client.connected + ' : ' + frame);
			this.connected = false;
			this.message = new Message();
			this.messages = [];
		};
	}

	connect(): void {
		this.client.activate();
	}

	disconnect(): void {
		this.client.deactivate();
	}

	sendMessage(): void {
		this.message.type = 'MESSAGE';
		this.client.publish({ destination: '/app/message', body: JSON.stringify(this.message)});
		this.message.text = '';
	}

	typingEvent(): void {
		this.client.publish({ destination: '/app/typing', body: JSON.stringify(this.message.username) });
	}
}
