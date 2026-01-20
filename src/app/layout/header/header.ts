import { Component } from '@angular/core';
import { AuthStatus } from './auth-status/auth-status';
import { Brand } from "./brand/brand";

@Component({
  selector: 'app-header',
  imports: [AuthStatus, Brand],
  templateUrl: './header.html'
})
export class Header {}
