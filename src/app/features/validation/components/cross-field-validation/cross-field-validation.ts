import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cross-field-validation',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section" id="cross-field-validation">
      <div class="container">
        <p class="lab-index">VALIDATION / 09 — CROSS-FIELD VALIDATION</p>
        <h2 class="lab-title">Some rules only make sense across two fields at once.</h2>

        <div class="lab-panel cross-panel">
          <p class="cross-title mono">RULE: if married, partnerName is required</p>
          <div class="cross-fields">
            <label class="checkbox-label"><input type="checkbox" [ngModel]="married()" (ngModelChange)="married.set($event)" /> Married</label>
            <div class="lab-field">
              <label for="partner-name">partnerName</label>
              <input id="partner-name" type="text" [ngModel]="partnerName()" (ngModelChange)="partnerName.set($event)" [disabled]="!married()" />
            </div>
          </div>
          <p class="cross-result" [class.is-ok]="marriageValid()" [class.is-fail]="!marriageValid()">
            {{ marriageValid() ? '✓ Valid' : '✕ partnerName is required when married' }}
          </p>
        </div>

        <div class="lab-panel cross-panel">
          <p class="cross-title mono">RULE: password === confirmPassword</p>
          <div class="cross-fields">
            <div class="lab-field">
              <label for="pwd1">Password</label>
              <input id="pwd1" type="password" [ngModel]="password()" (ngModelChange)="password.set($event)" />
            </div>
            <div class="lab-field">
              <label for="pwd2">Confirm</label>
              <input id="pwd2" type="password" [ngModel]="confirmPassword()" (ngModelChange)="confirmPassword.set($event)" />
            </div>
          </div>
          <p class="cross-result" [class.is-ok]="passwordsMatch()" [class.is-fail]="!passwordsMatch()">
            {{ passwordsMatch() ? '✓ Match' : '✕ Passwords do not match' }}
          </p>
        </div>

        <p class="lab-note">Neither rule can be checked by looking at one field alone — validation sometimes depends on relationships between fields.</p>
      </div>
    </section>
  `,
  styles: `
    .cross-panel { margin-top: 24px; }
    .cross-title { font-size: 0.8125rem; color: var(--accent-2); margin-bottom: 16px; }
    .cross-fields { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-end; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: var(--text-muted); }
    .cross-result { margin-top: 16px; font-size: 0.9375rem; font-weight: 600; }
    .cross-result.is-ok { color: var(--accent-2); }
    .cross-result.is-fail { color: var(--danger); }
  `,
})
export class CrossFieldValidation {
  protected readonly married = signal(false);
  protected readonly partnerName = signal('');
  protected readonly marriageValid = computed(() => !this.married() || this.partnerName().trim().length > 0);

  protected readonly password = signal('hunter2');
  protected readonly confirmPassword = signal('hunter2');
  protected readonly passwordsMatch = computed(() => this.password() === this.confirmPassword());
}
