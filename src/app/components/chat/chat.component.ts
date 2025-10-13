import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { TagModule } from "primeng/tag";

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    ProgressSpinnerModule,
    TagModule
],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private chatService = inject(ChatService);

  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  selectedUser: any | null = null;
  currentUser: any | null = null;

  messageContent: string = '';
  messageHistory: any[] = [];

  isUsersLoading: boolean = true;
  isHistoryLoading: boolean = false;

  private userSubscription: Subscription | undefined;
  private chatSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.loadUsers();
    });
  }

  loadUsers(): Promise<void> {
    this.isUsersLoading = true;
    return this.usersService.getUsers().then((users: any) => {
      // Filtramos para mostrar solo administradores y moderadores, excluyendo al usuario actual.
      this.users = users.filter((u: any) =>
          u.uid !== this.currentUser?.uid &&
          (u.role === 'ROLE_ADMIN' || u.role === 'ROLE_MOD')
        )
        .sort((a: any, b: any) => a.username.localeCompare(b.username));
      this.filteredUsers = this.users;
      this.isUsersLoading = false;
    });
  }

  filterUsers(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user => user.username.toLowerCase().includes(term) || user.email.toLowerCase().includes(term));
  }

  selectUser(user: any): void {
    if (this.selectedUser?.uid === user.uid) return;

    this.selectedUser = user;
    this.messageHistory = [];
    this.isHistoryLoading = true;

    this.chatSubscription?.unsubscribe();

    if (this.currentUser && this.selectedUser) {
      const chatId = this.chatService.getChatId(this.currentUser.uid, this.selectedUser.uid);
      this.chatSubscription = this.chatService.getChatMessages(chatId).subscribe(messages => {
        this.messageHistory = messages;
        this.isHistoryLoading = false;
      });
    }
  }

  handleKeydown(event: any): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage(event);
    }
  }

  async sendMessage(event: Event) {
    const messageText = this.messageContent.trim();
    if (!this.selectedUser || !this.currentUser || !messageText) {
      return;
    }

    const chatId = this.chatService.getChatId(this.currentUser.uid, this.selectedUser.uid);

    try {
      await this.chatService.sendMessage(
        chatId,
        this.currentUser.uid,
        this.currentUser.username, // Pasamos el nombre del usuario actual
        messageText
      );
      this.messageContent = ''; // Limpiar el input
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el mensaje.' });
      console.error("Error sending message:", error);
    }
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.chatSubscription?.unsubscribe();
  }
}
