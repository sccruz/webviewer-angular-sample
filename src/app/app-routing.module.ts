import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { DocumentComponent } from './document/document.component';
import { CanDeactivateGuard } from './services/can-deactivate-guard.service';


const routes: Routes = [
  {
    component: DocumentComponent,
    path: '',
    canDeactivate: [CanDeactivateGuard]
  },
  {
    component: AboutComponent,
    path: 'about'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
