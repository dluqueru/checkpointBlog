import { Component, inject } from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { ArticlesService } from '../services/articles.service';
import { DatePipe } from '@angular/common';
import { DefaultImageDirective } from '../../shared/directives/default-image.directive';

@Component({
  selector: 'app-list',
  imports: [SidebarComponent, DatePipe, DefaultImageDirective],
  templateUrl: './list.component.html'
})
export class ListComponent {

  articlesService: ArticlesService = inject(ArticlesService);

  ngOnInit(): void {
    this.articlesService.getArticles();
  }

}
