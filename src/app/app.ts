import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/components/header/header';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html'
})
export class App {
  protected readonly title = signal('EventDex');
}
