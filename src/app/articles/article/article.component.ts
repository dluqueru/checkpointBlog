import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-article',
  imports: [],
  templateUrl: './article.component.html'
})
export class ArticleComponent implements OnInit{
  @Input() articleId!: number;

  ngOnInit(): void {
    // let articleId: number = this.articleId
  }
}
